export type CadTranslateResult = {
  urn: string
  name: string
}

/** Upload a CAD file to Autodesk OSS and start model-derivative translation. */
export async function translateCadFile(file: File): Promise<CadTranslateResult> {
  const prep = await fetch('/api/integrations/autodesk/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name }),
  })
  const prepData = await prep.json().catch(() => ({}))
  if (!prep.ok) throw new Error(prepData.error || 'Failed to prepare CAD upload')

  const s3 = await fetch(prepData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: file,
  })
  if (!s3.ok) throw new Error(`Upload to Autodesk failed (${s3.status})`)

  const done = await fetch('/api/integrations/autodesk/complete-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadKey: prepData.uploadKey,
      objectKey: prepData.objectKey,
      bucketKey: prepData.bucketKey,
      fileName: file.name,
    }),
  })
  const doneData = await done.json().catch(() => ({}))
  if (!done.ok) throw new Error(doneData.error || 'Failed to complete CAD upload')
  if (!doneData.urn) throw new Error('Autodesk did not return a model URN')
  return { urn: doneData.urn as string, name: (doneData.name as string) || file.name }
}

export async function fetchVaultFile(documentId: string): Promise<File> {
  const res = await fetch(`/api/files/blob?id=${encodeURIComponent(documentId)}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Could not load that drawing from the vault')
  }
  const blob = await res.blob()
  const rawName = res.headers.get('X-Filename')
  const name = rawName ? decodeURIComponent(rawName) : 'drawing.dwg'
  return new File([blob], name, { type: blob.type || 'application/octet-stream' })
}
