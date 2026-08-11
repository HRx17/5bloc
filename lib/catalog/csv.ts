/**
 * Lightweight CSV parser for vendor catalog imports.
 * Supports quoted fields, commas inside quotes, and CRLF.
 * Does not load Excel — convert XLSX → CSV first (or use SheetJS later).
 */

export type CatalogRow = {
  sku: string
  name: string
  category: string
  unit: string
  price: string
  currency: string
  brand: string
  description: string
}

const HEADER_ALIASES: Record<keyof CatalogRow, string[]> = {
  sku: ['sku', 'item_code', 'item code', 'code', 'part_number', 'part number', 'id'],
  name: ['name', 'item_name', 'item name', 'product', 'product_name', 'product name', 'title', 'description_short'],
  category: ['category', 'cat', 'group', 'product_category', 'product category'],
  unit: ['unit', 'uom', 'unit_of_measure', 'unit of measure'],
  price: ['price', 'rate', 'unit_price', 'unit price', 'mrp', 'list_price', 'list price'],
  currency: ['currency', 'curr', 'ccy'],
  brand: ['brand', 'manufacturer', 'make'],
  description: ['description', 'desc', 'details', 'long_description', 'specs', 'specification'],
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s-]+/g, ' ')
}

function mapHeaders(headers: string[]): Partial<Record<keyof CatalogRow, number>> {
  const map: Partial<Record<keyof CatalogRow, number>> = {}
  headers.forEach((raw, index) => {
    const h = normalizeHeader(raw)
    ;(Object.keys(HEADER_ALIASES) as (keyof CatalogRow)[]).forEach((key) => {
      if (map[key] !== undefined) return
      if (HEADER_ALIASES[key].some((alias) => alias === h)) {
        map[key] = index
      }
    })
  })
  return map
}

/** Split one CSV line into fields (handles quotes). */
export function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

export function parseCatalogCsv(text: string): {
  rows: CatalogRow[]
  headers: string[]
  mapped: Partial<Record<keyof CatalogRow, number>>
  errors: string[]
} {
  const errors: string[] = []
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').filter((l) => l.trim().length > 0)
  if (lines.length === 0) {
    return { rows: [], headers: [], mapped: {}, errors: ['File is empty.'] }
  }

  const headers = splitCsvLine(lines[0])
  const mapped = mapHeaders(headers)
  if (mapped.name === undefined && mapped.sku === undefined) {
    errors.push(
      'Could not find a Name or SKU column. Include headers like: sku, name, category, unit, price, brand.',
    )
  }

  const rows: CatalogRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    if (cols.every((c) => !c)) continue
    const get = (key: keyof CatalogRow) => {
      const idx = mapped[key]
      return idx === undefined ? '' : (cols[idx] ?? '').trim()
    }
    const name = get('name')
    const sku = get('sku')
    if (!name && !sku) continue
    rows.push({
      sku: sku || `ROW-${i}`,
      name: name || sku,
      category: get('category'),
      unit: get('unit') || 'ea',
      price: get('price'),
      currency: get('currency') || 'INR',
      brand: get('brand'),
      description: get('description'),
    })
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push('No product rows found under the header.')
  }

  return { rows, headers, mapped, errors }
}

/** Template CSV for vendors downloading a starter file. */
export const CATALOG_CSV_TEMPLATE = [
  'sku,name,category,unit,price,currency,brand,description',
  'STL-12MM,TMT Bar 12mm FE500D,Steel & Metal,MT,62500,INR,Tata Tiscon,12mm thermo-mechanically treated bar',
  'TIL-600W,Vitrified Tile 600x600 White,Tiles & Flooring,box,890,INR,Kajaria,Premium matt finish',
  'LED-18W,LED Panel 18W 2x2,Lighting & Fixtures,pcs,420,INR,Havells,Cool white 6500K',
].join('\n')

export function downloadCatalogTemplate() {
  if (typeof window === 'undefined') return
  const blob = new Blob([CATALOG_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '5bloc-catalog-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}
