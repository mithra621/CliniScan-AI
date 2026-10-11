import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

from backend.config import DB_PATH

class HistoryService:
    """
    Persistent Prediction and Report History Service using SQLite.
    Stores metadata for audited chest radiographs and generated clinical reports.
    """

    @classmethod
    def get_connection(cls):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn

    @classmethod
    def init_db(cls):
        conn = cls.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            filename TEXT NOT NULL,
            patient_id TEXT,
            patient_age TEXT,
            patient_gender TEXT,
            patient_notes TEXT,
            conf_threshold REAL,
            iou_threshold REAL,
            num_detections INTEGER,
            detections_json TEXT,
            findings_summary TEXT,
            max_confidence REAL,
            has_critical INTEGER,
            original_image_path TEXT,
            annotated_image_path TEXT,
            gradcam_image_path TEXT,
            superimposed_image_path TEXT,
            thumbnail_path TEXT,
            report_text TEXT,
            pdf_path TEXT
        )
        """)
        conn.commit()
        conn.close()

    @classmethod
    def save_scan(cls, scan_data: Dict[str, Any]) -> str:
        conn = cls.get_connection()
        cursor = conn.cursor()

        detections = scan_data.get("detections", [])
        detections_json = json.dumps(detections)
        findings = [d["class_name"] for d in detections]
        findings_summary = ", ".join(sorted(list(set(findings)))) if findings else "No abnormalities detected"

        max_conf = 0.0
        has_critical = 0
        critical_classes = {"Pneumothorax", "Cardiomegaly", "Consolidation", "ILD"}
        for d in detections:
            conf = float(d.get("confidence", 0.0))
            if conf > max_conf:
                max_conf = conf
            if d.get("class_name") in critical_classes:
                has_critical = 1

        scan_id = scan_data.get("id")
        created_at = scan_data.get("created_at") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
        INSERT OR REPLACE INTO scans (
            id, created_at, filename, patient_id, patient_age, patient_gender, patient_notes,
            conf_threshold, iou_threshold, num_detections, detections_json, findings_summary,
            max_confidence, has_critical, original_image_path, annotated_image_path,
            gradcam_image_path, superimposed_image_path, thumbnail_path, report_text, pdf_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            scan_id,
            created_at,
            scan_data.get("filename", "unknown.png"),
            scan_data.get("patient_id", ""),
            str(scan_data.get("patient_age", "")),
            scan_data.get("patient_gender", ""),
            scan_data.get("patient_notes", ""),
            scan_data.get("conf_threshold", 0.25),
            scan_data.get("iou_threshold", 0.45),
            len(detections),
            detections_json,
            findings_summary,
            round(max_conf, 4),
            has_critical,
            scan_data.get("original_image_path", ""),
            scan_data.get("annotated_image_path", ""),
            scan_data.get("gradcam_image_path", ""),
            scan_data.get("superimposed_image_path", ""),
            scan_data.get("thumbnail_path", ""),
            scan_data.get("report_text", ""),
            scan_data.get("pdf_path", "")
        ))

        conn.commit()
        conn.close()
        return scan_id

    @classmethod
    def get_scans(cls, limit: int = 50, search: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = cls.get_connection()
        cursor = conn.cursor()

        if search:
            query = """
            SELECT * FROM scans 
            WHERE patient_id LIKE ? OR filename LIKE ? OR findings_summary LIKE ?
            ORDER BY created_at DESC LIMIT ?
            """
            s = f"%{search}%"
            cursor.execute(query, (s, s, s, limit))
        else:
            query = "SELECT * FROM scans ORDER BY created_at DESC LIMIT ?"
            cursor.execute(query, (limit,))

        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            try:
                d["detections"] = json.loads(d["detections_json"])
            except Exception:
                d["detections"] = []
            del d["detections_json"]
            result.append(d)

        conn.close()
        return result

    @classmethod
    def get_scan_by_id(cls, scan_id: str) -> Optional[Dict[str, Any]]:
        conn = cls.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM scans WHERE id = ?", (scan_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None
        d = dict(row)
        try:
            d["detections"] = json.loads(d["detections_json"])
        except Exception:
            d["detections"] = []
        del d["detections_json"]
        return d

    @classmethod
    def delete_scan(cls, scan_id: str) -> bool:
        conn = cls.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    @classmethod
    def get_stats(cls) -> Dict[str, Any]:
        conn = cls.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM scans")
        total_scans = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM scans WHERE num_detections > 0")
        positive_scans = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM scans WHERE has_critical = 1")
        critical_scans = cursor.fetchone()[0]

        cursor.execute("SELECT AVG(num_detections) FROM scans")
        avg_detections = cursor.fetchone()[0] or 0.0

        conn.close()
        return {
            "total_scans": total_scans,
            "positive_scans": positive_scans,
            "negative_scans": total_scans - positive_scans,
            "critical_scans": critical_scans,
            "avg_detections": round(avg_detections, 2)
        }
