import React from 'react';
import { Upload, CheckCircle2, AlertCircle, RefreshCw, Activity, Sparkles, Cpu } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  healthInfo, 
  connectionStatus, 
  onRetryHealth 
}) {
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

  const isHealthy = connectionStatus === 'connected' || healthInfo?.status === 'healthy';

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="header-title">{titles[activeTab] || 'CliniScan AI'}</h1>
        <span className="header-badge">YOLO11n • 14 Classes</span>
      </div>

      <div className="header-right">
        {/* Real-time System Connectivity Status */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '0.82rem', 
            background: '#f8fafc', 
            padding: '6px 12px', 
            borderRadius: '10px', 
            border: isHealthy ? '1px solid #e2e8f0' : (connectionStatus === 'waking_up' ? '1px solid #fde68a' : '1px solid #fecaca'), 
            cursor: isHealthy ? 'default' : 'pointer' 
          }}
          onClick={!isHealthy ? onRetryHealth : undefined}
          title={
            isHealthy 
              ? "FastAPI Inference Engine Online & Ready" 
              : (connectionStatus === 'waking_up' 
                  ? "Render cloud container waking up from standby (takes ~45-60s on free tier)" 
                  : "Click to reconnect to FastAPI server")
          }
        >
          {isHealthy ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 700 }}>
              <span className="status-dot" style={{ width: '7px', height: '7px' }} />
              FastAPI Connected
            </span>
          ) : connectionStatus === 'waking_up' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#d97706', fontWeight: 700 }}>
              <RefreshCw size={14} className="animate-spin-slow" />
              Waking Cloud Engine (~45s)...
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 700 }}>
              <AlertCircle size={15} /> Disconnected (Click to Retry)
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
