import csv
from pathlib import Path
from typing import Dict, Any, List, Optional

from backend.config import ARTIFACTS_DIR, VERIFIED_METRICS, DATASET_STATS, CLASSES

class EvaluationService:
    """
    Model Evaluation & Benchmark Service for CliniScan AI.
    Loads verified metrics, per-class evaluation data, and training loss progression.
    """

    @classmethod
    def get_overall_metrics(cls) -> Dict[str, Any]:
        """
        Returns verified validation metrics and dataset information.
        """
        metrics_file = ARTIFACTS_DIR / "metrics.txt"
        metrics_data = dict(VERIFIED_METRICS)

        if metrics_file.exists():
            try:
                with open(metrics_file, "r") as f:
                    for line in f:
                        line = line.strip()
                        if ":" in line:
                            parts = line.rsplit(":", 1)
                            k = parts[0].strip().lower()
                            v = parts[1].strip()
                            if "precision" in k:
                                metrics_data["precision"] = float(v)
                                metrics_data["precision_percent"] = round(float(v) * 100, 2)
                            elif "recall" in k:
                                metrics_data["recall"] = float(v)
                                metrics_data["recall_percent"] = round(float(v) * 100, 2)
                            elif "map@0.5:0.95" in k or "map50-95" in k:
                                metrics_data["map50_95"] = float(v)
                                metrics_data["map50_95_percent"] = round(float(v) * 100, 2)
                            elif "map@0.5" in k or "map50" in k:
                                metrics_data["map50"] = float(v)
                                metrics_data["map50_percent"] = round(float(v) * 100, 2)
            except Exception as e:
                print(f"[EvaluationService] Note reading metrics.txt: {e}")

        return {
            "metrics": metrics_data,
            "dataset": DATASET_STATS,
            "classes": CLASSES
        }

    @classmethod
    def get_per_class_metrics(cls) -> List[Dict[str, Any]]:
        """
        Parses per_class_metrics.txt to extract AP@0.5 and AP@0.5:0.95 for all 14 classes.
        """
        per_class_file = ARTIFACTS_DIR / "per_class_metrics.txt"
        results = []

        if not per_class_file.exists():
            return []

        try:
            with open(per_class_file, "r") as f:
                content = f.read()

            current_class = None
            ap50 = 0.0
            ap50_95 = 0.0

            for line in content.split("\n"):
                line = line.strip()
                if not line or line.startswith("=") or "CLINISCAN AI" in line:
                    continue

                if "AP@0.5:0.95" in line:
                    parts = line.rsplit(":", 1)
                    if len(parts) == 2:
                        ap50_95 = float(parts[1].strip())
                        if current_class:
                            results.append({
                                "class_name": current_class,
                                "ap50": round(ap50, 4),
                                "ap50_percent": round(ap50 * 100, 2),
                                "ap50_95": round(ap50_95, 4),
                                "ap50_95_percent": round(ap50_95 * 100, 2)
                            })
                            current_class = None
                elif "AP@0.5" in line:
                    parts = line.rsplit(":", 1)
                    if len(parts) == 2:
                        ap50 = float(parts[1].strip())
                else:
                    # Class header line
                    current_class = line

        except Exception as e:
            print(f"[EvaluationService Error] Parsing per_class_metrics.txt failed: {e}")

        return results

    @classmethod
    def get_training_history(cls) -> List[Dict[str, Any]]:
        """
        Parses results.csv to return 50-epoch training progression for Loss & mAP charts.
        """
        csv_file = ARTIFACTS_DIR / "results.csv"
        history = []

        if not csv_file.exists():
            return history

        try:
            with open(csv_file, "r") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Clean strip column keys
                    clean_row = {k.strip(): v.strip() for k, v in row.items()}
                    try:
                        epoch = int(clean_row.get("epoch", 0))
                        box_loss = float(clean_row.get("train/box_loss", 0.0))
                        cls_loss = float(clean_row.get("train/cls_loss", 0.0))
                        val_box_loss = float(clean_row.get("val/box_loss", 0.0))
                        val_cls_loss = float(clean_row.get("val/cls_loss", 0.0))
                        precision = float(clean_row.get("metrics/precision(B)", 0.0))
                        recall = float(clean_row.get("metrics/recall(B)", 0.0))
                        map50 = float(clean_row.get("metrics/mAP50(B)", 0.0))
                        map50_95 = float(clean_row.get("metrics/mAP50-95(B)", 0.0))

                        history.append({
                            "epoch": epoch,
                            "train_box_loss": round(box_loss, 4),
                            "train_cls_loss": round(cls_loss, 4),
                            "val_box_loss": round(val_box_loss, 4),
                            "val_cls_loss": round(val_cls_loss, 4),
                            "precision": round(precision, 4),
                            "recall": round(recall, 4),
                            "map50": round(map50, 4),
                            "map50_95": round(map50_95, 4)
                        })
                    except (ValueError, TypeError):
                        continue
        except Exception as e:
            print(f"[EvaluationService Error] Reading results.csv failed: {e}")

        return history

    @classmethod
    def get_artifact_images(cls) -> List[Dict[str, str]]:
        """
        Returns list of evaluation curves and confusion matrices stored in backend/artifacts/.
        """
        artifacts = [
            {"id": "confusion_matrix_normalized", "title": "Normalized Confusion Matrix", "filename": "confusion_matrix_normalized.png", "type": "matrix"},
            {"id": "confusion_matrix", "title": "Raw Confusion Matrix", "filename": "confusion_matrix.png", "type": "matrix"},
            {"id": "box_pr_curve", "title": "Precision-Recall (PR) Curve", "filename": "BoxPR_curve.png", "type": "curve"},
            {"id": "box_f1_curve", "title": "F1-Confidence Curve", "filename": "BoxF1_curve.png", "type": "curve"},
            {"id": "box_p_curve", "title": "Precision-Confidence Curve", "filename": "BoxP_curve.png", "type": "curve"},
            {"id": "box_r_curve", "title": "Recall-Confidence Curve", "filename": "BoxR_curve.png", "type": "curve"},
            {"id": "val_batch0_pred", "title": "Validation Predictions Batch 0", "filename": "val_batch0_pred.jpg", "type": "batch"},
            {"id": "val_batch1_pred", "title": "Validation Predictions Batch 1", "filename": "val_batch1_pred.jpg", "type": "batch"},
            {"id": "val_batch2_pred", "title": "Validation Predictions Batch 2", "filename": "val_batch2_pred.jpg", "type": "batch"},
        ]

        # Verify existence
        available = []
        for art in artifacts:
            if (ARTIFACTS_DIR / art["filename"]).exists():
                art["url"] = f"/artifacts/{art['filename']}"
                available.append(art)

        return available
