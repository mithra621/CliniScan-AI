import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "data" / "cliniscan.db"

def inspect_database():
    if not DB_PATH.exists():
        print(f"Database file not found at: {DB_PATH}")
        return

    print("=" * 80)
    print("                CLINISCAN AI — SQLITE DATABASE AUDIT VIEWER")
    print("=" * 80)
    print(f"Database Location: {DB_PATH}")
    
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get table info
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"Tables in Database: {', '.join(tables)}")
    print("-" * 80)

    # Fetch rows from scans table
    cursor.execute("SELECT * FROM scans ORDER BY created_at DESC;")
    rows = cursor.fetchall()
    print(f"Total Scans Recorded: {len(rows)}\n")

    if not rows:
        print("No scan records found in database yet.")
        conn.close()
        return

    # Print summary table
    print(f"{'#':<3} | {'Timestamp':<19} | {'Patient ID':<14} | {'Detections':<10} | {'Findings':<30}")
    print("-" * 85)

    for idx, row in enumerate(rows, 1):
        pid = row["patient_id"] or row["id"][:8]
        ts = row["created_at"]
        num = row["num_detections"]
        summary = row["findings_summary"] or "None"
        if len(summary) > 28:
            summary = summary[:25] + "..."
        print(f"{idx:<3} | {ts:<19} | {pid:<14} | {num:<10} | {summary:<30}")

    print("\n" + "=" * 80)
    print("LATEST SCAN DETAILED RECORD:")
    print("=" * 80)
    latest = rows[0]
    for key in latest.keys():
        val = latest[key]
        if key == "detections_json":
            try:
                dets = json.loads(val)
                print(f"  {key:<24}: {len(dets)} detected objects:")
                for d in dets:
                    print(f"     -> {d.get('class_name')} ({d.get('confidence_percent')}%) | Box: {d.get('box')}")
                continue
            except Exception:
                pass
        if key == "report_text":
            print(f"  {key:<24}: [Report Text stored — {len(str(val))} characters]")
            continue
        print(f"  {key:<24}: {val}")

    conn.close()
    print("=" * 80)

if __name__ == "__main__":
    inspect_database()
