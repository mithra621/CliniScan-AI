from pathlib import Path
from typing import List, Dict, Any, Optional

from backend.config import BACKEND_DIR, PROJECT_ROOT

SAMPLES_DIR = BACKEND_DIR / "samples"
FALLBACK_SAMPLES_DIR = PROJECT_ROOT / "CliniScan_AI" / "cliniscan_dataset_clean" / "images" / "val"

SAMPLES_CATALOG = [
    {
        "id": "sample-01",
        "title": "Cardiomegaly & Pleural Effusion",
        "filename": "00150343289f317a0ad5629d5b7d9ef9.png",
        "patient_id": "CXR-VAL-0150",
        "patient_age": "68",
        "patient_gender": "Female",
        "clinical_indication": "Progressive dyspnea on exertion and bilateral lower extremity edema",
        "primary_abnormalities": ["Cardiomegaly", "Pleural effusion"],
        "recommended_conf": 0.20,
        "description": "Marked transverse cardiac enlargement with blunting of the costophrenic angles bilaterally."
    },
    {
        "id": "sample-02",
        "title": "Aortic Enlargement & Pulmonary Fibrosis",
        "filename": "000d68e42b71d3eac10ccc077aba07c1.png",
        "patient_id": "CXR-VAL-000D",
        "patient_age": "72",
        "patient_gender": "Male",
        "clinical_indication": "Chronic dry cough, hypertension, exertional breathlessness",
        "primary_abnormalities": ["Aortic enlargement", "Pulmonary fibrosis", "Pleural thickening"],
        "recommended_conf": 0.20,
        "description": "Prominent thoracic aortic knob with peripheral reticular fibrotic interstitial markings."
    },
    {
        "id": "sample-03",
        "title": "Pulmonary Nodule / Mass & Opacity",
        "filename": "0005e8e3701dfb1dd93d53e2ff537b6e.png",
        "patient_id": "CXR-VAL-0005",
        "patient_age": "59",
        "patient_gender": "Male",
        "clinical_indication": "Hemoptysis evaluation and 30 pack-year smoking history",
        "primary_abnormalities": ["Nodule/Mass", "Lung Opacity", "Consolidation"],
        "recommended_conf": 0.15,
        "description": "Focal rounded soft-tissue density projecting over the pulmonary mid-zone."
    },
    {
        "id": "sample-04",
        "title": "Subsegmental Atelectasis & Calcification",
        "filename": "018a2fe44c3451281ec338c27ecc9c53.png",
        "patient_id": "CXR-VAL-018A",
        "patient_age": "61",
        "patient_gender": "Female",
        "clinical_indication": "Post-operative follow-up and shallow respiration",
        "primary_abnormalities": ["Atelectasis", "Calcification"],
        "recommended_conf": 0.15,
        "description": "Basilar volume reduction with focal linear densities and calcified granuloma."
    },
    {
        "id": "sample-05",
        "title": "Pneumothorax Case (Urgent / STAT)",
        "filename": "0e21abbef40e569be72ab0ad90544f87.png",
        "patient_id": "CXR-VAL-0E21",
        "patient_age": "34",
        "patient_gender": "Male",
        "clinical_indication": "Acute onset sharp pleuritic chest pain and sudden dyspnea",
        "primary_abnormalities": ["Pneumothorax"],
        "recommended_conf": 0.12,
        "description": "Visceral pleural contour with absence of peripheral bronchovascular lung markings."
    },
    {
        "id": "sample-06",
        "title": "Interstitial Lung Disease (ILD)",
        "filename": "013893a5fa90241c65c3efcdbdd2cec1.png",
        "patient_id": "CXR-VAL-0138",
        "patient_age": "66",
        "patient_gender": "Female",
        "clinical_indication": "Systemic sclerosis surveillance with restrictive pulmonary function",
        "primary_abnormalities": ["ILD"],
        "recommended_conf": 0.15,
        "description": "Bilateral symmetrical fine reticulonodular haziness across the lower lung zones."
    }
]

def get_sample_list() -> List[Dict[str, Any]]:
    result = []
    for item in SAMPLES_CATALOG:
        local_path = SAMPLES_DIR / item["filename"]
        if not local_path.exists():
            local_path = FALLBACK_SAMPLES_DIR / item["filename"]

        entry = dict(item)
        entry["exists"] = local_path.exists()
        entry["image_url"] = f"/samples/{item['filename']}"
        result.append(entry)
    return result

def get_sample_by_id(sample_id: str) -> Optional[Dict[str, Any]]:
    for item in SAMPLES_CATALOG:
        if item["id"] == sample_id:
            local_path = SAMPLES_DIR / item["filename"]
            if not local_path.exists():
                local_path = FALLBACK_SAMPLES_DIR / item["filename"]
            entry = dict(item)
            entry["file_path"] = str(local_path)
            return entry
    return None
