export class OPFSManager {
  private root: FileSystemDirectoryHandle | null = null

  private async getRoot() {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.getDirectory) {
      return null
    }
    if (!this.root) this.root = await navigator.storage.getDirectory()
    return this.root
  }

  async saveFile(projectId: string, key: string, buffer: ArrayBuffer) {
    const root = await this.getRoot()
    if (!root) return
    const dir  = await root.getDirectoryHandle(projectId, { create: true })
    const fh   = await dir.getFileHandle(key, { create: true })
    const w    = await fh.createWritable()
    await w.write(buffer)
    await w.close()
  }

  async getFile(projectId: string, key: string): Promise<ArrayBuffer | null> {
    try {
      const root = await this.getRoot()
      if (!root) return null
      const dir  = await root.getDirectoryHandle(projectId)
      const fh   = await dir.getFileHandle(key)
      const f    = await fh.getFile()
      return f.arrayBuffer()
    } catch {
      return null
    }
  }

  async hasFile(projectId: string, key: string): Promise<boolean> {
    try {
      const root = await this.getRoot()
      if (!root) return false
      await (await root.getDirectoryHandle(projectId)).getFileHandle(key)
      return true
    } catch {
      return false
    }
  }
}

export const opfs = new OPFSManager()
