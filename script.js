/**
 * AR Drawing & Tracing App
 * Professional-grade AR tracing application for Android
 */

// ============================================================================
// STATE & CONFIGURATION
// ============================================================================

const appState = {
  // Camera
  stream: null,
  currentDeviceId: null,
  currentZoom: 1,
  zoomSupported: false,
  cameras: [],

  // Overlay image
  imageLoaded: false,
  imageFile: null,

  // Transform
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0,
  opacity: 1,
  locked: false,
  hidden: false,

  // Filters
  brightness: 100,
  contrast: 100,
  mirrorX: false,
  mirrorY: false,
  invert: false,
  paperMode: false,

  // UI
  gridVisible: false,
  settingsOpen: false,

  // Touch interaction
  touchStartDistance: 0,
  touchStartAngle: 0,
  isDragging: false,
};

const CONFIG = {
  STORAGE_PREFIX: "ar-draw-",
  GRID_SIZE: 50,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 4,
  TOUCH_SLOP: 10,
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  // Video
  cameraVideo: document.getElementById("cameraVideo"),
  cameraContainer: document.getElementById("cameraContainer"),

  // Overlay
  overlayContainer: document.getElementById("overlayContainer"),
  overlayImage: document.getElementById("overlayImage"),

  // Canvas
  gridCanvas: document.getElementById("gridCanvas"),
  touchGuide: document.getElementById("touchGuide"),

  // Top bar
  cameraSelect: document.getElementById("cameraSelect"),
  switchCameraBtn: document.getElementById("switchCameraBtn"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  settingsBtn: document.getElementById("settingsBtn"),

  // Toolbar
  uploadBtn: document.getElementById("uploadBtn"),
  opacityBtn: document.getElementById("opacityBtn"),
  scaleBtn: document.getElementById("scaleBtn"),
  rotateBtn: document.getElementById("rotateBtn"),
  lockBtn: document.getElementById("lockBtn"),
  hideBtn: document.getElementById("hideBtn"),
  resetBtn: document.getElementById("resetBtn"),
  gridBtn: document.getElementById("gridBtn"),
  moreBtn: document.getElementById("moreBtn"),

  // File input
  fileInput: document.getElementById("fileInput"),

  // Settings panel
  settingsPanel: document.getElementById("settingsPanel"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),

  // Settings inputs
  settingsCameraSelect: document.getElementById("settingsCameraSelect"),
  zoomSlider: document.getElementById("zoomSlider"),
  settingsOpacitySlider: document.getElementById("settingsOpacitySlider"),
  settingsScaleSlider: document.getElementById("settingsScaleSlider"),
  settingsRotateSlider: document.getElementById("settingsRotateSlider"),
  brightnessSlider: document.getElementById("brightnessSlider"),
  contrastSlider: document.getElementById("contrastSlider"),
  mirrorXCheckbox: document.getElementById("mirrorXCheckbox"),
  mirrorYCheckbox: document.getElementById("mirrorYCheckbox"),
  invertCheckbox: document.getElementById("invertCheckbox"),
  paperModeCheckbox: document.getElementById("paperModeCheckbox"),

  // Action buttons
  saveDefaultsBtn: document.getElementById("saveDefaultsBtn"),
  resetAllBtn: document.getElementById("resetAllBtn"),

  // Debug
  debugCamera: document.getElementById("debugCamera"),
  debugZoomSupport: document.getElementById("debugZoomSupport"),
  debugZoomValue: document.getElementById("debugZoomValue"),
  debugResolution: document.getElementById("debugResolution"),
  debugErrors: document.getElementById("debugErrors"),

  // Toast
  toastContainer: document.getElementById("toastContainer"),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  elements.toastContainer.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.classList.add("removing");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return toast;
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(CONFIG.STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

function loadFromStorage(key, defaultValue) {
  try {
    const item = localStorage.getItem(CONFIG.STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error("Storage error:", e);
    return defaultValue;
  }
}

function addError(message) {
  const currentErrors = elements.debugErrors.textContent;
  elements.debugErrors.textContent =
    currentErrors === "None" ? message : currentErrors + "; " + message;
}

function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function angle(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// STORAGE & DEFAULTS
// ============================================================================

function loadDefaults() {
  appState.offsetX = loadFromStorage("offsetX", 0);
  appState.offsetY = loadFromStorage("offsetY", 0);
  appState.scale = loadFromStorage("scale", 1);
  appState.rotation = loadFromStorage("rotation", 0);
  appState.opacity = loadFromStorage("opacity", 1);
  appState.locked = loadFromStorage("locked", false);
  appState.brightness = loadFromStorage("brightness", 100);
  appState.contrast = loadFromStorage("contrast", 100);
  appState.mirrorX = loadFromStorage("mirrorX", false);
  appState.mirrorY = loadFromStorage("mirrorY", false);
  appState.invert = loadFromStorage("invert", false);
  appState.paperMode = loadFromStorage("paperMode", false);
  appState.currentDeviceId = loadFromStorage("deviceId", null);
  appState.currentZoom = loadFromStorage("zoom", 1);
}

function saveDefaults() {
  saveToStorage("offsetX", appState.offsetX);
  saveToStorage("offsetY", appState.offsetY);
  saveToStorage("scale", appState.scale);
  saveToStorage("rotation", appState.rotation);
  saveToStorage("opacity", appState.opacity);
  saveToStorage("locked", appState.locked);
  saveToStorage("brightness", appState.brightness);
  saveToStorage("contrast", appState.contrast);
  saveToStorage("mirrorX", appState.mirrorX);
  saveToStorage("mirrorY", appState.mirrorY);
  saveToStorage("invert", appState.invert);
  saveToStorage("paperMode", appState.paperMode);
  saveToStorage("deviceId", appState.currentDeviceId);
  saveToStorage("zoom", appState.currentZoom);
  showToast("Settings saved", "success");
}

function resetAllSettings() {
  appState.offsetX = 0;
  appState.offsetY = 0;
  appState.scale = 1;
  appState.rotation = 0;
  appState.opacity = 1;
  appState.locked = false;
  appState.brightness = 100;
  appState.contrast = 100;
  appState.mirrorX = false;
  appState.mirrorY = false;
  appState.invert = false;
  appState.paperMode = false;
  appState.currentZoom = 1;

  localStorage.clear();
  updateUI();
  applyTransform();
  showToast("All settings reset", "success");
}

// ============================================================================
// CAMERA MANAGEMENT
// ============================================================================

async function enumerateCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    appState.cameras = devices.filter((device) => device.kind === "videoinput");

    // Update camera selects
    updateCameraSelects();

    return appState.cameras;
  } catch (error) {
    console.error("Error enumerating devices:", error);
    addError("Failed to enumerate cameras");
    return [];
  }
}

function updateCameraSelects() {
  const selects = [elements.cameraSelect, elements.settingsCameraSelect];

  selects.forEach((select) => {
    const currentValue = select.value;
    select.innerHTML = "";

    if (appState.cameras.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No cameras found";
      select.appendChild(option);
      return;
    }

    appState.cameras.forEach((camera, index) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.textContent = camera.label || `Camera ${index + 1}`;
      select.appendChild(option);
    });

    if (currentValue) {
      select.value = currentValue;
    }
  });
}

async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });

    // Stop immediately, we just want permission
    stream.getTracks().forEach((track) => track.stop());

    // Now enumerate with labels
    await enumerateCameras();
    showToast("Camera access granted", "success");
    return true;
  } catch (error) {
    console.error("Camera permission error:", error);
    if (error.name === "NotAllowedError") {
      showToast(
        "Camera permission denied. Please enable it in settings.",
        "error",
      );
    } else if (error.name === "NotFoundError") {
      showToast("No camera found on this device", "error");
    } else {
      showToast("Camera error: " + error.message, "error");
    }
    addError(error.message);
    return false;
  }
}

async function startCamera(deviceId) {
  try {
    // Stop previous stream
    if (appState.stream) {
      appState.stream.getTracks().forEach((track) => track.stop());
    }

    const constraints = {
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    // Set device ID if provided
    if (deviceId) {
      constraints.video.deviceId = { exact: deviceId };
    } else if (!deviceId) {
      constraints.video.facingMode = { ideal: "environment" };
    }

    appState.stream = await navigator.mediaDevices.getUserMedia(constraints);
    elements.cameraVideo.srcObject = appState.stream;

    const track = appState.stream.getVideoTracks()[0];
    appState.currentDeviceId = track.getSettings().deviceId;

    // Check zoom support
    await setupZoomCapabilities(track);

    // Update debug info
    updateDebugInfo(track);

    showToast("Camera started", "success");
    return true;
  } catch (error) {
    console.error("Camera start error:", error);
    showToast("Failed to start camera: " + error.message, "error");
    addError(error.message);
    return false;
  }
}

async function setupZoomCapabilities(track) {
  try {
    const capabilities = track.getCapabilities();

    if (capabilities.zoom) {
      appState.zoomSupported = true;
      const zoomRange = capabilities.zoom;

      elements.zoomSlider.min = zoomRange.min || 1;
      elements.zoomSlider.max = zoomRange.max || 4;
      elements.zoomSlider.step = zoomRange.step || 0.1;
      elements.zoomSlider.value = appState.currentZoom;

      document.getElementById("zoomGroup").style.display = "flex";
      document.getElementById("zoomInfo").textContent =
        `Range: ${zoomRange.min}x to ${zoomRange.max}x`;

      // Apply saved zoom
      await applyZoom(appState.currentZoom);
    } else {
      appState.zoomSupported = false;
      document.getElementById("zoomGroup").style.display = "none";
      document.getElementById("zoomInfo").textContent =
        "Not supported by this camera";
    }
  } catch (error) {
    console.error("Zoom setup error:", error);
    appState.zoomSupported = false;
    document.getElementById("zoomGroup").style.display = "none";
  }
}

async function applyZoom(zoomValue) {
  if (!appState.stream || !appState.zoomSupported) return;

  try {
    const track = appState.stream.getVideoTracks()[0];
    zoomValue = clamp(zoomValue, 1, 4);
    await track.applyConstraints({
      advanced: [{ zoom: zoomValue }],
    });
    appState.currentZoom = zoomValue;
    elements.zoomSlider.value = zoomValue;
    document.getElementById("zoomValue").textContent =
      zoomValue.toFixed(1) + "x";
  } catch (error) {
    console.error("Zoom apply error:", error);
  }
}

function updateDebugInfo(track) {
  const settings = track.getSettings();
  const capabilities = track.getCapabilities();

  const cameraLabel =
    appState.cameras.find((c) => c.deviceId === settings.deviceId)?.label ||
    "Unknown";
  elements.debugCamera.textContent = cameraLabel;
  elements.debugZoomSupport.textContent = appState.zoomSupported ? "Yes" : "No";
  elements.debugZoomValue.textContent = appState.currentZoom.toFixed(1) + "x";
  elements.debugResolution.textContent = `${settings.width}x${settings.height}`;
}

// ============================================================================
// IMAGE OVERLAY
// ============================================================================

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please select an image file", "error");
    return;
  }

  appState.imageFile = file;
  const reader = new FileReader();

  reader.onload = (e) => {
    elements.overlayImage.src = e.target.result;
    elements.overlayImage.onload = () => {
      appState.imageLoaded = true;
      centerImage();
      showToast("Image loaded", "success");
    };
    elements.overlayImage.onerror = () => {
      showToast("Failed to load image", "error");
    };
  };

  reader.readAsDataURL(file);
}

function applyTransform() {
  if (!appState.imageLoaded) return;

  const {
    offsetX,
    offsetY,
    scale,
    rotation,
    opacity,
    brightness,
    contrast,
    mirrorX,
    mirrorY,
    invert,
    paperMode,
  } = appState;

  let filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  if (invert) filter += " invert(1)";
  if (paperMode) filter += " contrast(150%) brightness(110%)";

  let transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale}`;
  if (mirrorX) transform += ", -1";
  transform += ")";
  if (mirrorY) transform += " scaleY(-1)";
  transform += ` rotate(${rotation}deg)`;

  elements.overlayContainer.style.transform = transform;
  elements.overlayImage.style.opacity = opacity;
  elements.overlayImage.style.filter = filter;
}

function centerImage() {
  appState.offsetX = 0;
  appState.offsetY = 0;
  applyTransform();
}

function resetPosition() {
  appState.offsetX = 0;
  appState.offsetY = 0;
  appState.scale = 1;
  appState.rotation = 0;
  updateUI();
  applyTransform();
  showToast("Position reset", "success");
}

// ============================================================================
// TOUCH INTERACTION
// ============================================================================

function getTouchPoint(touch) {
  const rect = elements.cameraContainer.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
}

function handleTouchStart(event) {
  if (appState.locked || !appState.imageLoaded) return;

  if (event.touches.length === 1) {
    // Single touch - drag
    appState.isDragging = true;
    const touch = getTouchPoint(event.touches[0]);
    appState.dragStartX = touch.x - appState.offsetX;
    appState.dragStartY = touch.y - appState.offsetY;
  } else if (event.touches.length === 2) {
    // Two finger - pinch and rotate
    appState.isDragging = false;
    const touch1 = getTouchPoint(event.touches[0]);
    const touch2 = getTouchPoint(event.touches[1]);

    appState.touchStartDistance = distance(touch1, touch2);
    appState.touchStartAngle = angle(touch1, touch2);
    appState.touchStartScale = appState.scale;
    appState.touchStartRotation = appState.rotation;
  }

  event.preventDefault();
}

function handleTouchMove(event) {
  if (!appState.imageLoaded) return;

  if (event.touches.length === 1 && appState.isDragging) {
    // Dragging
    const touch = getTouchPoint(event.touches[0]);
    appState.offsetX = touch.x - appState.dragStartX;
    appState.offsetY = touch.y - appState.dragStartY;
    applyTransform();
  } else if (event.touches.length === 2) {
    // Pinch and rotate
    const touch1 = getTouchPoint(event.touches[0]);
    const touch2 = getTouchPoint(event.touches[1]);

    const currentDistance = distance(touch1, touch2);
    const currentAngle = angle(touch1, touch2);

    // Scale
    if (appState.touchStartDistance > 0) {
      const scaleRatio = currentDistance / appState.touchStartDistance;
      appState.scale = clamp(
        appState.touchStartScale * scaleRatio,
        CONFIG.MIN_ZOOM,
        CONFIG.MAX_ZOOM,
      );
    }

    // Rotate
    const angleDiff = currentAngle - appState.touchStartAngle;
    appState.rotation = (appState.touchStartRotation + angleDiff) % 360;

    updateUI();
    applyTransform();
  }

  event.preventDefault();
}

function handleTouchEnd(event) {
  appState.isDragging = false;
  appState.touchStartDistance = 0;
}

// ============================================================================
// POINTER INTERACTION (Mouse for desktop testing)
// ============================================================================

let isMouseDown = false;
let mouseStartX = 0;
let mouseStartY = 0;

elements.overlayContainer.addEventListener("pointerdown", (e) => {
  if (appState.locked || !appState.imageLoaded) return;

  isMouseDown = true;
  const rect = elements.cameraContainer.getBoundingClientRect();
  mouseStartX = e.clientX - rect.left - appState.offsetX;
  mouseStartY = e.clientY - rect.top - appState.offsetY;
  elements.overlayContainer.style.cursor = "grabbing";
});

document.addEventListener("pointermove", (e) => {
  if (!isMouseDown || !appState.imageLoaded) return;

  const rect = elements.cameraContainer.getBoundingClientRect();
  appState.offsetX = e.clientX - rect.left - mouseStartX;
  appState.offsetY = e.clientY - rect.top - mouseStartY;
  applyTransform();
});

document.addEventListener("pointerup", () => {
  isMouseDown = false;
  elements.overlayContainer.style.cursor = "grab";
});

// ============================================================================
// GRID
// ============================================================================

function drawGrid() {
  const canvas = elements.gridCanvas;
  const ctx = canvas.getContext("2d");

  canvas.width = elements.cameraContainer.offsetWidth;
  canvas.height = elements.cameraContainer.offsetHeight;

  ctx.strokeStyle = "rgba(255, 107, 107, 0.3)";
  ctx.lineWidth = 1;

  for (let x = 0; x < canvas.width; x += CONFIG.GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y < canvas.height; y += CONFIG.GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function toggleGrid() {
  appState.gridVisible = !appState.gridVisible;
  elements.gridCanvas.style.display = appState.gridVisible ? "block" : "none";
  if (appState.gridVisible) {
    drawGrid();
  }
  elements.gridBtn.classList.toggle("active", appState.gridVisible);
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateUI() {
  // Opacity
  elements.settingsOpacitySlider.value = Math.round(appState.opacity * 100);
  document.getElementById("settingsOpacityValue").textContent =
    Math.round(appState.opacity * 100) + "%";

  // Scale
  elements.settingsScaleSlider.value = Math.round(appState.scale * 100);
  document.getElementById("settingsScaleValue").textContent =
    Math.round(appState.scale * 100) + "%";

  // Rotation
  elements.settingsRotateSlider.value = appState.rotation;
  document.getElementById("settingsRotateValue").textContent =
    Math.round(appState.rotation) + "°";

  // Brightness
  elements.brightnessSlider.value = appState.brightness;
  document.getElementById("brightnessValue").textContent =
    appState.brightness + "%";

  // Contrast
  elements.contrastSlider.value = appState.contrast;
  document.getElementById("contrastValue").textContent =
    appState.contrast + "%";

  // Checkboxes
  elements.mirrorXCheckbox.checked = appState.mirrorX;
  elements.mirrorYCheckbox.checked = appState.mirrorY;
  elements.invertCheckbox.checked = appState.invert;
  elements.paperModeCheckbox.checked = appState.paperMode;

  // Buttons
  elements.lockBtn.classList.toggle("active", appState.locked);
  elements.hideBtn.classList.toggle("active", appState.hidden);
}

function updateSliderBackground(slider) {
  const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.setProperty("--value", value + "%");
}

// ============================================================================
// EVENT LISTENERS - TOOLBAR
// ============================================================================

elements.uploadBtn.addEventListener("click", () => {
  elements.fileInput.click();
});

elements.fileInput.addEventListener("change", handleFileSelect);

elements.opacityBtn.addEventListener("click", () => {
  elements.settingsPanel.classList.add("active");
  elements.settingsOpacitySlider.focus();
});

elements.scaleBtn.addEventListener("click", () => {
  elements.settingsPanel.classList.add("active");
  elements.settingsScaleSlider.focus();
});

elements.rotateBtn.addEventListener("click", () => {
  elements.settingsPanel.classList.add("active");
  elements.settingsRotateSlider.focus();
});

elements.lockBtn.addEventListener("click", () => {
  appState.locked = !appState.locked;
  elements.lockBtn.classList.toggle("active");
  showToast(
    appState.locked ? "Position locked" : "Position unlocked",
    "success",
  );
});

elements.hideBtn.addEventListener("click", () => {
  appState.hidden = !appState.hidden;
  elements.overlayContainer.classList.toggle("hidden");
  elements.hideBtn.classList.toggle("active");
  showToast(appState.hidden ? "Overlay hidden" : "Overlay shown", "success");
});

elements.resetBtn.addEventListener("click", () => {
  resetPosition();
});

elements.gridBtn.addEventListener("click", toggleGrid);

elements.moreBtn.addEventListener("click", () => {
  elements.settingsPanel.classList.add("active");
});

elements.settingsBtn.addEventListener("click", () => {
  elements.settingsPanel.classList.add("active");
});

elements.closeSettingsBtn.addEventListener("click", () => {
  elements.settingsPanel.classList.remove("active");
});

// ============================================================================
// EVENT LISTENERS - SETTINGS
// ============================================================================

elements.settingsOpacitySlider.addEventListener("input", (e) => {
  appState.opacity = parseInt(e.target.value) / 100;
  document.getElementById("settingsOpacityValue").textContent =
    e.target.value + "%";
  updateSliderBackground(e.target);
  applyTransform();
});

elements.settingsScaleSlider.addEventListener("input", (e) => {
  appState.scale = parseInt(e.target.value) / 100;
  document.getElementById("settingsScaleValue").textContent =
    e.target.value + "%";
  updateSliderBackground(e.target);
  applyTransform();
});

elements.settingsRotateSlider.addEventListener("input", (e) => {
  appState.rotation = parseInt(e.target.value);
  document.getElementById("settingsRotateValue").textContent =
    e.target.value + "°";
  updateSliderBackground(e.target);
  applyTransform();
});

elements.brightnessSlider.addEventListener("input", (e) => {
  appState.brightness = parseInt(e.target.value);
  document.getElementById("brightnessValue").textContent = e.target.value + "%";
  updateSliderBackground(e.target);
  applyTransform();
});

elements.contrastSlider.addEventListener("input", (e) => {
  appState.contrast = parseInt(e.target.value);
  document.getElementById("contrastValue").textContent = e.target.value + "%";
  updateSliderBackground(e.target);
  applyTransform();
});

elements.mirrorXCheckbox.addEventListener("change", (e) => {
  appState.mirrorX = e.target.checked;
  applyTransform();
});

elements.mirrorYCheckbox.addEventListener("change", (e) => {
  appState.mirrorY = e.target.checked;
  applyTransform();
});

elements.invertCheckbox.addEventListener("change", (e) => {
  appState.invert = e.target.checked;
  applyTransform();
});

elements.paperModeCheckbox.addEventListener("change", (e) => {
  appState.paperMode = e.target.checked;
  applyTransform();
});

elements.zoomSlider.addEventListener("input", (e) => {
  applyZoom(parseFloat(e.target.value));
});

elements.saveDefaultsBtn.addEventListener("click", saveDefaults);
elements.resetAllBtn.addEventListener("click", resetAllSettings);

// ============================================================================
// EVENT LISTENERS - CAMERA
// ============================================================================

elements.cameraSelect.addEventListener("change", (e) => {
  appState.currentDeviceId = e.target.value;
  startCamera(appState.currentDeviceId);
});

elements.settingsCameraSelect.addEventListener("change", (e) => {
  appState.currentDeviceId = e.target.value;
  startCamera(appState.currentDeviceId);
  elements.cameraSelect.value = e.target.value;
});

elements.switchCameraBtn.addEventListener("click", async () => {
  await enumerateCameras();
  if (appState.cameras.length > 1) {
    const currentIndex = appState.cameras.findIndex(
      (c) => c.deviceId === appState.currentDeviceId,
    );
    const nextIndex = (currentIndex + 1) % appState.cameras.length;
    appState.currentDeviceId = appState.cameras[nextIndex].deviceId;
    startCamera(appState.currentDeviceId);
  } else {
    showToast("Only one camera available", "warning");
  }
});

elements.fullscreenBtn.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    console.error("Fullscreen error:", error);
    showToast("Fullscreen not supported", "warning");
  }
});

// ============================================================================
// TOUCH EVENT LISTENERS
// ============================================================================

elements.cameraContainer.addEventListener("touchstart", handleTouchStart, {
  passive: false,
});
elements.cameraContainer.addEventListener("touchmove", handleTouchMove, {
  passive: false,
});
elements.cameraContainer.addEventListener("touchend", handleTouchEnd);

// Prevent scroll
document.addEventListener(
  "touchmove",
  (e) => {
    if (
      elements.settingsPanel.classList.contains("active") &&
      elements.settingsPanel.contains(e.target)
    ) {
      return;
    }
    e.preventDefault();
  },
  { passive: false },
);

// ============================================================================
// INITIALIZATION
// ============================================================================

async function init() {
  try {
    // Load saved settings
    loadDefaults();

    // Request camera permission
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    // Start camera
    await startCamera(appState.currentDeviceId);

    // Update UI
    updateUI();

    // Hide loading toast
    showToast("Ready to draw", "success");

    // Prevent iOS zoom
    document.addEventListener("gesturestart", (e) => e.preventDefault());
  } catch (error) {
    console.error("Initialization error:", error);
    showToast("Failed to initialize app", "error");
  }
}

// Start app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Handle visibility changes
document.addEventListener("visibilitychange", async () => {
  if (document.hidden) {
    if (appState.stream) {
      appState.stream.getTracks().forEach((track) => track.stop());
    }
  } else {
    await startCamera(appState.currentDeviceId);
  }
});

// Handle window resize
window.addEventListener("resize", () => {
  if (appState.gridVisible) {
    drawGrid();
  }
});
