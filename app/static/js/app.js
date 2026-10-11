// CliniScan AI — Frontend Application Logic

let currentScanResult = null;
let currentViewMode = "superimposed"; // superimposed | annotated | gradcam | original
let sampleCatalog = [];
let perClassChartInstance = null;
let trainingChartInstance = null;
let searchDebounceTimer = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();
  setupEventListeners();
  loadSampleCatalog();
  loadDatasetCatalog();
  loadScanHistory();
  loadAnalyticsData();
});

// Navigation Tab Switcher
function switchTab(tabName) {
  const tabs = ["studio", "analytics", "dataset", "history"];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`nav-btn-${t}`);
    if (t === tabName) {
      el.classList.remove("hidden");
      btn.classList.add("active");
    } else {
      el.classList.add("hidden");
      btn.classList.remove("active");
    }
  });

  if (tabName === "analytics") {
    renderAnalyticsCharts();
  } else if (tabName === "history") {
    loadScanHistory();
  }

  if (window.lucide) lucide.createIcons();
}

// Event Listeners Setup
function setupEventListeners() {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const confSlider = document.getElementById("conf-slider");
  const confVal = document.getElementById("conf-val");
  const iouSlider = document.getElementById("iou-slider");
  const iouVal = document.getElementById("iou-val");

  // Dropzone click
  dropzone.addEventListener("click", () => fileInput.click());

  // Drag and drop
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("border-cyan-400", "bg-slate-900");
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("border-cyan-400", "bg-slate-900");
  });
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("border-cyan-400", "bg-slate-900");
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  // File input change
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });

  // Sliders
  confSlider.addEventListener("input", (e) => {
    confVal.textContent = `${e.target.value}%`;
  });
  iouSlider.addEventListener("input", (e) => {
    iouVal.textContent = parseFloat(e.target.value).toFixed(2);
  });
}

function togglePatientInputs() {
  const container = document.getElementById("patient-inputs");
  const chevron = document.getElementById("patient-chevron");
  const isHidden = container.classList.contains("hidden");
  if (isHidden) {
    container.classList.remove("hidden");
    chevron.classList.add("rotate-180");
  } else {
    container.classList.add("hidden");
    chevron.classList.remove("rotate-180");
  }
}

// File Upload Handler
async function handleFileUpload(file) {
  if (!file.type.startsWith("image/")) {
    showToast("Please select a valid image file (PNG, JPG, JPEG)", "error");
    return;
  }

  const conf = parseFloat(document.getElementById("conf-slider").value) / 100.0;
  const iou = parseFloat(document.getElementById("iou-slider").value);
  const pid = document.getElementById("patient-id-input").value.trim();
  const age = document.getElementById("patient-age-input").value.trim();
  const gender = document.getElementById("patient-gender-input").value;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("conf_threshold", conf);
  formData.append("iou_threshold", iou);
  if (pid) formData.append("patient_id", pid);
  if (age) formData.append("patient_age", age);
  if (gender) formData.append("patient_gender", gender);

  setLoadingState(true);

  try {
    const res = await fetch("/api/scan/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Analysis request failed");
    }

    const data = await res.json();
    displayScanResults(data);
    showToast("Analysis & Grad-CAM completed successfully!", "success");
  } catch (error) {
    console.error(error);
    showToast(`Error: ${error.message}`, "error");
  } finally {
    setLoadingState(false);
  }
}

// Sample Case Handler
async function runSampleAnalysis(sampleId) {
  closeSampleModal();
  setLoadingState(true);

  const conf = parseFloat(document.getElementById("conf-slider").value) / 100.0;
  const iou = parseFloat(document.getElementById("iou-slider").value);

  const formData = new FormData();
  formData.append("sample_id", sampleId);
  formData.append("conf_threshold", conf);
  formData.append("iou_threshold", iou);

  try {
    const res = await fetch("/api/scan/sample", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Sample analysis failed");
    }

    const data = await res.json();
    displayScanResults(data);
    showToast("Sample case loaded and analyzed!", "success");
  } catch (error) {
    console.error(error);
    showToast(`Error: ${error.message}`, "error");
  } finally {
    setLoadingState(false);
  }
}

// Display Scan Results in Studio
function displayScanResults(data) {
  currentScanResult = data;

  // Hide placeholder, show display image
  document.getElementById("viewer-placeholder").classList.add("hidden");
  const mainImg = document.getElementById("main-display-img");
  mainImg.classList.remove("hidden");

  // Show colorbar & opacity slider
  document.getElementById("xai-colorbar").classList.remove("hidden");
  document.getElementById("heatmap-opacity-ctrl").classList.remove("hidden");

  // Update view mode
  setViewMode(currentViewMode);

  // Update Findings Count Badge
  const count = data.analysis.num_detections;
  const badge = document.getElementById("finding-count-badge");
  badge.textContent = `${count} ${count === 1 ? 'Finding' : 'Findings'}`;
  badge.className = count > 0 
    ? "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60"
    : "px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60";

  // Render Findings List
  const findingsList = document.getElementById("findings-list");
  if (count === 0) {
    findingsList.innerHTML = `
      <div class="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
        <i data-lucide="check" class="w-4 h-4 text-emerald-400 shrink-0"></i>
        <span>No abnormalities detected above current threshold (${(data.analysis.conf_threshold || 0.2)*100}%). Unremarkable radiograph.</span>
      </div>
    `;
  } else {
    findingsList.innerHTML = data.analysis.detections.map((d, i) => {
      const isCritical = ["Pneumothorax", "Cardiomegaly", "Consolidation"].includes(d.class_name);
      return `
        <div class="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all space-y-1.5" style="border-left: 3px solid ${d.hex}">
          <div class="flex items-center justify-between">
            <span class="font-bold text-white text-xs flex items-center space-x-1.5">
              <span>${i + 1}. ${d.class_name}</span>
              ${isCritical ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800/60 font-semibold">Priority</span>' : ''}
            </span>
            <span class="font-mono text-xs font-bold" style="color: ${d.hex}">
              ${d.confidence_percent.toFixed(1)}%
            </span>
          </div>

          <!-- Progress Meter -->
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500" style="width: ${d.confidence_percent}%; background-color: ${d.hex}"></div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Box: [${d.box.map(v => Math.round(v)).join(', ')}]</span>
            <span class="text-[10px] text-slate-500 font-mono">${(d.confidence).toFixed(4)}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  // Update Report Text
  document.getElementById("report-text-pane").textContent = data.report.report_text;

  // Enable PDF Download Button
  const pdfBtn = document.getElementById("download-pdf-btn");
  pdfBtn.href = data.pdf_url;
  pdfBtn.classList.remove("opacity-50", "pointer-events-none");

  if (window.lucide) lucide.createIcons();
}

// Switch Radiograph View Mode
function setViewMode(mode) {
  currentViewMode = mode;
  const modes = ["superimposed", "annotated", "gradcam", "original"];
  modes.forEach(m => {
    const btn = document.getElementById(`view-btn-${m}`);
    if (m === mode) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  if (!currentScanResult) return;

  const mainImg = document.getElementById("main-display-img");
  const urls = currentScanResult.image_urls;

  if (mode === "superimposed") {
    mainImg.src = urls.superimposed;
  } else if (mode === "annotated") {
    mainImg.src = urls.annotated;
  } else if (mode === "gradcam") {
    mainImg.src = urls.gradcam;
  } else if (mode === "original") {
    mainImg.src = urls.original;
  }
}

// Adjust XAI Opacity (Changes blend visually)
function adjustHeatmapOpacity(val) {
  document.getElementById("xai-opacity-val").textContent = `${val}%`;
}

// Copy Report Text
function copyReportText() {
  const text = document.getElementById("report-text-pane").textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast("Report text copied to clipboard!", "success");
  });
}

// Loading Spinner State
function setLoadingState(loading) {
  const spinner = document.getElementById("viewer-loading");
  if (loading) {
    spinner.classList.remove("hidden");
  } else {
    spinner.classList.add("hidden");
  }
}

// Load Curated Sample Catalog
async function loadSampleCatalog() {
  try {
    const res = await fetch("/api/samples");
    sampleCatalog = await res.json();
    renderSampleModal();
  } catch (e) {
    console.error("Failed to load sample catalog:", e);
  }
}

// Render Sample Selection Modal
function renderSampleModal() {
  const container = document.getElementById("sample-cards-container");
  if (!container) return;

  container.innerHTML = sampleCatalog.map(s => `
    <div class="bg-slate-950 border border-slate-800 hover:border-cyan-500/60 rounded-xl p-3 flex flex-col justify-between transition-all group shadow-md">
      <div class="space-y-2">
        <div class="aspect-[4/3] bg-black rounded-lg overflow-hidden relative border border-slate-800">
          <img src="${s.image_url}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="${s.title}">
          <div class="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-sm text-cyan-400 text-[10px] px-2 py-0.5 rounded font-mono border border-slate-700">
            ${s.patient_id}
          </div>
        </div>

        <div>
          <h4 class="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">${s.title}</h4>
          <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-2">${s.description}</p>
        </div>

        <div class="flex flex-wrap gap-1">
          ${s.primary_abnormalities.map(a => `
            <span class="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
              ${a}
            </span>
          `).join("")}
        </div>
      </div>

      <button onclick="runSampleAnalysis('${s.id}')" class="mt-3 w-full py-1.5 px-3 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 text-xs font-semibold border border-cyan-800/60 flex items-center justify-center space-x-1.5 transition-colors">
        <i data-lucide="play" class="w-3.5 h-3.5"></i>
        <span>Run Diagnostics</span>
      </button>
    </div>
  `).join("");

  if (window.lucide) lucide.createIcons();
}

function openSampleModal() {
  document.getElementById("sample-modal").classList.remove("hidden");
}
function closeSampleModal() {
  document.getElementById("sample-modal").classList.add("hidden");
}

// Load Dataset & Model Metadata
async function loadDatasetCatalog() {
  try {
    const res = await fetch("/api/evaluation");
    const evalData = await res.json();
    const grid = document.getElementById("classes-catalog-grid");
    if (!grid) return;

    grid.innerHTML = Object.entries(evalData.per_class).map(([className, vals], idx) => `
      <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="font-bold text-white">${idx}: ${className}</span>
          <span class="text-[10px] text-cyan-400 font-mono font-bold">${(vals.ap50 * 100).toFixed(1)}%</span>
        </div>
        <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1">
          <span>AP50: ${vals.ap50.toFixed(4)}</span>
          <span>AP50-95: ${vals.ap50_95.toFixed(4)}</span>
        </div>
      </div>
    `).join("");
  } catch (e) {
    console.error("Failed to load dataset catalog:", e);
  }
}

// Load Scan History from SQLite
async function loadScanHistory(search = "") {
  try {
    const res = await fetch(`/api/scans?search=${encodeURIComponent(search)}`);
    const scans = await res.json();
    const tbody = document.getElementById("history-table-body");
    if (!tbody) return;

    if (scans.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-4 py-8 text-center text-slate-500 font-sans">
            No scans found in database. Analyze a radiograph to create records.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = scans.map(s => {
      const dt = new Date(s.created_at).toLocaleString();
      const hasDets = s.num_detections > 0;
      return `
        <tr class="hover:bg-slate-900/50 transition-colors">
          <td class="px-4 py-2.5">
            <img src="${s.thumbnail_path || s.original_image_path}" class="w-10 h-10 object-cover rounded-lg border border-slate-800 bg-black" alt="Thumb">
          </td>
          <td class="px-4 py-2.5 font-bold text-white">${s.patient_id || 'CXR-N/A'}</td>
          <td class="px-4 py-2.5 text-slate-400 text-[11px]">${dt}</td>
          <td class="px-4 py-2.5 text-slate-300 font-sans text-xs">
            <span class="line-clamp-1 max-w-xs" title="${s.findings_summary}">${s.findings_summary}</span>
          </td>
          <td class="px-4 py-2.5 text-cyan-400">${(s.max_confidence * 100).toFixed(1)}%</td>
          <td class="px-4 py-2.5">
            ${s.has_critical 
              ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/60 font-sans">Critical</span>'
              : hasDets 
                ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-sans">Abnormal</span>'
                : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-sans">Clear</span>'}
          </td>
          <td class="px-4 py-2.5 text-right font-sans">
            <div class="flex items-center justify-end space-x-2">
              <a href="/api/scans/${s.id}/pdf" target="_blank" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400" title="Download PDF Report">
                <i data-lucide="file-down" class="w-4 h-4"></i>
              </a>
              <button onclick="deleteScanRecord('${s.id}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400" title="Delete record">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    if (window.lucide) lucide.createIcons();
  } catch (e) {
    console.error("Failed to load scan history:", e);
  }
}

function debounceSearchHistory(val) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    loadScanHistory(val);
  }, 300);
}

async function deleteScanRecord(scanId) {
  if (!confirm("Are you sure you want to delete this scan record from history?")) return;
  try {
    const res = await fetch(`/api/scans/${scanId}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Scan record deleted", "success");
      loadScanHistory();
    }
  } catch (e) {
    showToast("Failed to delete record", "error");
  }
}

// Analytics Charts Rendering
async function loadAnalyticsData() {
  // Pre-load if tab opened
}

async function renderAnalyticsCharts() {
  try {
    const [evalRes, histRes] = await Promise.all([
      fetch("/api/evaluation"),
      fetch("/api/training-history")
    ]);

    const evalData = await evalRes.json();
    const histData = await histRes.json();

    // 1. Per-Class AP Bar Chart
    const classes = Object.keys(evalData.per_class);
    const ap50Values = classes.map(c => evalData.per_class[c].ap50 * 100);
    const ap50_95Values = classes.map(c => evalData.per_class[c].ap50_95 * 100);

    const ctxPerClass = document.getElementById("perClassChart").getContext("2d");
    if (perClassChartInstance) perClassChartInstance.destroy();

    perClassChartInstance = new Chart(ctxPerClass, {
      type: "bar",
      data: {
        labels: classes,
        datasets: [
          {
            label: "AP@0.5 (%)",
            data: ap50Values,
            backgroundColor: "rgba(6, 182, 212, 0.8)", // Cyan
            borderColor: "rgba(6, 182, 212, 1)",
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: "AP@0.5:0.95 (%)",
            data: ap50_95Values,
            backgroundColor: "rgba(147, 51, 234, 0.7)", // Purple
            borderColor: "rgba(147, 51, 234, 1)",
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#94a3b8", font: { size: 11 } }
          }
        },
        scales: {
          x: {
            ticks: { color: "#94a3b8", font: { size: 9 }, maxRotation: 45 },
            grid: { color: "rgba(51, 65, 85, 0.3)" }
          },
          y: {
            ticks: { color: "#94a3b8", font: { size: 10 } },
            grid: { color: "rgba(51, 65, 85, 0.3)" },
            max: 100,
            beginAtZero: true
          }
        }
      }
    });

    // 2. 50-Epoch Training History Line Chart
    const epochs = histData.history.map(h => h.epoch);
    const boxLoss = histData.history.map(h => h["train/box_loss"]);
    const clsLoss = histData.history.map(h => h["train/cls_loss"]);
    const map50 = histData.history.map(h => (h["metrics/mAP50(B)"] || 0) * 100);

    const ctxTraining = document.getElementById("trainingChart").getContext("2d");
    if (trainingChartInstance) trainingChartInstance.destroy();

    trainingChartInstance = new Chart(ctxTraining, {
      type: "line",
      data: {
        labels: epochs,
        datasets: [
          {
            label: "Train Box Loss",
            data: boxLoss,
            borderColor: "rgba(239, 68, 68, 0.9)", // Red
            backgroundColor: "transparent",
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 0
          },
          {
            label: "Train Class Loss",
            data: clsLoss,
            borderColor: "rgba(245, 158, 11, 0.9)", // Amber
            backgroundColor: "transparent",
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 0
          },
          {
            label: "Validation mAP50 (%)",
            data: map50,
            borderColor: "rgba(16, 185, 129, 1)", // Emerald
            backgroundColor: "transparent",
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#94a3b8", font: { size: 10 } }
          }
        },
        scales: {
          x: {
            ticks: { color: "#94a3b8", font: { size: 9 } },
            grid: { color: "rgba(51, 65, 85, 0.3)" }
          },
          y: {
            ticks: { color: "#94a3b8", font: { size: 9 } },
            grid: { color: "rgba(51, 65, 85, 0.3)" }
          }
        }
      }
    });

  } catch (e) {
    console.error("Failed to render analytics charts:", e);
  }
}

// Image Modal Preview
function openImageModal(imgSrc, title) {
  document.getElementById("image-modal-img").src = imgSrc;
  document.getElementById("image-modal-title").textContent = title;
  document.getElementById("image-modal").classList.remove("hidden");
}
function closeImageModal() {
  document.getElementById("image-modal").classList.add("hidden");
}

// Toast Notifications
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  const msgEl = document.getElementById("toast-msg");
  const iconEl = document.getElementById("toast-icon");

  msgEl.textContent = message;

  if (type === "success") {
    iconEl.setAttribute("data-lucide", "check-circle");
    toast.className = "fixed bottom-5 right-5 z-50 transition-all duration-300 px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-800 shadow-2xl flex items-center space-x-2.5 text-xs font-semibold text-emerald-300 opacity-100 translate-y-0";
  } else if (type === "error") {
    iconEl.setAttribute("data-lucide", "alert-circle");
    toast.className = "fixed bottom-5 right-5 z-50 transition-all duration-300 px-4 py-2.5 rounded-xl bg-slate-900 border border-rose-800 shadow-2xl flex items-center space-x-2.5 text-xs font-semibold text-rose-300 opacity-100 translate-y-0";
  } else {
    iconEl.setAttribute("data-lucide", "info");
    toast.className = "fixed bottom-5 right-5 z-50 transition-all duration-300 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-800 shadow-2xl flex items-center space-x-2.5 text-xs font-semibold text-cyan-300 opacity-100 translate-y-0";
  }

  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.className = "fixed bottom-5 right-5 z-50 transform translate-y-20 opacity-0 transition-all duration-300 pointer-events-none px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl flex items-center space-x-2.5 text-xs font-semibold text-slate-200";
  }, 3500);
}
