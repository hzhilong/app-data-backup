/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly APP_TITLE?: string
  // 和其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  electronAPI?: {
    ipcSend: (channel: IpcChannels, ...data: unknown[]) => void
    ipcSendSync: (channel: IpcChannels, ...data: unknown[]) => unknown
    ipcOn: (channel: IpcChannels, listener: IpcListener) => void
    ipcOnce: (channel: IpcChannels, listener: IpcListener) => void
    ipcOff: (channel: IpcChannels) => void
    ipcInvoke: (channel: IpcChannels, ...data: unknown[]) => unknown
  }
}
