import base64
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models import User
from app.schemas.platform import InvoiceResponse
from app.services.platform_service import PlatformService

router = APIRouter(prefix="/billing", tags=["billing"])

_STATIC = Path(__file__).parent.parent.parent / "static"


def _logo_data_uri() -> str:
    logo_path = _STATIC / "logo.jpeg"
    if logo_path.exists():
        data = base64.b64encode(logo_path.read_bytes()).decode()
        return f"data:image/jpeg;base64,{data}"
    return ""


@router.get("/invoices", response_model=list[InvoiceResponse])
async def list_my_invoices(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Return all invoices for the current user's organisation (read-only)."""
    return await PlatformService.list_invoices(db, org_id=user.org_id)


@router.get("/invoices/{invoice_id}/print", response_class=HTMLResponse, include_in_schema=False)
async def print_my_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Print-optimised HTML for an invoice belonging to the current user's org."""
    inv = await PlatformService.get_invoice(db, invoice_id)
    if inv is None or inv.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Invoice not found")

    rows = "".join(
        f"""<tr>
          <td class="desc">{item.description}</td>
          <td class="num">{item.quantity}</td>
          <td class="num">{inv.currency} {item.unit_price:,.2f}</td>
          <td class="num bold">{inv.currency} {item.subtotal:,.2f}</td>
        </tr>"""
        for item in inv.items
    )

    tax_row = ""
    if float(inv.tax_rate) > 0:
        tax_row = f'<tr><td colspan="3" class="num sub-label">Tax ({inv.tax_rate}%)</td><td class="num">{inv.currency} {inv.tax_amount:,.2f}</td></tr>'

    status_colors = {
        "draft": "#64748b", "sent": "#1d4ed8", "partial": "#d97706",
        "paid": "#15803d", "overdue": "#dc2626",
    }
    status_color = status_colors.get(inv.status, "#64748b")

    logo_uri = _logo_data_uri()
    logo_html = (
        f'<img src="{logo_uri}" alt="DG ChatBot" style="height:48px;width:auto;object-fit:contain;display:block;margin-bottom:8px">'
        if logo_uri else ""
    )

    partial_rows = ""
    if inv.status == "partial":
        partial_rows = (
            f'<tr><td style="color:#15803d;font-weight:600;padding-top:6px">Amount Paid</td>'
            f'<td style="text-align:right;color:#15803d;font-weight:600;padding-top:6px">{inv.currency} {float(inv.amount_paid):,.2f}</td></tr>'
            f'<tr><td style="color:#dc2626;font-weight:700;padding-top:4px">Balance Due</td>'
            f'<td style="text-align:right;color:#dc2626;font-weight:700;padding-top:4px">{inv.currency} {float(inv.balance_due):,.2f}</td></tr>'
        )
    paid_row = ""
    if inv.status == "paid":
        paid_row = (
            f'<tr><td style="color:#15803d;font-weight:600;padding-top:6px">Paid in Full</td>'
            f'<td style="text-align:right;color:#15803d;font-weight:600;padding-top:6px">{inv.paid_at[:10] if inv.paid_at else ""}</td></tr>'
        )

    notes_block = f'<div class="notes"><strong style="display:block;margin-bottom:4px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#0f172a">Notes / Payment Instructions</strong>{inv.notes}</div>' if inv.notes else ""
    due_date_cell = f'<div class="meta-item"><span>Due Date</span><strong>{inv.due_date}</strong></div>' if inv.due_date else ""

    return HTMLResponse(f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Invoice {inv.invoice_number}</title>
<style>
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;background:#fff;padding:40px;max-width:860px;margin:0 auto}}
  .header{{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}}
  .company{{font-size:11px;color:#64748b;line-height:1.8}}
  .company .name{{font-size:15px;font-weight:800;color:#0f172a;display:block;margin-bottom:2px}}
  .inv-meta{{text-align:right}}
  .inv-meta h1{{font-size:1.6rem;font-weight:800;color:#0f172a;letter-spacing:.04em}}
  .inv-meta .number{{font-size:13px;color:#64748b;margin-top:4px;font-family:monospace}}
  .badge{{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:{status_color};border:1.5px solid {status_color};margin-top:8px}}
  .meta-row{{display:flex;gap:40px;margin-bottom:28px;padding:16px 20px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}}
  .meta-item span{{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:3px}}
  .meta-item strong{{font-size:13px;color:#0f172a}}
  table{{width:100%;border-collapse:collapse;margin-bottom:20px}}
  thead tr{{border-bottom:2px solid #0f172a}}
  thead th{{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;padding:0 8px 10px;font-weight:700}}
  thead th.num{{text-align:right}}
  thead th.desc{{text-align:left}}
  tbody td{{padding:11px 8px;font-size:13px;border-bottom:1px solid #f1f5f9}}
  td.desc{{color:#0f172a}}
  td.num{{text-align:right;color:#0f172a}}
  td.bold{{font-weight:700}}
  td.sub-label{{text-align:right;color:#64748b}}
  .totals td{{border:none;padding:5px 8px;font-size:13px}}
  .totals .grand-total td{{font-size:15px;font-weight:800;border-top:2px solid #0f172a;padding-top:10px}}
  .notes{{background:#f8fafc;border-left:3px solid #16a34a;padding:12px 16px;font-size:13px;color:#64748b;border-radius:4px;margin:20px 0}}
  .footer{{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between;align-items:center}}
  @media print{{body{{padding:20px}}.no-print{{display:none}}}}
</style>
</head>
<body>
<div class="header">
  <div class="company">
    {logo_html}
    <span class="name">DG ChatBot</span>
    Douglas Githui Tech Creatives<br>
    Nairobi, Kenya<br>
    githuiddoughlas8@gmail.com
  </div>
  <div class="inv-meta">
    <h1>INVOICE</h1>
    <div class="number">{inv.invoice_number}</div>
    <div class="badge">{inv.status}</div>
  </div>
</div>

<div class="meta-row">
  <div class="meta-item"><span>Billed To</span><strong>{inv.org_name}</strong></div>
  <div class="meta-item"><span>Issue Date</span><strong>{inv.issue_date}</strong></div>
  {due_date_cell}
  <div class="meta-item"><span>Currency</span><strong>{inv.currency}</strong></div>
</div>

<table>
  <thead>
    <tr>
      <th class="desc">Description</th>
      <th class="num">Qty</th>
      <th class="num">Unit Price</th>
      <th class="num">Amount</th>
    </tr>
  </thead>
  <tbody>{rows}</tbody>
</table>

<table class="totals" style="width:280px;margin-left:auto">
  <tr><td style="color:#64748b">Subtotal</td><td style="text-align:right">{inv.currency} {inv.subtotal:,.2f}</td></tr>
  {tax_row}
  <tr class="grand-total"><td>Total</td><td style="text-align:right">{inv.currency} {inv.total:,.2f}</td></tr>
  {partial_rows}
  {paid_row}
</table>

{notes_block}

<div class="footer">
  <span>DG ChatBot &nbsp;·&nbsp; Douglas Githui Tech Creatives &nbsp;·&nbsp; githuiddoughlas8@gmail.com</span>
  <span>{inv.invoice_number}</span>
</div>

<div class="no-print" style="margin-top:36px;display:flex;gap:12px">
  <button onclick="window.print()" style="background:#0f172a;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">
    🖨 Print / Save as PDF
  </button>
  <button onclick="window.close()" style="background:#f1f5f9;color:#0f172a;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">
    Close
  </button>
</div>
</body>
</html>""")
