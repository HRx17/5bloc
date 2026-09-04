/**
 * Downscales an image file to a square avatar in the browser so we never ship
 * multi-megabyte originals to the database.
 */
export async function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose a PNG, JPG, or WebP image')
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('That image is too large. Choose one under 8MB.')
  }

  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - side) / 2
  const sy = (bitmap.height - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process that image')
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size)
  bitmap.close?.()

  const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
  if (dataUrl.length > 300_000) {
    throw new Error('Could not compress that image enough. Try a simpler picture.')
  }
  return dataUrl
}
