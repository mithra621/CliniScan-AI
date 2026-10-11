import React from 'react';
import { 
  LayoutDashboard, 
  ScanSearch, 
  Sparkles, 
  FileText, 
  History, 
  BarChart3, 
  Database, 
  Info,
  Activity
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, healthInfo }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analysis', label: 'X-ray Analysis', icon: ScanSearch },
    { id: 'gradcam', label: 'Explainable AI', icon: Sparkles },
    { id: 'reports', label: 'Clinical-Style Reports', icon: FileText },
    { id: 'history', label: 'Prediction History', icon: History },
    { id: 'evaluation', label: 'Model Evaluation', icon: BarChart3 },
    { id: 'methodology', label: 'Dataset & Methodology', icon: Database },
    { id: 'about', label: 'About & Disclaimer', icon: Info },
  ];

  const isModelReady = healthInfo?.model_loaded || healthInfo?.model_available;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-badge">
          <div className="brand-icon-box">
            <Activity size={20} />
          </div>
          <span>CliniScan AI</span>
        </div>
        <div className="brand-subtitle">
          Thoracic Decision Support
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-section-title">Navigation</div>
        <ul className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sidebar-footer">
        <div className="model-status-chip">
          <div className={`status-dot ${isModelReady ? '' : 'offline'}`} />
          <div>
            <div style={{ fontWeight: 600 }}>
              {isModelReady ? 'YOLO11n Active' : 'Model Offline'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              14 Pathologies • PyTorch
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
