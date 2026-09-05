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
    <div className="page-m">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="page-m-title">Product Catalogue</h1>
          <p className="page-m-sub">
            Upload CSV exports from Tally, Zoho, Excel, or your ERP. Built for distributors with 10,000+ SKUs.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadCatalogTemplate}
            className="btn-secondary"
          >
            <Download className="h-4 w-4" aria-hidden />
            Template CSV
          </button>
          <label className="btn-primary cursor-pointer">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" aria-hidden />}
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
        <div className="mb-6 card-m p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-stone uppercase tracking-wider">Import Progress</span>
            <span className="text-xs font-bold text-amber">{progress}%</span>
          </div>
          <div className="meter-m">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3">
          <span className="material-icons-outlined text-error">error_outline</span>
          <p className="text-sm text-error font-medium">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
          <span className="material-icons-outlined text-success">check_circle_outline</span>
          <p className="text-sm text-success font-medium">{message}</p>
        </div>
      )}

      <div className="card-m p-4 mb-8 bg-surface-container-low border-l-4 border-l-purple">
        <div className="flex items-start gap-4">
          <div className="feed-m-icon !bg-purple/10 !text-purple">
            <FileSpreadsheet className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-on-surface">Still on the waitlist?</h3>
            <p className="text-[13px] text-on-surface-variant mt-1">
              Use <Link href="/join-as-vendor" className="text-amber font-semibold underline underline-offset-4 decoration-amber/30">Join as vendor</Link> to submit your profile + catalogue before invite.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="search-5bloc w-full md:w-80">
          <Search className="h-4 w-4 text-stone" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SKU, name, brand…"
          />
        </div>
        {items.length >= 200 && (
          <p className="text-[11px] font-bold text-stone uppercase tracking-tight">
            Showing first 200 rows
          </p>
        )}
      </div>

      <div className="card-m overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : loadError ? (
          <div className="p-8">
            <ErrorState
              title="Catalogue unavailable"
              description="We could not read your items. You can still upload a CSV."
              error={loadError}
              onRetry={load}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={query.trim() ? 'search_off' : 'inventory_2'}
              title={query.trim() ? `No matches for “${query.trim()}”` : 'No catalogue items'}
              description={
                query.trim()
                  ? 'Search covers SKU, name, category and brand. Try a broader term.'
                  : 'Upload a CSV export to populate thousands of SKUs. Start from our template.'
              }
              actionLabel={query.trim() ? undefined : 'Download template'}
              onClick={query.trim() ? undefined : downloadCatalogTemplate}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-m">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id ?? row.sku + row.name}>
                    <td className="font-mono text-[11px] font-bold text-stone">{row.sku}</td>
                    <td className="font-semibold">{row.name}</td>
                    <td>
                      {row.category ? (
                        <span className="chip-m chip-m-blue">{row.category}</span>
                      ) : '—'}
                    </td>
                    <td>
                      {row.brand ? (
                        <span className="chip-m">{row.brand}</span>
                      ) : '—'}
                    </td>
                    <td className="font-mono font-bold text-amber">
                      {row.price ? `${row.currency} ${row.price}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
