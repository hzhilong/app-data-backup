import type { ElMessageBoxOptions, MessageParams } from 'element-plus'
import { IPC_CHANNELS } from '@/models/IpcChannels'
import { CommonError } from '@/models/CommonError'

export default class AppUtil {
  static exitApp() {
    if (window.electronAPI) {
      window.electronAPI.ipcSend(IPC_CHANNELS.WINDOW_CLOSE)
    } else {
      // 非 Electron 环境，忽略窗口关闭操作
    }
  }

  static maxApp() {
    if (window.electronAPI) {
      window.electronAPI.ipcSend(IPC_CHANNELS.WINDOW_MAX)
    }
  }

  static minApp() {
    if (window.electronAPI) {
      window.electronAPI.ipcSend(IPC_CHANNELS.WINDOW_MIN)
    }
  }

  static browsePage(url?: string) {
    if (url && window.electronAPI) {
      window.electronAPI.ipcSend(IPC_CHANNELS.BROWSE_PAGE, url)
    }
  }

  static openPath(path?: string) {
    if (path) {
      window.electronAPI?.ipcInvoke(IPC_CHANNELS.OPEN_PATH, path)
    }
  }

  static message(message: string): void
  static message({
    message,
    type,
    duration,
  }: {
    message: string
    type?: 'success' | 'warning' | 'info' | 'error'
    duration?: number
  }): void

  static message(
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

  static confirm(message: string, title: string = '提示', options: ElMessageBoxOptions = {}) {
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
  static handleError(error: unknown): void {
    if (!error) {
      console.error('[app]:未知错误')
    } else {
      console.error('[app]:出现错误', error)
      if (error instanceof CommonError) {
        this.message({
          message: error.message,
          type: 'error',
        })
      }
    }
  }
}
