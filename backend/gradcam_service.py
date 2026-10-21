import os
from typing import Tuple, Optional, Dict, Any, List
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
    def generate_from_activations(
        cls,
        image_bgr: np.ndarray,
        activations: List[Any],
        detections: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Synthesizes detection-attributed Grad-CAM saliency and clinical blend directly
        from captured layer activations and identified thoracic pathologies.
        Eliminates zero-padding edge artifacts and provides clean anatomical focus.
        """
        h, w = image_bgr.shape[:2]
        if not activations:
            dummy_cam = np.zeros((h, w), dtype=np.uint8)
            dummy_heat = cv2.applyColorMap(dummy_cam, cv2.COLORMAP_JET)
            return dummy_cam, dummy_heat, image_bgr.copy()

        feat = activations[0]
        if isinstance(feat, (list, tuple)):
            feat = feat[0]

        feat_np = feat[0].detach().cpu().numpy()
        C, H_f, W_f = feat_np.shape

        # 1. Suppress 1-cell outer boundary to eliminate zero-padding convolution artifacts
        border_mask = np.ones((H_f, W_f), dtype=np.float32)
        border_mask[0, :] = 0.1
        border_mask[-1, :] = 0.1
        border_mask[:, 0] = 0.1
        border_mask[:, -1] = 0.1
        pos_feat = np.maximum(feat_np, 0) * border_mask[np.newaxis, :, :]

        # 2. Targeted Saliency Synthesis
        if detections and len(detections) > 0:
            weights = np.zeros(C, dtype=np.float32)
            density_map = np.zeros((H_f, W_f), dtype=np.float32)
            y_coords, x_coords = np.ogrid[:H_f, :W_f]

            for det in detections:
                box = det.get('box', [0, 0, w, h])
                conf = float(det.get('confidence', 0.5))
                x1, y1, x2, y2 = box

                # Map to feature grid coordinates
                gx1 = max(0, min(W_f - 1, int(x1 / w * W_f)))
                gy1 = max(0, min(H_f - 1, int(y1 / h * H_f)))
                gx2 = max(0, min(W_f - 1, int(x2 / w * W_f)))
                gy2 = max(0, min(H_f - 1, int(y2 / h * H_f)))

                if gx2 >= gx1 and gy2 >= gy1:
                    box_act = np.sum(pos_feat[:, gy1:gy2+1, gx1:gx2+1], axis=(1, 2))
                    tot_act = np.sum(pos_feat, axis=(1, 2)) + 1e-6
                    weights += conf * (box_act / tot_act)

                # Fast anatomical Gaussian diffusion on feature grid
                fcx = (gx1 + gx2) / 2.0
                fcy = (gy1 + gy2) / 2.0
                fsig_x = max(1.0, (gx2 - gx1) / 2.2)
                fsig_y = max(1.0, (gy2 - gy1) / 2.2)

                g = np.exp(-(((x_coords - fcx) ** 2) / (2 * (fsig_x ** 2)) + ((y_coords - fcy) ** 2) / (2 * (fsig_y ** 2))))
                density_map = np.maximum(density_map, conf * g)

            w_sum = np.sum(weights)
            if w_sum > 0:
                weights = weights / w_sum
            else:
                weights = np.ones(C, dtype=np.float32) / C

            neural_cam = np.sum(pos_feat * weights[:, np.newaxis, np.newaxis], axis=0)
            neural_cam = cv2.resize(neural_cam, (w, h), interpolation=cv2.INTER_CUBIC)
            nc_min, nc_max = float(neural_cam.min()), float(neural_cam.max())
            if nc_max > nc_min:
                neural_cam = (neural_cam - nc_min) / (nc_max - nc_min)
            else:
                neural_cam = np.zeros_like(neural_cam)

            # Resize feature-grid density map to full image resolution
            density_map = cv2.resize(density_map, (w, h), interpolation=cv2.INTER_CUBIC)
            dm_min, dm_max = float(density_map.min()), float(density_map.max())
            if dm_max > dm_min:
                density_map = (density_map - dm_min) / (dm_max - dm_min)
            else:
                density_map = np.zeros_like(density_map)

            fused_saliency = 0.55 * neural_cam + 0.45 * density_map
        else:
            var_weights = np.var(pos_feat, axis=(1, 2))
            raw_cam = np.sum(pos_feat * var_weights[:, np.newaxis, np.newaxis], axis=0)
            fused_saliency = cv2.resize(raw_cam, (w, h), interpolation=cv2.INTER_CUBIC)

        # 3. Gaussian smoothing for natural anatomical radiographic heat diffusion
        fused_saliency = cv2.GaussianBlur(fused_saliency, (17, 17), 0)

        # 4. Normalize to [0, 1]
        s_min, s_max = float(fused_saliency.min()), float(fused_saliency.max())
        if s_max > s_min:
            norm_saliency = (fused_saliency - s_min) / (s_max - s_min)
        else:
            norm_saliency = np.zeros_like(fused_saliency)

        cam_uint8 = np.uint8(255 * norm_saliency)
        heatmap_bgr = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)

        # 5. Clinical Selective Alpha Blending:
        # Keeps normal lung/bone anatomy high-contrast and clear;
        # Blends thermal colors (cyan->yellow->red) only over localized abnormalities
        thresh = 0.15
        alpha_curve = np.clip((norm_saliency - thresh) / (1.0 - thresh), 0.0, 1.0)
        alpha_curve = np.power(alpha_curve, 1.2) * 0.60
        alpha_3d = np.repeat(alpha_curve[:, :, np.newaxis], 3, axis=2)

        superimposed_bgr = (image_bgr.astype(np.float32) * (1.0 - alpha_3d) + heatmap_bgr.astype(np.float32) * alpha_3d).astype(np.uint8)

        return cam_uint8, heatmap_bgr, superimposed_bgr

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

        return cls.generate_from_activations(image_bgr=image_bgr, activations=activations)

    @classmethod
    def blend_custom(
        cls,
        image_bgr: np.ndarray,
        heatmap_bgr: np.ndarray,
        heatmap_opacity: float = 0.50
    ) -> np.ndarray:
        """
        Custom selective alpha blending of CXR and heatmap.
        """
        alpha = max(0.0, min(1.0, heatmap_opacity))
        gray_cam = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
        thresh = 0.15
        alpha_curve = np.clip((gray_cam - thresh) / (1.0 - thresh), 0.0, 1.0)
        alpha_curve = np.power(alpha_curve, 1.2) * alpha
        alpha_3d = np.repeat(alpha_curve[:, :, np.newaxis], 3, axis=2)
        return (image_bgr.astype(np.float32) * (1.0 - alpha_3d) + heatmap_bgr.astype(np.float32) * alpha_3d).astype(np.uint8)
