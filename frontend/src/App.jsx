import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import AnalysisView from './views/AnalysisView';
import GradCamView from './views/GradCamView';
import ReportsView from './views/ReportsView';
import HistoryView from './views/HistoryView';
import EvaluationView from './views/EvaluationView';
import MethodologyView from './views/MethodologyView';
import AboutView from './views/AboutView';
import { 
  getApiUrl, 
  getApiBaseUrl, 
  setApiBaseUrl, 
  CLOUD_RENDER_URL, 
  FALLBACK_OVERALL_METRICS, 
  FALLBACK_PER_CLASS_METRICS 
} from './apiConfig';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthInfo, setHealthInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'waking_up' | 'connected' | 'offline'
  const isFetchingRef = useRef(false);

  const [metricsData, setMetricsData] = useState({
    overall: FALLBACK_OVERALL_METRICS,
    per_class: FALLBACK_PER_CLASS_METRICS
  });
  const [historyData, setHistoryData] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [activeSampleId, setActiveSampleId] = useState('');

  // Bulletproof health fetch with cold-boot detection and no request stacking
  const fetchHealth = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // If health request takes > 2.5s, signal that cloud container is cold-starting
    const wakeTimer = setTimeout(() => {
      setConnectionStatus((prev) => (prev === 'connected' ? 'connected' : 'waking_up'));
    }, 2500);

    const endpointsToTry = [];
    const currentBase = getApiBaseUrl();
    const defaultEndpoint = getApiUrl('/api/health');

    endpointsToTry.push({ url: defaultEndpoint, base: currentBase });
    if (defaultEndpoint !== `${CLOUD_RENDER_URL}/api/health`) {
      endpointsToTry.push({ url: `${CLOUD_RENDER_URL}/api/health`, base: CLOUD_RENDER_URL });
    }
    if (!currentBase && defaultEndpoint !== '/api/health') {
      endpointsToTry.push({ url: '/api/health', base: '' });
    }

    let connected = false;

    for (const target of endpointsToTry) {
      if (!target.url) continue;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 16000);

      try {
        const res = await fetch(target.url, { 
          cache: 'no-store',
          signal: controller.signal 
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && (data.status === 'healthy' || data.model_loaded || data.model_available)) {
            clearTimeout(wakeTimer);
            setApiBaseUrl(target.base);
            setHealthInfo(data);
            setConnectionStatus('connected');
            connected = true;
            break;
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
        // Fallback to next endpoint candidates
      }
    }

    clearTimeout(wakeTimer);
    if (!connected && !healthInfo) {
      setConnectionStatus((prev) => (prev === 'waking_up' ? 'waking_up' : 'offline'));
    }
    isFetchingRef.current = false;
  };

  // Fetch evaluation metrics
  const fetchMetrics = () => {
    fetch(getApiUrl('/api/metrics'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.overall) setMetricsData(data);
      })
      .catch((err) => console.warn('[CliniScan] Metrics fetch using local cache:', err));
  };

  // Fetch scan history
  const fetchHistory = () => {
    fetch(getApiUrl('/api/history'))
      .then((res) => res.json())
      .then((data) => setHistoryData(data))
      .catch((err) => console.warn('[CliniScan] History fetch will retry on connect:', err));
  };

  useEffect(() => {
    fetchHealth();
    fetchMetrics();
    fetchHistory();

    // Adaptive keep-alive ping:
    // When connected: ping every 8 mins to keep Render from sleeping while tab is open.
    // When connecting / waking up / offline: retry every 7 seconds.
    const interval = setInterval(() => {
      fetchHealth();
    }, connectionStatus === 'connected' ? 480000 : 7000);

    return () => clearInterval(interval);
  }, [connectionStatus]);

  // When backend status transitions to healthy, fetch live metrics and audit records
  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchMetrics();
      fetchHistory();
    }
  }, [connectionStatus]);

  const handleAnalysisComplete = (result) => {
    setCurrentAnalysis(result);
    fetchHistory(); // refresh history database count
  };

  const handleSelectSampleFromDashboard = (sampleId) => {
    setActiveSampleId(sampleId);
    setActiveTab('analysis');
  };

  return (
    <div className="app-container">
      {/* Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        healthInfo={healthInfo}
        connectionStatus={connectionStatus}
      />

      {/* Main App Stage */}
      <div className="main-wrapper">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          healthInfo={healthInfo} 
          connectionStatus={connectionStatus}
          onRetryHealth={fetchHealth}
        />

        <main className="content-area">
          {activeTab === 'dashboard' && (
            <DashboardView 
              metricsData={metricsData} 
              historyData={historyData} 
              healthInfo={healthInfo}
              connectionStatus={connectionStatus}
              setActiveTab={setActiveTab}
              onSelectSample={handleSelectSampleFromDashboard}
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisView 
              currentAnalysis={currentAnalysis}
              setCurrentAnalysis={setCurrentAnalysis}
              setActiveTab={setActiveTab}
              healthInfo={healthInfo}
              connectionStatus={connectionStatus}
              onAnalysisComplete={handleAnalysisComplete}
              initialSampleId={activeSampleId}
            />
          )}

          {activeTab === 'gradcam' && (
            <GradCamView 
              currentAnalysis={currentAnalysis}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView 
              currentAnalysis={currentAnalysis}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView 
              historyData={historyData}
              refreshHistory={fetchHistory}
              setCurrentAnalysis={setCurrentAnalysis}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'evaluation' && (
            <EvaluationView 
              metricsData={metricsData}
            />
          )}

          {activeTab === 'methodology' && (
            <MethodologyView />
          )}

          {activeTab === 'about' && (
            <AboutView 
              healthInfo={healthInfo}
            />
          )}
        </main>
      </div>
    </div>
  );
}
