// CliniScan AI — Frontend API Configuration
// Supports local development, Vercel deployments, and remote backend hosting.

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

/**
 * Returns full URL for an API or static asset path.
 * If VITE_API_BASE_URL is set, prefixes the path with that URL.
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
