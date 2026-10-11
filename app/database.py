import sqlite3
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config import DB_PATH

def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
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

def save_scan(scan_data: Dict[str, Any]) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    
    detections_json = json.dumps(scan_data.get("detections", []))
    findings = [d["class_name"] for d in scan_data.get("detections", [])]
    findings_summary = ", ".join(sorted(list(set(findings)))) if findings else "No abnormalities detected"
    
    max_conf = 0.0
    has_critical = 0
    critical_classes = {"Pneumothorax", "Cardiomegaly", "Consolidation"}
    for d in scan_data.get("detections", []):
        conf = float(d.get("confidence", 0.0))
        if conf > max_conf:
            max_conf = conf
        if d.get("class_name") in critical_classes:
            has_critical = 1

    cursor.execute("""
    INSERT OR REPLACE INTO scans (
        id, created_at, filename, patient_id, patient_age, patient_gender, patient_notes,
        conf_threshold, iou_threshold, num_detections, detections_json, findings_summary,
        max_confidence, has_critical, original_image_path, annotated_image_path,
        gradcam_image_path, superimposed_image_path, thumbnail_path, report_text, pdf_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        scan_data["id"],
        scan_data.get("created_at", datetime.now().isoformat()),
        scan_data.get("filename", "unknown.png"),
        scan_data.get("patient_id", f"CXR-{scan_data['id'][:6].upper()}"),
        scan_data.get("patient_age", "N/A"),
        scan_data.get("patient_gender", "N/A"),
        scan_data.get("patient_notes", ""),
        float(scan_data.get("conf_threshold", 0.25)),
        float(scan_data.get("iou_threshold", 0.45)),
        int(len(scan_data.get("detections", []))),
        detections_json,
        findings_summary,
        max_conf,
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
    return scan_data["id"]

def get_scans(limit: int = 50, offset: int = 0, search: str = "") -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if search:
        query = """
        SELECT * FROM scans 
        WHERE patient_id LIKE ? OR findings_summary LIKE ? OR filename LIKE ?
        ORDER BY created_at DESC LIMIT ? OFFSET ?
        """
        pattern = f"%{search}%"
        cursor.execute(query, (pattern, pattern, pattern, limit, offset))
    else:
        cursor.execute("SELECT * FROM scans ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, offset))
        
    rows = cursor.fetchall()
    scans = []
    for r in rows:
        d = dict(r)
        try:
            d["detections"] = json.loads(d["detections_json"])
        except Exception:
            d["detections"] = []
        scans.append(d)
    conn.close()
    return scans

def get_scan_by_id(scan_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scans WHERE id = ?", (scan_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    d = dict(row)
    try:
        d["detections"] = json.loads(d["detections_json"])
    except Exception:
        d["detections"] = []
    conn.close()
    return d

def delete_scan(scan_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_stats() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM scans")
    total_scans = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM scans WHERE num_detections > 0")
    abnormal_scans = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM scans WHERE has_critical = 1")
    critical_scans = cursor.fetchone()[0]
    
    cursor.execute("SELECT detections_json FROM scans")
    all_det_rows = cursor.fetchall()
    
    pathology_counts = {}
    for r in all_det_rows:
        try:
            dets = json.loads(r[0])
            for d in dets:
                name = d.get("class_name", "Unknown")
                pathology_counts[name] = pathology_counts.get(name, 0) + 1
        except Exception:
            pass
            
    conn.close()
    return {
        "total_scans": total_scans,
        "abnormal_scans": abnormal_scans,
        "normal_scans": total_scans - abnormal_scans,
        "critical_scans": critical_scans,
        "pathology_breakdown": pathology_counts
    }
