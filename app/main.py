import os
import uuid
import shutil
import csv
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.config import (
    MODEL_PATH,
    DATA_DIR,
    UPLOAD_DIR,
    RESULTS_DIR,
    REPORTS_DIR,
    TRAINING_DIR,
    DATASET_DIR,
    DATASET_INFO,
    MODEL_METRICS,
    CLINISCAN_ROOT,
    CLASSES,
    CLASS_PALETTE,
    PATHOLOGY_METADATA
)
from app.database import init_db, save_scan, get_scans, get_scan_by_id, delete_scan, get_stats
from app.inference import ModelManager, run_cliniscan_analysis
from app.report_generator import generate_clinical_report
from app.pdf_generator import generate_pdf_report
from app.sample_data import get_sample_list, get_sample_by_id

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and load YOLO11n model once
    print("[CliniScan AI] Starting application...")
    init_db()
    # Pre-load singleton model
    try:
        ModelManager.load_model()
    except Exception as e:
        print(f"[CliniScan AI Warning] Model load at startup failed: {e}")
    yield
    # Shutdown
    print("[CliniScan AI] Application shutting down.")

app = FastAPI(
    title="CliniScan AI API",
    description="Explainable Multi-Abnormality Detection & Localization in Chest Radiographs with Clinical Reporting",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for local frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static asset folders
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

DATA_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/data", StaticFiles(directory=str(DATA_DIR)), name="data")

if TRAINING_DIR.exists():
    app.mount("/training-artifacts", StaticFiles(directory=str(TRAINING_DIR)), name="training-artifacts")

XAI_DIR = CLINISCAN_ROOT / "xai_results"
if XAI_DIR.exists():
    app.mount("/xai-artifacts", StaticFiles(directory=str(XAI_DIR)), name="xai-artifacts")

# Routes

@app.get("/")
async def root():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "CliniScan AI API is running. Visit /docs for Swagger API documentation."}


@app.get("/api/health")
async def health_check():
    model = ModelManager.get_model()
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
        "classes_count": len(CLASSES)
    }


@app.get("/api/dataset")
async def get_dataset_info():
    """Returns verified dataset information and integrity stats."""
    return DATASET_INFO


@app.get("/api/evaluation")
async def get_evaluation_metrics():
    """Returns official YOLO11n evaluation results and per-class AP metrics."""
    return MODEL_METRICS


@app.get("/api/training-history")
async def get_training_history():
    """Parses and returns 50-epoch loss and mAP progression from results.csv."""
    csv_path = TRAINING_DIR / "results.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="Training results.csv not found")

    epochs = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                clean_row = {k.strip(): float(v.strip()) for k, v in row.items() if v is not None}
                epochs.append(clean_row)
            except Exception:
                continue

    return {
        "total_epochs": len(epochs),
        "history": epochs
    }


@app.get("/api/samples")
async def list_sample_cases():
    """Returns catalog of pre-curated Chest X-ray cases from the validation set."""
    return get_sample_list()


@app.get("/api/samples/{sample_id}/image")
async def get_sample_image(sample_id: str):
    """Serves the full-resolution image for a curated sample."""
    sample = get_sample_by_id(sample_id)
    if not sample or not os.path.exists(sample["file_path"]):
        raise HTTPException(status_code=404, detail="Sample image not found")
    return FileResponse(sample["file_path"])


@app.post("/api/scan/upload")
async def scan_upload(
    file: UploadFile = File(...),
    conf_threshold: float = Form(0.20),
    iou_threshold: float = Form(0.45),
    patient_id: Optional[str] = Form(None),
    patient_age: Optional[str] = Form(None),
    patient_gender: Optional[str] = Form(None),
    patient_notes: Optional[str] = Form(None),
    clinical_indication: Optional[str] = Form(None)
):
    """
    Primary endpoint: Uploads Chest X-ray, executes YOLO11n inference,
    generates Grad-CAM explainability maps, writes clinical report & PDF,
    and stores scan to database.
    """
    scan_id = str(uuid.uuid4())
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    file_ext = Path(file.filename).suffix or ".png"
    uploaded_path = UPLOAD_DIR / f"{scan_id}_orig{file_ext}"

    with open(uploaded_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 1. Run YOLO11n detection + Grad-CAM XAI
        analysis = run_cliniscan_analysis(
            scan_id=scan_id,
            image_path=str(uploaded_path),
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold
        )

        patient_meta = {
            "patient_id": patient_id or f"CXR-{scan_id[:6].upper()}",
            "age": patient_age or "Unspecified",
            "gender": patient_gender or "Unspecified",
            "indication": clinical_indication or "Chest radiograph evaluation"
        }

        image_dim = {
            "width": analysis["image_width"],
            "height": analysis["image_height"]
        }

        # 2. Synthesize clinical diagnostic report
        report = generate_clinical_report(
            scan_id=scan_id,
            patient_info=patient_meta,
            detections=analysis["detections"],
            image_dim=image_dim
        )

        # 3. Generate hospital-grade PDF report
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        pdf_path = REPORTS_DIR / f"{scan_id}_report.pdf"
        img_refs = {
            "original": str(uploaded_path),
            "annotated": analysis["annotated_path"],
            "gradcam": analysis["gradcam_path"],
            "superimposed": analysis["superimposed_path"]
        }
        generate_pdf_report(scan_id, report, img_refs, str(pdf_path))

        # 4. Save to persistent database
        db_record = {
            "id": scan_id,
            "filename": file.filename,
            "patient_id": patient_meta["patient_id"],
            "patient_age": patient_meta["age"],
            "patient_gender": patient_meta["gender"],
            "patient_notes": patient_notes or "",
            "conf_threshold": conf_threshold,
            "iou_threshold": iou_threshold,
            "detections": analysis["detections"],
            "original_image_path": f"/data/uploads/{uploaded_path.name}",
            "annotated_image_path": f"/data/results/{Path(analysis['annotated_path']).name}",
            "gradcam_image_path": f"/data/results/{Path(analysis['gradcam_path']).name}",
            "superimposed_image_path": f"/data/results/{Path(analysis['superimposed_path']).name}",
            "thumbnail_path": f"/data/results/{Path(analysis['thumbnail_path']).name}",
            "report_text": report["report_text"],
            "pdf_path": f"/data/reports/{pdf_path.name}"
        }
        save_scan(db_record)

        return {
            "status": "success",
            "scan_id": scan_id,
            "patient_meta": patient_meta,
            "image_dim": image_dim,
            "analysis": analysis,
            "report": report,
            "pdf_url": f"/api/scans/{scan_id}/pdf",
            "image_urls": {
                "original": f"/data/uploads/{uploaded_path.name}",
                "annotated": f"/data/results/{Path(analysis['annotated_path']).name}",
                "gradcam": f"/data/results/{Path(analysis['gradcam_path']).name}",
                "superimposed": f"/data/results/{Path(analysis['superimposed_path']).name}",
                "thumbnail": f"/data/results/{Path(analysis['thumbnail_path']).name}"
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post("/api/scan/sample")
async def scan_sample(
    sample_id: str = Form(...),
    conf_threshold: float = Form(0.20),
    iou_threshold: float = Form(0.45),
    patient_notes: Optional[str] = Form(None)
):
    """
    Executes full CliniScan AI pipeline directly on one of the curated sample cases.
    """
    sample = get_sample_by_id(sample_id)
    if not sample or not os.path.exists(sample["file_path"]):
        raise HTTPException(status_code=404, detail="Curated sample not found")

    scan_id = str(uuid.uuid4())
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    file_ext = Path(sample["filename"]).suffix or ".png"
    uploaded_path = UPLOAD_DIR / f"{scan_id}_orig{file_ext}"
    shutil.copyfile(sample["file_path"], uploaded_path)

    try:
        analysis = run_cliniscan_analysis(
            scan_id=scan_id,
            image_path=str(uploaded_path),
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold
        )

        patient_meta = {
            "patient_id": sample["patient_id"],
            "age": sample["patient_age"],
            "gender": sample["patient_gender"],
            "indication": sample["clinical_indication"]
        }

        image_dim = {
            "width": analysis["image_width"],
            "height": analysis["image_height"]
        }

        report = generate_clinical_report(
            scan_id=scan_id,
            patient_info=patient_meta,
            detections=analysis["detections"],
            image_dim=image_dim
        )

        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        pdf_path = REPORTS_DIR / f"{scan_id}_report.pdf"
        img_refs = {
            "original": str(uploaded_path),
            "annotated": analysis["annotated_path"],
            "gradcam": analysis["gradcam_path"],
            "superimposed": analysis["superimposed_path"]
        }
        generate_pdf_report(scan_id, report, img_refs, str(pdf_path))

        db_record = {
            "id": scan_id,
            "filename": sample["filename"],
            "patient_id": patient_meta["patient_id"],
            "patient_age": patient_meta["age"],
            "patient_gender": patient_meta["gender"],
            "patient_notes": patient_notes or f"Demo Sample: {sample['title']}",
            "conf_threshold": conf_threshold,
            "iou_threshold": iou_threshold,
            "detections": analysis["detections"],
            "original_image_path": f"/data/uploads/{uploaded_path.name}",
            "annotated_image_path": f"/data/results/{Path(analysis['annotated_path']).name}",
            "gradcam_image_path": f"/data/results/{Path(analysis['gradcam_path']).name}",
            "superimposed_image_path": f"/data/results/{Path(analysis['superimposed_path']).name}",
            "thumbnail_path": f"/data/results/{Path(analysis['thumbnail_path']).name}",
            "report_text": report["report_text"],
            "pdf_path": f"/data/reports/{pdf_path.name}"
        }
        save_scan(db_record)

        return {
            "status": "success",
            "scan_id": scan_id,
            "patient_meta": patient_meta,
            "image_dim": image_dim,
            "analysis": analysis,
            "report": report,
            "pdf_url": f"/api/scans/{scan_id}/pdf",
            "image_urls": {
                "original": f"/data/uploads/{uploaded_path.name}",
                "annotated": f"/data/results/{Path(analysis['annotated_path']).name}",
                "gradcam": f"/data/results/{Path(analysis['gradcam_path']).name}",
                "superimposed": f"/data/results/{Path(analysis['superimposed_path']).name}",
                "thumbnail": f"/data/results/{Path(analysis['thumbnail_path']).name}"
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Sample analysis error: {str(e)}")


@app.get("/api/scans")
async def list_scans(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    search: str = Query("")
):
    """Returns persistent scan history records."""
    return get_scans(limit=limit, offset=offset, search=search)


@app.get("/api/scans/{scan_id}")
async def get_scan_details(scan_id: str):
    """Returns detailed result for a previous scan."""
    scan = get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@app.get("/api/scans/{scan_id}/pdf")
@app.head("/api/scans/{scan_id}/pdf")
async def download_scan_pdf(scan_id: str):
    """Downloads the generated medical PDF report for a scan."""
    scan = get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    pdf_rel = scan.get("pdf_path", "").lstrip("/data/")
    pdf_full = DATA_DIR / pdf_rel
    if not pdf_full.exists():
        raise HTTPException(status_code=404, detail="PDF report file not found on disk")
        
    return FileResponse(
        str(pdf_full),
        media_type="application/pdf",
        filename=f"CliniScan_Report_{scan['patient_id']}_{scan_id[:8]}.pdf"
    )


@app.delete("/api/scans/{scan_id}")
async def remove_scan(scan_id: str):
    """Deletes a scan record from history."""
    success = delete_scan(scan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scan not found or already deleted")
    return {"status": "deleted", "scan_id": scan_id}


@app.get("/api/stats")
async def get_dashboard_stats():
    """Returns aggregated scan history statistics."""
    return get_stats()


if __name__ == "__main__":
    import uvicorn
    print("[CliniScan AI] Starting Uvicorn Web Server on http://0.0.0.0:8000")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
