import os
import sys
from pathlib import Path

# Ensure root directory is in sys.path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import MODEL_PATH, DATASET_INFO, MODEL_METRICS
from app.inference import ModelManager, run_cliniscan_analysis
from app.report_generator import generate_clinical_report
from app.pdf_generator import generate_pdf_report
from app.database import init_db, save_scan, get_scans, get_stats
from app.sample_data import get_sample_list

def test_full_pipeline():
    print("\n--- [1] Testing Model Loading (Singleton) ---")
    model = ModelManager.load_model()
    assert model is not None, "Model failed to load"
    print(f"PASS: YOLO11n loaded with {len(model.names)} classes")

    print("\n--- [2] Testing Sample Catalog ---")
    samples = get_sample_list()
    assert len(samples) > 0, "No samples in catalog"
    print(f"PASS: {len(samples)} curated clinical samples available")
    sample_img = samples[0]["filename"]
    sample_path = str(Path("CliniScan_AI/cliniscan_dataset_clean/images/val") / sample_img)
    print(f"Using sample image: {sample_path}")

    print("\n--- [3] Testing YOLO11n Inference & Grad-CAM ---")
    scan_id = "test-verification-scan"
    analysis = run_cliniscan_analysis(
        scan_id=scan_id,
        image_path=sample_path,
        conf_threshold=0.15,
        iou_threshold=0.45
    )
    print(f"PASS: Analysis complete. Found {analysis['num_detections']} detections.")
    assert os.path.exists(analysis["annotated_path"]), "Annotated image missing"
    assert os.path.exists(analysis["gradcam_path"]), "Grad-CAM image missing"
    assert os.path.exists(analysis["superimposed_path"]), "Superimposed image missing"
    print(f"Annotated path: {analysis['annotated_path']}")
    print(f"Grad-CAM path: {analysis['gradcam_path']}")

    print("\n--- [4] Testing Clinical Report Generation ---")
    patient_info = {
        "patient_id": "CXR-VERIFY-001",
        "age": "68",
        "gender": "Female",
        "indication": "Evaluation of dyspnea and bilateral leg swelling"
    }
    image_dim = {"width": analysis["image_width"], "height": analysis["image_height"]}
    report = generate_clinical_report(
        scan_id=scan_id,
        patient_info=patient_info,
        detections=analysis["detections"],
        image_dim=image_dim
    )
    assert len(report["report_text"]) > 100, "Report text empty"
    print("PASS: Clinical report synthesized successfully:")
    print("Report excerpt:\n" + "\n".join(report["report_text"].split("\n")[:12]))

    print("\n--- [5] Testing Diagnostic Medical PDF Report Generation ---")
    pdf_path = f"data/reports/{scan_id}_report.pdf"
    img_refs = {
        "original": sample_path,
        "annotated": analysis["annotated_path"],
        "gradcam": analysis["gradcam_path"],
        "superimposed": analysis["superimposed_path"]
    }
    generated_pdf = generate_pdf_report(scan_id, report, img_refs, pdf_path)
    assert os.path.exists(generated_pdf), "PDF file missing"
    pdf_size = os.path.getsize(generated_pdf)
    assert pdf_size > 1000, "PDF file too small"
    print(f"PASS: PDF created at {generated_pdf} (size: {pdf_size} bytes)")

    print("\n--- [6] Testing Persistent Database ---")
    init_db()
    db_record = {
        "id": scan_id,
        "filename": sample_img,
        "patient_id": patient_info["patient_id"],
        "patient_age": patient_info["age"],
        "patient_gender": patient_info["gender"],
        "patient_notes": "Automated verification test record",
        "conf_threshold": 0.15,
        "iou_threshold": 0.45,
        "detections": analysis["detections"],
        "original_image_path": sample_path,
        "annotated_image_path": analysis["annotated_path"],
        "gradcam_image_path": analysis["gradcam_path"],
        "superimposed_image_path": analysis["superimposed_path"],
        "thumbnail_path": analysis["thumbnail_path"],
        "report_text": report["report_text"],
        "pdf_path": pdf_path
    }
    save_scan(db_record)
    scans = get_scans(limit=10)
    assert any(s["id"] == scan_id for s in scans), "Scan not found in database"
    stats = get_stats()
    print(f"PASS: Database verified. Total recorded scans: {stats['total_scans']}")

    print("\n=======================================================")
    print("  ALL 6 FULL-STACK VERIFICATION TESTS PASSED SUCCESSFULLY! ")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_pipeline()
