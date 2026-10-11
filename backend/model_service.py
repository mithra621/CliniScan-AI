import os
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import cv2
import numpy as np
import torch
from ultralytics import YOLO

from backend.config import MODEL_PATH, CLASSES, CLASS_PALETTE

class ModelService:
    """
    Singleton YOLO11n Model Service for CliniScan AI.
    Loads the trained model once at startup and performs bounding box detection.
    """
    _instance: Optional["ModelService"] = None
    _model: Optional[YOLO] = None
    _model_path: Optional[Path] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelService, cls).__new__(cls)
        return cls._instance

    @classmethod
    def get_model_path(cls) -> Path:
        return Path(MODEL_PATH).resolve()

    @classmethod
    def is_model_available(cls) -> bool:
        path = cls.get_model_path()
        return path.exists() and path.is_file()

    @classmethod
    def load_model(cls) -> YOLO:
        if cls._model is None:
            model_path = cls.get_model_path()
            if not model_path.exists():
                raise FileNotFoundError(
                    f"Model checkpoint not found at: '{model_path}'. "
                    f"Please place your trained YOLO11n weights file 'best.pt' in the "
                    f"'backend/models/' folder before starting inference."
                )
            print(f"[ModelService] Loading trained YOLO11n checkpoint from: {model_path}")
            cls._model = YOLO(str(model_path))
            cls._model.model.eval()
            cls._model_path = model_path
            
            # Verify class count and names
            model_names = cls._model.names
            print(f"[ModelService] Model successfully initialized with {len(model_names)} classes.")
            
            # Verify class alignment
            for idx, expected_name in enumerate(CLASSES):
                actual_name = model_names.get(idx)
                if actual_name != expected_name:
                    print(f"[ModelService Note] Class index {idx}: expected '{expected_name}', got '{actual_name}'")
                    
        return cls._model

    @classmethod
    def get_model(cls) -> YOLO:
        if cls._model is None:
            return cls.load_model()
        return cls._model

    @classmethod
    def draw_annotations(
        cls,
        image_bgr: np.ndarray,
        detections: List[Dict[str, Any]]
    ) -> np.ndarray:
        """
        Renders bounding boxes and label badges onto a copy of the image.
        """
        annotated = image_bgr.copy()
        h, w = image_bgr.shape[:2]

        if not detections:
            return annotated

        # Soft overlay for bounding box interiors
        overlay = annotated.copy()
        for det in detections:
            x1, y1, x2, y2 = [int(v) for v in det["box"]]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            color_bgr = det.get("bgr", (38, 38, 220))
            cv2.rectangle(overlay, (x1, y1), (x2, y2), color_bgr, -1)

        # Blend with 12% opacity
        cv2.addWeighted(overlay, 0.12, annotated, 0.88, 0, annotated)

        # Draw borders and badges
        for det in detections:
            x1, y1, x2, y2 = [int(v) for v in det["box"]]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            color_bgr = det.get("bgr", (38, 38, 220))
            label = f"{det['class_name']} {det['confidence_percent']:.1f}%"

            # 2px crisp border
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color_bgr, 2)

            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.48
            thickness = 1
            (tw, th), baseline = cv2.getTextSize(label, font, font_scale, thickness)

            badge_y1 = max(0, y1 - th - 8)
            badge_y2 = y1
            badge_x2 = min(w, x1 + tw + 10)

            # Badge background
            cv2.rectangle(annotated, (x1, badge_y1), (badge_x2, badge_y2), color_bgr, -1)
            # Badge text
            cv2.putText(
                annotated,
                label,
                (x1 + 5, badge_y2 - 4),
                font,
                font_scale,
                (255, 255, 255),
                thickness,
                cv2.LINE_AA
            )

        return annotated

    @classmethod
    def predict(
        cls,
        image_bgr: np.ndarray,
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45
    ) -> Tuple[List[Dict[str, Any]], np.ndarray]:
        """
        Runs YOLO11n prediction on input BGR image at 640x640 resolution.
        Returns: (detections_list, annotated_image_bgr)
        """
        model = cls.get_model()
        h, w = image_bgr.shape[:2]

        results = model.predict(
            image_bgr,
            conf=conf_threshold,
            iou=iou_threshold,
            imgsz=640,
            verbose=False
        )

        detections = []
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            class_name = model.names.get(cls_id, f"Class {cls_id}")
            conf = float(box.conf[0])
            coords = box.xyxy[0].cpu().numpy().tolist() # [x1, y1, x2, y2]
            
            palette = CLASS_PALETTE.get(class_name, {"hex": "#3B82F6", "bgr": (246, 130, 59)})

            box_norm = [
                round(coords[0] / w, 4),
                round(coords[1] / h, 4),
                round(coords[2] / w, 4),
                round(coords[3] / h, 4)
            ]

            detections.append({
                "class_id": cls_id,
                "class_name": class_name,
                "confidence": round(conf, 4),
                "confidence_percent": round(conf * 100, 2),
                "box": [round(c, 2) for c in coords],
                "box_norm": box_norm,
                "hex": palette["hex"],
                "bgr": palette["bgr"]
            })

        # Rank descending by confidence
        detections.sort(key=lambda d: d["confidence"], reverse=True)

        annotated_bgr = cls.draw_annotations(image_bgr, detections)
        return detections, annotated_bgr
