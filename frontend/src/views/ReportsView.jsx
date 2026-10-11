import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  RefreshCw,
  Clock, 
  User, 
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Award
} from 'lucide-react';
import { getApiUrl } from '../apiConfig';

export default function ReportsView({ currentAnalysis, setActiveTab }) {
  const [customImpression, setCustomImpression] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportData, setReportData] = useState(currentAnalysis?.report || null);

  // Sync if currentAnalysis updates
  React.useEffect(() => {
    if (currentAnalysis?.report) {
      setReportData(currentAnalysis.report);
      setCustomImpression(currentAnalysis.report.impression || '');
    }
  }, [currentAnalysis]);

  const handleUpdateReport = async () => {
    if (!currentAnalysis?.analysis_id) return;
    setRegenerating(true);

    const formData = new FormData();
    formData.append('analysis_id', currentAnalysis.analysis_id);
    if (customImpression) formData.append('custom_impression', customImpression);
    if (customNotes) formData.append('custom_notes', customNotes);

    try {
      const res = await fetch(getApiUrl('/api/report'), {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setReportData((prev) => ({
          ...prev,
          report_id: data.report_id,
          pdf_url: data.pdf_url,
          report_text: data.report_text,
          impression: customImpression || prev?.impression
        }));
      }
    } catch (err) {
      console.error('Failed to update report:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyNarrative = () => {
    if (reportData?.report_text) {
      navigator.clipboard.writeText(reportData.report_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const findings = currentAnalysis?.detections || [];

  return (
    <div className="animate-fade-in">
      {currentAnalysis ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '26px' }}>
          
          {/* Main Clinical Report Document (Realistic Medical Stationery Layout) */}
          <div className="clinical-paper-document">
            
            {/* Document Institutional Header */}
            <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '18px', marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={18} />
                  </div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    CLINISCAN AI — RADIOLOGICAL AUDIT REPORT
                  </h2>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Division of Computer-Aided Thoracic Diagnostics & Decision Support
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-blue" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                  {reportData?.report_id || `CLINI-${currentAnalysis.analysis_id.slice(0, 10).toUpperCase()}`}
                </span>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px' }}>
                  Generated: {reportData?.generated_at || new Date().toLocaleString()}
                </div>
              </div>
            </div>

            {/* Patient Demographics Table */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Study / File</div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>{currentAnalysis.filename}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Patient ID</div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>{currentAnalysis.patient_id || 'PT-ANONYMOUS'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Age / Gender</div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>{currentAnalysis.patient_age || 'N/A'} / {currentAnalysis.patient_gender || 'Unspecified'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Modality / Geometry</div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>CXR (PA) • {currentAnalysis.image_dimensions?.width || 640}x{currentAnalysis.image_dimensions?.height || 640}</div>
              </div>
            </div>

            {/* Radiographic Visual Triad Preview */}
            <div style={{ marginBottom: '26px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                Radiographic Evidence Triad
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ background: '#070d1e', borderRadius: '8px', overflow: 'hidden', textAlign: 'center', border: '1px solid #334155' }}>
                  <img src={currentAnalysis.images.original_url} alt="Raw CXR" style={{ width: '100%', height: '175px', objectFit: 'contain' }} />
                  <div style={{ background: '#1e293b', color: '#fff', fontSize: '0.72rem', padding: '5px', fontWeight: 600 }}>1. Raw Radiograph</div>
                </div>
                <div style={{ background: '#070d1e', borderRadius: '8px', overflow: 'hidden', textAlign: 'center', border: '1px solid #334155' }}>
                  <img src={currentAnalysis.images.annotated_url} alt="YOLO11n Detections" style={{ width: '100%', height: '175px', objectFit: 'contain' }} />
                  <div style={{ background: '#1e293b', color: '#38bdf8', fontSize: '0.72rem', padding: '5px', fontWeight: 600 }}>2. YOLO11n Bounding Boxes</div>
                </div>
                <div style={{ background: '#070d1e', borderRadius: '8px', overflow: 'hidden', textAlign: 'center', border: '1px solid #334155' }}>
                  <img src={currentAnalysis.images.superimposed_url} alt="Grad-CAM Saliency" style={{ width: '100%', height: '175px', objectFit: 'contain' }} />
                  <div style={{ background: '#1e293b', color: '#c084fc', fontSize: '0.72rem', padding: '5px', fontWeight: 600 }}>3. Grad-CAM Overlay</div>
                </div>
              </div>
            </div>

            {/* Clinical Impression */}
            <div style={{ marginBottom: '26px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Radiological Impression
              </div>
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '16px 20px', color: '#0369a1', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500 }}>
                {customImpression || reportData?.impression || 'No thoracic abnormalities detected above threshold.'}
              </div>
            </div>

            {/* Detailed Findings Table */}
            <div style={{ marginBottom: '26px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                Detailed Abnormality Localization ({findings.length} findings)
              </div>
              {findings.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Pathology Class</th>
                      <th>Confidence</th>
                      <th>Bounding Box</th>
                      <th>Clinical Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {findings.map((f, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 700 }}>{f.class_name}</td>
                        <td>
                          <span className="badge badge-blue">{f.confidence_percent.toFixed(1)}%</span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#475569' }}>
                          [{f.box.map(b => Math.round(b)).join(', ')}]
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#475569' }}>
                          Clinical correlation and radiologist review advised.
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '18px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                  No focal parenchymal abnormalities detected above current confidence threshold.
                </div>
              )}
            </div>

            {/* Digital Verification & Doctor Signature Section */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.8rem', fontWeight: 700 }}>
                  <ShieldCheck size={16} /> Digital Decision-Support Verification Seal
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>
                  CliniScan AI v1.0 • YOLO11n + ReportLab Engine
                </div>
              </div>

              <div style={{ textAlign: 'right', borderTop: '1px solid #cbd5e1', paddingTop: '6px', width: '200px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Reviewing Radiologist</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>Signature & Date</div>
              </div>
            </div>

          </div>

          {/* Right Column: Actions & Edit Controls */}
          <div>
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Download size={18} color="#0284c7" /> Export Actions
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '13px', fontSize: '0.9rem' }}
                  href={getApiUrl(reportData?.pdf_url || `/api/report/${currentAnalysis.analysis_id}`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={17} /> Download Official PDF Report
                </a>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '11px', fontSize: '0.86rem' }}
                  onClick={handleCopyNarrative}
                >
                  {copied ? (
                    <>
                      <Check size={16} color="#059669" /> Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copy Narrative Text (EHR)
                    </>
                  )}
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '11px', fontSize: '0.86rem' }}
                  onClick={() => window.print()}
                >
                  <Printer size={16} /> Print Consultation Sheet
                </button>
              </div>

              {/* Edit Impression Form */}
              <div style={{ marginTop: '26px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e293b', marginBottom: '8px' }}>
                  Modify Clinical Impression:
                </div>
                <textarea
                  rows={4}
                  value={customImpression}
                  onChange={(e) => setCustomImpression(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', resize: 'vertical' }}
                  placeholder="Enter custom clinical notes or impressions..."
                />

                <button
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '12px', fontSize: '0.82rem', padding: '10px' }}
                  onClick={handleUpdateReport}
                  disabled={regenerating}
                >
                  {regenerating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin-slow" /> Re-rendering PDF...
                    </>
                  ) : (
                    'Re-synthesize PDF Report'
                  )}
                </button>
              </div>

              {/* PDF Specs Pill */}
              <div style={{ marginTop: '22px', background: '#f8fafc', padding: '14px', borderRadius: '10px', fontSize: '0.76rem', color: '#64748b', lineHeight: 1.55, border: '1px solid #e2e8f0' }}>
                <strong>ReportLab 5.0 Generation:</strong> Automatically builds hospital-grade multi-section PDF reports with embedded CXR visual triad, formatted tables, and digital verification seal.
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FileText size={52} color="#0284c7" style={{ margin: '0 auto 14px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
            No Analysis Available for Reporting
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '520px', margin: '8px auto 22px', lineHeight: 1.6 }}>
            Run an analysis on an uploaded radiograph or one of the curated verification cases first to automatically synthesize and download a diagnostic medical PDF report.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('analysis')}
          >
            Go to X-ray Analysis
          </button>
        </div>
      )}
    </div>
  );
}
