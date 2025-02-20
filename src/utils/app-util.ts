import { IPC_CHANNELS } from '@/models/IpcChannels.ts'

export default {
  exitApp() {
    if (window.electronAPI) {
      window.electronAPI.ipcSend(IPC_CHANNELS.WINDOW_CLOSE)
    } else {
      // 非 Electron 环境，忽略窗口关闭操作
    }
  },
  maxApp() {
    if (window.electronAPI) {
      window.electronAPI.ipcSend(IPC_CHANNELS.WINDOW_MAX)
    }
  },
  minApp() {
    if (window.electronAPI) {
      window.electronAPI.ipcSend(IPC_CHANNELS.WINDOW_MIN)
    }
  },
  browsePage(url: string) {
    if (window.electronAPI) {
      window.electronAPI.ipcSend(IPC_CHANNELS.BROWSE_PAGE, url)
    }
  },
}
