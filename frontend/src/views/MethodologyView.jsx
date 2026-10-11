import React from 'react';
import { 
  Database, 
  Workflow, 
  Cpu, 
  FileCode, 
  CheckCircle2, 
  Layers, 
  BarChart, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function MethodologyView() {
  const pipelineSteps = [
    { num: 1, title: 'Input CXR Radiograph', desc: 'Accepts raw frontal thoracic PA radiographs in JPG, JPEG, or PNG format with dimension verification.' },
    { num: 2, title: 'Preprocessing & Normalization', desc: 'Bilinear letterbox resizing to 640x640 pixels, 3-channel conversion, and tensor float normalization [0, 1].' },
    { num: 3, title: 'YOLO11n Deep Inference', desc: 'Forward pass through modified CSPDarknet backbone featuring C3k2 building blocks and SPPF pooling.' },
    { num: 4, title: 'Multi-Abnormality Localization', desc: 'Decoupled detection heads regress anchor-free bounding boxes and predict logit probabilities for 14 classes.' },
    { num: 5, title: 'Confidence & NMS Filtering', desc: 'Non-Maximum Suppression (IoU default: 0.45) with user-controlled thresholding (default: 0.25) to prune duplicates.' },
    { num: 6, title: 'Grad-CAM Explainability', desc: 'Registers activation hooks on Neck Layer 22 (C3k2) to extract spatial attention heatmaps and calculate feature energy.' },
    { num: 7, title: 'Clinical Narrative Synthesis', desc: 'Automated synthesis of standardized findings, anatomical zone attribution, impression, and recommendations.' },
    { num: 8, title: 'Clinical PDF Export', desc: 'ReportLab rendering with embedded CXR visual triad (Raw, Bounding Boxes, Heatmap) and regulatory disclaimer.' },
  ];

  const classesList = [
    { id: 0, name: 'Aortic enlargement', zone: 'Superior Mediastinum / Aortic Arch', ap50: '68.98%' },
    { id: 1, name: 'Atelectasis', zone: 'Pulmonary Basal Segments', ap50: '18.80%' },
    { id: 2, name: 'Calcification', zone: 'Parenchymal / Hilar Granuloma', ap50: '19.56%' },
    { id: 3, name: 'Cardiomegaly', zone: 'Cardiac Silhouette / Ventricular Border', ap50: '69.31%' },
    { id: 4, name: 'Consolidation', zone: 'Lobar / Alveolar Compartment', ap50: '27.93%' },
    { id: 5, name: 'ILD', zone: 'Bilateral Interstitial / Subpleural', ap50: '33.49%' },
    { id: 6, name: 'Infiltration', zone: 'Mid-to-Lower Pulmonary Zones', ap50: '26.36%' },
    { id: 7, name: 'Lung Opacity', zone: 'Pulmonary Parenchyma (Segmental)', ap50: '27.34%' },
    { id: 8, name: 'Nodule/Mass', zone: 'Pulmonary Parenchyma / Peripheral', ap50: '24.67%' },
    { id: 9, name: 'Other lesion', zone: 'Thoracic Cavity / Extrapulmonary', ap50: '11.42%' },
    { id: 10, name: 'Pleural effusion', zone: 'Costophrenic Angle / Basal Pleura', ap50: '42.81%' },
    { id: 11, name: 'Pleural thickening', zone: 'Parietal / Visceral Pleural Margin', ap50: '23.11%' },
    { id: 12, name: 'Pneumothorax', zone: 'Apical / Lateral Pleural Space', ap50: '29.26%' },
    { id: 13, name: 'Pulmonary fibrosis', zone: 'Basilar & Subpleural Zones', ap50: '28.20%' },
  ];

  return (
    <div>
      {/* Problem Statement Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Workflow size={18} color="#0284c7" /> Problem Statement & Research Objective
          </div>
        </div>
        <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.65 }}>
          Thoracic radiography is the most frequently performed diagnostic imaging examination globally. However, high clinical workload, subtle lesion manifestation, and overlapping radiological features frequently contribute to missed or delayed findings. Furthermore, existing AI diagnostic tools predominantly function as opaque "black boxes" that output image-level class labels without spatial bounding boxes, without verifiable visual explainability, and without automated clinical-style reporting. 
        </p>
        <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.65, marginTop: '12px' }}>
          <strong>CliniScan AI</strong> addresses these limitations by developing an end-to-end framework integrating fine-tuned <strong>YOLO11n</strong> multi-abnormality localization, <strong>Grad-CAM</strong> feature saliency verification from the neck architecture, and <strong>automated radiological narrative synthesis</strong> with downloadable medical PDF documentation.
        </p>
      </div>

      {/* 8-Step Proposed Pipeline Flowchart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} color="#0284c7" /> Proposed 8-Step Diagnostic & Explainability Pipeline
          </div>
          <span className="badge badge-blue">End-to-End Pipeline</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '10px' }}>
          {pipelineSteps.map((step) => (
            <div 
              key={step.num}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                position: 'relative'
              }}
            >
              <div style={{ 
                width: '26px', 
                height: '26px', 
                borderRadius: '50%', 
                background: '#0284c7', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '10px'
              }}>
                {step.num}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a', marginBottom: '6px' }}>
                {step.title}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.5 }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dataset Specifications & 14 Pathology Taxonomy */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Database size={18} color="#059669" /> Curated Dataset & 14 Pathology Taxonomy
            </div>
            <div className="card-subtitle">
              4,394 total chest radiographs (80% Training: 3,516 images / 20% Validation: 878 images)
            </div>
          </div>
          <span className="badge badge-green">100% Label Match</span>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '8px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Class ID</th>
                <th>Pathology Class</th>
                <th>Target Anatomical Zone</th>
                <th>Validation AP@0.50</th>
              </tr>
            </thead>
            <tbody>
              {classesList.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: '#64748b' }}>#{c.id}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{c.name}</td>
                  <td style={{ fontSize: '0.8rem', color: '#475569' }}>{c.zone}</td>
                  <td>
                    <span className="badge badge-blue">{c.ap50}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Tables: Baseline vs Proposed & YOLOv8 vs YOLO11 */}
      <div className="grid-2">
        {/* Baseline Systems vs Proposed CliniScan AI */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BarChart size={18} color="#0284c7" /> Baseline vs Proposed System
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Capability</th>
                <th>Conventional Baseline</th>
                <th>Proposed CliniScan AI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Detection Format</td>
                <td>Image-level label only (no boxes)</td>
                <td><strong>Pixel Bounding Boxes (x1, y1, x2, y2)</strong></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Multi-Abnormality</td>
                <td>Single or binary classification</td>
                <td><strong>Simultaneous 14-Class Detection</strong></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Explainability (XAI)</td>
                <td>Opaque / Black-Box output</td>
                <td><strong>Layer 22 Neck Grad-CAM Saliency</strong></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Reporting Workflow</td>
                <td>Manual text dictation</td>
                <td><strong>Automated ReportLab Clinical PDF</strong></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Interactive Controls</td>
                <td>Fixed static threshold</td>
                <td><strong>Live Confidence & NMS Sliders</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* YOLOv8 vs YOLO11 Explanatory Technical Section */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Cpu size={18} color="#7c3aed" /> YOLOv8 vs YOLO11 Architectural Review
            </div>
            <span className="badge badge-blue">Explanatory Analysis</span>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '10px' }}>
              Our trained model utilizes <strong>Ultralytics YOLO11n</strong>. YOLO11 introduces key architectural refinements over YOLOv8:
            </p>
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#475569' }}>
              <li>
                <strong>C3k2 Bottlenecks:</strong> Replaces the earlier C2f modules with dual-kernel C3k2 blocks, offering flexible feature extraction at reduced computational parameter budget.
              </li>
              <li>
                <strong>C2PSA Attention:</strong> Integrates Cross-Stage Partial with Pointwise Spatial Attention in deeper backbone layers, enhancing long-range spatial context across thoracic lung fields.
              </li>
              <li>
                <strong>Optimized Neck & Head:</strong> Enhanced multi-scale feature fusion allows improved localization of small focal pulmonary nodules alongside large cardiac silhouettes.
              </li>
            </ul>
            <div style={{ marginTop: '12px', background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '0.74rem', color: '#64748b' }}>
              <em>Note:</em> Presented as an architectural comparison. No claims of superior experimental performance are made without a direct head-to-head empirical trial under identical hyperparameters.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
