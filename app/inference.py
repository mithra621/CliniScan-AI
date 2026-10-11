import os
import cv2
import numpy as np
import torch
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
from ultralytics import YOLO

from app.config import (
    MODEL_PATH,
    CLASSES,
    CLASS_PALETTE,
    UPLOAD_DIR,
    RESULTS_DIR
)

class ModelManager:
    """
    Singleton YOLO11n Model Loader and Inference Engine.
    Ensures the model is loaded exactly once into memory at application startup.
    """
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
        return cls._instance

    @classmethod
    def load_model(cls) -> YOLO:
        if cls._model is None:
            resolved_path = Path(MODEL_PATH).resolve()
            if not resolved_path.exists():
                raise FileNotFoundError(f"Trained YOLO11n weights not found at: {resolved_path}")
            print(f"[CliniScan AI] Loading YOLO11n model from: {resolved_path}")
            cls._model = YOLO(str(resolved_path))
            cls._model.model.eval()
            print(f"[CliniScan AI] Successfully initialized YOLO11n ({len(cls._model.names)} classes)")
        return cls._model

    @classmethod
    def get_model(cls) -> YOLO:
        if cls._model is None:
            return cls.load_model()
        return cls._model


def draw_bounding_boxes(
    orig_img: np.ndarray,
    detections: List[Dict[str, Any]]
) -> np.ndarray:
    """
    Renders professional clinical bounding boxes with labels and translucent overlays.
    """
    annotated = orig_img.copy()
    h, w = orig_img.shape[:2]

    # Overlay layer for soft semi-transparent box shading
    overlay = annotated.copy()

    for det in detections:
        x1, y1, x2, y2 = [int(v) for v in det["box"]]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        
        color_bgr = det.get("bgr", (38, 38, 220))
        
        # Soft fill
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color_bgr, -1)

    # Blend 15% box fill
    cv2.addWeighted(overlay, 0.15, annotated, 0.85, 0, annotated)

    # Draw crisp borders and badges
    for det in detections:
        x1, y1, x2, y2 = [int(v) for v in det["box"]]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        
        color_bgr = det.get("bgr", (38, 38, 220))
        class_name = det["class_name"]
        conf = det["confidence"]
        
        # Border
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color_bgr, 2)
        
        # Badge label
        label = f"{class_name} {conf*100:.1f}%"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.5
        font_thickness = 1
        (label_w, label_h), baseline = cv2.getTextSize(label, font, font_scale, font_thickness)
        
        # Badge background
        badge_y1 = max(0, y1 - label_h - 8)
        badge_y2 = y1
        badge_x2 = min(w, x1 + label_w + 10)
        
        cv2.rectangle(annotated, (x1, badge_y1), (badge_x2, badge_y2), color_bgr, -1)
        cv2.putText(
            annotated,
            label,
            (x1 + 5, badge_y2 - 4),
            font,
            font_scale,
            (255, 255, 255),
            font_thickness,
            cv2.LINE_AA
        )

    return annotated


def generate_gradcam_heatmap(
    model: YOLO,
    img_bgr: np.ndarray,
    target_layer_idx: int = 22
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generates high-resolution Grad-CAM / feature saliency heatmap for the Chest X-ray.
    Returns: (raw_cam_uint8, heatmap_bgr)
    """
    h, w = img_bgr.shape[:2]
    torch_model = model.model
    torch_model.eval()

    activations = []
    def hook_fn(module, inp, out):
        activations.append(out)

    target_layer = torch_model.model[target_layer_idx]
    hook = target_layer.register_forward_hook(hook_fn)

    # Preprocess to 640x640 tensor
    resized = cv2.resize(img_bgr, (640, 640))
    tensor = torch.from_numpy(resized).permute(2, 0, 1).float().unsqueeze(0) / 255.0

    with torch.no_grad():
        _ = torch_model(tensor)

    hook.remove()

    if not activations:
        dummy = np.zeros((h, w), dtype=np.uint8)
        return dummy, cv2.applyColorMap(dummy, cv2.COLORMAP_JET)

    feat = activations[0]
    if isinstance(feat, (list, tuple)):
        feat = feat[0]

    feat_np = feat[0].cpu().numpy() # [C, H, W]

    # Compute saliency by positive channel energy
    cam = np.mean(np.maximum(feat_np, 0), axis=0)
    cam = cv2.resize(cam, (w, h))

    # Normalize
    cam_min, cam_max = cam.min(), cam.max()
    if cam_max > cam_min:
        cam_norm = (cam - cam_min) / (cam_max - cam_min)
    else:
        cam_norm = np.zeros_like(cam)

    cam_uint8 = np.uint8(255 * cam_norm)
    heatmap = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)

    return cam_uint8, heatmap


def run_cliniscan_analysis(
    scan_id: str,
    image_path: str,
    conf_threshold: float = 0.25,
    iou_threshold: float = 0.45
) -> Dict[str, Any]:
    """
    Full CliniScan AI pipeline:
    1. Loads image
    2. Runs YOLO11n detection
    3. Annotates bounding boxes
    4. Generates Grad-CAM XAI heatmaps and superimposed views
    5. Saves output artifacts to data/results/
    """
    model = ModelManager.get_model()
    orig_img = cv2.imread(image_path)
    if orig_img is None:
        raise ValueError(f"Failed to read image at: {image_path}")

    h, w = orig_img.shape[:2]

    # Run YOLO11n prediction
    results = model.predict(
        orig_img,
        conf=conf_threshold,
        iou=iou_threshold,
        imgsz=640,
        verbose=False
    )

    detections = []
    for b in results[0].boxes:
        cls_id = int(b.cls[0])
        class_name = model.names.get(cls_id, f"Class {cls_id}")
        conf = float(b.conf[0])
        box = b.xyxy[0].cpu().numpy().tolist() # [x1, y1, x2, y2]
        
        palette = CLASS_PALETTE.get(class_name, {"hex": "#3B82F6", "bgr": (246, 130, 59)})

        # Normalized coordinates for flexible frontend rendering
        box_norm = [
            round(box[0] / w, 4),
            round(box[1] / h, 4),
            round(box[2] / w, 4),
            round(box[3] / h, 4)
        ]

        detections.append({
            "class_id": cls_id,
            "class_name": class_name,
            "confidence": round(conf, 4),
            "confidence_percent": round(conf * 100, 2),
            "box": [round(v, 2) for v in box],
            "box_norm": box_norm,
            "hex": palette["hex"],
            "bgr": palette["bgr"]
        })

    # Sort detections by confidence descending
    detections.sort(key=lambda d: d["confidence"], reverse=True)

    # 1. Generate annotated image with bounding boxes
    annotated_img = draw_bounding_boxes(orig_img, detections)

    # 2. Generate Grad-CAM heatmaps
    cam_uint8, heatmap = generate_gradcam_heatmap(model, orig_img, target_layer_idx=22)

    # 3. Superimposed Grad-CAM on original image (60% X-ray + 40% CAM)
    superimposed = cv2.addWeighted(orig_img, 0.60, heatmap, 0.40, 0)

    # 4. Generate thumbnail (300x300 aspect-ratio preserved)
    scale = 300 / max(h, w)
    thumb_w, thumb_h = int(w * scale), int(h * scale)
    thumbnail = cv2.resize(orig_img, (thumb_w, thumb_h))

    # Save output artifacts
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    annotated_path = RESULTS_DIR / f"{scan_id}_annotated.jpg"
    gradcam_path = RESULTS_DIR / f"{scan_id}_gradcam.jpg"
    superimposed_path = RESULTS_DIR / f"{scan_id}_superimposed.jpg"
    thumbnail_path = RESULTS_DIR / f"{scan_id}_thumb.jpg"

    cv2.imwrite(str(annotated_path), annotated_img, [cv2.IMWRITE_JPEG_QUALITY, 92])
    cv2.imwrite(str(gradcam_path), heatmap, [cv2.IMWRITE_JPEG_QUALITY, 92])
    cv2.imwrite(str(superimposed_path), superimposed, [cv2.IMWRITE_JPEG_QUALITY, 92])
    cv2.imwrite(str(thumbnail_path), thumbnail, [cv2.IMWRITE_JPEG_QUALITY, 85])

    return {
        "scan_id": scan_id,
        "image_width": w,
        "image_height": h,
        "num_detections": len(detections),
        "detections": detections,
        "annotated_path": str(annotated_path),
        "gradcam_path": str(gradcam_path),
        "superimposed_path": str(superimposed_path),
        "thumbnail_path": str(thumbnail_path)
    }
