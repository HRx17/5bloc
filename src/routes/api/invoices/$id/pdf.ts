import { createFileRoute } from '@tanstack/react-router'
import { getAuthUserOrNull, json } from '@/lib/api/get-user.server'

type Ctx = { params: Promise<{ id: string }> }

function escapeHtml(s: unknown) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function money(n: unknown) {
  return Number(n || 0).toLocaleString('en-IN')
}

function buildInvoiceHtml(inv: any, firm: { name: string; city?: string | null; gst?: string | null }) {
  const lines: any[] = Array.isArray(inv.line_items) ? inv.line_items : []
  const lineRows =
    lines.length > 0
      ? lines
          .map(
            (l) => `
        <tr>
          <td>${escapeHtml(l.description || l.label || l.name || '—')}</td>
          <td class="num">${escapeHtml(l.quantity ?? '')}</td>
          <td class="num">₹${money(l.rate ?? l.amount ?? 0)}</td>
          <td class="num">₹${money(l.amount ?? (Number(l.quantity || 0) * Number(l.rate || 0)))}</td>
        </tr>`
          )
          .join('')
      : `
        <tr>
          <td>${escapeHtml(inv.milestone_label || inv.phase || 'Professional fees')}</td>
          <td class="num">1</td>
          <td class="num">₹${money(inv.subtotal)}</td>
          <td class="num">₹${money(inv.subtotal)}</td>
        </tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(inv.invoice_number)} — 5Bloc</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: "DM Sans", Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #0C1220; background: #fff; }
    .brand { font-family: "Bebas Neue", Impact, sans-serif; letter-spacing: 0.06em; font-size: 28px; margin: 0; }
    .tag { color: #B7791F; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 2px; }
    .meta { display: flex; justify-content: space-between; gap: 24px; margin: 28px 0; }
    .box h3 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6B655C; }
    .box p { margin: 2px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th { text-align: left; padding: 10px 8px; border-bottom: 2px solid #0C1220; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6B655C; }
    td { padding: 10px 8px; border-bottom: 1px solid #E8E4DC; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { margin-top: 20px; margin-left: auto; width: 280px; font-size: 13px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { font-weight: 700; font-size: 16px; border-top: 2px solid #0C1220; margin-top: 8px; padding-top: 10px; }
    .footer { margin-top: 40px; font-size: 11px; color: #6B655C; border-top: 1px solid #E8E4DC; padding-top: 16px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;font-size:12px;color:#6B655C;">
    Use your browser Print → Save as PDF.
  </div>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <h1 class="brand">5BLOC</h1>
      <div class="tag">Build Together</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:20px;font-weight:700;">TAX INVOICE</div>
      <div style="font-size:13px;margin-top:4px;">${escapeHtml(inv.invoice_number)}</div>
      <div style="font-size:12px;color:#6B655C;margin-top:4px;">Status: ${escapeHtml(inv.status || 'draft')}</div>
    </div>
  </div>

  <div class="meta">
    <div class="box">
      <h3>From</h3>
      <p><strong>${escapeHtml(firm.name)}</strong></p>
      ${firm.city ? `<p>${escapeHtml(firm.city)}</p>` : ''}
      ${firm.gst ? `<p>GSTIN: ${escapeHtml(firm.gst)}</p>` : ''}
    </div>
    <div class="box">
      <h3>Bill to</h3>
      <p><strong>${escapeHtml(inv.client_name || 'Client')}</strong></p>
      <p>Project: ${escapeHtml(inv.project_name || '—')}</p>
      ${inv.milestone_label ? `<p>${escapeHtml(inv.milestone_label)}</p>` : ''}
    </div>
    <div class="box">
      <h3>Dates</h3>
      <p>Issue: ${escapeHtml(inv.issue_date || (inv.created_at || '').slice(0, 10) || '—')}</p>
      <p>Due: ${escapeHtml(inv.due_date || '—')}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Qty</th>
        <th class="num">Rate</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineRows}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>₹${money(inv.subtotal ?? inv.amount)}</span></div>
    ${Number(inv.cgst_amount || 0) ? `<div><span>CGST</span><span>₹${money(inv.cgst_amount)}</span></div>` : ''}
    ${Number(inv.sgst_amount || 0) ? `<div><span>SGST</span><span>₹${money(inv.sgst_amount)}</span></div>` : ''}
    ${Number(inv.igst_amount || 0) ? `<div><span>IGST</span><span>₹${money(inv.igst_amount)}</span></div>` : ''}
    <div class="grand"><span>Total</span><span>₹${money(inv.total ?? inv.amount)}</span></div>
  </div>

  ${inv.notes ? `<p style="margin-top:24px;font-size:13px;"><strong>Notes:</strong> ${escapeHtml(inv.notes)}</p>` : ''}

  <div class="footer">
    Generated by 5Bloc · ${escapeHtml(firm.name)} · Print or Save as PDF from your browser.
  </div>
</body>
</html>`
}

const handleGET = async ({ request, params }: any) => {
  const id = params.id as string
  const auth = await getAuthUserOrNull(request)
  if (!auth) return json({ error: 'Unauthorized' }, { status: 401 })

  let invoice: any = null
  let firm = {
    name: auth.profile.organisations?.name || 'Architecture Firm',
    city: auth.profile.organisations?.city || null,
    gst: auth.profile.organisations?.gst_number || null,
  }
  {
    const { data, error } = await auth.supabase
      .from('invoices')
      .select('*, projects(name)')
      .eq('id', id)
      .eq('org_id', auth.orgId)
      .maybeSingle()
    if (error) return json({ error: error.message }, { status: 500 })
    if (!data) return json({ error: 'Not found' }, { status: 404 })
    invoice = {
      ...data,
      project_name: (data as any).project_name || (data as any).projects?.name || '—',
    }
    if (auth.orgId) {
      const { data: org } = await auth.supabase
        .from('organisations')
        .select('name, city, gst_number')
        .eq('id', auth.orgId)
        .maybeSingle()
      if (org) {
        firm = {
          name: org.name || firm.name,
          city: org.city || null,
          gst: org.gst_number || null,
        }
      }
    }
  }

  const html = buildInvoiceHtml(invoice, firm)
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export const Route = createFileRoute('/api/invoices/$id/pdf')({
  server: {
    handlers: {
        GET: handleGET,
    },
  },
})
