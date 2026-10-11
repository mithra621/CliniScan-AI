import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi.testclient import TestClient
from backend.main import app

def test_backend_endpoints():
    client = TestClient(app)
    print("\n==================================================")
    print("  CLINISCAN AI — BACKEND ENDPOINT VERIFICATION   ")
    print("==================================================")

    # 1. Health
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    h = r.json()
    assert h["status"] == "healthy"
    assert h["model_loaded"] is True
    assert h["classes_count"] == 14
    print(f"✓ GET /api/health -> Healthy, Model: {h['architecture']}, Classes: {h['classes_count']}")

    # 2. Metrics
    r = client.get("/api/metrics")
    assert r.status_code == 200
    m = r.json()
    assert m["overall"]["precision"] == 0.3890
    assert m["overall"]["recall"] == 0.3584
    assert m["overall"]["map50"] == 0.3223
    assert len(m["per_class"]) == 14
    assert len(m["training_history"]) == 50
    print(f"✓ GET /api/metrics -> Precision: {m['overall']['precision']}, Recall: {m['overall']['recall']}, mAP50: {m['overall']['map50']}")
    print(f"  Per-class metrics: {len(m['per_class'])} classes verified")
    print(f"  Training history : {len(m['training_history'])} epochs verified")

    # 3. Samples
    r = client.get("/api/samples")
    assert r.status_code == 200
    s = r.json()
    assert len(s["samples"]) == 6
    print(f"✓ GET /api/samples -> {len(s['samples'])} curated clinical validation cases available")

    # 4. History
    r = client.get("/api/history")
    assert r.status_code == 200
    hist = r.json()
    print(f"✓ GET /api/history -> {hist['total']} scans stored in persistent SQLite audit log")

    # 5. Prediction with sample case
    sample_id = s["samples"][0]["id"]
    print(f"\n--- Testing POST /api/predict with sample '{sample_id}' ---")
    r = client.post("/api/predict", data={
        "sample_id": sample_id,
        "conf_threshold": 0.20,
        "iou_threshold": 0.45,
        "patient_id": "TEST-CXR-001",
        "age": "68",
        "gender": "Female",
        "indication": "Dyspnea on exertion"
    })
    assert r.status_code == 200, f"Prediction failed: {r.text}"
    pred = r.json()
    assert pred["status"] == "success"
    analysis_id = pred["analysis_id"]
    print(f"✓ POST /api/predict -> Analysis ID: {analysis_id}")
    print(f"  Detections found: {pred['num_detections']}")
    for d in pred["detections"]:
        print(f"    - {d['class_name']}: {d['confidence_percent']}% | Box: {d['box']}")
    print(f"  Generated PDF Report: {pred['report']['pdf_url']}")

    # 6. Report Retrieval
    print(f"\n--- Testing GET /api/report/{analysis_id} ---")
    r = client.get(f"/api/report/{analysis_id}")
    assert r.status_code == 200, f"Report download failed: {r.status_code}"
    assert r.headers["content-type"] == "application/pdf"
    assert len(r.content) > 10000
    print(f"✓ GET /api/report/{analysis_id} -> Successfully streamed PDF ({len(r.content)} bytes)")

    # 7. Single scan detail from history
    r = client.get(f"/api/history/{analysis_id}")
    assert r.status_code == 200
    detail = r.json()
    assert detail["scan"]["id"] == analysis_id
    print(f"✓ GET /api/history/{analysis_id} -> Retrieved audit detail record")

    # 8. Root serves index.html
    r = client.get("/")
    assert r.status_code == 200
    assert "CliniScan AI" in r.text
    print(f"✓ GET / -> Successfully serves production React application")

    print("\n==================================================")
    print("  ALL BACKEND TESTS PASSED SUCCESSFULLY! (8/8)   ")
    print("==================================================\n")

if __name__ == "__main__":
    test_backend_endpoints()
