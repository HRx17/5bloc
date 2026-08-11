'use client'

import { useId, useRef, useState } from 'react'
import { Download, FileSpreadsheet, Link2, Loader2, Upload } from 'lucide-react'
import {
  downloadCatalogTemplate,
  parseCatalogCsv,
  type CatalogRow,
} from '@/lib/catalog/csv'
import { PartnerField, partnerInputProps } from '@/components/site/PartnerSignupChrome'

export type CatalogMethod = 'csv' | 'url' | 'later'

export type CatalogImportState = {
  method: CatalogMethod
  sourceUrl: string
  fileName: string
  itemCount: number
  sample: CatalogRow[]
  file: File | null
  importId: string | null
  progress: number
  status: 'idle' | 'parsing' | 'uploading' | 'ready' | 'error'
  error: string
}

export const EMPTY_CATALOG_STATE: CatalogImportState = {
  method: 'csv',
  sourceUrl: '',
  fileName: '',
  itemCount: 0,
  sample: [],
  file: null,
  importId: null,
  progress: 0,
  status: 'idle',
  error: '',
}

const BATCH = 400

export function VendorCatalogImport({
  email: _email,
  value,
  onChange,
}: {
  email: string
  value: CatalogImportState
  onChange: (next: CatalogImportState) => void
}) {
  void _email
  const input = partnerInputProps()
  const fileRef = useRef<HTMLInputElement>(null)
  const groupId = useId()
  const [localBusy, setLocalBusy] = useState(false)

  function set(patch: Partial<CatalogImportState>) {
    onChange({ ...value, ...patch })
  }

  async function handleCsv(file: File) {
    setLocalBusy(true)
    set({ status: 'parsing', error: '', fileName: file.name, file, progress: 5 })
    try {
      const text = await file.text()
      const { rows, errors } = parseCatalogCsv(text)
      if (errors.length) {
        set({ status: 'error', error: errors[0], progress: 0 })
        return
      }
      set({
        method: 'csv',
        itemCount: rows.length,
        sample: rows.slice(0, 8),
        status: 'ready',
        progress: 100,
        error: '',
      })
    } catch {
      set({ status: 'error', error: 'Could not read that CSV. Export as UTF-8 CSV and try again.', progress: 0 })
    } finally {
      setLocalBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const methods: { id: CatalogMethod; title: string; body: string; icon: React.ReactNode }[] = [
    {
      id: 'csv',
      title: 'Upload CSV (best for 10,000+ SKUs)',
      body: 'Export from Tally, Zoho, Excel, or your ERP. We accept 25 MB / 100k+ rows.',
      icon: <FileSpreadsheet className="h-5 w-5" />,
    },
    {
      id: 'url',
      title: 'Link your live catalogue',
      body: 'Website, PDF, or Google Sheet — we ingest it before your listing goes live.',
      icon: <Link2 className="h-5 w-5" />,
    },
    {
      id: 'later',
      title: 'Skip for now',
      body: 'Create your profile today. Import the full catalogue after your invite.',
      icon: <Upload className="h-5 w-5" />,
    },
  ]

  return (
    <div className="grid gap-5" role="group" aria-labelledby={`${groupId}-label`}>
      <p id={`${groupId}-label`} className="sr-only">
        How will you share your product catalogue?
      </p>

      <div className="grid gap-2" role="radiogroup" aria-label="Catalogue import method">
        {methods.map((m) => {
          const active = value.method === m.id
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => set({ method: m.id, error: '', status: m.id === value.method ? value.status : 'idle' })}
              className="flex items-start gap-3 rounded-xl px-4 py-3.5 text-left transition-all"
              style={{
                background: active ? 'rgba(245,166,35,0.08)' : 'var(--lp-bg-alt)',
                boxShadow: active
                  ? 'inset 0 0 0 1.5px rgba(245,166,35,0.45)'
                  : 'inset 0 0 0 1px var(--lp-border)',
                color: 'var(--lp-text)',
              }}
            >
              <span style={{ color: active ? 'var(--lp-brand)' : 'var(--lp-text-secondary)' }}>{m.icon}</span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold">{m.title}</span>
                <span className="block text-[13px] mt-0.5" style={{ color: 'var(--lp-text-secondary)' }}>
                  {m.body}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {value.method === 'csv' && (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={localBusy}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-medium"
              style={{
                background: 'var(--lp-brand)',
                color: 'var(--lp-on-brand)',
              }}
            >
              {localBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Choose CSV file
            </button>
            <button
              type="button"
              onClick={downloadCatalogTemplate}
              className="inline-flex items-center gap-2 text-[13px] font-medium"
              style={{ color: 'var(--lp-brand-dk)' }}
            >
              <Download className="h-4 w-4" />
              Download template
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleCsv(f)
              }}
            />
          </div>
          <p className="text-[12px]" style={{ color: 'var(--lp-text-secondary)' }}>
            Required columns: <strong>name</strong> or <strong>sku</strong>. Optional: category, unit, price, currency, brand, description.
            Excel users: File → Save As → CSV UTF-8.
          </p>
          {value.fileName && (
            <p className="text-[13px] font-medium" style={{ color: 'var(--lp-text)' }}>
              {value.fileName}
              {value.itemCount > 0 && (
                <span style={{ color: 'var(--lp-text-secondary)' }}>
                  {' '}
                  · {value.itemCount.toLocaleString()} items detected
                </span>
              )}
            </p>
          )}
          {value.sample.length > 0 && (
            <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--lp-border)' }}>
              <table className="w-full text-left text-[12px]">
                <caption className="sr-only">Sample of parsed catalogue rows</caption>
                <thead style={{ background: 'var(--lp-bg-alt)', color: 'var(--lp-text-secondary)' }}>
                  <tr>
                    <th className="px-3 py-2 font-medium">SKU</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {value.sample.map((r) => (
                    <tr key={r.sku + r.name} style={{ borderTop: '1px solid var(--lp-border)', color: 'var(--lp-text)' }}>
                      <td className="px-3 py-2 font-mono">{r.sku}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.category || '—'}</td>
                      <td className="px-3 py-2">{r.price ? `${r.currency} ${r.price}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {value.method === 'url' && (
        <PartnerField label="Catalogue URL" required hint="Public website, PDF, or Google Sheets link">
          <input
            {...input}
            type="url"
            value={value.sourceUrl}
            onChange={(e) => set({ sourceUrl: e.target.value, status: 'ready' })}
            placeholder="https://docs.google.com/spreadsheets/d/… or https://yoursite.com/catalogue"
          />
        </PartnerField>
      )}

      {value.method === 'later' && (
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--lp-text-secondary)' }}>
          You can still get discovered by category and city. When you receive your invite, open{' '}
          <strong>Catalog</strong> in the app to upload CSV — even lists with 10,000+ SKUs.
        </p>
      )}

      {value.error && (
        <p role="alert" className="text-[13px]" style={{ color: '#c62828' }}>
          {value.error}
        </p>
      )}

      {value.status === 'uploading' && (
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ background: 'var(--lp-bg-alt)' }}
          role="progressbar"
          aria-valuenow={value.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Catalogue upload progress"
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${value.progress}%`, background: 'var(--lp-brand)' }}
          />
        </div>
      )}
    </div>
  )
}

/** Imperative helper used by the join-as-vendor submit handler */
export async function submitVendorCatalog(
  email: string,
  state: CatalogImportState,
  signupId?: string | null,
): Promise<{ ok: boolean; importId: string | null; error?: string }> {
  if (state.method === 'later') {
    const res = await fetch('/api/public/vendor-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, method: 'later', signupId }),
    })
    const json = await res.json()
    return { ok: res.ok, importId: json.importId ?? null, error: json.error }
  }

  if (state.method === 'url') {
    if (!state.sourceUrl.trim()) {
      return { ok: false, importId: null, error: 'Paste a catalogue or Google Sheet URL.' }
    }
    const res = await fetch('/api/public/vendor-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        method: state.sourceUrl.includes('docs.google.com') ? 'sheet' : 'url',
        sourceUrl: state.sourceUrl.trim(),
        signupId,
      }),
    })
    const json = await res.json()
    return { ok: res.ok, importId: json.importId ?? null, error: json.error }
  }

  if (!state.file || state.itemCount === 0) {
    return { ok: false, importId: null, error: 'Upload a CSV with at least one product row, or choose another option.' }
  }

  const form = new FormData()
  form.append('file', state.file)
  form.append('email', email)
  form.append('method', 'csv')
  form.append('totalRows', String(state.itemCount))
  if (signupId) form.append('signupId', signupId)

  const fileRes = await fetch('/api/public/vendor-catalog', { method: 'POST', body: form })
  const fileJson = await fileRes.json()
  if (!fileRes.ok) {
    return { ok: false, importId: null, error: fileJson.error || 'File upload failed' }
  }

  let importId = (fileJson.importId as string | null) ?? null
  const text = await state.file.text()
  const { rows } = parseCatalogCsv(text)

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const done = i + BATCH >= rows.length
    const res = await fetch('/api/public/vendor-catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        method: 'csv',
        signupId,
        importId,
        rows: chunk,
        sample: i === 0 ? rows.slice(0, 20) : undefined,
        totalRows: rows.length,
        done,
      }),
    })
    const json = await res.json()
    if (json.importId) importId = json.importId
  }

  return { ok: true, importId, error: undefined }
}
