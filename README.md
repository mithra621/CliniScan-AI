# CliniScan AI: Explainable Multi-Abnormality Detection and Localization in Chest X-rays with Automated Clinical Report Generation

[![Live Web Application](https://img.shields.io/badge/Live%20Demo-cliniscan--ai.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://cliniscan-ai.vercel.app)
[![FastAPI Backend](https://img.shields.io/badge/Cloud%20API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://cliniscan-ai.onrender.com)
[![Swagger Docs](https://img.shields.io/badge/API%20Docs-Swagger%20UI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://cliniscan-ai.onrender.com/docs)
[![PyTorch](https://img.shields.io/badge/PyTorch-YOLO11n-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)

---

## 🌐 Live Deployments & Cloud Access

CliniScan AI is deployed and publicly accessible in the cloud:

| Service | Platform | Live URL |
| :--- | :--- | :--- |
| **Interactive Clinical Web App** | Vercel | [https://cliniscan-ai.vercel.app](https://cliniscan-ai.vercel.app) |
| **FastAPI Inference Backend** | Render | [https://cliniscan-ai.onrender.com](https://cliniscan-ai.onrender.com) |
| **Interactive API Documentation** | Swagger UI | [https://cliniscan-ai.onrender.com/docs](https://cliniscan-ai.onrender.com/docs) |
| **Real-time Engine Health Check** | JSON Endpoint | [https://cliniscan-ai.onrender.com/api/health](https://cliniscan-ai.onrender.com/api/health) |

> **Note on Free Tier Cloud Hosting**: The Render cloud inference container spins down after periods of inactivity. If visiting the live app for the first time, allow ~30 seconds for the cloud container to wake up.

---

**CliniScan AI** is an advanced, full-stack medical AI web application engineered for final-year engineering research and clinical decision-support demonstration. It integrates a fine-tuned **YOLO11n** deep learning object detection model trained on **4,394 chest radiographs** across **14 thoracic abnormality classes**, deep feature saliency **Grad-CAM (Layer 22 / C3k2)** explainability, automated structured radiological narrative synthesis, **ReportLab** clinical PDF generation, and an interactive **React + Vite** dashboard with persistent SQLite audit history.

---

## 🌟 Key Features

1. **Multi-Abnormality Detection & Localization**:
   - Simultaneous detection and pixel-level bounding-box localization across 14 thoracic pathologies.
   - Interactive Confidence Threshold slider (5% to 80%, default: 25%) and IoU NMS overlap slider.
   - Supported Classes: *Aortic enlargement, Atelectasis, Calcification, Cardiomegaly, Consolidation, ILD, Infiltration, Lung Opacity, Nodule/Mass, Other lesion, Pleural effusion, Pleural thickening, Pneumothorax, Pulmonary fibrosis*.

2. **Explainable AI (Grad-CAM)**:
   - Computes activation heatmaps directly from the neural network's neck (`Layer 22 / C3k2`).
   - Live visualizer modes:
     - **Superimposed Blend**: Dynamic opacity slider (0% to 100%) blending raw CXR with attention maps.
     - **Side-by-Side Triad**: Direct visual comparison of Raw CXR, YOLO11n bounding boxes, and Grad-CAM map.
     - **Raw Heatmap**: Full-intensity thermal colorbar scale (0.0 to 1.0).

3. **Hospital-Grade Medical PDF Reports**:
   - Synthesizes structured clinical radiology narrative (Patient Demographics, Clinical Impression, Detailed Localization Table, Severity ratings, Recommendations).
   - Generates downloadable clinical PDF reports via **ReportLab 5.0** with embedded CXR visual triad, table of findings, and digital verification seal.

4. **Curated Clinical Demonstration Cases**:
   - 1-Click validation cases for demonstration without manual file picking:
     - Case 1: *Cardiomegaly & Pleural Effusion*
     - Case 2: *Aortic Enlargement & Pulmonary Fibrosis*
     - Case 3: *Pulmonary Nodule / Mass & Opacity*
     - Case 4: *Subsegmental Atelectasis & Calcification*
     - Case 5: *Pneumothorax Case (Urgent / STAT)*
     - Case 6: *Interstitial Lung Disease (ILD)*

5. **Verified Validation Set Benchmark**:
   - **Precision**: 38.90% (0.3890)
   - **Recall**: 35.84% (0.3584)
   - **mAP@0.5**: 32.23% (0.3223)
   - **mAP@0.5:0.95**: 16.07% (0.1607)
   - Interactive Recharts bar chart displaying AP@0.50 and AP@0.50:0.95 for all 14 classes from real `per_class_metrics.txt`.
   - 50-Epoch training convergence charts (Box Loss, Class Loss, mAP) loaded from `results.csv`.
   - Full-resolution official artifact gallery: Normalized Confusion Matrix, Box PR Curve, Box F1 Curve.

6. **Persistent Scan History**:
   - SQLite audit trail storing all analyzed radiographs, patient identifiers, detected abnormalities, confidence scores, and PDF report paths in `data/cliniscan.db`.
   - Search by Patient ID, filename, or pathology, view previous scans, download past PDFs, or delete records.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Recharts, Lucide React, Modern Clinical CSS (Navy, Slate, Sky Theme).
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Ultralytics YOLO11n, PyTorch, OpenCV, Pillow, ReportLab.
- **Persistence**: SQLite (`data/cliniscan.db`).

---

## 📂 Project Architecture

```
CliniScan_AI -26/
├── backend/
│   ├── main.py                  # FastAPI application, routing & static mounts
│   ├── config.py                # System paths, 14 classes, palette & clinical metadata
│   ├── model_service.py         # Singleton YOLO11n model loader & bounding box engine
│   ├── gradcam_service.py       # Layer 22 (C3k2) Grad-CAM heatmap extraction
│   ├── report_service.py        # Clinical narrative & ReportLab PDF report builder
│   ├── history_service.py       # Persistent SQLite audit database CRUD
│   ├── evaluation_service.py    # Parsers for metrics.txt, per_class_metrics.txt, results.csv
│   ├── sample_data.py           # Catalog of curated clinical test cases
│   ├── requirements.txt         # Python dependencies
│   ├── models/
│   │   └── best.pt              # Trained YOLO11n weights checkpoint
│   ├── artifacts/               # Evaluation curves, confusion matrix, results.csv
│   ├── samples/                 # Sample demonstration CXR images
│   ├── uploads/                 # Runtime uploaded CXR radiographs
│   ├── results/                 # Annotated images & Grad-CAM outputs
│   └── reports/                 # Generated diagnostic PDF reports
├── frontend/
│   ├── package.json             # React, Vite, Recharts, Lucide dependencies
│   ├── vite.config.js           # Vite server configuration with backend proxy
│   ├── index.html               # Web application HTML entry
│   └── src/
│       ├── main.jsx             # React DOM entry
│       ├── App.jsx              # Root layout & tab router
│       ├── index.css            # Responsive clinical CSS design system
│       ├── components/
│       │   ├── Sidebar.jsx      # 8-Section navigation drawer
│       │   ├── Header.jsx       # Diagnostic top bar & status indicators
│       │   └── MetricCard.jsx   # Reusable clinical metric card
│       └── views/
│           ├── DashboardView.jsx    # Project overview, metrics & recent scans
│           ├── AnalysisView.jsx     # Upload dropzone, sliders & multi-mode viewer
│           ├── GradCamView.jsx      # Layer 22 XAI deep dive with blend controls
│           ├── ReportsView.jsx      # Clinical narrative preview & PDF export
│           ├── HistoryView.jsx      # Searchable SQLite audit log
│           ├── EvaluationView.jsx   # Per-class Recharts & 50-epoch loss curves
│           ├── MethodologyView.jsx  # 8-Step pipeline & YOLOv8 vs YOLO11 review
│           └── AboutView.jsx        # Project specs & regulatory research disclaimer
├── data/
│   └── cliniscan.db             # Persistent SQLite database
├── models/
│   └── best.pt                  # Original trained weights checkpoint
├── CliniScan_AI/                # Original Colab dataset & evaluation artifacts
├── run.py                       # Single-command application launcher
├── test_backend_api.py          # Comprehensive 8-point backend test suite
├── test_endpoints.py            # REST API compatibility test suite
├── test_system.py               # Full-pipeline verification test
├── .gitignore                   # Git exclusion rules
├── .env.example                 # Environment configuration template
└── README.md                    # Documentation
```

---

## ⚡ Exact PowerShell Setup & Run Instructions (Windows)

Open **PowerShell** in the workspace root directory:
```powershell
cd "c:\Users\mithr\Downloads\CliniScan_AI -26"
```

### 1. (Optional) Create Python Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install Backend Dependencies
```powershell
pip install -r backend/requirements.txt
```

### 3. Install Frontend Dependencies
```powershell
cd frontend
npm install
cd ..
```

### 4. Start the Application

You can start the full application in either of two ways:

#### Option A: Unified Launcher (FastAPI serves built React SPA + API)
```powershell
python run.py
```
Then open your browser at:
- **Application Dashboard**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Option B: Separate Development Servers (Recommended for Live React Editing)

**Terminal 1 (Backend - FastAPI):**
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend - Vite Dev Server):**
```powershell
cd frontend
npm run dev
```

Then open your browser at:
- **Vite React UI (Dev mode)**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend**: [http://127.0.0.1:8000](http://127.0.0.1:8000)

### 5. Verify Backend Health
```powershell
curl http://127.0.0.1:8000/api/health
```
Expected response:
```json
{
  "status": "healthy",
  "model_available": true,
  "model_loaded": true,
  "model_path": "C:\\Users\\mithr\\Downloads\\CliniScan_AI -26\\backend\\models\\best.pt",
  "architecture": "YOLO11n",
  "classes_count": 14,
  "classes": [...]
}
```

### 6. Run Automated Test Suites
```powershell
python test_backend_api.py
python test_endpoints.py
python test_system.py
```

---

## 🔬 Testing Checklist

- [x] **Model Verification**: Checkpoint verified at `backend/models/best.pt` (5,478,234 bytes).
- [x] **Classes Count**: Exact 14 classes mapped and confirmed against model metadata.
- [x] **Inference Pipeline**: YOLO11n bounding-box detection, label drawing, and coordinate normalization verified.
- [x] **Explainable AI**: Layer 22 (C3k2) Grad-CAM heatmap extraction and alpha blending verified.
- [x] **PDF Report Generation**: ReportLab 5.0 clinical PDF synthesis with embedded image triad verified (size: ~373 KB).
- [x] **Database Persistence**: SQLite audit trail records scans, patient demographics, and findings summary.
- [x] **Evaluation Data**: Real `per_class_metrics.txt` (14 classes) and `results.csv` (50 epochs) parsed without fabrication.
- [x] **React Production Build**: `npm run build` succeeds cleanly in 1.07s.
- [x] **API Test Suite**: 8/8 tests in `test_backend_api.py` passing.

---

## ⚕️ Regulatory & Research Disclaimer

**CliniScan AI is an artificial intelligence research platform developed for academic investigational purposes.** The predicted bounding boxes, class labels, confidence scores, and Grad-CAM activation heatmaps provide computerized exploratory decision-support evidence. They **must not be used as an autonomous medical diagnosis, definitive radiological finding, or treatment recommendation**. All clinical decision-making must be validated by a board-certified medical professional.
