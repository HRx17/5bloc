import chokidar from 'chokidar'
import path from 'path'
import os from 'os'
import { promises as fs } from 'fs'
import * as tus from 'tus-js-client'

const WATCH_DIR  = path.join(os.homedir(), '5Bloc', 'projects')
const CHUNK_SIZE = 5 * 1024 * 1024  // 5MB
const APP_URL    = 'https://app.5bloc.com'

interface QueueItem {
  filePath:  string
  projectId: string
  filename:  string
  retries:   number
}

export class SyncDaemon {
  private watcher:    chokidar.FSWatcher | null = null
  private queue:      QueueItem[] = []
  private processing  = false
  private authToken   = ''

  async start() {
    await fs.mkdir(WATCH_DIR, { recursive: true })

    this.watcher = chokidar.watch(WATCH_DIR, {
      ignored:       /(^|[\/\\])\..|(~$)/,
      persistent:    true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 },
    })

    this.watcher.on('add',    f => this.enqueue(f))
    this.watcher.on('change', f => this.enqueue(f))
  }

  private enqueue(filePath: string) {
    const parts     = filePath.split(path.sep)
    const filename  = parts[parts.length - 1]
    const projectId = parts[parts.length - 2]
    if (!projectId || projectId === 'projects') return

    const idx = this.queue.findIndex(q => q.filePath === filePath)
    if (idx >= 0) this.queue[idx].retries = 0
    else this.queue.push({ filePath, projectId, filename, retries: 0 })

    if (!this.processing) this.processQueue()
  }

  private async processQueue() {
    this.processing = true
    while (this.queue.length > 0) {
      const item = this.queue.shift()!
      try {
        await this.uploadFile(item)
      } catch {
        if (item.retries < 5) {
          item.retries++
          this.queue.push(item)
          await new Promise(r => setTimeout(r, Math.pow(2, item.retries) * 1000))
        }
      }
    }
    this.processing = false
  }

  private uploadFile(item: QueueItem): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const buffer = await fs.readFile(item.filePath)
        const upload = new tus.Upload(new Blob([buffer]), {
          endpoint:    `${APP_URL}/api/files/tus`,
          chunkSize:   CHUNK_SIZE,
          retryDelays: [0, 3000, 5000, 10000],
          headers:     { Authorization: `Bearer ${this.authToken}` },
          metadata: {
            filename:  item.filename,
            filetype:  this.mimeType(item.filename),
            projectId: item.projectId,
            source:    'electron',
          },
          onSuccess: () => resolve(),
          onError:   (err) => reject(err),
        })
        upload.start()
      } catch (e) {
        reject(e)
      }
    })
  }

  setAuthToken(token: string) { this.authToken = token }
  getStatus() { return { pending: this.queue.length, syncing: this.processing } }
  stop() { this.watcher?.close() }

  private mimeType(filename: string): string {
    const ext   = filename.toLowerCase().split('.').pop()
    const types: Record<string, string> = {
      pdf:  'application/pdf',
      dwg:  'application/acad',
      dxf:  'application/dxf',
      rvt:  'application/octet-stream',
      jpg:  'image/jpeg',
      jpeg: 'image/jpeg',
      png:  'image/png',
      zip:  'application/zip',
    }
    return types[ext || ''] || 'application/octet-stream'
  }
}
