#!/usr/bin/env python3
"""Generate a professional PDF summary of the CLATly legal compliance requirements."""

from fpdf import FPDF
import os

OUTPUT_PATH = os.path.expanduser("~/clat-prep/docs/legal-compliance-summary.pdf")

FONT_DIR = "/usr/share/fonts/truetype/dejavu"

class LegalPDF(FPDF):

    def __init__(self):
        super().__init__()
        # Register Unicode fonts
        self.add_font("DejaVu", "", os.path.join(FONT_DIR, "DejaVuSans.ttf"))
        self.add_font("DejaVu", "B", os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf"))
        self.add_font("DejaVuMono", "", os.path.join(FONT_DIR, "DejaVuSansMono.ttf"))
        self.add_font("DejaVuMono", "B", os.path.join(FONT_DIR, "DejaVuSansMono-Bold.ttf"))
    """Custom PDF with header/footer for legal document."""

    def header(self):
        if self.page_no() > 1:
            self.set_font("DejaVu", "", 8)
            self.set_text_color(130, 130, 130)
            self.cell(0, 6, "CLATly — Legal Compliance Requirements Summary", align="L")
            self.cell(0, 6, f"Page {self.page_no()}", align="R", new_x="LMARGIN", new_y="NEXT")
            self.line(10, 14, 200, 14)
            self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("DejaVu", "", 7)
        self.set_text_color(160, 160, 160)
        self.cell(0, 10, "Confidential — Prepared by Yogita Sharma (Tech & EdTech Compliance)", align="C")

    def section_title(self, num, title):
        self.set_font("DejaVu", "B", 14)
        self.set_text_color(83, 23, 231)  # Purple accent (#5319e7)
        self.cell(0, 10, f"{num}. {title}", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(83, 23, 231)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def sub_title(self, title):
        self.set_font("DejaVu", "B", 11)
        self.set_text_color(60, 60, 60)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body_text(self, text):
        self.set_font("DejaVu", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text, indent=15):
        x = self.get_x()
        self.set_x(x + indent)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(40, 40, 40)
        # Bullet character
        bullet_w = self.get_string_width("•  ")
        self.cell(bullet_w, 5.5, "•  ")
        self.multi_cell(0, 5.5, text)
        self.ln(0.5)

    def bold_bullet(self, bold_part, rest, indent=15):
        x = self.get_x()
        self.set_x(x + indent)
        self.set_font("DejaVu", "", 10)
        self.set_text_color(40, 40, 40)
        bullet_w = self.get_string_width("•  ")
        self.cell(bullet_w, 5.5, "•  ")
        self.set_font("DejaVu", "B", 10)
        self.cell(self.get_string_width(bold_part), 5.5, bold_part)
        self.set_font("DejaVu", "", 10)
        self.multi_cell(0, 5.5, rest)
        self.ln(0.5)

    def priority_table(self, rows):
        """Draw priority action plan table."""
        self.set_font("DejaVu", "B", 9)
        col_w = [10, 55, 80, 40]
        headers = ["", "Priority", "Action", "Timeline"]
        self.set_fill_color(83, 23, 231)
        self.set_text_color(255, 255, 255)
        for i, h in enumerate(headers):
            self.cell(col_w[i], 7, h, border=1, align="C", fill=True)
        self.ln()

        self.set_font("DejaVu", "", 9)
        self.set_text_color(40, 40, 40)
        for row in rows:
            # Row height calculation
            h = 7
            # Check if text wraps — if so, increase row height
            max_lines = 1
            for i, cell_text in enumerate(row):
                text_w = self.get_string_width(cell_text)
                lines = max(1, -(-int(text_w / (col_w[i] - 2)) // 1)) if text_w > (col_w[i] - 2) else 1
                # More accurate: ceil division
                lines = (text_w + (col_w[i] - 2) - 1) // (col_w[i] - 2) if text_w > (col_w[i] - 2) else 1
                max_lines = max(max_lines, lines)
            h = max(7, max_lines * 5.5)

            # Check page break
            if self.get_y() + h > 270:
                self.add_page()
                # Reprint header
                self.set_font("DejaVu", "B", 9)
                self.set_fill_color(83, 23, 231)
                self.set_text_color(255, 255, 255)
                for i, hd in enumerate(headers):
                    self.cell(col_w[i], 7, hd, border=1, align="C", fill=True)
                self.ln()
                self.set_font("DejaVu", "", 9)
                self.set_text_color(40, 40, 40)

            x_start = self.get_x()
            y_start = self.get_y()
            # Priority indicator color
            prio = row[0]
            fill_colors = {
                "[CRIT]": (220, 38, 38),
                "[HIGH]": (217, 119, 6),
                "[MED]": (22, 163, 74),
            }
            fc = fill_colors.get(prio, (200, 200, 200))

            # Priority column
            self.set_fill_color(*fc)
            self.set_text_color(255, 255, 255)
            self.set_font("DejaVu", "B", 10)
            self.cell(col_w[0], h, prio, border=1, align="C", fill=True)

            # Priority label
            self.set_text_color(40, 40, 40)
            self.set_font("DejaVu", "", 9)
            self.cell(col_w[1], h, row[1], border=1)

            # Action (multicell in cell)
            x_act = self.get_x()
            y_act = self.get_y()
            # Draw border rectangle
            self.rect(x_act, y_act, col_w[2], h)
            self.set_xy(x_act + 1, y_act + 1)
            self.multi_cell(col_w[2] - 2, 5, row[2])
            self.set_xy(x_act + col_w[2], y_act)

            # Timeline
            self.cell(col_w[3], h, row[3], border=1, align="C")
            self.ln()

        self.ln(3)

    def info_box(self, text, color=(83, 23, 231)):
        """Draw an info/warning box."""
        self.set_fill_color(*color)
        self.set_text_color(255, 255, 255)
        self.set_font("DejaVu", "B", 10)
        self.cell(0, 8, "  [!] Important", new_x="LMARGIN", new_y="NEXT")
        self.set_fill_color(245, 240, 255)
        self.set_text_color(50, 50, 50)
        self.set_font("DejaVu", "", 9)
        y_before = self.get_y()
        self.multi_cell(0, 5, f"  {text}", new_x="LMARGIN", new_y="NEXT")
        y_after = self.get_y()
        # Draw background rectangle
        self.set_fill_color(245, 240, 255)
        self.rect(10, y_before, 190, y_after - y_before, style="F")
        self.set_xy(10, y_after)
        self.ln(3)

    def status_box(self, text, icon="[OK]"):
        """Draw a green status box."""
        self.set_fill_color(220, 252, 231)
        self.set_text_color(22, 101, 52)
        self.set_font("DejaVu", "", 9)
        y_before = self.get_y()
        self.multi_cell(0, 5, f"  {icon}  {text}", new_x="LMARGIN", new_y="NEXT")
        y_after = self.get_y()
        self.rect(10, y_before, 190, y_after - y_before, style="F")
        self.set_xy(10, y_after)
        self.ln(2)


def build_pdf():
    pdf = LegalPDF()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ═══════════════════════════════════════
    # COVER PAGE
    # ═══════════════════════════════════════
    pdf.add_page()
    pdf.ln(40)

    # Accent bar
    pdf.set_fill_color(83, 23, 231)
    pdf.rect(10, 50, 190, 3, style="F")

    pdf.ln(15)

    pdf.set_font("DejaVu", "B", 28)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 14, "Legal Compliance", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("DejaVu", "", 16)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 10, "Requirements Summary", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(5)

    pdf.set_font("DejaVu", "", 12)
    pdf.set_text_color(83, 23, 231)
    pdf.cell(0, 8, "CLATly — AI-Powered CLAT Preparation Platform", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(15)

    # Accent bar
    pdf.set_fill_color(83, 23, 231)
    pdf.rect(10, pdf.get_y(), 190, 3, style="F")

    pdf.ln(20)

    # Info block
    pdf.set_font("DejaVu", "", 10)
    pdf.set_text_color(80, 80, 80)
    info_lines = [
        ("Prepared for:", "Bhimsen"),
        ("Consultant:", "Yogita Sharma (Tech & EdTech Compliance)"),
        ("Date:", "July 10, 2026"),
        ("Classification:", "Confidential"),
        ("Reference:", "docs/legal-consultation.md"),
    ]
    for label, value in info_lines:
        pdf.set_x(60)
        pdf.set_font("DejaVu", "B", 10)
        pdf.set_text_color(60, 60, 60)
        pdf.cell(35, 7, label)
        pdf.set_font("DejaVu", "", 10)
        pdf.set_text_color(40, 40, 40)
        pdf.cell(0, 7, value, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(30)

    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(160, 160, 160)
    pdf.multi_cell(0, 4.5,
        "This document provides a summary of legal compliance requirements for the CLATly "
        "platform prior to its commercial launch with paid subscriptions. It covers advertising, "
        "data privacy, intellectual property, Terms of Service, and payment processing under "
        "Indian law as of July 2026. This does not constitute an attorney-client relationship.",
        align="C"
    )

    # ═══════════════════════════════════════
    # SECTION 1: ADVERTISING COMPLIANCE
    # ═══════════════════════════════════════
    pdf.add_page()
    pdf.section_title("1", "Advertising & Marketing Compliance")

    pdf.body_text(
        "Your biggest risk in EdTech advertising is misleading claims — especially around "
        "\"guaranteed results,\" rankings, or success rates. The following legal framework applies:"
    )

    pdf.sub_title("Legal Framework")
    pdf.bold_bullet("ASCI Guidelines — ", "All claims must be substantiated with verifiable data. "
        "Claims about pass rates, question bank size, or AI accuracy must be provable.")
    pdf.bold_bullet("Consumer Protection Act 2019 — ", "False or misleading claims are strictly "
        "prohibited. \"Guaranteed selection\" claims or testimonials without written consent are not allowed.")
    pdf.bold_bullet("Endorsements — ", "Student testimonials need explicit written consent plus "
        "a \"results not typical\" disclaimer.")
    pdf.bold_bullet("Comparative Ads — ", "Factual only. Must not disparage competitors. Every claim needs data backup.")

    pdf.sub_title("AI-Powered Claims — Critical")
    pdf.info_box(
        "If marketing \"AI-driven personalized learning\" or \"adaptive AI\":\n"
        "  • Ensure the AI demonstrably does what's advertised\n"
        "  • Add disclaimer: \"AI suggestions are supplemental aids, not guarantees\"\n"
        "  • Never claim AI replaces human coaching or guarantees score improvement",
        (180, 50, 50)
    )

    pdf.sub_title("Recommendation")
    pdf.body_text(
        "Create an ad pre-approval checklist that flags \"guarantee,\" \"percentage,\" and \"ranking\" "
        "language for legal review before any campaign launch."
    )

    # ═══════════════════════════════════════
    # SECTION 2: DATA PRIVACY
    # ═══════════════════════════════════════
    pdf.add_page()
    pdf.section_title("2", "Data Privacy & Security (DPDP Act 2023)")

    pdf.body_text(
        "As a Data Fiduciary under the Digital Personal Data Protection Act 2023, you have "
        "specific obligations for handling student information."
    )

    pdf.sub_title("Key Requirements")
    pdf.bold_bullet("Consent — ", "Explicit, informed, freely given consent before collection. "
        "Separate consent for processing vs. marketing. Never pre-ticked.")
    pdf.bold_bullet("Notice — ", "Privacy notice in clear language (English + Hindi recommended). "
        "State: what data, why, retention period, third-party sharing.")
    pdf.bold_bullet("Data Minimization — ", "Collect only: name, email, phone, academic level. "
        "Avoid Aadhaar unless verified necessary.")
    pdf.bold_bullet("Parental Consent — ", "MANDATORY if any user may be under 18. Verifiable parental "
        "consent required under DPDP.")
    pdf.bold_bullet("Retention & Deletion — ", "Delete on consent withdrawal. Publish a retention "
        "schedule with auto-delete rules.")
    pdf.bold_bullet("Breach Notification — ", "Must report to DPB India + affected users. Implement "
        "breach detection now.")
    pdf.bold_bullet("Security — ", "AES-256 at rest, TLS 1.3 in transit, access controls, audit logs.")
    pdf.bold_bullet("Grievance Officer — ", "Appoint a Data Protection Officer and publish their name "
        "and contact on the site.")

    pdf.info_box(
        "Supabase project at ap-south-1 (Mumbai) — India data residency verified. Also verify the "
        "Data Processing Agreement with Supabase covers DPDP Act 2023 obligations (not just GDPR).",
        (83, 23, 231)
    )

    pdf.sub_title("Quick Wins — This Week")
    pdf.bullet("Privacy Policy (layered: summary + full version)")
    pdf.bullet("Consent checkboxes on registration (not pre-ticked)")
    pdf.bullet("Parental consent flow for under-18 users")
    pdf.bullet("Data deletion API endpoint for account closure")
    pdf.bullet("DPO / Grievance Officer contact page")

    # ═══════════════════════════════════════
    # SECTION 3: INTELLECTUAL PROPERTY
    # ═══════════════════════════════════════
    pdf.add_page()
    pdf.section_title("3", "Intellectual Property & Branding")

    pdf.sub_title("Protection Strategy")
    pdf.bold_bullet("\"CLATly\" Brand Name — ", "File TM Application (Class 41 — education; "
        "Class 9 — software/app). Priority date matters even before registration.")
    pdf.bold_bullet("Logo & Visual Identity — ", "Copyright as artistic work. Use \u2122 marking "
        "until registration.")
    pdf.bold_bullet("Question Bank Content — ", "Copyright exists on creation. Display "
        "\"\u00a9 CLATly, 2026\" in site footer.")
    pdf.bold_bullet("AI-Generated Content — ", "Under Indian law, AI outputs have NO copyright "
        "(no human author). Protect curation, platform code, and database structure instead.")
    pdf.bold_bullet("Domain Names — ", "clatly.com registered. Also register: clatly.in, "
        "clatprep.in, and typo-squatting variants.")

    pdf.info_box(
        "If a user copies and republishes AI-generated answers from your platform, you have limited "
        "legal recourse since those outputs aren't copyrightable. Focus protection on the platform "
        "itself (UI, code, database structure).",
        (180, 50, 50)
    )

    # ═══════════════════════════════════════
    # SECTION 4: TERMS OF SERVICE & AI DISCLAIMERS
    # ═══════════════════════════════════════
    pdf.add_page()
    pdf.section_title("4", "Terms of Service & AI Liability Disclaimers")

    pdf.body_text(
        "This is the highest-risk area for an AI-powered EdTech platform. The ToS must cover:"
    )

    pdf.sub_title("Essential Clauses")
    pdf.bold_bullet("Service Description — ", "Define what AI does and does not do "
        "(assistance \u2260 coaching, no exam guarantee)")
    pdf.bold_bullet("User Eligibility — ", "Min. age 13; under-18 requires parent/guardian acceptance")
    pdf.bold_bullet("Subscriptions — ", "Billing terms, auto-renewal, refund policy "
        "(no statutory right to refund for digital goods)")
    pdf.bold_bullet("User Conduct — ", "Prohibit answer-sharing, scraping, multi-account abuse")
    pdf.bold_bullet("AI Disclaimer — ", "Critical — see below")
    pdf.bold_bullet("Limitation of Liability — ", "Cap at subscription fees paid in last 12 months. "
        "Disclaim exam results and indirect damages")
    pdf.bold_bullet("Dispute Resolution — ", "Jurisdiction specified. Arbitration clause optional")
    pdf.bold_bullet("Termination — ", "Right to suspend for ToS violation. 30-day data retention "
        "post-termination, then delete")
    pdf.bold_bullet("Updates — ", "30-day notice for material changes")

    pdf.ln(2)
    pdf.sub_title("Required AI Disclaimer")

    # Disclaimer box
    pdf.set_fill_color(245, 240, 255)
    y_box = pdf.get_y()
    pdf.set_font("DejaVu", "B", 9)
    pdf.set_text_color(83, 23, 231)
    pdf.set_x(12)
    pdf.cell(0, 6, "   AI-Powered Assistance Disclaimer (must be prominent)", new_x="LMARGIN", new_y="NEXT")

    disclaimer_text = (
        "The CLATly AI Mentor and related AI features provide informational guidance, practice "
        "questions, and explanatory content only. They:\n\n"
        "\u2022  Are NOT a substitute for professional legal coaching, structured coursework, or human mentorship\n"
        "\u2022  Do NOT guarantee any specific CLAT rank, score, admission, or selection outcome\n"
        "\u2022  May occasionally produce incomplete, inaccurate, or outdated information\n"
        "\u2022  Should not be relied upon for time-sensitive exam strategy decisions\n\n"
        "CLATly makes no warranty regarding the accuracy, completeness, or fitness of AI-generated "
        "content for any particular purpose. Your use of AI features is at your own risk."
    )
    pdf.set_x(12)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(186, 4.5, disclaimer_text)
    y_box_end = pdf.get_y()
    pdf.set_fill_color(245, 240, 255)
    pdf.rect(10, y_box - 1, 190, y_box_end - y_box + 2, style="F")
    pdf.set_xy(10, y_box_end + 1)
    pdf.set_text_color(40, 40, 40)
    pdf.ln(2)

    # ═══════════════════════════════════════
    # SECTION 5: PAYMENT PROCESSING
    # ═══════════════════════════════════════
    pdf.add_page()
    pdf.section_title("5", "Online Payment Processing")

    pdf.sub_title("Compliance Requirements")
    pdf.bold_bullet("Payment Gateway — ", "Use RBI-authorized aggregator "
        "(Razorpay recommended for subscription billing)")
    pdf.bold_bullet("PCI-DSS — ", "Use hosted checkout — never store card data on your server")
    pdf.bold_bullet("RBI Recurring Payments — ", "Explicit mandate, pre-transaction notification, "
        "easy cancellation, SMS/email confirmation")
    pdf.bold_bullet("Refund Policy — ", "Must be published. Fair policy (e.g., 7-day cooling-off "
        "for first purchase) builds trust")
    pdf.bold_bullet("GST — ", "18% on digital educational services. Register if turnover >\u20b920L. "
        "Issue invoices with HSN 998439")
    pdf.bold_bullet("TCS — ", "Check Section 206C(1H) applicability if using Razorpay marketplace model")

    pdf.sub_title("Recommended Stack")
    pdf.bullet("Gateway: Razorpay Subscriptions API + webhooks for billing events")
    pdf.bullet("Integration: Hosted checkout page only — never bring raw card/PIN data to your server")
    pdf.bullet("Invoicing: Auto-generate invoices per transaction with GSTIN and HSN code")

    # ═══════════════════════════════════════
    # PRIORITY ACTION PLAN
    # ═══════════════════════════════════════
    pdf.add_page()
    pdf.section_title("", "Priority Action Plan")

    pdf.body_text(
        "The following actions are organized by priority. Critical items must be completed "
        "before the paid launch. Use issue #27 on the CLAT Prep Hub board to track progress."
    )

    rows = [
        ("[CRIT]", "Critical", "Draft & publish DPDP-compliant Privacy Policy + ToS", "Before paid launch"),
        ("[CRIT]", "Critical", "Parental consent mechanism for under-18 users", "Before paid launch"),
        ("[CRIT]", "Critical", "AI disclaimer in ToS + consent on first AI use", "Before paid launch"),
        ("[HIGH]", "High", "File trademark application for \"CLATly\"", "This month"),
        ("[HIGH]", "High", "Register for GST (if projected >\u20b920L annual)", "Before 1st subscription"),
        ("[HIGH]", "High", "Set up Razorpay with DPDP-compliant DPA", "Before paid launch"),
        ("[MED]", "Medium", "ASCI ad review checklist + pre-approval process", "Before marketing campaign"),
        ("[MED]", "Medium", "Grievance Officer / DPO contact page", "Before paid launch"),
    ]

    pdf.priority_table(rows)

    pdf.status_box("Issue #27 created on CLAT Prep Hub project board with all checklist items tracked.")

    pdf.ln(5)

    # Summary boxes
    pdf.sub_title("Status Overview")
    pdf.set_font("DejaVu", "", 9)
    pdf.set_text_color(40, 40, 40)

    summary_items = [
        ("Git Repository", "docs/legal-consultation.md", "[OK] Committed & pushed"),
        ("Git Tag", "legal", "[OK] Applied to commit 0ea3d96"),
        ("GitHub Issue", "#27 -- Legal Compliance Review", "[OK] Created & labeled"),
        ("Project Board", "CLAT Prep Hub (Status: Todo)", "[OK] Added to board"),
    ]

    col_w = [35, 100, 50]
    pdf.set_font("DejaVu", "B", 9)
    pdf.set_fill_color(83, 23, 231)
    pdf.set_text_color(255, 255, 255)
    for i, h in enumerate(["Area", "Reference", "Status"]):
        pdf.cell(col_w[i], 7, h, border=1, align="C", fill=True)
    pdf.ln()

    pdf.set_font("DejaVu", "", 9)
    pdf.set_text_color(40, 40, 40)
    for row in summary_items:
        for i, cell_text in enumerate(row):
            pdf.cell(col_w[i], 7, cell_text, border=1)
        pdf.ln()

    pdf.ln(8)

    # Footer disclaimer
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(140, 140, 140)
    pdf.multi_cell(0, 4.5,
        "This document provides general legal guidance based on Indian law (DPDP Act 2023, "
        "Consumer Protection Act 2019, ASCI Guidelines, IT Act 2000, RBI regulations) as of "
        "July 2026. It does not constitute an attorney-client relationship. Specific contractual "
        "documents should be finalized with review of the live platform's features and data flows."
    )

    # Save
    pdf.output(OUTPUT_PATH)
    print(f"PDF saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    build_pdf()
