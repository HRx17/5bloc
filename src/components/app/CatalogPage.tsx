import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from '@/compat/next-link'
import { Download, FileSpreadsheet, Loader2, Search, Upload } from 'lucide-react'
import { ErrorState } from '@/components/ui5/ErrorState'
import { EmptyState } from '@/components/ui5/EmptyState'
import { Skeleton } from '@/components/ui5/Skeleton'
import {
  downloadCatalogTemplate,
  parseCatalogCsv,
  type CatalogRow,
} from '@/lib/catalog/csv'
import { createSupabaseClient } from '@/lib/supabase/client'
import { submitVendorCatalog, EMPTY_CATALOG_STATE, type CatalogImportState } from '@/components/catalog/VendorCatalogImport'

type CatalogItem = CatalogRow & { id?: string }

export default function CatalogPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<string>('vendor')
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [query, setQuery] = useState('')
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        setLoading(false)
        return
      }
      setEmail(user.email)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('auth_id', user.id)
        .maybeSingle()
      if (profile?.role) setRole(profile.role)

      const { data, error: qErr } = await (supabase as any)
        .from('vendor_catalog_items')
        .select('id, sku, name, category, unit, price, currency, brand, description')
        .eq('owner_email', user.email)
        .order('name')
        .limit(200)

      if (qErr) throw new Error('Could not read your catalogue')
      if (data) {
        setItems(
          data.map((r: Record<string, unknown>) => ({
            id: String(r.id),
            sku: String(r.sku ?? ''),
            name: String(r.name ?? ''),
            category: String(r.category ?? ''),
            unit: String(r.unit ?? 'ea'),
            price: r.price != null ? String(r.price) : '',
            currency: String(r.currency ?? 'INR'),
            brand: String(r.brand ?? ''),
            description: String(r.description ?? ''),
          })),
        )
      }
    } catch (err) {
      setLoadError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q),
    )
  }, [items, query])

  async function onCsvChosen(file: File) {
    setError('')
    setMessage('')
    setImporting(true)
    setProgress(10)
    try {
      const text = await file.text()
      const { rows, errors } = parseCatalogCsv(text)
      if (errors.length) {
        setError(errors[0])
        return
      }
      setProgress(30)
      const state: CatalogImportState = {
        ...EMPTY_CATALOG_STATE,
        method: 'csv',
        file,
        fileName: file.name,
        itemCount: rows.length,
        sample: rows.slice(0, 8),
        status: 'ready',
      }
      const result = await submitVendorCatalog(email || 'unknown@vendor.local', state)
      setProgress(100)
      if (!result.ok) {
        setError(result.error || 'Import failed')
        return
      }
      setMessage(`Imported ${rows.length.toLocaleString()} items from ${file.name}. Showing the first page below after refresh.`)
      setItems(rows.slice(0, 200))
    } catch {
      setError('Could not import that file. Export as UTF-8 CSV and try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div id="main-content" className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker mb-1">Vendor tools</p>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--on-surface)' }}>
            Product catalogue
          </h1>
          <p className="mt-1 text-[13.5px] max-w-xl" style={{ color: 'var(--on-surface-variant)' }}>
            Upload CSV exports from Tally, Zoho, Excel, or your ERP. Built for distributors with 10,000+ SKUs —
            we chunk the upload so signup never blocks on typing every item.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadCatalogTemplate}
            className="btn-secondary inline-flex items-center gap-2 text-[12.5px]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Template CSV
          </button>
          <label className="btn-primary inline-flex items-center gap-2 text-[12.5px] cursor-pointer">
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" aria-hidden />}
            {importing ? 'Importing…' : 'Upload CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={importing || !email}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onCsvChosen(f)
                e.currentTarget.value = ''
              }}
            />
          </label>
        </div>
      </header>

      {importing && (
        <div
          className="mb-4 h-2 w-full overflow-hidden rounded-full"
          style={{ background: 'var(--surface-container-high)' }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Import progress"
        >
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--amber)' }} />
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 text-[13px]" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mb-4 text-[13px]" style={{ color: 'var(--success)' }}>
          {message}
        </p>
      )}

      <section
        className="rounded-2xl p-4 mb-5"
        style={{ background: 'var(--surface-container)', boxShadow: 'inset 0 0 0 1px var(--hairline)' }}
      >
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--purple)' }} aria-hidden />
          <div className="text-[13px] leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            <strong style={{ color: 'var(--on-surface)' }}>Still on the waitlist?</strong>{' '}
            Use{' '}
            <Link href="/join-as-vendor" className="underline" style={{ color: 'var(--amber)' }}>
              Join as vendor
            </Link>{' '}
            to submit your profile + catalogue before invite. After you have an account, re-upload here anytime.
          </div>
        </div>
      </section>

      <div className="mb-4 relative max-w-md">
        <label htmlFor="catalog-search" className="sr-only">Search catalogue</label>
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
          style={{ color: 'var(--stone)' }}
          aria-hidden
        />
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search SKU, name, brand…"
          className="input-5bloc pl-9 h-10 text-[13px]"
        />
      </div>

      <div
        className="overflow-x-auto rounded-2xl"
        style={{ background: 'var(--surface-container)', boxShadow: 'inset 0 0 0 1px var(--hairline)' }}
      >
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : loadError ? (
          <ErrorState
            title="Could not load your catalogue"
            description="Nothing has been deleted — we could not read your items. You can still upload a CSV while this is failing."
            error={loadError}
            onRetry={load}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={query.trim() ? 'search_off' : 'inventory_2'}
            title={query.trim() ? `No SKUs match “${query.trim()}”` : 'No catalogue items yet'}
            description={
              query.trim()
                ? 'Search covers SKU, name, category and brand. Clear the search to see the full catalogue.'
                : 'Upload a CSV export from Tally, Zoho, Excel or your ERP to populate thousands of SKUs in one go. Start from the template if you are unsure of the columns.'
            }
            actionLabel={query.trim() ? undefined : 'Download template CSV'}
            onClick={query.trim() ? undefined : downloadCatalogTemplate}
          />
        ) : (
          <table className="w-full text-left text-[12.5px]">
            <caption className="sr-only">Your product catalogue</caption>
            <thead style={{ color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)' }}>
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">SKU</th>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Category</th>
                <th scope="col" className="px-4 py-3 font-medium">Brand</th>
                <th scope="col" className="px-4 py-3 font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id ?? row.sku + row.name} style={{ borderTop: '1px solid var(--hairline)', color: 'var(--on-surface)' }}>
                  <td className="px-4 py-2.5 font-mono text-[11.5px]">{row.sku}</td>
                  <td className="px-4 py-2.5">{row.name}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--on-surface-variant)' }}>{row.category || '—'}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--on-surface-variant)' }}>{row.brand || '—'}</td>
                  <td className="px-4 py-2.5">{row.price ? `${row.currency} ${row.price}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {items.length >= 200 && (
        <p className="mt-3 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
          Showing the first 200 rows. Full catalogue stays searchable server-side after import.
        </p>
      )}
    </div>
  )
}
