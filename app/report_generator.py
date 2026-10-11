from datetime import datetime
from typing import Dict, Any, List
from app.config import PATHOLOGY_METADATA

def generate_clinical_report(
    scan_id: str,
    patient_info: Dict[str, Any],
    detections: List[Dict[str, Any]],
    image_dim: Dict[str, int]
) -> Dict[str, Any]:
    """
    Generates both structured JSON and clinical text matching the CliniScan AI
    radiological report format.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    patient_id = patient_info.get("patient_id", f"CXR-{scan_id[:6].upper()}")
    patient_age = patient_info.get("age", "Unspecified")
    patient_gender = patient_info.get("gender", "Unspecified")
    clinical_indication = patient_info.get("indication", "Routine screening / Abnormality localization")

    # Generate Impression
    if not detections:
        impression = "No acute cardiopulmonary abnormalities detected above current confidence threshold. Normal cardiac silhouette and clear pulmonary fields."
        overall_severity = "Normal"
    else:
        unique_findings = []
        for d in detections:
            if d["class_name"] not in unique_findings:
                unique_findings.append(d["class_name"])
        impression = f"Radiographic findings suspicious for {', '.join(unique_findings)}. Correlation with clinical symptomatology and dedicated radiological review is advised."
        
        has_critical = any(d["class_name"] in ["Pneumothorax", "Cardiomegaly", "Consolidation"] for d in detections)
        overall_severity = "Critical / Priority" if has_critical else "Abnormal"

    # Per-finding clinical descriptions
    detailed_findings = []
    for idx, d in enumerate(detections, 1):
        class_name = d["class_name"]
        conf_pct = d["confidence_percent"]
        box = [int(v) for v in d["box"]]
        meta = PATHOLOGY_METADATA.get(class_name, {
            "finding": f"Visual features associated with {class_name}.",
            "anatomical_zone": "Thoracic Cavity",
            "severity": "Moderate",
            "urgency": "Routine",
            "xai_explanation": f"Grad-CAM highlights regions corresponding to predicted {class_name}.",
            "recommendation": "Clinical correlation and follow-up imaging recommended."
        })

        detailed_findings.append({
            "index": idx,
            "class_name": class_name,
            "confidence": d["confidence"],
            "confidence_percent": conf_pct,
            "box": box,
            "finding": meta["finding"],
            "anatomical_zone": meta["anatomical_zone"],
            "severity": meta["severity"],
            "urgency": meta["urgency"],
            "xai_explanation": meta["xai_explanation"],
            "recommendation": meta["recommendation"],
            "interpretation_note": "The prediction requires clinical and radiological confirmation."
        })

    # Assemble Clinical Text Report (Matches CliniScan_AI_Report.txt)
    lines = []
    lines.append("CLINISCAN AI — X-RAY ANALYSIS REPORT")
    lines.append("=" * 60)
    lines.append(f"Generated: {timestamp}")
    lines.append(f"Patient ID: {patient_id} | Age: {patient_age} | Gender: {patient_gender}")
    lines.append(f"Study ID: {scan_id}")
    lines.append(f"Indication: {clinical_indication}")
    lines.append(f"Dimensions: {image_dim.get('width', 640)}x{image_dim.get('height', 640)} px | Model: YOLO11n")
    lines.append("")
    lines.append("CLINICAL IMPRESSION")
    lines.append("-" * 60)
    lines.append(impression)
    lines.append("")
    lines.append("DETECTED ABNORMALITIES")
    lines.append("-" * 60)

    if not detailed_findings:
        lines.append("No focal abnormalities identified above confidence threshold.")
        lines.append("")
    else:
        for f in detailed_findings:
            lines.append(f"{f['index']}. {f['class_name']}")
            lines.append(f"Confidence: {f['confidence_percent']:.2f}%")
            lines.append(f"Bounding Box: {f['box']}")
            lines.append(f"Anatomical Zone: {f['anatomical_zone']} | Severity: {f['severity']}")
            lines.append("")
            lines.append("Finding:")
            lines.append(f.get('finding', ''))
            lines.append("")
            lines.append("XAI Explanation:")
            lines.append(f.get('xai_explanation', ''))
            lines.append("")
            lines.append("Interpretation Note:")
            lines.append(f.get('interpretation_note', ''))
            lines.append("")
            lines.append("Recommendation:")
            lines.append(f.get('recommendation', ''))
            lines.append("-" * 40)
            lines.append("")

    lines.append("=" * 60)
    lines.append("XAI SUMMARY")
    lines.append("-" * 60)
    lines.append(
        "Grad-CAM is used to visualize image regions that contributed to the model's predictions. "
        "The highlighted regions provide visual evidence for interpreting the model output."
    )
    lines.append("")
    lines.append("IMPORTANT DISCLAIMER")
    lines.append("-" * 60)
    lines.append(
        "This report is generated by an AI research system. The predictions and explanations are "
        "not clinically validated and must not be considered a medical diagnosis."
    )

    report_text = "\n".join(lines)

    return {
        "scan_id": scan_id,
        "timestamp": timestamp,
        "patient_id": patient_id,
        "patient_age": patient_age,
        "patient_gender": patient_gender,
        "clinical_indication": clinical_indication,
        "impression": impression,
        "overall_severity": overall_severity,
        "findings": detailed_findings,
        "report_text": report_text
    }
