import os
import cv2
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

def escape_pdf_text(text: str) -> str:
    """Escapes special characters and replaces non-latin1 unicode for PDF text operators."""
    if not text:
        return ""
    text = str(text)
    # Replace common unicode typographic characters with ASCII equivalents
    text = text.replace("—", " - ").replace("–", "-")
    text = text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    text = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    # Strip any remaining non-ascii characters safely
    text = text.encode("ascii", "replace").decode("ascii")
    return text

def wrap_text(text: str, max_chars: int = 75) -> List[str]:
    """Simple greedy word wrapper."""
    words = text.split()
    lines = []
    curr = []
    curr_len = 0
    for w in words:
        if curr_len + len(w) + (1 if curr else 0) <= max_chars:
            curr.append(w)
            curr_len += len(w) + (1 if len(curr) > 1 else 0)
        else:
            if curr:
                lines.append(" ".join(curr))
            curr = [w]
            curr_len = len(w)
    if curr:
        lines.append(" ".join(curr))
    return lines

class PurePythonPDFBuilder:
    """
    Self-contained, dependency-free clinical PDF 1.4 generator.
    Guarantees medical report generation across all environments.
    """
    def __init__(self, page_width: int = 612, page_height: int = 792):
        self.width = page_width   # Standard US Letter (8.5 x 11 inches)
        self.height = page_height
        self.objects = []
        self.images = {}  # name -> (width, height, raw_jpeg_bytes)
        self.pages_content = [] # list of command strings per page

    def add_jpeg(self, image_name: str, file_path: str) -> bool:
        if not os.path.exists(file_path):
            return False
        try:
            img = cv2.imread(file_path)
            if img is None:
                return False
            h, w = img.shape[:2]
            success, enc = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 90])
            if not success:
                return False
            self.images[image_name] = (w, h, enc.tobytes())
            return True
        except Exception as e:
            print(f"[PDF] Error embedding image {file_path}: {e}")
            return False

    def build_pdf(
        self,
        report_data: Dict[str, Any],
        img_refs: Dict[str, str]
    ) -> bytes:
        # Load images
        has_orig = self.add_jpeg("ImOrig", img_refs.get("original", ""))
        has_anno = self.add_jpeg("ImAnno", img_refs.get("annotated", ""))
        has_cam = self.add_jpeg("ImCam", img_refs.get("gradcam", "") or img_refs.get("superimposed", ""))

        # Page 1 commands
        cmds = []

        # Header background banner (Dark Slate Blue)
        cmds.append("0.08 0.15 0.28 rg") # Fill color
        cmds.append(f"0 {self.height - 75} {self.width} 75 re f")

        # Header Text
        cmds.append("1 1 1 rg") # White text
        cmds.append(f"BT /F2 18 Tf 36 {self.height - 38} Td (CLINISCAN AI - RADIOLOGICAL ANALYSIS REPORT) Tj ET")
        cmds.append(f"BT /F1 9 Tf 36 {self.height - 56} Td (Deep Learning Chest Radiograph Screening & Explainability System) Tj ET")
        cmds.append(f"BT /F1 9 Tf {self.width - 190} {self.height - 56} Td (Automated Report Engine v2.0) Tj ET")

        # Patient Info Box
        info_y = self.height - 140
        cmds.append("0.96 0.97 0.99 rg") # Light background
        cmds.append(f"36 {info_y} {self.width - 72} 55 re f")
        cmds.append("0.85 0.88 0.92 RG 1 w") # Border
        cmds.append(f"36 {info_y} {self.width - 72} 55 re s")

        pid = escape_pdf_text(report_data.get("patient_id", "CXR-UNKNOWN"))
        p_age = escape_pdf_text(report_data.get("patient_age", "N/A"))
        p_gen = escape_pdf_text(report_data.get("patient_gender", "N/A"))
        dt = escape_pdf_text(report_data.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        scan_id = escape_pdf_text(report_data.get("scan_id", "")[:12])

        cmds.append("0.1 0.15 0.25 rg")
        cmds.append(f"BT /F2 9 Tf 48 {info_y + 36} Td (Patient ID: ) Tj /F1 9 Tf ({pid}) Tj ET")
        cmds.append(f"BT /F2 9 Tf 210 {info_y + 36} Td (Age/Gender: ) Tj /F1 9 Tf ({p_age} / {p_gen}) Tj ET")
        cmds.append(f"BT /F2 9 Tf 380 {info_y + 36} Td (Study Date: ) Tj /F1 9 Tf ({dt}) Tj ET")

        cmds.append(f"BT /F2 9 Tf 48 {info_y + 16} Td (Study ID: ) Tj /F1 9 Tf ({scan_id}) Tj ET")
        cmds.append(f"BT /F2 9 Tf 210 {info_y + 16} Td (Modality: ) Tj /F1 9 Tf (Chest X-Ray [PA View]) Tj ET")
        cmds.append(f"BT /F2 9 Tf 380 {info_y + 16} Td (Model: ) Tj /F1 9 Tf (YOLO11n-4394 [14 Classes]) Tj ET")

        # Visual Triad Images (Original, Detections, Grad-CAM)
        triad_y = info_y - 155
        img_w = 170
        img_h = 135
        gap = 15
        start_x = 36

        # Draw labels above images
        cmds.append("0.2 0.3 0.4 rg")
        cmds.append(f"BT /F2 9 Tf {start_x + 35} {triad_y + img_h + 6} Td (1. Original Chest X-Ray) Tj ET")
        cmds.append(f"BT /F2 9 Tf {start_x + img_w + gap + 25} {triad_y + img_h + 6} Td (2. YOLO11n Detections) Tj ET")
        cmds.append(f"BT /F2 9 Tf {start_x + (img_w + gap)*2 + 25} {triad_y + img_h + 6} Td (3. Grad-CAM XAI Map) Tj ET")

        # Background frames for images
        for i in range(3):
            bx = start_x + i * (img_w + gap)
            cmds.append("0.9 0.9 0.9 RG 1 w")
            cmds.append(f"{bx} {triad_y} {img_w} {img_h} re s")

        # Render Images
        if has_orig:
            cmds.append(f"q {img_w} 0 0 {img_h} {start_x} {triad_y} cm /ImOrig Do Q")
        if has_anno:
            cmds.append(f"q {img_w} 0 0 {img_h} {start_x + img_w + gap} {triad_y} cm /ImAnno Do Q")
        if has_cam:
            cmds.append(f"q {img_w} 0 0 {img_h} {start_x + (img_w + gap)*2} {triad_y} cm /ImCam Do Q")

        # Clinical Impression Banner
        curr_y = triad_y - 25
        cmds.append("0.1 0.2 0.4 rg")
        cmds.append(f"BT /F2 11 Tf 36 {curr_y} Td (CLINICAL IMPRESSION) Tj ET")
        cmds.append("0.8 0.85 0.9 RG 1 w")
        cmds.append(f"36 {curr_y - 4} {self.width - 72} 0.5 re s")

        curr_y -= 18
        impression = report_data.get("impression", "No acute abnormalities detected.")
        imp_lines = wrap_text(impression, max_chars=85)
        cmds.append("0.15 0.15 0.15 rg")
        for line in imp_lines:
            cmds.append(f"BT /F1 9 Tf 36 {curr_y} Td ({escape_pdf_text(line)}) Tj ET")
            curr_y -= 12

        # Detected Abnormalities Section
        curr_y -= 10
        cmds.append("0.1 0.2 0.4 rg")
        cmds.append(f"BT /F2 11 Tf 36 {curr_y} Td (LOCALIZED FINDINGS & EXPLAINABLE AI ANALYSIS) Tj ET")
        cmds.append("0.8 0.85 0.9 RG 1 w")
        cmds.append(f"36 {curr_y - 4} {self.width - 72} 0.5 re s")
        curr_y -= 16

        findings = report_data.get("findings", [])
        if not findings:
            cmds.append("0.3 0.3 0.3 rg")
            cmds.append(f"BT /F1 9 Tf 36 {curr_y} Td (No localized abnormalities met the confidence threshold. Visual review is clear.) Tj ET")
            curr_y -= 18
        else:
            for f in findings[:4]: # Fit up to 4 primary findings on first page
                idx = f.get("index", 1)
                name = escape_pdf_text(f.get("class_name", ""))
                conf = f.get("confidence_percent", 0.0)
                box = escape_pdf_text(str(f.get("box", [])))
                finding_desc = f.get("finding", "")
                xai_desc = f.get("xai_explanation", "")
                rec_desc = f.get("recommendation", "")

                # Abnormality title bar
                cmds.append("0.93 0.95 0.98 rg")
                cmds.append(f"36 {curr_y - 3} {self.width - 72} 16 re f")
                cmds.append("0.1 0.25 0.5 rg")
                cmds.append(f"BT /F2 9 Tf 40 {curr_y} Td ({idx}. {name}) Tj ET")
                cmds.append("0.2 0.2 0.2 rg")
                cmds.append(f"BT /F2 9 Tf 220 {curr_y} Td (Confidence: ) Tj /F1 9 Tf ({conf:.1f}%) Tj ET")
                cmds.append(f"BT /F2 9 Tf 360 {curr_y} Td (BBox: ) Tj /F1 8 Tf ({box}) Tj ET")
                curr_y -= 15

                # Finding narrative
                cmds.append("0.2 0.2 0.2 rg")
                for f_line in wrap_text(f"Finding: {finding_desc}", max_chars=90)[:2]:
                    cmds.append(f"BT /F1 8 Tf 45 {curr_y} Td ({escape_pdf_text(f_line)}) Tj ET")
                    curr_y -= 10
                for x_line in wrap_text(f"XAI: {xai_desc}", max_chars=90)[:2]:
                    cmds.append(f"BT /F1 8 Tf 45 {curr_y} Td ({escape_pdf_text(x_line)}) Tj ET")
                    curr_y -= 10
                for r_line in wrap_text(f"Rec: {rec_desc}", max_chars=90)[:1]:
                    cmds.append(f"BT /F1 8 Tf 45 {curr_y} Td ({escape_pdf_text(r_line)}) Tj ET")
                    curr_y -= 10
                curr_y -= 6

        # Regulatory & Medical Disclaimer at the bottom
        disclaimer_y = 52
        cmds.append("0.98 0.95 0.95 rg") # Warning background
        cmds.append(f"36 {disclaimer_y} {self.width - 72} 40 re f")
        cmds.append("0.9 0.7 0.7 RG 1 w")
        cmds.append(f"36 {disclaimer_y} {self.width - 72} 40 re s")

        cmds.append("0.7 0.1 0.1 rg")
        cmds.append(f"BT /F2 8 Tf 42 {disclaimer_y + 26} Td (IMPORTANT REGULATORY & RESEARCH NOTICE:) Tj ET")
        cmds.append("0.3 0.3 0.3 rg")
        disclaimer_text = (
            "This report is automatically generated by an artificial intelligence research platform (YOLO11n + Grad-CAM). "
            "These findings and heatmaps are investigative aids and do NOT constitute a definitive medical diagnosis. "
            "All imaging must be independently evaluated by a licensed radiologist or healthcare provider."
        )
        for d_line in wrap_text(disclaimer_text, max_chars=98):
            cmds.append(f"BT /F1 7 Tf 42 {disclaimer_y + 14} Td ({escape_pdf_text(d_line)}) Tj ET")
            disclaimer_y -= 8

        # Footer
        cmds.append("0.5 0.5 0.5 rg")
        cmds.append(f"BT /F1 7 Tf 36 20 Td (CliniScan AI Medical Diagnostics Platform | Report Generated: {dt} | Page 1 of 1) Tj ET")

        stream_data = "\n".join(cmds).encode('latin1')
        return self._package_pdf(stream_data)

    def _package_pdf(self, stream_data: bytes) -> bytes:
        out = bytearray()
        out.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = {}

        # 1. Catalog
        offsets[1] = len(out)
        out.extend(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

        # 2. Pages
        offsets[2] = len(out)
        out.extend(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")

        # Build Image XObjects dict
        img_entries = []
        next_obj_id = 6
        img_obj_map = {}
        for name in ["ImOrig", "ImAnno", "ImCam"]:
            if name in self.images:
                img_obj_map[name] = next_obj_id
                img_entries.append(f"/{name} {next_obj_id} 0 R")
                next_obj_id += 1

        img_xobject_str = " ".join(img_entries)

        # 3. Page
        offsets[3] = len(out)
        out.extend(
            f"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {self.width} {self.height}] "
            f"/Resources << /Font << /F1 4 0 R /F2 5 0 R >> /XObject << {img_xobject_str} >> >> "
            f"/Contents {next_obj_id} 0 R >>\nendobj\n".encode('ascii')
        )

        # 4. Font F1 (Helvetica)
        offsets[4] = len(out)
        out.extend(b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

        # 5. Font F2 (Helvetica-Bold)
        offsets[5] = len(out)
        out.extend(b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n")

        # Image objects
        for name in ["ImOrig", "ImAnno", "ImCam"]:
            if name in self.images:
                obj_id = img_obj_map[name]
                w, h, data = self.images[name]
                offsets[obj_id] = len(out)
                header = (
                    f"{obj_id} 0 obj\n<< /Type /XObject /Subtype /Image "
                    f"/Width {w} /Height {h} /ColorSpace /DeviceRGB /BitsPerComponent 8 "
                    f"/Filter /DCTDecode /Length {len(data)} >>\nstream\n"
                ).encode('ascii')
                out.extend(header)
                out.extend(data)
                out.extend(b"\nendstream\nendobj\n")

        # Content Stream Object
        content_id = next_obj_id
        offsets[content_id] = len(out)
        out.extend(
            f"{content_id} 0 obj\n<< /Length {len(stream_data)} >>\nstream\n".encode('ascii')
        )
        out.extend(stream_data)
        out.extend(b"\nendstream\nendobj\n")

        # XRef table
        start_xref = len(out)
        total_objects = content_id + 1
        out.extend(f"xref\n0 {total_objects}\n".encode('ascii'))
        out.extend(b"0000000000 65535 f \n")
        for i in range(1, total_objects):
            offset = offsets.get(i, 0)
            out.extend(f"{offset:010d} 00000 n \n".encode('ascii'))

        # Trailer
        out.extend(
            f"trailer\n<< /Size {total_objects} /Root 1 0 R >>\nstartxref\n{start_xref}\n%%EOF".encode('ascii')
        )
        return bytes(out)


def generate_pdf_report(
    scan_id: str,
    report_data: Dict[str, Any],
    image_paths: Dict[str, str],
    output_pdf_path: str
) -> str:
    """
    Generates a professional medical PDF report.
    """
    Path(output_pdf_path).parent.mkdir(parents=True, exist_ok=True)
    builder = PurePythonPDFBuilder(page_width=612, page_height=792)
    pdf_bytes = builder.build_pdf(report_data, image_paths)
    with open(output_pdf_path, "wb") as f:
        f.write(pdf_bytes)
    print(f"[CliniScan AI] Diagnostic PDF report generated: {output_pdf_path} ({len(pdf_bytes)} bytes)")
    return output_pdf_path
