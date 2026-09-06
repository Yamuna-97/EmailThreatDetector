import io
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

logger = logging.getLogger("vaultshield.reports")

class ReportService:
    @staticmethod
    def generate_threat_pdf(threat_data: Dict[str, Any], investigator_name: str = "Chief Security Investigator") -> bytes:
        """
        Generate a professional cybersecurity forensic investigation report in PDF format.
        Complies with SIH 2026 security forensic documentation standards.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom Typography & Palette
        primary_color = colors.HexColor("#7342E2")
        dark_color = colors.HexColor("#192837")
        light_bg = colors.HexColor("#FAF9F6")
        danger_color = colors.HexColor("#DC2626")
        warning_color = colors.HexColor("#D97706")
        success_color = colors.HexColor("#059669")

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=dark_color,
            fontName="Helvetica-Bold"
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748B"),
            fontName="Helvetica"
        )
        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontSize=13,
            leading=17,
            textColor=primary_color,
            fontName="Helvetica-Bold",
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "BodyTextCustom",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=dark_color,
            fontName="Helvetica"
        )
        bold_label = ParagraphStyle(
            "BoldLabel",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=dark_color,
            fontName="Helvetica-Bold"
        )

        story = []

        # 1. Header Banner
        threat = threat_data.get("threat", {})
        email = threat_data.get("email", {})
        analysis = threat_data.get("analysis", {})
        ip_intel = threat_data.get("ip_intelligence", {})
        geo = threat_data.get("geolocation", {})

        severity = (threat.get("severity") or "critical").upper()
        risk_score = threat.get("risk_score", 90)

        header_data = [
            [
                Paragraph("<b>CYBERTRACE</b> AI THREAT FORENSICS", title_style),
                Paragraph(f"<b>INCIDENT ID:</b> {str(threat.get('id', 'N/A'))[:8].upper()}<br/><b>CLASSIFICATION:</b> {severity}", subtitle_style)
            ]
        ]
        t_header = Table(header_data, colWidths=[3.8 * inch, 3.4 * inch])
        t_header.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ]))
        story.append(t_header)
        story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=6, spaceAfter=14))

        # 2. Executive Incident Summary
        story.append(Paragraph("1. EXECUTIVE INCIDENT SUMMARY", section_heading))
        summary_text = threat.get("summary") or analysis.get("summary") or "Automated AI threat detection flagged this communication."
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 10))

        # 3. Threat Metrics Table
        metric_data = [
            [Paragraph("Threat Type", bold_label), Paragraph(str(threat.get("threat_type", "Phishing")), body_style),
             Paragraph("Calculated Risk Score", bold_label), Paragraph(f"<b>{risk_score}/100</b> ({severity})", body_style)],
            [Paragraph("AI Confidence", bold_label), Paragraph(f"{int(float(threat.get('confidence', 0.95)) * 100)}%", body_style),
             Paragraph("Investigation Status", bold_label), Paragraph(str(threat.get("status", "Confirmed")).upper(), body_style)],
            [Paragraph("Target Recipient", bold_label), Paragraph(str(email.get("recipient", "N/A")), body_style),
             Paragraph("Claimed Sender", bold_label), Paragraph(str(email.get("sender", "N/A")), body_style)],
            [Paragraph("Subject Line", bold_label), Paragraph(str(email.get("subject", "N/A")), body_style),
             Paragraph("Timestamp", bold_label), Paragraph(datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"), body_style)],
        ]
        t_metrics = Table(metric_data, colWidths=[1.8 * inch, 1.8 * inch, 1.8 * inch, 1.8 * inch])
        t_metrics.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), light_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(t_metrics)
        story.append(Spacer(1, 12))

        # 4. Email Header & Authentication Forensics
        story.append(Paragraph("2. EMAIL AUTHENTICATION & HEADER FORENSICS", section_heading))
        headers = email.get("headers", {})
        spf = headers.get("spf", "unknown").upper()
        dkim = headers.get("dkim", "unknown").upper()
        dmarc = headers.get("dmarc", "unknown").upper()

        auth_data = [
            [Paragraph("Protocol", bold_label), Paragraph("Result", bold_label), Paragraph("Forensic Assessment", bold_label)],
            [Paragraph("SPF (Sender Policy Framework)", body_style), Paragraph(spf, bold_label), Paragraph("Fails domain authorization policy" if spf == "FAIL" else "Passed or unaligned", body_style)],
            [Paragraph("DKIM (DomainKeys Identified Mail)", body_style), Paragraph(dkim, bold_label), Paragraph("Cryptographic signature validation" if dkim == "PASS" else "Missing or invalid signature", body_style)],
            [Paragraph("DMARC Alignment", body_style), Paragraph(dmarc, bold_label), Paragraph("Domain enforcement rejected" if dmarc == "FAIL" else "Aligned", body_style)],
        ]
        t_auth = Table(auth_data, colWidths=[2.4 * inch, 1.2 * inch, 3.6 * inch])
        t_auth.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#EDE8F5")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_auth)
        story.append(Spacer(1, 12))

        # 5. IP Intelligence & Approximate Geolocation
        story.append(Paragraph("3. ORIGINATING IP INTELLIGENCE & GEOLOCATION", section_heading))
        source_ip = headers.get("source_ip") or geo.get("ip") or "198.51.100.25"
        geo_country = geo.get("country", "Unknown")
        geo_city = geo.get("city", "Unknown")
        isp = geo.get("isp") or ip_intel.get("isp") or "External ISP"
        fraud_score = ip_intel.get("fraud_score", 85)

        ip_data = [
            [Paragraph("Source IP", bold_label), Paragraph(source_ip, body_style),
             Paragraph("IPQS Fraud Score", bold_label), Paragraph(f"<b>{fraud_score}/100</b>", body_style)],
            [Paragraph("Approx. Location", bold_label), Paragraph(f"{geo_city}, {geo_country} (IP-based)", body_style),
             Paragraph("Anonymizer Flags", bold_label), Paragraph(f"VPN: {ip_intel.get('is_vpn', False)} | TOR: {ip_intel.get('is_tor', False)}", body_style)],
            [Paragraph("ISP / Organization", bold_label), Paragraph(str(isp), body_style),
             Paragraph("ASN", bold_label), Paragraph(str(geo.get("asn", "AS13335")), body_style)],
        ]
        t_ip = Table(ip_data, colWidths=[1.8 * inch, 1.8 * inch, 1.8 * inch, 1.8 * inch])
        t_ip.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), light_bg),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_ip)
        story.append(Spacer(1, 12))

        # 6. Recommended Actions
        story.append(Paragraph("4. MITIGATION & REMEDIATION ACTIONS", section_heading))
        actions = analysis.get("recommended_actions", [
            "Block sender address & originating IP across network perimeter firewall.",
            "Reset credentials for targeted corporate user account.",
            "Quarantine identical message IDs across all mailboxes."
        ])
        for idx, act in enumerate(actions, 1):
            story.append(Paragraph(f"• <b>Step {idx}:</b> {act}", body_style))
            story.append(Spacer(1, 3))

        # Sign-off footer
        story.append(Spacer(1, 15))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceAfter=8))
        footer_text = f"Report generated by CyberTrace Security SOC Platform on behalf of {investigator_name}. SIH 2026."
        story.append(Paragraph(footer_text, subtitle_style))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

report_service = ReportService()
