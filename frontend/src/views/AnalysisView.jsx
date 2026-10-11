import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Play, 
  Sparkles, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  Layers, 
  Sliders, 
  RefreshCw,
  Maximize2,
  Minimize2,
  X,
  Split,
  Tag,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { getApiUrl } from '../apiConfig';

export default function AnalysisView({ 
  currentAnalysis, 
  setCurrentAnalysis, 
  setActiveTab, 
  onAnalysisComplete,
  initialSampleId
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confThreshold, setConfThreshold] = useState(0.25);
  const [iouThreshold, setIouThreshold] = useState(0.45);
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [splitSideBySide, setSplitSideBySide] = useState(false);

  // Patient metadata
  const [patientId, setPatientId] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Unspecified');
  const [clinicalIndication, setClinicalIndication] = useState('');

  // Viewer tab state: 'annotated' | 'superimposed' | 'gradcam' | 'original'
  const [viewerMode, setViewerMode] = useState('annotated');
  const fileInputRef = useRef(null);

  // Fetch curated samples catalog
  useEffect(() => {
    fetch(getApiUrl('/api/samples'))
      .then((res) => res.json())
      .then((data) => {
        if (data?.samples) setSamples(data.samples);
      })
      .catch((err) => console.error('Failed to load sample catalog:', err));
  }, []);

  // Auto-activate sample if selected from Dashboard
  useEffect(() => {
    if (initialSampleId && samples.length > 0) {
      const match = samples.find((s) => s.id === initialSampleId);
      if (match) handleSelectSample(match);
    }
  }, [initialSampleId, samples]);


  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Invalid file format. Please upload a standard JPG or PNG radiograph.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File too large (exceeds 15MB limit).');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    setSelectedSampleId('');
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Handle curated sample selection
  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    setSelectedFile(null);
    setPreviewUrl(sample.image_url);
    setPatientId(sample.patient_id);
    setPatientAge(sample.patient_age);
    setPatientGender(sample.patient_gender);
    setClinicalIndication(sample.clinical_indication);
    if (sample.recommended_conf) {
      setConfThreshold(sample.recommended_conf);
    }
    setErrorMsg(null);
  };

  // Run CliniScan AI inference
  const handleRunAnalysis = async () => {
    if (!selectedFile && !selectedSampleId) {
      setErrorMsg('Please select a Chest X-ray image or click one of the verification cases.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
    } else if (selectedSampleId) {
      formData.append('sample_id', selectedSampleId);
    }

    formData.append('conf_threshold', confThreshold);
    formData.append('iou_threshold', iouThreshold);
    if (patientId) formData.append('patient_id', patientId);
    if (patientAge) formData.append('age', patientAge);
    if (patientGender) formData.append('gender', patientGender);
    if (clinicalIndication) formData.append('indication', clinicalIndication);

    try {
      let response;
      try {
        response = await fetch(getApiUrl('/api/predict'), {
          method: 'POST',
          body: formData,
        });
      } catch (firstErr) {
        console.warn('Initial predict route failed, falling back directly to cloud backend:', firstErr);
        response = await fetch('https://cliniscan-ai.onrender.com/api/predict', {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned error status ${response.status}`);
      }

      const result = await response.json();
      setCurrentAnalysis(result);
      if (onAnalysisComplete) onAnalysisComplete(result);
      setViewerMode('annotated');
    } catch (err) {
      setErrorMsg(err.message || 'Analysis failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const getActiveImageSrc = () => {
    if (!currentAnalysis?.images) return previewUrl;
    switch (viewerMode) {
      case 'annotated':
        return getApiUrl(currentAnalysis.images.annotated_url);
      case 'superimposed':
        return getApiUrl(currentAnalysis.images.superimposed_url);
      case 'gradcam':
        return getApiUrl(currentAnalysis.images.gradcam_url);
      case 'original':
      default:
        return getApiUrl(currentAnalysis.images.original_url) || previewUrl;
    }
  };

  // Severity helper
  const getSeverityBadge = (name) => {
    if (name === 'Pneumothorax') return <span className="badge badge-rose">STAT Alert</span>;
    if (['Cardiomegaly', 'Consolidation', 'ILD'].includes(name)) return <span className="badge badge-amber">Clinical Priority</span>;
    if (['Calcification', 'Pleural thickening'].includes(name)) return <span className="badge badge-green">Benign / Stable</span>;
    return <span className="badge badge-blue">Moderate</span>;
  };

  return (
    <div className="animate-fade-in">
      {errorMsg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px 18px', borderRadius: '10px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px', fontSize: '0.86rem', boxShadow: '0 2px 8px rgba(185, 28, 28, 0.08)' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Analysis Layout: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '390px 1fr', gap: '24px' }}>
        
        {/* Left Column: Input & Controls */}
        <div>
          {/* File Picker Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Upload size={18} color="#0284c7" /> Input Radiograph
              </div>
              <span className="badge badge-blue">PA Chest View</span>
            </div>

            {/* Dropzone with enhanced styling */}
            <div 
              style={{
                border: '2px dashed #94a3b8',
                borderRadius: '12px',
                padding: '26px 18px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: '18px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0284c7';
                e.currentTarget.style.backgroundColor = '#f0f9ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".jpg,.jpeg,.png"
                style={{ display: 'none' }} 
              />
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Upload size={24} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                Click or drag & drop radiograph
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
                DICOM exports, JPG, JPEG, PNG (max 15MB)
              </div>
            </div>

            {/* Curated Sample Cases */}
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="#0284c7" /> 1-Click Verification Cases:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {samples.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: selectedSampleId === s.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: selectedSampleId === s.id ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => handleSelectSample(s)}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.81rem', color: '#0f172a' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {s.primary_abnormalities.join(', ')}
                      </div>
                    </div>
                    {selectedSampleId === s.id ? (
                      <CheckCircle2 size={16} color="#0284c7" />
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Select</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Detection Sliders & Sensitivity Presets */}
            <div style={{ marginTop: '22px', borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.84rem', color: '#1e293b' }}>
                  <Sliders size={16} color="#0284c7" /> Sensitivity Preset
                </div>
                <span className="badge badge-blue">{Math.round(confThreshold * 100)}% Conf</span>
              </div>

              {/* 3 Quick Sensitivity Presets */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
                <button
                  type="button"
                  style={{
                    padding: '6px 4px',
                    borderRadius: '6px',
                    border: confThreshold === 0.15 ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: confThreshold === 0.15 ? '#f0f9ff' : '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: confThreshold === 0.15 ? '#0284c7' : '#475569',
                    cursor: 'pointer'
                  }}
                  onClick={() => setConfThreshold(0.15)}
                >
                  Screening (15%)
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 4px',
                    borderRadius: '6px',
                    border: confThreshold === 0.25 ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: confThreshold === 0.25 ? '#f0f9ff' : '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: confThreshold === 0.25 ? '#0284c7' : '#475569',
                    cursor: 'pointer'
                  }}
                  onClick={() => setConfThreshold(0.25)}
                >
                  Balanced (25%)
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 4px',
                    borderRadius: '6px',
                    border: confThreshold === 0.40 ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: confThreshold === 0.40 ? '#f0f9ff' : '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: confThreshold === 0.40 ? '#0284c7' : '#475569',
                    cursor: 'pointer'
                  }}
                  onClick={() => setConfThreshold(0.40)}
                >
                  Specific (40%)
                </button>
              </div>

              <div className="slider-group">
                <div className="slider-label">
                  <span>Fine Confidence Control</span>
                  <span>{Math.round(confThreshold * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.05" 
                  max="0.80" 
                  step="0.01"
                  value={confThreshold}
                  onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                />
              </div>

              <div className="slider-group">
                <div className="slider-label">
                  <span>IoU NMS Overlap Filter</span>
                  <span>{Math.round(iouThreshold * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.10" 
                  max="0.70" 
                  step="0.05"
                  value={iouThreshold}
                  onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* Patient Demographics */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b', marginBottom: '8px' }}>
                Study Demographics (Optional)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Patient ID (e.g. CXR-104)" 
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                />
                <input 
                  type="text" 
                  placeholder="Age (e.g. 68)" 
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                />
              </div>
              <input 
                type="text" 
                placeholder="Clinical Indication (e.g. Dyspnea, cough)" 
                value={clinicalIndication}
                onChange={(e) => setClinicalIndication(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
              />
            </div>

            {/* Run Button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '22px', padding: '13px', fontSize: '0.92rem' }}
              disabled={loading || (!selectedFile && !selectedSampleId)}
              onClick={handleRunAnalysis}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin-slow" /> Running YOLO11n & Grad-CAM...
                </>
              ) : (
                <>
                  <Play size={18} /> Run CliniScan Diagnostic
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Diagnostic Workstation & Findings */}
        <div>
          {/* Workstation Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Eye size={18} color="#0284c7" /> Diagnostic Viewport
                </div>
                <div className="card-subtitle">
                  {currentAnalysis 
                    ? `Study ID: ${currentAnalysis.analysis_id.slice(0, 12)} • ${currentAnalysis.num_detections} pathologies detected`
                    : 'Awaiting image selection'}
                </div>
              </div>

              {/* Viewport Toolbar */}
              {currentAnalysis && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Mode Tabs */}
                  <div className="image-tabs">
                    <button 
                      className={`image-tab-btn ${viewerMode === 'annotated' ? 'active' : ''}`}
                      onClick={() => { setViewerMode('annotated'); setSplitSideBySide(false); }}
                    >
                      Detections
                    </button>
                    <button 
                      className={`image-tab-btn ${viewerMode === 'superimposed' ? 'active' : ''}`}
                      onClick={() => { setViewerMode('superimposed'); setSplitSideBySide(false); }}
                    >
                      Blend
                    </button>
                    <button 
                      className={`image-tab-btn ${viewerMode === 'gradcam' ? 'active' : ''}`}
                      onClick={() => { setViewerMode('gradcam'); setSplitSideBySide(false); }}
                    >
                      Heatmap
                    </button>
                    <button 
                      className={`image-tab-btn ${viewerMode === 'original' ? 'active' : ''}`}
                      onClick={() => { setViewerMode('original'); setSplitSideBySide(false); }}
                    >
                      Original
                    </button>
                  </div>

                  {/* Split View Toggle */}
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    onClick={() => setSplitSideBySide(prev => !prev)}
                    title="Toggle Side-by-Side Dual View"
                  >
                    <Split size={14} /> {splitSideBySide ? 'Single' : 'Dual'}
                  </button>

                  {/* Lightbox / Fullscreen */}
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    onClick={() => setIsLightboxOpen(true)}
                    title="Open Fullscreen Lightbox"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Viewer Stage */}
            {splitSideBySide && currentAnalysis ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#070d1e', padding: '14px', borderRadius: '14px', minHeight: '440px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, marginBottom: '6px' }}>1. RAW CHEST RADIOGRAPH</div>
                  <img src={getApiUrl(currentAnalysis.images.original_url)} alt="Original" style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#38bdf8', fontSize: '0.72rem', fontWeight: 700, marginBottom: '6px' }}>2. YOLO11n BOUNDING BOXES</div>
                  <img src={getApiUrl(currentAnalysis.images.annotated_url)} alt="Detections" style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }} />
                </div>
              </div>
            ) : (
              <div className="viewer-stage">
                {getActiveImageSrc() ? (
                  <img 
                    src={getActiveImageSrc()} 
                    alt="Radiograph View" 
                    key={getActiveImageSrc()}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '60px 20px' }}>
                    <Upload size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 700, color: '#e2e8f0' }}>No radiograph loaded</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '4px', color: '#94a3b8' }}>
                      Choose a clinical verification case on the left or upload your own CXR.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Action Bar beneath Viewer */}
            {currentAnalysis && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '9px 15px' }}
                    onClick={() => setActiveTab('gradcam')}
                  >
                    <Sparkles size={15} color="#7c3aed" /> Layer 22 Grad-CAM Deep Dive
                  </button>
                  <button 
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '9px 15px' }}
                    onClick={() => setActiveTab('reports')}
                  >
                    <FileText size={15} color="#059669" /> Synthesize Clinical Report
                  </button>
                </div>

                <a 
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', padding: '9px 16px' }}
                  href={getApiUrl(`/api/report/${currentAnalysis.analysis_id}`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={15} /> Download Medical PDF
                </a>
              </div>
            )}
          </div>

          {/* Localized Abnormality Findings Table */}
          {currentAnalysis && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Layers size={18} color="#0284c7" /> Localized Thoracic Findings
                  </div>
                  <div className="card-subtitle">
                    YOLO11n multi-head bounding box predictions and localization coordinates
                  </div>
                </div>
                <span className="badge badge-blue">
                  {currentAnalysis.detections.length} Objects Found
                </span>
              </div>

              {currentAnalysis.detections.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Pathology Class</th>
                        <th>Confidence</th>
                        <th>Coordinates [x1, y1, x2, y2]</th>
                        <th>Clinical Urgency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAnalysis.detections.map((det, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700 }}>
                            <span 
                              style={{ 
                                display: 'inline-block', 
                                width: '12px', 
                                height: '12px', 
                                borderRadius: '3px', 
                                backgroundColor: det.hex || '#0284c7', 
                                marginRight: '9px',
                                verticalAlign: 'middle'
                              }} 
                            />
                            {det.class_name}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '85px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div 
                                  style={{ 
                                    width: `${det.confidence_percent}%`, 
                                    height: '100%', 
                                    background: det.confidence_percent > 50 ? '#059669' : '#0284c7' 
                                  }} 
                                />
                              </div>
                              <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                                {det.confidence_percent.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
                            [{det.box.map(b => Math.round(b)).join(', ')}]
                          </td>
                          <td>
                            {getSeverityBadge(det.class_name)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                  <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 700, color: '#0f172a' }}>No Abnormalities Detected</p>
                  <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                    The neural network did not detect any of the 14 thoracic pathologies above {Math.round(confThreshold * 100)}% threshold.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(7, 13, 30, 0.94)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Full-Resolution Diagnostic Lightbox
            </div>
            <button 
              onClick={() => setIsLightboxOpen(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
            >
              <X size={22} />
            </button>
          </div>
          <div style={{ maxWidth: '1000px', maxHeight: '82vh', overflow: 'hidden', borderRadius: '12px', border: '1px solid #334155' }}>
            <img src={getActiveImageSrc()} alt="Full Radiograph" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        </div>
      )}

    </div>
  );
}
