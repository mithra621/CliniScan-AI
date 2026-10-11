import React from 'react';
import { Upload, CheckCircle2, AlertCircle, Activity, Sparkles, Cpu } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, healthInfo }) {
  const titles = {
    dashboard: 'Dashboard Overview',
    analysis: 'Chest Radiograph Analysis & Localization',
    gradcam: 'Explainable AI & Grad-CAM Visualizer',
    reports: 'Radiological Clinical-Style Reports',
    history: 'Prediction & Audit History',
    evaluation: 'Model Performance & Benchmark Analytics',
    methodology: 'Dataset, Architecture & Methodology',
    about: 'About Project & Regulatory Specifications',
  };

  const isHealthy = healthInfo?.status === 'healthy';

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="header-title">{titles[activeTab] || 'CliniScan AI'}</h1>
        <span className="header-badge">YOLO11n • 14 Classes</span>
      </div>

      <div className="header-right">
        {/* Real-time System Connectivity Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', background: '#f8fafc', padding: '6px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          {isHealthy ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 700 }}>
              <span className="status-dot" style={{ width: '7px', height: '7px' }} />
              FastAPI Connected
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 700 }}>
              <AlertCircle size={15} /> Connecting...
            </span>
          )}
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#64748b', fontSize: '0.76rem', fontWeight: 600 }}>
            mAP50: 32.23%
          </span>
        </div>

        {activeTab !== 'analysis' && (
          <button
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            onClick={() => setActiveTab('analysis')}
          >
            <Upload size={15} />
            <span>Analyze CXR</span>
          </button>
        )}
      </div>
    </header>
  );
}
