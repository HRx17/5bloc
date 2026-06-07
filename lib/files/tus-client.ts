import * as tus from 'tus-js-client'

const CHUNK_SIZE = 5 * 1024 * 1024  // 5MB

export async function tusUpload(
  file: File | Blob,
  metadata: { projectId: string; filename: string; fileType: string },
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If running in development and we want to simulate successful upload when API is not implemented
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL

    if (isMock) {
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        onProgress(Math.min(progress, 100))
        if (progress >= 100) {
          clearInterval(interval)
          resolve('mock-upload-url-successful')
        }
      }, 100)
      return
    }

    const upload = new tus.Upload(file, {
      endpoint:    '/api/files/tus',
      chunkSize:   CHUNK_SIZE,
      retryDelays: [0, 3000, 5000, 10000, 20000, 30000],
      metadata:    { ...metadata, source: 'browser' },
      onProgress:  (b, t) => onProgress(Math.round((b / t) * 100)),
      onSuccess:   () => resolve(upload.url!),
      onError:     reject,
    })
    upload.start()
  })
}
