import React, { useState, useEffect } from 'react';
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
import { getApiUrl, FALLBACK_OVERALL_METRICS, FALLBACK_PER_CLASS_METRICS } from './apiConfig';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [healthInfo, setHealthInfo] = useState(null);
  const [metricsData, setMetricsData] = useState({
    overall: FALLBACK_OVERALL_METRICS,
    per_class: FALLBACK_PER_CLASS_METRICS
  });
  const [historyData, setHistoryData] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [activeSampleId, setActiveSampleId] = useState('');

  // Fetch initial health status
  const fetchHealth = () => {
    fetch(getApiUrl('/api/health'))
      .then((res) => res.json())
      .then((data) => setHealthInfo(data))
      .catch((err) => console.error('Health check failed:', err));
  };

  // Fetch evaluation metrics
  const fetchMetrics = () => {
    fetch(getApiUrl('/api/metrics'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.overall) setMetricsData(data);
      })
      .catch((err) => console.error('Metrics fetch failed:', err));
  };

  // Fetch scan history
  const fetchHistory = () => {
    fetch(getApiUrl('/api/history'))
      .then((res) => res.json())
      .then((data) => setHistoryData(data))
      .catch((err) => console.error('History fetch failed:', err));
  };

  useEffect(() => {
    fetchHealth();
    fetchMetrics();
    fetchHistory();

    // Periodic retry to auto-connect as soon as cloud backend wakes up
    const interval = setInterval(() => {
      fetchHealth();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // When backend status transitions to healthy, fetch live data
  useEffect(() => {
    if (healthInfo?.status === 'healthy') {
      fetchMetrics();
      fetchHistory();
    }
  }, [healthInfo?.status]);

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
      />

      {/* Main App Stage */}
      <div className="main-wrapper">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          healthInfo={healthInfo} 
        />

        <main className="content-area">
          {activeTab === 'dashboard' && (
            <DashboardView 
              metricsData={metricsData} 
              historyData={historyData} 
              healthInfo={healthInfo}
              setActiveTab={setActiveTab}
              onSelectSample={handleSelectSampleFromDashboard}
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisView 
              currentAnalysis={currentAnalysis}
              setCurrentAnalysis={setCurrentAnalysis}
              setActiveTab={setActiveTab}
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
