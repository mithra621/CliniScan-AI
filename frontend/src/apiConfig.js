// CliniScan AI — Frontend API Configuration
// Automatically routes to your live Render backend on Vercel deployments!

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://cliniscan-ai.onrender.com'
    : '')
).replace(/\/$/, '');

/**
 * Returns full URL for an API or static asset path.
 * If API_BASE_URL is set, prefixes the path with that URL.
 * Otherwise returns the relative path (standard for local or proxied setups).
 */
export const getApiUrl = (endpoint) => {
  if (!endpoint) return '';
  if (
    endpoint.startsWith('http://') || 
    endpoint.startsWith('https://') || 
    endpoint.startsWith('blob:') || 
    endpoint.startsWith('data:')
  ) {
    return endpoint;
  }
  // Serve static assets bundled in public directly from frontend CDN
  if (endpoint.startsWith('/artifacts/') || endpoint.startsWith('/samples/')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

// Verified validation metrics constants (loaded if backend is waking up or offline)
export const FALLBACK_OVERALL_METRICS = {
  precision: 0.3890,
  precision_percent: 38.90,
  recall: 0.3584,
  recall_percent: 35.84,
  map50: 0.3223,
  map50_percent: 32.23,
  map50_95: 0.1607,
  map50_95_percent: 16.07
};

export const FALLBACK_PER_CLASS_METRICS = [
  { class_id: 0, class_name: 'Aortic enlargement', ap50_percent: 68.98, ap50_95_percent: 41.35 },
  { class_id: 1, class_name: 'Atelectasis', ap50_percent: 18.80, ap50_95_percent: 7.45 },
  { class_id: 2, class_name: 'Calcification', ap50_percent: 19.56, ap50_95_percent: 8.51 },
  { class_id: 3, class_name: 'Cardiomegaly', ap50_percent: 69.31, ap50_95_percent: 45.25 },
  { class_id: 4, class_name: 'Consolidation', ap50_percent: 27.93, ap50_95_percent: 13.82 },
  { class_id: 5, class_name: 'ILD', ap50_percent: 33.49, ap50_95_percent: 17.05 },
  { class_id: 6, class_name: 'Infiltration', ap50_percent: 26.36, ap50_95_percent: 11.54 },
  { class_id: 7, class_name: 'Lung Opacity', ap50_percent: 27.34, ap50_95_percent: 11.16 },
  { class_id: 8, class_name: 'Nodule/Mass', ap50_percent: 24.67, ap50_95_percent: 13.07 },
  { class_id: 9, class_name: 'Other lesion', ap50_percent: 11.42, ap50_95_percent: 4.38 },
  { class_id: 10, class_name: 'Pleural effusion', ap50_percent: 42.81, ap50_95_percent: 18.22 },
  { class_id: 11, class_name: 'Pleural thickening', ap50_percent: 23.11, ap50_95_percent: 8.15 },
  { class_id: 12, class_name: 'Pneumothorax', ap50_percent: 29.26, ap50_95_percent: 13.83 },
  { class_id: 13, class_name: 'Pulmonary fibrosis', ap50_percent: 28.20, ap50_95_percent: 11.14 }
];

export const FALLBACK_SAMPLE_CASES = [
  {
    id: "sample-01",
    title: "Cardiomegaly & Pleural Effusion",
    filename: "00150343289f317a0ad5629d5b7d9ef9.png",
    image_url: "/samples/00150343289f317a0ad5629d5b7d9ef9.png",
    patient_id: "CXR-VAL-0150",
    patient_age: "68",
    patient_gender: "Female",
    clinical_indication: "Progressive dyspnea on exertion and bilateral lower extremity edema",
    primary_abnormalities: ["Cardiomegaly", "Pleural effusion"],
    recommended_conf: 0.20,
    description: "Marked transverse cardiac enlargement with blunting of the costophrenic angles bilaterally."
  },
  {
    id: "sample-02",
    title: "Aortic Enlargement & Pulmonary Fibrosis",
    filename: "000d68e42b71d3eac10ccc077aba07c1.png",
    image_url: "/samples/000d68e42b71d3eac10ccc077aba07c1.png",
    patient_id: "CXR-VAL-000D",
    patient_age: "72",
    patient_gender: "Male",
    clinical_indication: "Chronic dry cough, hypertension, exertional breathlessness",
    primary_abnormalities: ["Aortic enlargement", "Pulmonary fibrosis", "Pleural thickening"],
    recommended_conf: 0.20,
    description: "Prominent thoracic aortic knob with peripheral reticular fibrotic interstitial markings."
  },
  {
    id: "sample-03",
    title: "Pulmonary Nodule / Mass & Opacity",
    filename: "0005e8e3701dfb1dd93d53e2ff537b6e.png",
    image_url: "/samples/0005e8e3701dfb1dd93d53e2ff537b6e.png",
    patient_id: "CXR-VAL-0005",
    patient_age: "59",
    patient_gender: "Male",
    clinical_indication: "Hemoptysis evaluation and 30 pack-year smoking history",
    primary_abnormalities: ["Nodule/Mass", "Lung Opacity", "Consolidation"],
    recommended_conf: 0.15,
    description: "Focal rounded soft-tissue density projecting over the pulmonary mid-zone."
  },
  {
    id: "sample-04",
    title: "Subsegmental Atelectasis & Calcification",
    filename: "018a2fe44c3451281ec338c27ecc9c53.png",
    image_url: "/samples/018a2fe44c3451281ec338c27ecc9c53.png",
    patient_id: "CXR-VAL-018A",
    patient_age: "61",
    patient_gender: "Female",
    clinical_indication: "Post-operative follow-up and shallow respiration",
    primary_abnormalities: ["Atelectasis", "Calcification"],
    recommended_conf: 0.15,
    description: "Basilar volume reduction with focal linear densities and calcified granuloma."
  },
  {
    id: "sample-05",
    title: "Pneumothorax Case (Urgent / STAT)",
    filename: "0e21abbef40e569be72ab0ad90544f87.png",
    image_url: "/samples/0e21abbef40e569be72ab0ad90544f87.png",
    patient_id: "CXR-VAL-0E21",
    patient_age: "34",
    patient_gender: "Male",
    clinical_indication: "Sudden onset sharp right pleuritic chest pain and shortness of breath",
    primary_abnormalities: ["Pneumothorax", "Pleural thickening"],
    recommended_conf: 0.20,
    description: "Visceral pleural line visualization with absence of peripheral lung markings in upper right hemithorax."
  },
  {
    id: "sample-06",
    title: "Bilateral Infiltration & Consolidation",
    filename: "013893a5fa90241c65c3efcdbdd2cec1.png",
    image_url: "/samples/013893a5fa90241c65c3efcdbdd2cec1.png",
    patient_id: "CXR-VAL-0138",
    patient_age: "52",
    patient_gender: "Male",
    clinical_indication: "Fever, chills, productive purulent sputum, and hypoxia",
    primary_abnormalities: ["Infiltration", "Consolidation", "Lung Opacity"],
    recommended_conf: 0.20,
    description: "Confluent alveolar airspace opacification with air bronchograms in bilateral lower lung fields."
  }
];
