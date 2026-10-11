import os
from pathlib import Path

# Paths
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Check backend/models/best.pt first, then fallback to root models/best.pt
DEFAULT_MODEL_PATH = BACKEND_DIR / "models" / "best.pt"
if not DEFAULT_MODEL_PATH.exists():
    FALLBACK_PATH = PROJECT_ROOT / "models" / "best.pt"
    if FALLBACK_PATH.exists():
        DEFAULT_MODEL_PATH = FALLBACK_PATH

MODEL_PATH = Path(os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH))).resolve()

# Directories for runtime artifacts
UPLOADS_DIR = BACKEND_DIR / "uploads"
RESULTS_DIR = BACKEND_DIR / "results"
REPORTS_DIR = BACKEND_DIR / "reports"
ARTIFACTS_DIR = BACKEND_DIR / "artifacts"
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "cliniscan.db"

# Sample images directory
SAMPLES_DIR = PROJECT_ROOT / "CliniScan_AI" / "cliniscan_dataset_clean" / "images" / "val"

# Ensure runtime directories exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# 14 Abnormality Classes
CLASSES = [
    "Aortic enlargement",
    "Atelectasis",
    "Calcification",
    "Cardiomegaly",
    "Consolidation",
    "ILD",
    "Infiltration",
    "Lung Opacity",
    "Nodule/Mass",
    "Other lesion",
    "Pleural effusion",
    "Pleural thickening",
    "Pneumothorax",
    "Pulmonary fibrosis"
]

# Color palette for bounding boxes and UI tags (Hex and BGR for OpenCV)
CLASS_PALETTE = {
    "Aortic enlargement": {"hex": "#E11D48", "bgr": (72, 29, 225)},     # Rose
    "Atelectasis":        {"hex": "#D97706", "bgr": (6, 119, 217)},     # Amber
    "Calcification":      {"hex": "#0D9488", "bgr": (136, 148, 13)},    # Teal
    "Cardiomegaly":       {"hex": "#DC2626", "bgr": (38, 38, 220)},     # Red
    "Consolidation":      {"hex": "#2563EB", "bgr": (235, 99, 37)},     # Blue
    "ILD":                {"hex": "#7C3AED", "bgr": (237, 58, 124)},    # Violet
    "Infiltration":       {"hex": "#0891B2", "bgr": (178, 145, 8)},     # Cyan
    "Lung Opacity":       {"hex": "#4F46E5", "bgr": (229, 70, 79)},     # Indigo
    "Nodule/Mass":        {"hex": "#EA580C", "bgr": (12, 88, 234)},     # Orange
    "Other lesion":       {"hex": "#64748B", "bgr": (139, 116, 100)},   # Slate
    "Pleural effusion":   {"hex": "#0284C7", "bgr": (199, 132, 2)},     # Sky Blue
    "Pleural thickening": {"hex": "#059669", "bgr": (105, 150, 5)},     # Emerald
    "Pneumothorax":       {"hex": "#BE123C", "bgr": (60, 18, 190)},     # Crimson (STAT)
    "Pulmonary fibrosis": {"hex": "#9333EA", "bgr": (234, 51, 147)}     # Purple
}

# Clinical metadata for radiological reporting & interpretation
PATHOLOGY_METADATA = {
    "Aortic enlargement": {
        "finding": "Visual features associated with enlargement or prominent dilation of the thoracic aorta / aortic knob.",
        "anatomical_zone": "Superior Mediastinum / Aortic Arch",
        "severity": "Moderate",
        "urgency": "Non-urgent",
        "xai_explanation": "Grad-CAM highlights attention along the superior mediastinal contour and aortic knob region.",
        "recommendation": "Contrast-enhanced chest CT or echocardiogram suggested if aneurysmal dilatation is suspected clinically."
    },
    "Atelectasis": {
        "finding": "Focal volume loss and collapsed pulmonary parenchyma with linear or discoid opacification.",
        "anatomical_zone": "Pulmonary Basal / Subsegmental Segments",
        "severity": "Moderate",
        "urgency": "Routine",
        "xai_explanation": "Grad-CAM identifies localized volume displacement and increased parenchymal density.",
        "recommendation": "Incentive spirometry, deep breathing exercises, and clinical correlation for bronchial obstruction."
    },
    "Calcification": {
        "finding": "High-attenuation calcified density, typically indicative of healed granulomatous infection.",
        "anatomical_zone": "Parenchymal / Hilar Granuloma",
        "severity": "Low",
        "urgency": "Benign / Stable",
        "xai_explanation": "Grad-CAM registers prominent high-contrast focal pixel clusters characteristic of calcification.",
        "recommendation": "Typically benign; compare with prior radiographs to confirm long-term temporal stability."
    },
    "Cardiomegaly": {
        "finding": "Increased cardiothoracic ratio (CTR > 0.50) with prominent cardiac silhouette enlargement.",
        "anatomical_zone": "Cardiac Silhouette / Pericardial Border",
        "severity": "High",
        "urgency": "Clinical Priority",
        "xai_explanation": "Grad-CAM highlights wide bilateral attention expanding across the cardiac margins and ventricular borders.",
        "recommendation": "Echocardiogram and clinical evaluation for congestive heart failure, cardiomyopathy, or pericardial effusion."
    },
    "Consolidation": {
        "finding": "Homogeneous parenchymal opacification obscuring underlying pulmonary vessels with possible air bronchograms.",
        "anatomical_zone": "Lobar / Segmental Alveolar Compartment",
        "severity": "High",
        "urgency": "Clinical Priority",
        "xai_explanation": "Grad-CAM concentrates strongly over the dense alveolar confluent opacity.",
        "recommendation": "Clinical correlation for acute bacterial pneumonia or aspiration; antimicrobial therapy as clinically indicated."
    },
    "ILD": {
        "finding": "Diffuse reticular, nodular, or ground-glass interstitial markings across bilateral lung fields.",
        "anatomical_zone": "Bilateral Interstitial / Subpleural Basal",
        "severity": "High",
        "urgency": "Clinical Priority",
        "xai_explanation": "Grad-CAM displays diffuse parenchymal activation matching interstitial reticular architecture.",
        "recommendation": "High-Resolution Computed Tomography (HRCT) of the chest and pulmonology specialist consultation."
    },
    "Infiltration": {
        "finding": "Ill-defined parenchymal density consistent with inflammatory or infectious exudate.",
        "anatomical_zone": "Mid-to-Lower Pulmonary Zones",
        "severity": "Moderate",
        "urgency": "Routine",
        "xai_explanation": "Grad-CAM registers increased gradient responsiveness across non-homogeneous patchy airspace densities.",
        "recommendation": "Follow-up radiograph in 4 to 6 weeks to confirm radiological resolution following treatment."
    },
    "Lung Opacity": {
        "finding": "Non-specific pulmonary density with attenuation higher than surrounding aerated lung parenchyma.",
        "anatomical_zone": "Pulmonary Parenchyma (Segmental/Subsegmental)",
        "severity": "Moderate",
        "urgency": "Routine",
        "xai_explanation": "Grad-CAM focuses on focal attenuation differences relative to normally ventilated lung.",
        "recommendation": "Clinical correlation with respiratory symptoms; diagnostic CT recommended if persistent."
    },
    "Nodule/Mass": {
        "finding": "Focal rounded soft-tissue lesion within the lung parenchyma (<3 cm nodule, >3 cm mass).",
        "anatomical_zone": "Pulmonary Parenchyma / Peripheral",
        "severity": "High",
        "urgency": "High Priority",
        "xai_explanation": "Grad-CAM localizes sharp focal spherical activation boundaries surrounding the lesion.",
        "recommendation": "Chest CT with contrast, Fleischner Society nodule guideline protocol follow-up, and multidisciplinary review."
    },
    "Other lesion": {
        "finding": "Atypical radiographic lesion or structural parenchymal variation not fitting standardized primary categories.",
        "anatomical_zone": "Thoracic Cavity / Extrapulmonary",
        "severity": "Moderate",
        "urgency": "Routine",
        "xai_explanation": "Grad-CAM reveals localized structural anomaly distinguishing it from standard anatomy.",
        "recommendation": "Dedicated high-resolution imaging and comparative analysis with prior historical radiographs."
    },
    "Pleural effusion": {
        "finding": "Blunting of the costophrenic angle and meniscus sign indicating abnormal fluid collection in the pleural space.",
        "anatomical_zone": "Costophrenic Angle / Basal Pleural Space",
        "severity": "High",
        "urgency": "Clinical Priority",
        "xai_explanation": "Grad-CAM identifies sharp crescentic fluid boundary masking the acute costophrenic sulcus.",
        "recommendation": "Thoracic ultrasonography, diagnostic thoracentesis if indicated, and evaluation for cardiopulmonary etiology."
    },
    "Pleural thickening": {
        "finding": "Focal or continuous fibrous thickening and pleural enhancement along the thoracic wall or apical caps.",
        "anatomical_zone": "Parietal / Visceral Pleural Margin",
        "severity": "Low",
        "urgency": "Benign / Stable",
        "xai_explanation": "Grad-CAM traces elongated peripheral pleural lines distinct from aerated lung tissue.",
        "recommendation": "Assess occupational history (e.g. asbestos exposure); correlate with historical imaging to confirm stability."
    },
    "Pneumothorax": {
        "finding": "Visceral pleural line with peripheral radiolucency and absence of pulmonary vascular markings.",
        "anatomical_zone": "Apical / Lateral Pleural Space",
        "severity": "Critical",
        "urgency": "STAT / Urgent",
        "xai_explanation": "Grad-CAM activates along the visceral pleural stripe and hyperlucent non-vascularized air crescent.",
        "recommendation": "Immediate clinical evaluation for tension physiology; emergent supplemental oxygen or tube thoracostomy if indicated."
    },
    "Pulmonary fibrosis": {
        "finding": "Coarse reticular opacities, traction bronchiectasis, and volume contraction characteristic of fibrotic remodeling.",
        "anatomical_zone": "Basilar & Peripheral Subpleural Zones",
        "severity": "High",
        "urgency": "Clinical Priority",
        "xai_explanation": "Grad-CAM highlights architectural distortion and peripheral coarse interstitial fibrotic bands.",
        "recommendation": "HRCT thorax, pulmonary function tests with DLCO, and comprehensive interstitial lung disease clinic workup."
    }
}

# Verified Validation Metrics
VERIFIED_METRICS = {
    "model_name": "YOLO11n",
    "validation_split": "val",
    "image_size": 640,
    "precision": 0.3890,
    "precision_percent": 38.90,
    "recall": 0.3584,
    "recall_percent": 35.84,
    "map50": 0.3223,
    "map50_percent": 32.23,
    "map50_95": 0.1607,
    "map50_95_percent": 16.07
}

# Dataset Specifications
DATASET_STATS = {
    "name": "CliniScan Cleaned Chest Radiograph Dataset",
    "total_images": 4394,
    "train_images": 3516,
    "val_images": 878,
    "classes_count": 14,
    "annotation_matching_percent": 100.0,
    "split_ratio": "80% Training / 20% Validation",
    "note": "100% refers to dataset annotation completeness during data curation, distinct from model detection accuracy (32.23% mAP50)."
}
