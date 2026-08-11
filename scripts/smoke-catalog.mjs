import assert from 'node:assert/strict'

// Smoke-test CSV parsing without a TS runner — inline minimal checks mirroring lib/catalog/csv.ts
function splitCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

assert.deepEqual(splitCsvLine('a,"b,c",d'), ['a', 'b,c', 'd'])
assert.deepEqual(splitCsvLine('sku,name'), ['sku', 'name'])

const template = [
  'sku,name,category,unit,price,currency,brand,description',
  'STL-12MM,TMT Bar 12mm FE500D,Steel & Metal,MT,62500,INR,Tata Tiscon,12mm bar',
].join('\n')
const lines = template.split('\n')
assert.equal(lines.length, 2)
assert.equal(splitCsvLine(lines[1])[0], 'STL-12MM')

console.log('smoke-catalog: CSV parse OK')
