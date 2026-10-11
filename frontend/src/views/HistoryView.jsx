import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Database,
  Calendar
} from 'lucide-react';
import { getApiUrl } from '../apiConfig';

export default function HistoryView({ 
  historyData, 
  refreshHistory, 
  setCurrentAnalysis, 
  setActiveTab 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const scans = historyData?.scans || [];
  const stats = historyData?.stats || {
    total_scans: 0,
    positive_scans: 0,
    critical_scans: 0,
    avg_detections: 0
  };

  const filteredScans = scans.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.patient_id && s.patient_id.toLowerCase().includes(term)) ||
      (s.filename && s.filename.toLowerCase().includes(term)) ||
      (s.findings_summary && s.findings_summary.toLowerCase().includes(term)) ||
      (s.id && s.id.toLowerCase().includes(term))
    );
  });

  const handleDelete = async (scanId) => {
    if (!window.confirm(`Are you sure you want to delete scan record ${scanId.slice(0, 8)}?`)) return;
    setDeletingId(scanId);
    try {
      const res = await fetch(getApiUrl(`/api/history/${scanId}`), { method: 'DELETE' });
      if (res.ok && refreshHistory) {
        refreshHistory();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoadScan = (scan) => {
    // Reconstruct analysis object
    const analysisObj = {
      analysis_id: scan.id,
      filename: scan.filename,
      patient_id: scan.patient_id,
      patient_age: scan.patient_age,
      patient_gender: scan.patient_gender,
      clinical_indication: scan.patient_notes,
      num_detections: scan.num_detections,
      detections: scan.detections || [],
      images: {
        original_url: scan.original_image_path,
        annotated_url: scan.annotated_image_path,
        gradcam_url: scan.gradcam_image_path,
        superimposed_url: scan.superimposed_image_path,
        thumbnail_url: scan.thumbnail_path
      },
      report: {
        report_id: `CLINI-${scan.id.slice(0, 10).toUpperCase()}`,
        generated_at: scan.created_at,
        impression: scan.findings_summary,
        findings: scan.detections || [],
        report_text: scan.report_text,
        pdf_url: scan.pdf_path
      }
    };
    setCurrentAnalysis(analysisObj);
    setActiveTab('analysis');
  };

  return (
    <div>
      {/* Top Stats Strip */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="metric-card" style={{ '--card-accent': '#0284c7' }}>
          <div className="metric-header">
            <span>Total Recorded Scans</span>
            <Database size={16} color="#0284c7" />
          </div>
          <div className="metric-value">{stats.total_scans}</div>
          <div className="metric-desc">Stored in SQLite audit log</div>
        </div>

        <div className="metric-card" style={{ '--card-accent': '#d97706' }}>
          <div className="metric-header">
            <span>Positive Abnormality Scans</span>
            <AlertCircle size={16} color="#d97706" />
          </div>
          <div className="metric-value">{stats.positive_scans}</div>
          <div className="metric-desc">
            {stats.total_scans > 0 ? `${Math.round((stats.positive_scans / stats.total_scans) * 100)}% positive rate` : '0%'}
          </div>
        </div>

        <div className="metric-card" style={{ '--card-accent': '#e11d48' }}>
          <div className="metric-header">
            <span>High Priority / STAT Cases</span>
            <AlertCircle size={16} color="#e11d48" />
          </div>
          <div className="metric-value">{stats.critical_scans}</div>
          <div className="metric-desc">Pneumothorax / Cardiomegaly</div>
        </div>

        <div className="metric-card" style={{ '--card-accent': '#059669' }}>
          <div className="metric-header">
            <span>Avg Detections / Radiograph</span>
            <CheckCircle size={16} color="#059669" />
          </div>
          <div className="metric-value">{stats.avg_detections}</div>
          <div className="metric-desc">Multi-label bounding boxes</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <History size={18} color="#0284c7" /> Scan History & Audit Records
            </div>
            <div className="card-subtitle">
              Persistent local audit trail saved to <code>data/cliniscan.db</code>
            </div>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search patient, filename, pathology..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {filteredScans.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thumbnail</th>
                  <th>Patient ID / Indication</th>
                  <th>Timestamp</th>
                  <th>Detections</th>
                  <th>Summary Findings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.map((scan) => (
                  <tr key={scan.id}>
                    <td style={{ width: '60px' }}>
                      <div style={{ width: '44px', height: '44px', background: '#000', borderRadius: '6px', overflow: 'hidden' }}>
                        <img 
                          src={scan.thumbnail_path || scan.annotated_image_path || scan.original_image_path} 
                          alt="Thumb" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {scan.patient_id || 'PT-ANONYMOUS'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {scan.filename}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#475569', whiteSpace: 'nowrap' }}>
                      {scan.created_at}
                    </td>
                    <td>
                      <span className={`badge ${scan.num_detections > 0 ? 'badge-amber' : 'badge-green'}`}>
                        {scan.num_detections} detected
                      </span>
                      {scan.has_critical === 1 && (
                        <span className="badge badge-rose" style={{ marginLeft: '4px' }}>
                          STAT
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.78rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {scan.findings_summary}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 9px', fontSize: '0.75rem' }}
                          title="Load into Visualizer"
                          onClick={() => handleLoadScan(scan)}
                        >
                          <Eye size={13} /> View
                        </button>

                        {scan.pdf_path && (
                          <a
                            className="btn btn-outline"
                            style={{ padding: '5px 9px', fontSize: '0.75rem' }}
                            title="Download PDF"
                            href={getApiUrl(`/api/report/${scan.id}`)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download size={13} /> PDF
                          </a>
                        )}

                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 9px', fontSize: '0.75rem', color: '#e11d48' }}
                          title="Delete Record"
                          onClick={() => handleDelete(scan.id)}
                          disabled={deletingId === scan.id}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
            <History size={38} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontWeight: 600 }}>No prediction records found</p>
            <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              {searchTerm ? 'No results matched your search query.' : 'Scans analyzed in the application will automatically appear in this audit log.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
