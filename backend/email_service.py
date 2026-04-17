"""
email_service.py
────────────────
Async-friendly email helper using Python's built-in smtplib (no extra deps).
Sends a rich HTML welcome email whenever a student is enrolled.

Required .env variables:
  SMTP_HOST      – e.g. smtp.gmail.com
  SMTP_PORT      – e.g. 587
  SMTP_USER      – sender Gmail / mail address
  SMTP_PASSWORD  – Gmail App Password (or SMTP password)
  SMTP_FROM_NAME – Display name, e.g. "Raffles University"
"""

import os
import smtplib
import asyncio
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

logger = logging.getLogger(__name__)


# ── Config (read once at import time) ──────────────────────────────────────
SMTP_HOST      = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT      = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER      = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD  = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "Raffles University")
SMTP_ENABLED   = bool(SMTP_USER and SMTP_PASSWORD)


# ── HTML template ──────────────────────────────────────────────────────────
def _build_welcome_html(
    student_name: str,
    student_id: str,
    program_name: str,
    semester: int,
    enrollment_number: str,
    academic_session: str,
    department_name: str = "",
) -> str:
    year = datetime.now().year
    ordinal = {1:"1st",2:"2nd",3:"3rd"}.get(semester, f"{semester}th")
    dept_line = f"<p style='color:#64748b;font-size:14px;margin:4px 0;'>Department: <b>{department_name}</b></p>" if department_name else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Welcome to Raffles University</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header banner -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:40px 40px 32px;text-align:center;">
            <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 6px;letter-spacing:-0.5px;">
              🎓 Welcome to Raffles University
            </h1>
            <p style="color:#bfdbfe;font-size:14px;margin:0;">Neemrana, Rajasthan</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">

            <!-- Greeting -->
            <p style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 8px;">
              Hello, {student_name}! 👋
            </p>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
              We are absolutely thrilled to welcome you to the <b>Raffles University</b> family!
              Your enrollment has been confirmed and you are all set to begin your academic journey.
            </p>

            <!-- Highlight card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="color:#1e40af;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;">📋 Your Enrollment Details</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:14px;width:52%;">Student Name</td>
                      <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{student_name}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:14px;">Student ID</td>
                      <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{student_id}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:14px;">Enrollment No.</td>
                      <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{enrollment_number}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:14px;">Program</td>
                      <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{program_name}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:14px;">Semester</td>
                      <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{ordinal} Semester</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#64748b;font-size:14px;">Academic Session</td>
                      <td style="padding:6px 0;color:#1e293b;font-size:14px;font-weight:600;">{academic_session}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Quote / motivation -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;margin-bottom:28px;">
              <tr>
                <td style="padding:18px 22px;">
                  <p style="color:#334155;font-size:15px;font-style:italic;margin:0;line-height:1.7;">
                    "The beautiful thing about learning is that no one can take it away from you."
                  </p>
                  <p style="color:#94a3b8;font-size:12px;margin:8px 0 0;">— B.B. King</p>
                </td>
              </tr>
            </table>

            <!-- What's next -->
            <p style="color:#1e293b;font-size:16px;font-weight:700;margin:0 0 12px;">🚀 What's Next?</p>
            <ul style="color:#475569;font-size:14px;line-height:2;padding-left:20px;margin:0 0 28px;">
              <li>Check your timetable on the university portal</li>
              <li>Collect your student ID card from the admin office</li>
              <li>Attend the orientation session in Week 1</li>
              <li>Connect with your faculty and classmates</li>
            </ul>

            <p style="color:#475569;font-size:14px;line-height:1.7;margin:0;">
              If you have any questions, reach out to the academic office or reply to this email.
              We wish you a <b>successful and enriching semester ahead!</b> 🌟
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">
              <b style="color:#475569;">Raffles University</b> · Neemrana, Alwar, Rajasthan – 301705
            </p>
            <p style="color:#cbd5e1;font-size:11px;margin:0;">
              © {year} Raffles University. This is an automated message, please do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _build_plain_text(student_name: str, student_id: str, program_name: str, semester: int, enrollment_number: str, academic_session: str) -> str:
    ordinal = {1:"1st",2:"2nd",3:"3rd"}.get(semester, f"{semester}th")
    return f"""Welcome to Raffles University, {student_name}!

Your enrollment has been confirmed.

Enrollment Details
-------------------
Student Name    : {student_name}
Student ID      : {student_id}
Enrollment No.  : {enrollment_number}
Program         : {program_name}
Semester        : {ordinal} Semester
Academic Session: {academic_session}

"The beautiful thing about learning is that no one can take it away from you." — B.B. King

What's Next?
- Check your timetable on the university portal
- Collect your student ID card from the admin office
- Attend the orientation session in Week 1

We wish you a successful and enriching semester ahead!

Raffles University, Neemrana
This is an automated message.
"""


# ── Core send (synchronous, runs in thread) ────────────────────────────────
def _send_email_sync(to_email: str, subject: str, html_body: str, plain_body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
    msg["To"]      = to_email

    msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, to_email, msg.as_string())


# ── Public async function ──────────────────────────────────────────────────
async def send_enrollment_welcome_email(
    to_email: str,
    student_name: str,
    student_id: str,
    program_name: str,
    semester: int,
    enrollment_number: str,
    academic_session: str,
    department_name: str = "",
) -> bool:
    """
    Sends a welcome email to the newly enrolled student.
    Returns True on success, False on failure (never raises).
    If SMTP_USER / SMTP_PASSWORD are not configured, logs a warning and returns False.
    """
    if not SMTP_ENABLED:
        logger.warning("Email not sent: SMTP_USER or SMTP_PASSWORD is not configured in .env")
        return False

    subject    = f"Welcome to Raffles University, {student_name}! 🎓"
    html_body  = _build_welcome_html(student_name, student_id, program_name, semester, enrollment_number, academic_session, department_name)
    plain_body = _build_plain_text(student_name, student_id, program_name, semester, enrollment_number, academic_session)

    try:
        await asyncio.to_thread(_send_email_sync, to_email, subject, html_body, plain_body)
        logger.info(f"Welcome email sent to {to_email} ({student_name})")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {to_email}: {e}")
        return False
