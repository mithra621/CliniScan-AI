import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = os.getenv("MODEL_PATH", str(BASE_DIR / "models" / "best.pt"))

DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
RESULTS_DIR = DATA_DIR / "results"
REPORTS_DIR = DATA_DIR / "reports"
DB_PATH = DATA_DIR / "cliniscan.db"

# Existing training & evaluation directories
CLINISCAN_ROOT = BASE_DIR / "CliniScan_AI"
TRAINING_DIR = CLINISCAN_ROOT / "yolo11n_training" / "cliniscan_yolo11n"
DATASET_DIR = CLINISCAN_ROOT / "cliniscan_dataset_clean"
EVALUATION_DIR = CLINISCAN_ROOT / "evaluation"

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

# Color palette for bounding boxes and UI tags (Hex and BGR)
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
    "Pneumothorax":       {"hex": "#BE123C", "bgr": (60, 18, 190)},     # Crimson (High Critical)
    "Pulmonary fibrosis": {"hex": "#9333EA", "bgr": (234, 51, 147)}     # Purple
}

# Clinical metadata for report generation & interpretation
PATHOLOGY_METADATA = {
    "Aortic enlargement": {
        "finding": "Visual features associated with enlargement or dilation of the thoracic aorta / aortic knob.",
        "anatomical_zone": "Superior Mediastinum / Aortic Arch",
        "severity": "Moderate",
        "urgency": "Non-urgent",
        "xai_explanation": "Grad-CAM highlights attention along the superior mediastinal contour and aortic knob region.",
        "recommendation": "Contrast-enhanced chest CT or echocardiogram suggested if aneurysmal dilatation is suspected."
    },
    "Atelectasis": {
        "finding": "Focal volume loss and collapsed pulmonary parenchyma with linear or discoid opacification.",
        "anatomical_zone": "Pulmonary Basal / Subsegmental Segments",
        "severity": "Moderate",
        "urgency": "Routine",
        "xai_explanation": "Grad-CAM identifies localized volume displacement and increased parenchymal density.",
        "recommendation": "Incentive spirometry, deep breathing exercises, and clinical correlation for airway obstruction."
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
        "recommendation": "Echocardiogram and clinical evaluation for congestive heart failure, cardiopathy, or pericardial effusion."
    },
    "Consolidation": {
        "finding": "Homogeneous parenchymal opacification obscuring underlying pulmonary vessels and air bronchograms.",
        "anatomical_zone": "Lobar / Segmental Alveolar Compartment",
        "severity": "High",
        "urgency": "Clinical Priority",
        "xai_explanation": "Grad-CAM concentrates strongly over the dense alveolar confluent opacity.",
        "recommendation": "Clinical correlation for acute bacterial pneumonia or aspiration; antimicrobial therapy as indicated."
    },
    "ILD": {
        "finding": "Diffuse reticular, nodular, or ground-glass interstitial markings across bilateral lung fields.",
        "anatomical_zone": "Bilateral Interstitial / Subpleural Basal",
        "severity": "High",
        "urgency": "Specialist Review",
        "xai_explanation": "Grad-CAM exhibits diffuse bilateral reticular pattern activation in the lower lung zones.",
        "recommendation": "High-Resolution Computed Tomography (HRCT) of chest and pulmonary function testing (PFTs)."
    },
    "Infiltration": {
        "finding": "Ill-defined patchy alveolar-interstitial haziness suggestive of cellular or fluid accumulation.",
        "anatomical_zone": "Peribronchovascular / Mid-Lung Fields",
        "severity": "Moderate",
        "urgency": "Active Follow-up",
        "xai_explanation": "Grad-CAM identifies irregular patchy zones of increased attenuation.",
        "recommendation": "Assess for active infectious or inflammatory pneumonitis; follow-up chest radiograph after treatment."
    },
    "Lung Opacity": {
        "finding": "Abnormal attenuation or non-specific density projecting over pulmonary parenchyma.",
        "anatomical_zone": "Pulmonary Parenchyma",
        "severity": "Moderate",
        "urgency": "Routine Follow-up",
        "xai_explanation": "Grad-CAM targets localized areas of increased radiographic opacity.",
        "recommendation": "Correlate with clinical symptomatology; repeat radiograph or CT chest if opacity persists."
    },
    "Nodule/Mass": {
        "finding": "Well-circumscribed or ill-defined spherical focal parenchymal lesion (>3cm mass, <=3cm nodule).",
        "anatomical_zone": "Pulmonary Parenchyma (Focal)",
        "severity": "High",
        "urgency": "High Priority",
        "xai_explanation": "Grad-CAM focuses sharply on the circumscribed round density.",
        "recommendation": "Chest CT with contrast protocol and comparison with prior imaging to assess doubling time and Fleischner Society criteria."
    },
    "Other lesion": {
        "finding": "Atypical radiographic lesion or structural abnormality not classified into primary categories.",
        "anatomical_zone": "Thoracic / Parenchymal Cavity",
        "severity": "Moderate",
        "urgency": "Radiologist Review",
        "xai_explanation": "Grad-CAM registers localized feature discrepancy compared to standard anatomy.",
        "recommendation": "Review with dedicated cross-sectional imaging or radiologist overread."
    },
    "Pleural effusion": {
        "finding": "Blunting of the costophrenic angle and meniscus-shaped fluid density in the pleural space.",
        "anatomical_zone": "Costophrenic Sulcus / Hemithorax Base",
        "severity": "High",
        "urgency": "Clinical Priority",
        "xai_explanation": "Grad-CAM focuses prominently on the dependent pleural gutter and blunted costophrenic angle.",
        "recommendation": "Evaluate for transudative vs exudative etiology, diagnostic thoracentesis or decubitus view if clinically warranted."
    },
    "Pleural thickening": {
        "finding": "Chronic thickening or fibrosis along the apical cap or lateral pleural surfaces.",
        "anatomical_zone": "Parietal / Visceral Pleura",
        "severity": "Low",
        "urgency": "Stable",
        "xai_explanation": "Grad-CAM outlines the peripheral pleural contour and lateral thoracic margin.",
        "recommendation": "Correlate with prior asbestos exposure or remote pleuritis; usually represents inactive sequelae."
    },
    "Pneumothorax": {
        "finding": "Visualized visceral pleural line with absent peripheral lung markings indicating intrapleural air.",
        "anatomical_zone": "Pleural Space / Apex & Lateral Margin",
        "severity": "Critical",
        "urgency": "EMERGENCY / STAT",
        "xai_explanation": "Grad-CAM isolates the sharp apical-lateral visceral line and radiolucent avascular space.",
        "recommendation": "IMMEDIATE clinical assessment: exclude tension pneumothorax. Oxygen therapy or tube thoracostomy as indicated."
    },
    "Pulmonary fibrosis": {
        "finding": "Volume loss with architectural distortion, traction bronchiectasis, and coarse reticular bands.",
        "anatomical_zone": "Peripheral / Basal Subpleural Spaces",
        "severity": "High",
        "urgency": "Specialist Review",
        "xai_explanation": "Grad-CAM pinpoints dense fibrotic architectural distortion and traction changes.",
        "recommendation": "Pulmonology consultation, HRCT chest, and serial pulmonary physiological monitoring."
    }
}

# Verified Dataset Information (From Project Verification)
DATASET_INFO = {
    "title": "CliniScan AI Verified Dataset",
    "training_images": 3516,
    "validation_images": 878,
    "total_images": 4394,
    "training_labels": 3516,
    "validation_labels": 878,
    "total_labels": 4394,
    "num_classes": 14,
    "status": "Verified",
    "matching_status": "Complete",
    "matching_percentage": 100.0,
    "matching_description": "Every training and validation image has a verified corresponding annotation label.",
    "scientific_clarification": "The 100% metric denotes dataset image-label matching and pipeline annotation completeness. It must not be conflated with YOLO11n detection accuracy or mAP."
}

# Official Model Evaluation Metrics (From evaluation/metrics.txt)
MODEL_METRICS = {
    "model_name": "YOLO11n (Ultralytics)",
    "weights_file": "best.pt",
    "image_size": 640,
    "epochs_trained": 50,
    "precision": 0.3890,
    "recall": 0.3584,
    "map50": 0.3223,
    "map50_95": 0.1607,
    "per_class": {
        "Aortic enlargement": {"ap50": 0.6898, "ap50_95": 0.4135},
        "Atelectasis":        {"ap50": 0.1880, "ap50_95": 0.0745},
        "Calcification":      {"ap50": 0.1956, "ap50_95": 0.0851},
        "Cardiomegaly":       {"ap50": 0.6931, "ap50_95": 0.4525},
        "Consolidation":      {"ap50": 0.2793, "ap50_95": 0.1382},
        "ILD":                {"ap50": 0.3349, "ap50_95": 0.1705},
        "Infiltration":       {"ap50": 0.2636, "ap50_95": 0.1154},
        "Lung Opacity":       {"ap50": 0.2734, "ap50_95": 0.1116},
        "Nodule/Mass":        {"ap50": 0.2467, "ap50_95": 0.1307},
        "Other lesion":       {"ap50": 0.1142, "ap50_95": 0.0438},
        "Pleural effusion":   {"ap50": 0.4281, "ap50_95": 0.1822},
        "Pleural thickening": {"ap50": 0.2311, "ap50_95": 0.0815},
        "Pneumothorax":       {"ap50": 0.2926, "ap50_95": 0.1383},
        "Pulmonary fibrosis": {"ap50": 0.2820, "ap50_95": 0.1114}
    }
}
