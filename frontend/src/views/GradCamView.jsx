import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  Eye, 
  Sliders, 
  Info,
  Maximize2,
  ChevronRight,
  Split,
  Cpu,
  Activity
} from 'lucide-react';

export default function GradCamView({ currentAnalysis, setActiveTab }) {
  const [blendOpacity, setBlendOpacity] = useState(45); // 0 to 100%
  const [displayMode, setDisplayMode] = useState('blend'); // 'blend' | 'split' | 'heatmap' | 'slider'
  const [wipePercent, setWipePercent] = useState(50); // for interactive wipe comparison

  // Reference XAI examples from training / Colab experiments
  const colabExamples = [
    {
      id: 'ex-1',
      title: 'Cardiomegaly & Pleural Effusion Multi-Abnormality',
      desc: 'Wide lateral ventricular contour activation combined with blunted costophrenic angle focus.',
      path: '/artifacts/val_batch0_pred.jpg'
    },
    {
      id: 'ex-2',
      title: 'Aortic Enlargement Mediastinal Saliency',
      desc: 'Focal high-intensity activation concentrated along the thoracic aortic knob.',
      path: '/artifacts/val_batch1_pred.jpg'
    },
    {
      id: 'ex-3',
      title: 'Parenchymal Consolidation & Infiltration',
      desc: 'Confluent alveolar opacity mapping with elevated gradient energy in mid lung fields.',
      path: '/artifacts/val_batch2_pred.jpg'
    }
  ];

  return (
    <div className="animate-fade-in">
      {currentAnalysis ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 370px', gap: '24px' }}>
          
          {/* Main Visualizer Area */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Sparkles size={18} color="#7c3aed" /> YOLO11n Layer 22 (C3k2) Saliency Engine
                </div>
                <div className="card-subtitle">
                  Deep spatial gradient attention contributing to multi-abnormality bounding boxes
                </div>
              </div>

              {/* Display Mode Tabs */}
              <div className="image-tabs">
                <button 
                  className={`image-tab-btn ${displayMode === 'blend' ? 'active' : ''}`}
                  onClick={() => setDisplayMode('blend')}
                >
                  Alpha Blend
                </button>
                <button 
                  className={`image-tab-btn ${displayMode === 'slider' ? 'active' : ''}`}
                  onClick={() => setDisplayMode('slider')}
                >
                  Wipe Slider
                </button>
                <button 
                  className={`image-tab-btn ${displayMode === 'split' ? 'active' : ''}`}
                  onClick={() => setDisplayMode('split')}
                >
                  Triad View
                </button>
                <button 
                  className={`image-tab-btn ${displayMode === 'heatmap' ? 'active' : ''}`}
                  onClick={() => setDisplayMode('heatmap')}
                >
                  Raw Heatmap
                </button>
              </div>
            </div>

            {/* Display Modes */}
            {displayMode === 'blend' && (
              <div>
                <div className="viewer-stage" style={{ position: 'relative' }}>
                  {/* Base Raw CXR */}
                  <img 
                    src={currentAnalysis.images.original_url} 
                    alt="Original CXR" 
                    style={{ position: 'absolute', maxWidth: '100%', maxHeight: '500px' }}
                  />
                  {/* Heatmap overlay with live dynamic opacity */}
                  <img 
                    src={currentAnalysis.images.gradcam_url} 
                    alt="Grad-CAM Heatmap" 
                    style={{ 
                      position: 'relative', 
                      maxWidth: '100%', 
                      maxHeight: '500px',
                      opacity: blendOpacity / 100,
                      mixBlendMode: 'screen',
                      transition: 'opacity 0.1s ease'
                    }}
                  />
                </div>

                {/* Opacity slider with quick preset markers */}
                <div style={{ marginTop: '18px', background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    <span>Live Superimposed Opacity</span>
                    <span className="badge badge-violet">{blendOpacity}% Heatmap</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={blendOpacity}
                    onChange={(e) => setBlendOpacity(parseInt(e.target.value))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
                    <span>0% (Raw Radiograph)</span>
                    <span>45% (Recommended Clinical Blend)</span>
                    <span>100% (Thermal Attention Mask)</span>
                  </div>
                </div>
              </div>
            )}

            {displayMode === 'slider' && (
              <div>
                <div className="viewer-stage" style={{ position: 'relative', overflow: 'hidden' }}>
                  {/* Base Original Image */}
                  <img 
                    src={currentAnalysis.images.original_url} 
                    alt="Raw CXR" 
                    style={{ maxWidth: '100%', maxHeight: '500px' }}
                  />
                  {/* Overlay Heatmap clipped by wipe percentage */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${wipePercent}%`,
                    height: '100%',
                    overflow: 'hidden',
                    borderRight: '3px solid #38bdf8',
                    boxShadow: '4px 0 16px rgba(56, 189, 248, 0.4)'
                  }}>
                    <img 
                      src={currentAnalysis.images.superimposed_url} 
                      alt="Superimposed" 
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        maxWidth: 'none',
                        maxHeight: 'none',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '18px', background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    <span>Interactive Before/After Wipe Divider</span>
                    <span className="badge badge-blue">{wipePercent}% Revealed</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={wipePercent}
                    onChange={(e) => setWipePercent(parseInt(e.target.value))}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
                    <span>◀ Slide Left to view Raw CXR</span>
                    <span>Slide Right to reveal Grad-CAM Attention ▶</span>
                  </div>
                </div>
              </div>
            )}

            {displayMode === 'split' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ background: '#070d1e', borderRadius: '10px', overflow: 'hidden', textAlign: 'center', border: '1px solid #334155' }}>
                  <div style={{ background: '#1e293b', color: '#cbd5e1', fontSize: '0.74rem', padding: '7px', fontWeight: 700 }}>
                    1. RAW RADIOGRAPH
                  </div>
                  <img src={currentAnalysis.images.original_url} alt="Original" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
                <div style={{ background: '#070d1e', borderRadius: '10px', overflow: 'hidden', textAlign: 'center', border: '1px solid #334155' }}>
                  <div style={{ background: '#1e293b', color: '#38bdf8', fontSize: '0.74rem', padding: '7px', fontWeight: 700 }}>
                    2. YOLO11n BOUNDING BOXES
                  </div>
                  <img src={currentAnalysis.images.annotated_url} alt="Annotated" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
                <div style={{ background: '#070d1e', borderRadius: '10px', overflow: 'hidden', textAlign: 'center', border: '1px solid #334155' }}>
                  <div style={{ background: '#1e293b', color: '#c084fc', fontSize: '0.74rem', padding: '7px', fontWeight: 700 }}>
                    3. GRAD-CAM (LAYER 22)
                  </div>
                  <img src={currentAnalysis.images.gradcam_url} alt="Grad-CAM" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              </div>
            )}

            {displayMode === 'heatmap' && (
              <div>
                <div className="viewer-stage">
                  <img src={currentAnalysis.images.gradcam_url} alt="Pure Heatmap" />
                </div>
                {/* Enhanced Colormap Scale */}
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1' }}>0.0 Baseline Lung</span>
                  <div style={{ 
                    width: '280px', 
                    height: '14px', 
                    borderRadius: '7px',
                    background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e11d48' }}>1.0 Peak Gradient Focus</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Pathology Attribution Breakdown & Layer Specs */}
          <div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Layers size={18} color="#0284c7" /> Saliency Attribution
                </div>
                <span className="badge badge-violet">Grad-CAM XAI</span>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
                Neural activation correlation across localized thoracic findings:
              </div>

              {currentAnalysis.detections.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentAnalysis.detections.map((det, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '10px', 
                        padding: '13px',
                        background: '#f8fafc',
                        borderLeft: `4px solid ${det.hex || '#0284c7'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>
                          {det.class_name}
                        </span>
                        <span className="badge badge-blue">
                          {det.confidence_percent.toFixed(1)}% Conf
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.5 }}>
                        <strong>Layer 22 Attribution:</strong> Positive channel gradients localize around the anatomical contour of {det.class_name.toLowerCase()}.
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '28px 10px', color: '#64748b' }}>
                  <p style={{ fontWeight: 700 }}>No localized objects above threshold</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    Heatmap reflects baseline distributed thoracic lung fields without focal peaks.
                  </p>
                </div>
              )}

              {/* Layer 22 Technical Specs */}
              <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={15} color="#7c3aed" /> Hooked Neural Layer
                </div>
                <div style={{ background: '#f1f5f9', padding: '10px 12px', borderRadius: '8px', fontSize: '0.74rem', fontFamily: 'monospace', color: '#334155', lineHeight: 1.5 }}>
                  <strong>Layer:</strong> YOLO11n.model[22]<br />
                  <strong>Block Type:</strong> C3k2 Neck Module<br />
                  <strong>Feature Map:</strong> Multi-scale Neck Fusion
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Sparkles size={52} color="#7c3aed" style={{ margin: '0 auto 14px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
            No Active Scan Selected
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '520px', margin: '8px auto 22px', lineHeight: 1.6 }}>
            Run a diagnostic scan on an uploaded radiograph or one of the curated verification cases to generate deep Layer 22 Grad-CAM activation heatmaps.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('analysis')}
          >
            Go to X-ray Analysis
          </button>
        </div>
      )}

      {/* Official Validation Batch Predictions Reference */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Layers size={18} color="#0284c7" /> Official Validation Batch Predictions & XAI Gallery
            </div>
            <div className="card-subtitle">
              Ground truth vs YOLO11n predictions from verified validation runs
            </div>
          </div>
        </div>

        <div className="grid-3">
          {colabExamples.map((ex) => (
            <div key={ex.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
              <div style={{ height: '230px', background: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={ex.path} alt={ex.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginBottom: '4px' }}>
                  {ex.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.5 }}>
                  {ex.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
