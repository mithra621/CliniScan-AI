import os
from typing import Tuple, Optional, Dict, Any
import cv2
import numpy as np
import torch
from ultralytics import YOLO

from backend.model_service import ModelService

class GradCAMService:
    """
    Explainable AI (Grad-CAM / Feature Saliency) Service for CliniScan AI.
    Extracts deep activations from YOLO11n neck layer (Layer 22 / C3k2) to visualize
    spatial attention maps corresponding to thoracic abnormalities.
    """
    TARGET_LAYER_IDX = 22

    @classmethod
    def generate_heatmap(
        cls,
        image_bgr: np.ndarray,
        model: Optional[YOLO] = None,
        target_layer_idx: int = 22
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Generates Grad-CAM / feature saliency heatmap and superimposed image.
        Returns:
            cam_uint8: (H, W) grayscale saliency map [0-255]
            heatmap_bgr: (H, W, 3) Jet colormapped heatmap
            superimposed_bgr: (H, W, 3) 60% CXR + 40% Heatmap blend
        """
        h, w = image_bgr.shape[:2]
        if model is None:
            model = ModelService.get_model()

        torch_model = model.model
        torch_model.eval()

        activations = []
        def hook_fn(module, inp, out):
            activations.append(out)

        # Attempt to hook into the specified target layer
        try:
            target_layer = torch_model.model[target_layer_idx]
            hook = target_layer.register_forward_hook(hook_fn)
        except Exception as e:
            print(f"[GradCAMService Warning] Failed to hook layer {target_layer_idx}: {e}")
            # Fallback to layer len - 2
            fallback_idx = max(0, len(torch_model.model) - 2)
            target_layer = torch_model.model[fallback_idx]
            hook = target_layer.register_forward_hook(hook_fn)

        # Preprocess input image to 640x640 tensor
        resized = cv2.resize(image_bgr, (640, 640))
        tensor = torch.from_numpy(resized).permute(2, 0, 1).float().unsqueeze(0) / 255.0
        
        # Match device
        device = next(torch_model.parameters()).device
        tensor = tensor.to(device)

        with torch.no_grad():
            try:
                _ = torch_model(tensor)
            except Exception as e:
                print(f"[GradCAMService Error] Forward pass during CAM generation failed: {e}")
            finally:
                hook.remove()

        if not activations:
            print("[GradCAMService Warning] No activations captured from target layer.")
            dummy_cam = np.zeros((h, w), dtype=np.uint8)
            dummy_heat = cv2.applyColorMap(dummy_cam, cv2.COLORMAP_JET)
            return dummy_cam, dummy_heat, image_bgr.copy()

        feat = activations[0]
        if isinstance(feat, (list, tuple)):
            feat = feat[0]

        feat_np = feat[0].detach().cpu().numpy() # [C, H, W]

        # Compute spatial saliency via positive channel activation energy
        cam = np.mean(np.maximum(feat_np, 0), axis=0)
        cam = cv2.resize(cam, (w, h), interpolation=cv2.INTER_LINEAR)

        # Normalize to [0, 1]
        c_min, c_max = float(cam.min()), float(cam.max())
        if c_max > c_min:
            cam_norm = (cam - c_min) / (c_max - c_min)
        else:
            cam_norm = np.zeros_like(cam)

        cam_uint8 = np.uint8(255 * cam_norm)
        heatmap_bgr = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)

        # Create blended superimposed view: 60% original image + 40% heatmap
        superimposed_bgr = cv2.addWeighted(image_bgr, 0.60, heatmap_bgr, 0.40, 0)

        return cam_uint8, heatmap_bgr, superimposed_bgr

    @classmethod
    def blend_custom(
        cls,
        image_bgr: np.ndarray,
        heatmap_bgr: np.ndarray,
        heatmap_opacity: float = 0.50
    ) -> np.ndarray:
        """
        Custom alpha blending of CXR and heatmap.
        """
        alpha = max(0.0, min(1.0, heatmap_opacity))
        beta = 1.0 - alpha
        return cv2.addWeighted(image_bgr, beta, heatmap_bgr, alpha, 0)
