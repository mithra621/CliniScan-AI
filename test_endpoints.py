import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi.testclient import TestClient
from app.main import app

def test_api():
    client = TestClient(app)
    
    print("\n--- Testing API Endpoints ---")
    
    # 1. Health
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    print("PASS: /api/health ->", r.json())
    
    # 2. Dataset
    r = client.get("/api/dataset")
    assert r.status_code == 200, f"Dataset failed: {r.status_code}"
    d = r.json()
    assert d["total_images"] == 4394, f"Incorrect total images: {d['total_images']}"
    assert d["num_classes"] == 14, f"Incorrect class count: {d['num_classes']}"
    assert d["status"] == "Verified", f"Incorrect status: {d['status']}"
    print(f"PASS: /api/dataset -> {d['total_images']} total images, 14 classes, status: {d['status']}")
    
    # 3. Evaluation
    r = client.get("/api/evaluation")
    assert r.status_code == 200, f"Evaluation failed: {r.status_code}"
    e = r.json()
    assert e["precision"] == 0.3890
    assert e["recall"] == 0.3584
    assert e["map50"] == 0.3223
    assert len(e["per_class"]) == 14
    print(f"PASS: /api/evaluation -> Precision: {e['precision']}, Recall: {e['recall']}, mAP50: {e['map50']}")
    
    # 4. Training History
    r = client.get("/api/training-history")
    assert r.status_code == 200
    th = r.json()
    assert th["total_epochs"] == 50
    print(f"PASS: /api/training-history -> {th['total_epochs']} epochs parsed from results.csv")
    
    # 5. Samples
    r = client.get("/api/samples")
    assert r.status_code == 200
    samples = r.json()
    assert len(samples) == 6
    print(f"PASS: /api/samples -> {len(samples)} curated samples")
    
    # 6. Scans History
    r = client.get("/api/scans")
    assert r.status_code == 200
    scans = r.json()
    print(f"PASS: /api/scans -> {len(scans)} saved scans in database")
    
    # 7. Frontend Root
    r = client.get("/")
    assert r.status_code == 200
    assert "CliniScan AI" in r.text
    print("PASS: / (Root) -> Successfully served index.html")
    
    print("\nAll API endpoint tests passed successfully!")

if __name__ == "__main__":
    test_api()
