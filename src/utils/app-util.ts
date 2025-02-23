import { IPC_CHANNELS } from '@/models/IpcChannels.ts'
import type { ElMessageBoxOptions, MessageParams } from 'element-plus'

function message(message: string): void
function message({
  message,
  type,
  duration,
}: {
  message: string
  type?: 'success' | 'warning' | 'info' | 'error'
  duration?: number
}): void

function message(
  config:
    | string
    | {
        message: string
        type?: 'success' | 'warning' | 'info' | 'error'
        duration?: number
      },
): void {
  const options: MessageParams = {
    message: '',
    type: 'success',
    duration: 3000,
  }
  if (typeof config === 'string') {
    options.message = config
  } else {
    Object.assign(options, config)
  }
  ElMessage(options)
}

function confirm({
  message,
  title = '提示',
  options = {},
}: {
  message: string
  title?: string
  options?: ElMessageBoxOptions
}) {
  return new Promise<void>((resolve, reject) => {
    ElMessageBox.confirm(message, title, {
      ...Object.assign(
        {
          confirmButtonText: '确定',
          type: 'warning',
        },
        options,
      ),
    })
      .then(() => {
        resolve()
      })
      .catch(() => {
        reject()
      })
  })
}

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
  message,
  confirm,
}
