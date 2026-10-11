import React, { useState } from 'react';
import { 
  Target, 
  Search, 
  BarChart2, 
  Layers, 
  ArrowRight, 
  CheckCircle, 
  FileText,
  Upload,
  Cpu,
  Sparkles,
  Zap,
  Activity,
  ArrowUpDown
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Cell
} from 'recharts';
import { getApiUrl } from '../apiConfig';

export default function DashboardView({ 
  metricsData, 
  historyData, 
  healthInfo, 
  setActiveTab,
  onSelectSample
}) {
  const [sortOrder, setSortOrder] = useState('default'); // 'default' | 'ap50_desc'

  const overall = metricsData?.overall || {
    precision_percent: 38.90,
    recall_percent: 35.84,
    map50_percent: 32.23,
    map50_95_percent: 16.07
  };

  const rawPerClass = metricsData?.per_class || [];
  
  // Sortable per-class data
  const perClass = [...rawPerClass].sort((a, b) => {
    if (sortOrder === 'ap50_desc') {
      return (b.ap50_percent || 0) - (a.ap50_percent || 0);
    }
    return 0;
  });

  const recentScans = historyData?.scans?.slice(0, 5) || [];

  // Curated demo validation cases
  const demoCases = [
    {
      id: 'sample-01',
      title: 'Cardiomegaly & Effusion',
      findings: ['Cardiomegaly', 'Pleural effusion'],
      badge: 'Bilateral Basal',
      urgency: 'Clinical Priority',
      badgeColor: 'badge-amber',
      img: '/samples/00150343289f317a0ad5629d5b7d9ef9.png'
    },
    {
      id: 'sample-05',
      title: 'Pneumothorax (Urgent)',
      findings: ['Pneumothorax'],
      badge: 'Visceral Pleural Line',
      urgency: 'STAT / Urgent',
      badgeColor: 'badge-rose',
      img: '/samples/0e21abbef40e569be72ab0ad90544f87.png'
    },
    {
      id: 'sample-02',
      title: 'Aortic Enlargement',
      findings: ['Aortic enlargement', 'Pulmonary fibrosis'],
      badge: 'Mediastinal Knob',
      urgency: 'Moderate',
      badgeColor: 'badge-blue',
      img: '/samples/000d68e42b71d3eac10ccc077aba07c1.png'
    },
    {
      id: 'sample-03',
      title: 'Pulmonary Nodule / Mass',
      findings: ['Nodule/Mass', 'Consolidation'],
      badge: 'Focal Mid-Zone',
      urgency: 'High Priority',
      badgeColor: 'badge-violet',
      img: '/samples/0005e8e3701dfb1dd93d53e2ff537b6e.png'
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #0b1329 0%, #0f172a 50%, #1e293b 100%)', 
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '34px 38px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 36px -4px rgba(11, 19, 41, 0.25)'
      }}>
        {/* Glow backdrop decorative effect */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.28) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '820px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(2, 132, 199, 0.18)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '5px 12px', borderRadius: '16px', fontSize: '0.76rem', fontWeight: 700, color: '#38bdf8', marginBottom: '14px' }}>
            <Cpu size={14} /> YOLO11n Deep Thoracic Architecture • Neck Layer 22 (C3k2) Grad-CAM
          </div>

          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '12px', color: '#ffffff', letterSpacing: '-0.02em' }}>
            CliniScan AI: Explainable Multi-Abnormality Detection & Localization
          </h2>

          <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.65, marginBottom: '24px', maxWidth: '740px' }}>
            Trained on <strong>4,394 chest radiographs</strong> across <strong>14 thoracic abnormality classes</strong>. Delivers pixel-accurate bounding boxes, deep feature attention heatmaps, and automated hospital-grade clinical PDF reports.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              className="btn btn-primary"
              style={{ padding: '11px 22px', fontSize: '0.9rem' }}
              onClick={() => setActiveTab('analysis')}
            >
              <Upload size={17} /> Analyze Chest Radiograph
            </button>
            <button 
              className="btn btn-secondary"
              style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.22)', padding: '11px 20px', fontSize: '0.9rem' }}
              onClick={() => setActiveTab('evaluation')}
            >
              <BarChart2 size={17} /> View Benchmark Metrics
            </button>
            <button 
              className="btn btn-secondary"
              style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.22)', padding: '11px 20px', fontSize: '0.9rem' }}
              onClick={() => setActiveTab('gradcam')}
            >
              <Sparkles size={17} color="#38bdf8" /> Explainable AI (XAI)
            </button>
          </div>
        </div>
      </div>

      {/* 4 Verified Metric Cards */}
      <div style={{ marginBottom: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#0284c7" /> Verified Model Benchmark (split: val • 640px)
          </h3>
          <span className="badge badge-blue">Official 878 Validation Images</span>
        </div>

        <div className="grid-4">
          <MetricCard 
            title="Precision"
            value={`${overall.precision_percent || 38.90}%`}
            subtext="Baseline validation score"
            icon={Target}
            accentColor="#0284c7"
            badgeText="TP / (TP+FP)"
          />
          <MetricCard 
            title="Recall"
            value={`${overall.recall_percent || 35.84}%`}
            subtext="Ground-truth coverage"
            icon={Search}
            accentColor="#059669"
            iconBg="#ecfdf5"
            badgeText="Sensitivity"
          />
          <MetricCard 
            title="mAP @ 0.50"
            value={`${overall.map50_percent || 32.23}%`}
            subtext="Primary detection benchmark"
            icon={BarChart2}
            accentColor="#7c3aed"
            iconBg="#f5f3ff"
            badgeText="IoU = 0.50"
          />
          <MetricCard 
            title="mAP @ 0.5:0.95"
            value={`${overall.map50_95_percent || 16.07}%`}
            subtext="Strict localization score"
            icon={Layers}
            accentColor="#d97706"
            iconBg="#fffbeb"
            badgeText="10-step IoU"
          />
        </div>
      </div>

      {/* 1-Click Curated Clinical Demo Cases Strip */}
      <div className="card" style={{ background: '#ffffff' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Zap size={18} color="#0284c7" /> 1-Click Clinical Validation Cases
            </div>
            <div className="card-subtitle">
              Instant demonstration cases pre-verified on unseen validation chest radiographs
            </div>
          </div>
          <button 
            className="btn btn-outline"
            style={{ padding: '5px 12px', fontSize: '0.78rem' }}
            onClick={() => setActiveTab('analysis')}
          >
            All 6 Cases in Analysis <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid-4">
          {demoCases.map((demo) => (
            <div
              key={demo.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = '#0284c7';
                e.currentTarget.style.boxShadow = '0 8px 20px -2px rgba(2, 132, 199, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={() => {
                if (onSelectSample) onSelectSample(demo.id);
                setActiveTab('analysis');
              }}
            >
              <div style={{ height: '140px', background: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={getApiUrl(demo.img)} alt={demo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                      {demo.title}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '10px' }}>
                    {demo.findings.join(' • ')}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${demo.badgeColor}`}>{demo.urgency}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    Test <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Per-Class Chart + Recent Scans */}
      <div className="grid-2">
        {/* Real Per-Class AP50 Chart with Sort Filter */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <BarChart2 size={18} color="#0284c7" /> Per-Class AP@0.50 Benchmark
              </div>
              <div className="card-subtitle">
                Official evaluation results across all 14 thoracic pathologies
              </div>
            </div>

            <button 
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              onClick={() => setSortOrder(prev => prev === 'default' ? 'ap50_desc' : 'default')}
              title="Toggle Sort Order"
            >
              <ArrowUpDown size={12} /> {sortOrder === 'default' ? 'Sort by AP' : 'Default Order'}
            </button>
          </div>

          <div style={{ height: '330px', width: '100%', marginTop: '10px' }}>
            {perClass.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perClass} margin={{ top: 10, right: 10, left: -15, bottom: 65 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="class_name" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0}
                    tick={{ fontSize: 9.5, fill: '#475569', fontWeight: 500 }}
                  />
                  <YAxis 
                    unit="%" 
                    domain={[0, 80]}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip 
                    formatter={(val) => [`${val}%`, 'AP@0.50']}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="ap50_percent" fill="url(#barGradient)" radius={[4, 4, 0, 0]} name="AP@0.5" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                Loading verified evaluation metrics...
              </div>
            )}
          </div>
        </div>

        {/* Recent Scans Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <FileText size={18} color="#059669" /> Recent Scans & Audits
              </div>
              <div className="card-subtitle">
                Latest analyzed radiographs recorded in SQLite database
              </div>
            </div>
            <button 
              className="btn btn-outline"
              style={{ padding: '5px 11px', fontSize: '0.75rem' }}
              onClick={() => setActiveTab('history')}
            >
              Full History <ArrowRight size={13} />
            </button>
          </div>

          {recentScans.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Date</th>
                    <th>Detections</th>
                    <th>Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan) => (
                    <tr key={scan.id}>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{scan.patient_id || scan.id.slice(0, 8)}</td>
                      <td style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>{scan.created_at}</td>
                      <td>
                        <span className={`badge ${scan.num_detections > 0 ? 'badge-amber' : 'badge-green'}`}>
                          {scan.num_detections} detected
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155' }}>
                        {scan.findings_summary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <CheckCircle size={36} color="#0284c7" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontWeight: 600 }}>No scans recorded yet</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                Upload a radiograph or test one of the 1-click clinical validation cases above.
              </p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '16px', fontSize: '0.82rem' }}
                onClick={() => setActiveTab('analysis')}
              >
                Go to X-ray Analysis
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Model Limitations & Research Note */}
      <div style={{ marginTop: '10px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={16} color="#0284c7" />
          <span>
            <strong>Research Prototype Notice:</strong> CliniScan AI is engineered for academic machine learning research and is not clinically validated for diagnostic use.
          </span>
        </div>
        <button 
          onClick={() => setActiveTab('about')}
          style={{ background: 'transparent', border: 'none', color: '#0284c7', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}
        >
          View Full Specifications
        </button>
      </div>
    </div>
  );
}
