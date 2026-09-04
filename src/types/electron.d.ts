export {};

declare global {
  interface ElectronAPI {
    isElectron?: boolean;
    getHomeDir: () => Promise<string>;
    fileExists: (path: string) => Promise<boolean>;
    readFile: (path: string) => Promise<Uint8Array>;
    writeFile: (path: string, data: ArrayBuffer | Uint8Array) => Promise<void>;
    mkdir?: (path: string) => Promise<void>;
    [key: string]: unknown;
  }
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
