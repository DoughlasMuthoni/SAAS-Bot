import base64
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_STATIC = Path(__file__).parent.parent / "static"

def _logo_data_uri() -> str:
    logo_path = _STATIC / "logo.jpeg"
    if logo_path.exists():
        data = base64.b64encode(logo_path.read_bytes()).decode()
        return f"data:image/jpeg;base64,{data}"
    return ""


async def send_password_reset_email(to_email: str, reset_link: str) -> None:
    settings = get_settings()

    if not settings.SMTP_HOST:
        logger.info("SMTP not configured — password reset link", email=to_email, link=reset_link)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your DG ChatBot password"
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email

    text = (
        f"Reset your DG ChatBot password\n\n"
        f"Click the link below (expires in 1 hour):\n{reset_link}\n\n"
        f"If you didn't request this, ignore this email."
    )
    html = f"""
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#0f172a">
  <h2 style="font-size:1.3rem;font-weight:800;margin:0 0 8px">Reset your password</h2>
  <p style="color:#64748b;font-size:14px;margin:0 0 24px;line-height:1.6">
    We received a request to reset the password for your DG ChatBot admin account.
    Click the button below — this link expires in <strong>1 hour</strong>.
  </p>
  <a href="{reset_link}"
     style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:9px;text-decoration:none;font-weight:700;font-size:14px">
    Reset password →
  </a>
  <p style="color:#94a3b8;font-size:12px;margin:28px 0 0;line-height:1.6">
    If you didn't request a password reset, you can safely ignore this email.
    Your password will not change.
  </p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
  <p style="color:#94a3b8;font-size:11px;margin:0">
    DG ChatBot · Douglas Githui Tech Creatives · Kenya
  </p>
</div>
"""

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
            if settings.SMTP_TLS:
                smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        logger.info("Password reset email sent", email=to_email)
    except Exception as exc:
        logger.error("Failed to send reset email", email=to_email, error=str(exc))


async def send_lead_notification_email(
    to_emails: list[str],
    lead_name: str,
    lead_email: str | None,
    lead_phone: str | None,
    lead_message: str | None,
    bot_name: str,
    page_url: str | None,
) -> None:
    settings = get_settings()

    if not to_emails:
        return

    if not settings.SMTP_HOST:
        logger.info(
            "SMTP not configured — new lead captured",
            bot=bot_name,
            name=lead_name,
            email=lead_email,
            phone=lead_phone,
        )
        return

    rows = ""
    if lead_email:
        rows += f'<tr><td style="color:#64748b;font-size:13px;padding:6px 0;width:100px">Email</td><td style="font-size:13px;font-weight:600;padding:6px 0">{lead_email}</td></tr>'
    if lead_phone:
        rows += f'<tr><td style="color:#64748b;font-size:13px;padding:6px 0">Phone</td><td style="font-size:13px;font-weight:600;padding:6px 0">{lead_phone}</td></tr>'
    if lead_message:
        rows += f'<tr><td style="color:#64748b;font-size:13px;padding:6px 0;vertical-align:top">Message</td><td style="font-size:13px;padding:6px 0">{lead_message}</td></tr>'
    if page_url:
        rows += f'<tr><td style="color:#64748b;font-size:13px;padding:6px 0">Page</td><td style="font-size:13px;padding:6px 0"><a href="{page_url}" style="color:#16a34a">{page_url}</a></td></tr>'

    html = f"""
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#0f172a">
  <div style="display:inline-block;background:#16a34a;color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.04em;margin-bottom:16px">
    NEW LEAD
  </div>
  <h2 style="font-size:1.25rem;font-weight:800;margin:0 0 6px">{lead_name} left their contact details</h2>
  <p style="color:#64748b;font-size:13px;margin:0 0 20px">via <strong>{bot_name}</strong></p>
  <table style="width:100%;border-collapse:collapse;border-top:1px solid #e2e8f0">
    {rows}
  </table>
  <a href="{settings.ADMIN_WEB_URL}/leads"
     style="display:inline-block;margin-top:24px;background:#16a34a;color:#fff;padding:11px 24px;border-radius:9px;text-decoration:none;font-weight:700;font-size:13px">
    View in admin panel →
  </a>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px">
  <p style="color:#94a3b8;font-size:11px;margin:0">DG ChatBot · Douglas Githui Tech Creatives · Kenya</p>
</div>
"""

    plain = (
        f"New lead from {bot_name}\n\n"
        f"Name: {lead_name}\n"
        + (f"Email: {lead_email}\n" if lead_email else "")
        + (f"Phone: {lead_phone}\n" if lead_phone else "")
        + (f"Message: {lead_message}\n" if lead_message else "")
        + (f"Page: {page_url}\n" if page_url else "")
        + f"\nView leads: {settings.ADMIN_WEB_URL}/leads"
    )

    for recipient in to_emails:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"New lead: {lead_name} via {bot_name}"
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = recipient
        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html, "html"))
        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
                if settings.SMTP_TLS:
                    smtp.starttls()
                if settings.SMTP_USER:
                    smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                smtp.send_message(msg)
            logger.info("Lead notification sent", email=recipient, bot=bot_name)
        except Exception as exc:
            logger.error("Failed to send lead notification", email=recipient, error=str(exc))


async def send_invoice_email(
    to_emails: list[str],
    invoice: "InvoiceResponse",  # type: ignore[name-defined]  # avoid circular
    org_name: str,
) -> None:
    settings = get_settings()

    if not to_emails:
        return

    if not settings.SMTP_HOST:
        logger.info(
            "SMTP not configured — invoice email skipped",
            invoice=invoice.invoice_number,
            org=org_name,
        )
        return

    rows_html = "".join(
        f"""<tr>
          <td style="padding:9px 8px;font-size:13px;color:#0f172a;border-bottom:1px solid #f1f5f9">{item.description}</td>
          <td style="padding:9px 8px;font-size:13px;text-align:center;color:#64748b;border-bottom:1px solid #f1f5f9">{item.quantity}</td>
          <td style="padding:9px 8px;font-size:13px;text-align:right;color:#64748b;border-bottom:1px solid #f1f5f9">{invoice.currency} {item.unit_price:,.2f}</td>
          <td style="padding:9px 8px;font-size:13px;text-align:right;font-weight:700;border-bottom:1px solid #f1f5f9">{invoice.currency} {item.subtotal:,.2f}</td>
        </tr>"""
        for item in invoice.items
    )

    tax_row = ""
    if float(invoice.tax_rate) > 0:
        tax_row = f'<tr><td colspan="3" style="text-align:right;font-size:13px;color:#64748b;padding:5px 8px">Tax ({invoice.tax_rate}%)</td><td style="text-align:right;font-size:13px;padding:5px 8px">{invoice.currency} {invoice.tax_amount:,.2f}</td></tr>'

    logo_uri = _logo_data_uri()
    logo_html = (
        f'<img src="{logo_uri}" alt="DG ChatBot" style="height:40px;width:auto;object-fit:contain;display:block;margin-bottom:6px">'
        if logo_uri else ""
    )

    notes_block = ""
    if invoice.notes:
        notes_block = (
            '<div style="background:#f8fafc;border-left:3px solid #16a34a;padding:12px 16px;'
            'font-size:13px;color:#64748b;border-radius:4px;margin-bottom:24px">'
            '<strong style="display:block;margin-bottom:4px;font-size:11px;text-transform:uppercase;'
            'letter-spacing:.05em;color:#0f172a">Notes / Payment Instructions</strong>'
            f'{invoice.notes}</div>'
        )

    due_date_th = '<th style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding:0 16px 4px 16px">Due Date</th>' if invoice.due_date else ''
    due_date_td = f'<td style="font-size:13px;font-weight:700;padding:0 16px 16px 16px">{invoice.due_date}</td>' if invoice.due_date else ''

    html = f"""
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:580px;margin:0 auto;background:#fff;color:#0f172a">

  <!-- Header band -->
  <div style="background:#0f172a;padding:24px 32px;display:flex;align-items:center;justify-content:space-between">
    <div>
      {logo_html}
      <span style="color:#fff;font-size:13px;font-weight:700;letter-spacing:.02em">DG ChatBot</span>
    </div>
    <span style="background:#16a34a;color:#fff;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.05em">
      {invoice.status.upper()}
    </span>
  </div>

  <!-- Body -->
  <div style="padding:32px">
    <table style="width:100%;margin-bottom:24px">
      <tr>
        <td>
          <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px">Invoice</p>
          <p style="font-size:18px;font-weight:800;margin:0;font-family:monospace">{invoice.invoice_number}</p>
        </td>
        <td style="text-align:right">
          <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px">Billed To</p>
          <p style="font-size:14px;font-weight:700;margin:0">{org_name}</p>
        </td>
      </tr>
    </table>

    <table style="width:100%;margin-bottom:24px;background:#f8fafc;border-radius:8px;padding:16px">
      <tr>
        <td style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding:0 16px 4px 16px">Issue Date</td>
        {due_date_th}
        <td style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding:0 16px 4px 16px">Currency</td>
      </tr>
      <tr>
        <td style="font-size:13px;font-weight:700;padding:0 16px 16px 16px">{invoice.issue_date}</td>
        {due_date_td}
        <td style="font-size:13px;font-weight:700;padding:0 16px 16px 16px">{invoice.currency}</td>
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
      <thead>
        <tr style="border-bottom:2px solid #0f172a">
          <th style="text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;padding:0 8px 10px 0;font-weight:700">Description</th>
          <th style="text-align:center;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;padding:0 8px 10px;font-weight:700">Qty</th>
          <th style="text-align:right;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;padding:0 8px 10px;font-weight:700">Unit Price</th>
          <th style="text-align:right;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;padding:0 0 10px 8px;font-weight:700">Amount</th>
        </tr>
      </thead>
      <tbody>{rows_html}</tbody>
    </table>

    <table style="width:220px;border-collapse:collapse;margin-left:auto;margin-bottom:24px">
      <tr><td style="font-size:13px;color:#64748b;padding:5px 8px 5px 0">Subtotal</td><td style="font-size:13px;text-align:right;padding:5px 0">{invoice.currency} {invoice.subtotal:,.2f}</td></tr>
      {tax_row}
      <tr style="border-top:2px solid #0f172a">
        <td style="font-size:15px;font-weight:800;padding:10px 8px 10px 0">Total</td>
        <td style="font-size:15px;font-weight:800;text-align:right;padding:10px 0">{invoice.currency} {invoice.total:,.2f}</td>
      </tr>
    </table>

    {notes_block}

    <p style="font-size:13px;color:#64748b;margin:0 0 24px;line-height:1.6">
      Please remit payment by <strong>{invoice.due_date or "the due date"}</strong>.
      Questions? Reply to this email or contact us at
      <a href="mailto:githuiddoughlas8@gmail.com" style="color:#16a34a;text-decoration:none">githuiddoughlas8@gmail.com</a>.
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:11px;color:#94a3b8">DG ChatBot &nbsp;·&nbsp; Douglas Githui Tech Creatives &nbsp;·&nbsp; Nairobi, Kenya</span>
    <span style="font-size:11px;color:#94a3b8;font-family:monospace">{invoice.invoice_number}</span>
  </div>
</div>
"""

    plain = (
        f"Invoice {invoice.invoice_number} — {org_name}\n\n"
        f"Issue date: {invoice.issue_date}\n"
        + (f"Due date: {invoice.due_date}\n" if invoice.due_date else "")
        + f"Total: {invoice.currency} {invoice.total:,.2f}\n\n"
        + (f"Notes: {invoice.notes}\n\n" if invoice.notes else "")
        + "Please remit payment by the due date. Contact us if you have questions."
    )

    for recipient in to_emails:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Invoice {invoice.invoice_number} from DG ChatBot — {invoice.currency} {invoice.total:,.2f}"
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = recipient
        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html, "html"))
        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
                if settings.SMTP_TLS:
                    smtp.starttls()
                if settings.SMTP_USER:
                    smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                smtp.send_message(msg)
            logger.info("Invoice email sent", email=recipient, invoice=invoice.invoice_number)
        except Exception as exc:
            logger.error("Failed to send invoice email", email=recipient, error=str(exc))
