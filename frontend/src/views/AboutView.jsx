import React from 'react';
import { 
  Info, 
  ShieldAlert, 
  Code, 
  Server, 
  Terminal, 
  HeartHandshake, 
  Award,
  Layers,
  FileCheck
} from 'lucide-react';

export default function AboutView({ healthInfo }) {
  return (
    <div>
      {/* Project Overview Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Award size={18} color="#0284c7" /> Final-Year Project Overview
          </div>
        </div>
        <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.65 }}>
          <p>
            <strong>Project Title:</strong> CliniScan AI: Explainable Multi-Abnormality Detection and Localization in Chest X-rays with Automated Clinical Report Generation.
          </p>
          <p style={{ marginTop: '10px' }}>
            This project investigates the intersection of real-time computer vision (YOLO11n), deep feature saliency explainability (Grad-CAM), and natural language medical narrative generation. By localizing 14 distinct thoracic conditions concurrently and mapping the spatial regions driving model predictions, the application provides an interpretable human-in-the-loop workflow for radiologist decision support.
          </p>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="grid-2">
        {/* Backend Stack */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Server size={18} color="#059669" /> Backend Architecture & AI Engine
            </div>
          </div>
          <table className="data-table">
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Object Detection Model</td>
                <td>Ultralytics YOLO11n (PyTorch)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Model Checkpoint Path</td>
                <td><code>backend/models/best.pt</code></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Explainable AI (XAI)</td>
                <td>Grad-CAM hooked to Neck Layer 22 (C3k2)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>API Framework</td>
                <td>FastAPI with Uvicorn ASGI Server</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>PDF Report Generation</td>
                <td>ReportLab 5.0 (Embedded Visual Triad)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Image Processing</td>
                <td>OpenCV (cv2) & Pillow (PIL)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Persistence</td>
                <td>SQLite3 (Persistent Audit History)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Frontend Stack */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Code size={18} color="#0284c7" /> Frontend & Visualization Stack
            </div>
          </div>
          <table className="data-table">
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>UI Library</td>
                <td>React 19 with Vite Build Tool</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Analytics & Charts</td>
                <td>Recharts (Responsive SVG Visualization)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Iconography</td>
                <td>Lucide React Medical & Diagnostic Icons</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Styling System</td>
                <td>Modern Clinical CSS (Navy, Slate, Sky Theme)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>API Integration</td>
                <td>RESTful JSON with Vite Dev Proxy & CORS</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Deployment Environment</td>
                <td>Windows 11 Localhost Architecture</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Ethical & Academic Guidelines */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <HeartHandshake size={18} color="#7c3aed" /> Ethical Machine Learning & Data Governance
          </div>
        </div>
        <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.6 }}>
          <p>
            • <strong>De-identification & Privacy:</strong> All radiographs utilized during training and evaluation underwent complete anonymization with removal of protected health information (PHI) in accordance with HIPAA safe-harbor standards.
          </p>
          <p style={{ marginTop: '8px' }}>
            • <strong>Algorithmic Transparency:</strong> Rather than hiding model uncertainty, CliniScan AI exposes raw confidence percentages, bounding box coordinates, and Layer 22 feature activation heatmaps to enable critical assessment by domain practitioners.
          </p>
          <p style={{ marginTop: '8px' }}>
            • <strong>Non-replacement Policy:</strong> Artificial intelligence in diagnostic radiology must function as assistive decision support, never as an unsupervised replacement for clinical judgment.
          </p>
        </div>
      </div>
    </div>
  );
}
