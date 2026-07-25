from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_superadmin
from app.core.database import get_db
from app.models import User
from app.schemas.platform import (
    AssignPlanRequest,
    InvoiceCreate,
    InvoiceResponse,
    InvoiceUpdate,
    OrgDetail,
    OrgListItem,
    SuspendRequest,
)
from app.services.platform_service import PlatformService

router = APIRouter(prefix="/platform", tags=["platform"])

_sa = Depends(require_superadmin)


# ── Organisations ─────────────────────────────────────────────────────────────

@router.get("/orgs", response_model=list[OrgListItem])
async def list_orgs(db: AsyncSession = Depends(get_db), _: User = _sa):
    return await PlatformService.list_orgs(db)


@router.get("/orgs/{org_id}", response_model=OrgDetail)
async def get_org(org_id: str, db: AsyncSession = Depends(get_db), _: User = _sa):
    detail = await PlatformService.get_org_detail(db, org_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Organisation not found")
    return detail


@router.post("/orgs/{org_id}/assign-plan", status_code=204)
async def assign_plan(org_id: str, body: AssignPlanRequest, db: AsyncSession = Depends(get_db), _: User = _sa):
    try:
        await PlatformService.assign_plan(db, org_id, body)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/orgs/{org_id}/suspend", status_code=204)
async def suspend_org(org_id: str, body: SuspendRequest, db: AsyncSession = Depends(get_db), _: User = _sa):
    try:
        await PlatformService.suspend_org(db, org_id, body.reason)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/orgs/{org_id}/activate", status_code=204)
async def activate_org(org_id: str, db: AsyncSession = Depends(get_db), _: User = _sa):
    try:
        await PlatformService.activate_org(db, org_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Invoices ──────────────────────────────────────────────────────────────────

@router.get("/invoices", response_model=list[InvoiceResponse])
async def list_invoices(
    org_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = _sa,
):
    return await PlatformService.list_invoices(db, org_id=org_id)


@router.post("/invoices", response_model=InvoiceResponse, status_code=201)
async def create_invoice(body: InvoiceCreate, db: AsyncSession = Depends(get_db), _: User = _sa):
    if not body.items:
        raise HTTPException(status_code=422, detail="At least one line item is required")
    return await PlatformService.create_invoice(db, body)


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str, db: AsyncSession = Depends(get_db), _: User = _sa):
    inv = await PlatformService.get_invoice(db, invoice_id)
    if inv is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


@router.put("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(invoice_id: str, body: InvoiceUpdate, db: AsyncSession = Depends(get_db), _: User = _sa):
    try:
        inv = await PlatformService.update_invoice(db, invoice_id, body)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    if inv is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


@router.post("/invoices/{invoice_id}/send", response_model=InvoiceResponse)
async def send_invoice(invoice_id: str, db: AsyncSession = Depends(get_db), _: User = _sa):
    inv = await PlatformService.send_invoice(db, invoice_id)
    if inv is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


@router.post("/invoices/{invoice_id}/mark-paid", response_model=InvoiceResponse)
async def mark_paid(invoice_id: str, db: AsyncSession = Depends(get_db), _: User = _sa):
    inv = await PlatformService.mark_paid(db, invoice_id)
    if inv is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


@router.delete("/invoices/{invoice_id}", status_code=204)
async def delete_invoice(invoice_id: str, db: AsyncSession = Depends(get_db), _: User = _sa):
    try:
        found = await PlatformService.delete_invoice(db, invoice_id)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    if not found:
        raise HTTPException(status_code=404, detail="Invoice not found")


@router.get("/invoices/{invoice_id}/print", response_class=HTMLResponse, include_in_schema=False)
async def print_invoice(invoice_id: str, db: AsyncSession = Depends(get_db), _: User = _sa):
    """Returns a print-optimised HTML page for the invoice (browser print-to-PDF)."""
    inv = await PlatformService.get_invoice(db, invoice_id)
    if inv is None:
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
        "draft": "#64748b",
        "sent": "#1d4ed8",
        "paid": "#15803d",
        "overdue": "#dc2626",
    }
    status_color = status_colors.get(inv.status, "#64748b")

    return HTMLResponse(f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Invoice {inv.invoice_number}</title>
<style>
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;background:#fff;padding:40px}}
  .header{{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}}
  .company{{font-size:11px;color:#64748b;line-height:1.8}}
  .company strong{{font-size:16px;color:#0f172a;display:block;margin-bottom:4px}}
  .inv-meta{{text-align:right}}
  .inv-meta h1{{font-size:1.6rem;font-weight:800;color:#0f172a}}
  .inv-meta .number{{font-size:13px;color:#64748b;margin-top:4px}}
  .badge{{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:{status_color};border:1.5px solid {status_color};margin-top:8px}}
  .meta-row{{display:flex;gap:40px;margin-bottom:28px;padding:16px;background:#f8fafc;border-radius:8px}}
  .meta-item span{{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:2px}}
  .meta-item strong{{font-size:13px}}
  table{{width:100%;border-collapse:collapse;margin-bottom:20px}}
  thead tr{{border-bottom:2px solid #e2e8f0}}
  thead th{{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;padding:0 8px 10px;font-weight:600}}
  thead th.num{{text-align:right}}
  thead th.desc{{text-align:left}}
  tbody td{{padding:10px 8px;font-size:13px;border-bottom:1px solid #f1f5f9}}
  td.desc{{color:#0f172a}}
  td.num{{text-align:right;color:#0f172a}}
  td.bold{{font-weight:700}}
  td.sub-label{{text-align:right;color:#64748b}}
  .totals td{{border:none;padding:5px 8px;font-size:13px}}
  .totals .grand-total td{{font-size:15px;font-weight:800;border-top:2px solid #0f172a;padding-top:10px}}
  .notes{{background:#f8fafc;border-left:3px solid #e2e8f0;padding:12px 16px;font-size:13px;color:#64748b;border-radius:4px;margin:20px 0}}
  .footer{{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}}
  @media print{{
    body{{padding:20px}}
    .no-print{{display:none}}
  }}
</style>
</head>
<body>
<div class="header">
  <div class="company">
    <strong>DG ChatBot</strong>
    Douglas Githui Tech Creatives<br>
    Kenya<br>
    smvscapital@gmail.com
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
  {f'<div class="meta-item"><span>Due Date</span><strong>{inv.due_date}</strong></div>' if inv.due_date else ''}
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

<table class="totals" style="width:240px;margin-left:auto">
  <tr><td style="color:#64748b">Subtotal</td><td style="text-align:right">{inv.currency} {inv.subtotal:,.2f}</td></tr>
  {tax_row}
  <tr class="grand-total"><td>Total</td><td style="text-align:right">{inv.currency} {inv.total:,.2f}</td></tr>
  {f'<tr><td style="color:#15803d;font-weight:600">Paid</td><td style="text-align:right;color:#15803d;font-weight:600">{inv.paid_at[:10] if inv.paid_at else ""}</td></tr>' if inv.status == 'paid' else ''}
</table>

{f'<div class="notes"><strong style="display:block;margin-bottom:4px;font-size:12px;color:#0f172a">Notes</strong>{inv.notes}</div>' if inv.notes else ''}

<div class="footer">
  DG ChatBot · Douglas Githui Tech Creatives · Kenya &nbsp;·&nbsp;
  Generated {inv.invoice_number}
</div>

<div class="no-print" style="margin-top:32px;display:flex;gap:12px">
  <button onclick="window.print()" style="background:#0f172a;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">
    Print / Save as PDF
  </button>
  <button onclick="window.close()" style="background:#f1f5f9;color:#0f172a;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">
    Close
  </button>
</div>
</body>
</html>""")
