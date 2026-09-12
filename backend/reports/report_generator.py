"""
AURA - Report Generator
Generates PDF and JSON security reports from scan findings.
Uses fpdf2 to build the PDF document programmatically.
"""

import json
from pathlib import Path
from fpdf import FPDF
from datetime import datetime, timezone

from orchestrator.state import SecurityReport, Severity

# Ensure output directory exists
OUTPUT_DIR = Path(__file__).parent.parent.parent / "reports" / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class PDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 15)
        self.cell(0, 10, "AURA Security Assessment Report", border=False, align="C")
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")


def sanitize_text(text: str) -> str:
    """Sanitize text to avoid fpdf2 unicode encoding errors on default fonts."""
    if not text:
        return ""
    # Replace common unicode chars
    replacements = {
        '\u2011': '-', '\u2013': '-', '\u2014': '-', 
        '\u2018': "'", '\u2019': "'", 
        '\u201c': '"', '\u201d': '"', 
        '\u2026': '...'
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text.encode('latin-1', 'replace').decode('latin-1')


def generate_pdf(report_data: dict) -> Path:
    """Generate a PDF report and save to disk. Returns the file path."""
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    
    pdf.set_font("Helvetica", size=11)
    
    # -- Header Information --
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, f"Scan ID: {report_data.get('scan_id')}", ln=True)
    pdf.cell(0, 10, f"Target: {report_data.get('target_url')}", ln=True)
    pdf.cell(0, 10, f"Date: {report_data.get('scan_date', datetime.now(timezone.utc).isoformat()[:10])}", ln=True)
    pdf.ln(5)
    
    # -- Score Summary --
    pdf.set_font("Helvetica", "B", 14)
    risk_score = report_data.get('overall_risk_score', 0.0)
    if risk_score >= 7.0:
        pdf.set_text_color(220, 38, 38)
    elif risk_score >= 4.0:
        pdf.set_text_color(217, 119, 6)
    else:
        pdf.set_text_color(5, 150, 105)
        
    pdf.cell(0, 10, f"Overall Risk Score: {risk_score}/10.0", ln=True)
    pdf.set_text_color(0, 0, 0)
    
    pdf.set_font("Helvetica", size=11)
    pdf.cell(0, 8, f"Total Attacks Fired: {report_data.get('total_attacks', 0)}", ln=True)
    pdf.cell(0, 8, f"Successful Vulnerabilities Found: {report_data.get('successful_attacks', 0)}", ln=True)
    pdf.cell(0, 8, f"Success Rate: {report_data.get('success_rate', 0.0)}%", ln=True)
    pdf.ln(10)
    
    # -- Executive Summary --
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "Executive Summary", ln=True)
    pdf.set_font("Helvetica", size=11)
    exec_summary = sanitize_text(report_data.get("executive_summary", "No summary provided."))
    pdf.multi_cell(0, 8, exec_summary)
    pdf.ln(10)
    
    # -- Vulnerabilities --
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "Detailed Vulnerability Findings", ln=True)
    pdf.ln(5)
    
    findings = report_data.get("vulnerabilities", [])
    if not findings:
        pdf.set_font("Helvetica", size=11)
        pdf.cell(0, 8, "No vulnerabilities were found during this scan. Great job!", ln=True)
    
    for i, finding in enumerate(findings):
        pdf.set_font("Helvetica", "B", 12)
        title = sanitize_text(f"{i+1}. {finding.get('title', 'Unknown Vulnerability')}")
        pdf.cell(0, 10, title, ln=True)
        
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(40, 8, f"Severity: {finding.get('severity', 'Unknown')}", border=False)
        pdf.cell(40, 8, f"CVSS: {finding.get('cvss_score', 0.0)}", border=False)
        pdf.cell(80, 8, f"Category: {finding.get('category', 'Unknown')}", ln=True)
        pdf.ln(2)
        
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 8, "Description:", ln=True)
        pdf.set_font("Helvetica", size=10)
        desc = sanitize_text(finding.get('description', ''))
        pdf.multi_cell(0, 6, desc)
        pdf.ln(2)
        
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 8, "Recommendation / Fix:", ln=True)
        pdf.set_font("Helvetica", size=10)
        rec = sanitize_text(finding.get('recommendation', ''))
        pdf.multi_cell(0, 6, rec)
        pdf.ln(8)
        
    output_path = OUTPUT_DIR / f"{report_data.get('scan_id')}.pdf"
    pdf.output(str(output_path))
    return output_path


def generate_json(report_data: dict) -> Path:
    output_path = OUTPUT_DIR / f"{report_data.get('scan_id')}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
    return output_path
