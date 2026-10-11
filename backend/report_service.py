import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import cv2

from backend.config import PATHOLOGY_METADATA, REPORTS_DIR

# ReportLab imports
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class ReportService:
    """
    Clinical-Grade Radiological Report Generation Service for CliniScan AI.
    Produces structured narrative text reports and downloadable PDF documents.
    """

    @classmethod
    def generate_clinical_text(
        cls,
        analysis_id: str,
        patient_info: Dict[str, Any],
        detections: List[Dict[str, Any]],
        image_meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes structured clinical radiology narrative from detection results.
        """
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        patient_id = patient_info.get("patient_id") or f"PT-{analysis_id[:8].upper()}"
        age = patient_info.get("age", "N/A")
        gender = patient_info.get("gender", "Unspecified")
        indication = patient_info.get("indication", "Routine Thoracic Radiographic Evaluation")

        dim_str = "640x640 px"
        if image_meta:
            dim_str = f"{image_meta.get('width', 640)}x{image_meta.get('height', 640)} px"

        # Group and synthesize findings
        findings_list = []
        abnormality_names = []

        if detections:
            for i, det in enumerate(detections, 1):
                name = det["class_name"]
                conf_pct = det["confidence_percent"]
                box = det["box"]
                meta = PATHOLOGY_METADATA.get(name, {
                    "finding": f"Visual features compatible with {name}.",
                    "anatomical_zone": "Thoracic Cavity",
                    "severity": "Moderate",
                    "urgency": "Routine",
                    "xai_explanation": "Grad-CAM highlights localized attention corresponding to the abnormality.",
                    "recommendation": "Radiological follow-up and clinical correlation advised."
                })

                findings_list.append({
                    "index": i,
                    "class_name": name,
                    "confidence_percent": conf_pct,
                    "box": box,
                    "box_str": f"[{box[0]:.0f}, {box[1]:.0f}, {box[2]:.0f}, {box[3]:.0f}]",
                    "anatomical_zone": meta["anatomical_zone"],
                    "severity": meta["severity"],
                    "urgency": meta["urgency"],
                    "finding_text": meta["finding"],
                    "xai_text": meta["xai_explanation"],
                    "recommendation": meta["recommendation"]
                })
                if name not in abnormality_names:
                    abnormality_names.append(name)

            impression = (
                f"Radiographic findings suspicious for {', '.join(abnormality_names)}. "
                f"Computer-aided bounding box detections indicate localized pathological features. "
                f"Correlation with clinical symptomatology and dedicated specialist radiological review is recommended."
            )
        else:
            impression = (
                "No thoracic abnormalities detected above the specified confidence threshold. "
                "Normal radiographic pulmonary markings and cardiothoracic contours observed within detection sensitivity limits."
            )

        # Build formatted narrative report string
        lines = [
            "=" * 64,
            "CLINISCAN AI — RADIOLOGICAL AUDIT & ANALYSIS REPORT",
            "=" * 64,
            f"Report ID: CLINI-{analysis_id[:12].upper()}",
            f"Generated: {now_str}",
            f"Patient ID: {patient_id} | Age: {age} | Gender: {gender}",
            f"Clinical Indication: {indication}",
            f"Image Geometry: {dim_str} | Architecture: YOLO11n (14 thoracic classes)",
            "-" * 64,
            "",
            "CLINICAL IMPRESSION",
            "-" * 64,
            impression,
            "",
            "DETAILED RADIOLOGICAL FINDINGS & LOCALIZATION",
            "-" * 64,
        ]

        if findings_list:
            for f in findings_list:
                lines.extend([
                    f"{f['index']}. {f['class_name']} — Confidence: {f['confidence_percent']:.1f}%",
                    f"   Anatomical Zone : {f['anatomical_zone']}",
                    f"   Bounding Box    : {f['box_str']} (x1, y1, x2, y2)",
                    f"   Severity / STAT : {f['severity']} ({f['urgency']})",
                    f"   Finding Note    : {f['finding_text']}",
                    f"   Grad-CAM Saliency: {f['xai_text']}",
                    f"   Recommendation  : {f['recommendation']}",
                    ""
                ])
        else:
            lines.extend([
                "No focal radiographic lesions identified above the confidence threshold.",
                ""
            ])

        lines.extend([
            "-" * 64,
            "EXPLAINABLE AI (GRAD-CAM) SUMMARY",
            "-" * 64,
            "Deep neural activation maps were extracted from YOLO11n Neck Layer 22 (C3k2).",
            "Color heatmaps indicate relative spatial gradient attention contributing to",
            "the bounding box predictions. Red/warm regions indicate high feature weight,",
            "while blue/cool regions represent baseline lung parenchyma.",
            "",
            "-" * 64,
            "REGULATORY & RESEARCH USE DISCLAIMER",
            "-" * 64,
            "CliniScan AI is an investigational decision-support research platform.",
            "This automated synthesis is NOT clinically validated and MUST NOT be used",
            "as an independent or autonomous diagnostic instrument. All radiological",
            "findings require validation by a board-certified healthcare practitioner.",
            "=" * 64
        ])

        report_text = "\n".join(lines)

        return {
            "analysis_id": analysis_id,
            "report_id": f"CLINI-{analysis_id[:12].upper()}",
            "generated_at": now_str,
            "patient_info": {
                "patient_id": patient_id,
                "age": age,
                "gender": gender,
                "indication": indication
            },
            "impression": impression,
            "abnormality_names": abnormality_names,
            "num_findings": len(findings_list),
            "findings": findings_list,
            "report_text": report_text
        }

    @classmethod
    def generate_pdf(
        cls,
        analysis_id: str,
        clinical_data: Dict[str, Any],
        image_paths: Dict[str, str],
        output_path: Optional[str] = None
    ) -> str:
        """
        Builds a multi-section clinical PDF report using ReportLab.
        """
        if output_path is None:
            REPORTS_DIR.mkdir(parents=True, exist_ok=True)
            output_path = str(REPORTS_DIR / f"{analysis_id}_report.pdf")

        if REPORTLAB_AVAILABLE:
            try:
                cls._build_reportlab_pdf(analysis_id, clinical_data, image_paths, output_path)
                return output_path
            except Exception as e:
                print(f"[ReportService Warning] ReportLab failed ({e}), using fallback generator...")

        # Fallback to pure python PDF generator
        cls._build_fallback_pdf(analysis_id, clinical_data, image_paths, output_path)
        return output_path

    @classmethod
    def _build_reportlab_pdf(
        cls,
        analysis_id: str,
        clinical_data: Dict[str, Any],
        image_paths: Dict[str, str],
        output_path: str
    ):
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        primary_color = colors.HexColor("#0F172A")    # Deep Navy
        secondary_color = colors.HexColor("#1E3A8A")  # Royal Navy
        accent_blue = colors.HexColor("#0284C7")      # Medical Sky
        light_bg = colors.HexColor("#F8FAFC")         # Slate 50
        border_color = colors.HexColor("#CBD5E1")     # Slate 300

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=primary_color
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#64748B")
        )
        section_style = ParagraphStyle(
            "SectionHeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=15,
            textColor=secondary_color,
            spaceBefore=8,
            spaceAfter=4
        )
        body_style = ParagraphStyle(
            "BodyDark",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#1E293B")
        )
        meta_label_style = ParagraphStyle(
            "MetaLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#475569")
        )
        meta_val_style = ParagraphStyle(
            "MetaValue",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#0F172A")
        )

        story = []

        # 1. Header Banner Table
        header_data = [
            [
                Paragraph("<b>CLINISCAN AI</b> &nbsp;|&nbsp; Diagnostic Decision Support", title_style),
                Paragraph(f"<b>REPORT:</b> {clinical_data.get('report_id', 'CLINI-REP')}<br/><b>DATE:</b> {clinical_data.get('generated_at', '')}", subtitle_style)
            ]
        ]
        t_header = Table(header_data, colWidths=[360, 180])
        t_header.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_header)
        story.append(HRFlowable(width="100%", thickness=1.5, color=accent_blue, spaceBefore=4, spaceAfter=8))

        # 2. Patient Demographics Block
        p_info = clinical_data.get("patient_info", {})
        patient_data = [
            [
                Paragraph("<b>Patient ID:</b>", meta_label_style),
                Paragraph(str(p_info.get("patient_id", "N/A")), meta_val_style),
                Paragraph("<b>Age / Gender:</b>", meta_label_style),
                Paragraph(f"{p_info.get('age', 'N/A')} / {p_info.get('gender', 'N/A')}", meta_val_style),
            ],
            [
                Paragraph("<b>Clinical Indication:</b>", meta_label_style),
                Paragraph(str(p_info.get("indication", "Routine Investigation")), meta_val_style),
                Paragraph("<b>Model Architecture:</b>", meta_label_style),
                Paragraph("YOLO11n (14 Pathologies)", meta_val_style),
            ]
        ]
        t_patient = Table(patient_data, colWidths=[100, 170, 95, 175])
        t_patient.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), light_bg),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_patient)
        story.append(Spacer(1, 8))

        # 3. Clinical Impression Callout
        story.append(Paragraph("CLINICAL IMPRESSION", section_style))
        impression_data = [[
            Paragraph(f"<b>Summary:</b> {clinical_data.get('impression', 'No abnormalities detected.')}", body_style)
        ]]
        t_imp = Table(impression_data, colWidths=[540])
        t_imp.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F0F9FF")), # Light cyan
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BAE6FD")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(t_imp)
        story.append(Spacer(1, 10))

        # 4. Radiographic Images Section (Triad: Original / Annotated / Grad-CAM / Blend)
        story.append(Paragraph("RADIOGRAPHIC LOCALIZATION & XAI HEATMAPS", section_style))
        
        # Prepare available images (resized for PDF embedding)
        img_cells = []
        labels_row = []
        
        display_keys = [
            ("original", "1. Original CXR"),
            ("annotated", "2. YOLO11n Detections"),
            ("gradcam", "3. Grad-CAM Heatmap"),
            ("superimposed", "4. Superimposed Blend")
        ]
        
        img_flowables = []
        valid_labels = []
        target_w = 125
        target_h = 125

        for k, lbl in display_keys:
            fpath = image_paths.get(k)
            if fpath and os.path.exists(fpath):
                try:
                    rl_img = RLImage(fpath, width=target_w, height=target_h)
                    img_flowables.append(rl_img)
                    valid_labels.append(Paragraph(f"<font size=7><b>{lbl}</b></font>", subtitle_style))
                except Exception:
                    pass

        if img_flowables:
            # 4 images per row or 2x2
            if len(img_flowables) >= 4:
                img_table_data = [
                    img_flowables[:4],
                    valid_labels[:4]
                ]
                col_w = 135
                t_imgs = Table(img_table_data, colWidths=[col_w]*4)
            else:
                img_table_data = [img_flowables, valid_labels]
                t_imgs = Table(img_table_data)
                
            t_imgs.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('TOPPADDING', (0,0), (-1,-1), 2),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ]))
            story.append(t_imgs)
        story.append(Spacer(1, 10))

        # 5. Detected Findings Table
        findings = clinical_data.get("findings", [])
        if findings:
            story.append(Paragraph(f"LOCALIZED ABNORMALITIES ({len(findings)} DETECTED)", section_style))
            
            f_table_data = [
                [
                    Paragraph("<b>#</b>", meta_label_style),
                    Paragraph("<b>Abnormality Class</b>", meta_label_style),
                    Paragraph("<b>Confidence</b>", meta_label_style),
                    Paragraph("<b>Anatomical Zone</b>", meta_label_style),
                    Paragraph("<b>Severity</b>", meta_label_style),
                    Paragraph("<b>Clinical Recommendation</b>", meta_label_style),
                ]
            ]
            
            for item in findings:
                f_table_data.append([
                    Paragraph(str(item["index"]), body_style),
                    Paragraph(f"<b>{item['class_name']}</b>", body_style),
                    Paragraph(f"{item['confidence_percent']:.1f}%", body_style),
                    Paragraph(item["anatomical_zone"], body_style),
                    Paragraph(item["severity"], body_style),
                    Paragraph(item["recommendation"], body_style),
                ])
                
            t_findings = Table(f_table_data, colWidths=[20, 110, 60, 120, 60, 170])
            t_findings.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E2E8F0")),
                ('BOX', (0,0), (-1,-1), 1, border_color),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('LEFTPADDING', (0,0), (-1,-1), 5),
                ('RIGHTPADDING', (0,0), (-1,-1), 5),
            ]))
            story.append(t_findings)
        else:
            story.append(Paragraph("<b>No focal abnormalities detected above threshold.</b>", body_style))

        story.append(Spacer(1, 12))

        # 6. Disclaimer & Research Footer
        disclaimer_text = (
            "<b>INVESTIGATIONAL USE ONLY:</b> CliniScan AI is an artificial intelligence research prototype "
            "developed for educational and diagnostic decision-support exploration. The predictions, bounding "
            "box coordinates, and Grad-CAM heatmaps do not constitute a clinical diagnosis or treatment recommendation. "
            "All findings must be confirmed by a licensed medical practitioner."
        )
        d_table = Table([[Paragraph(disclaimer_text, ParagraphStyle('Disc', parent=styles['Normal'], fontSize=7, leading=9.5, textColor=colors.HexColor('#64748B')))]], colWidths=[540])
        d_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FFFBEB")), # Warm amber 50
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#FDE68A")),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(KeepTogether(d_table))

        doc.build(story)

    @classmethod
    def _build_fallback_pdf(
        cls,
        analysis_id: str,
        clinical_data: Dict[str, Any],
        image_paths: Dict[str, str],
        output_path: str
    ):
        """
        Standalone minimal PDF 1.4 generator fallback.
        """
        text = clinical_data.get("report_text", "CliniScan AI Report")
        clean_text = text.replace("—", "-").replace("“", '"').replace("”", '"').encode("ascii", "replace").decode("ascii")
        lines = clean_text.split("\n")

        # Basic PDF 1.4 template
        stream_lines = ["BT", "/F1 9 Tf", "40 750 Td", "13 TL"]
        for line in lines[:55]:
            safe_l = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            stream_lines.append(f"({safe_l}) '")
        stream_lines.append("ET")
        stream = "\n".join(stream_lines).encode("latin1")

        obj1 = b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        obj2 = b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        obj3 = b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        obj4 = f"4 0 obj\n<< /Length {len(stream)} >>\nstream\n".encode("latin1") + stream + b"\nendstream\nendobj\n"
        obj5 = b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n"

        header = b"%PDF-1.4\n"
        offsets = [0]
        curr = len(header)
        body = b""
        for obj in [obj1, obj2, obj3, obj4, obj5]:
            offsets.append(curr)
            body += obj
            curr += len(obj)

        xref_pos = curr
        xref = f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode("latin1")
        for o in offsets[1:]:
            xref += f"{o:010d} 00000 n \n".encode("latin1")
        trailer = f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("latin1")

        with open(output_path, "wb") as f:
            f.write(header + body + xref + trailer)
