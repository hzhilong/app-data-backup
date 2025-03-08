import { IPC_CHANNELS } from '../models/IpcChannels'
import type { ElMessageBoxOptions, MessageParams } from 'element-plus'
import { CommonError } from '../models/CommonError.ts'

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

function confirm(message: string, title: string = '提示', options: ElMessageBoxOptions = {}) {
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

/**
 * 控制台显示错误，如果是CommonError则还有弹窗提示
 * @param error
 */
function handleError(error: unknown): void {
  if (!error) {
    console.error('[app]:未知错误')
  } else {
    console.error('[app]:出现错误', error)
    if (error instanceof CommonError) {
      message({
        message: error.message,
        type: 'error',
      })
    }
  }
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
  handleError: handleError,
  openPath(path: string) {
    window.electronAPI?.ipcInvoke(IPC_CHANNELS.OPEN_PATH, path)
  },
}
