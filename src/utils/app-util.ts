import type { ElMessageBoxOptions, MessageParams } from 'element-plus'
import { IPC_CHANNELS } from '@/models/ipc-channels'
import { CommonError } from '@/models/common-error'
import type { BuResult } from '@/models/bu-result'
import { db } from '@/db/db'
import BaseUtil from '@/utils/base-util'
import { getPluginExecName, getTaskStateText, type PluginExecTask } from '@/plugins/plugin-task'

export default class AppUtil {
  static async exitApp() {
    const running1 = await db.backupTask.where({ state: 'running' }).count()
    const running2 = await db.backupTask.where({ state: 'running' }).count()
    if (running1 > 0 || running2 > 0) {
      this.confirm(`当前有任务正在运行，是否直接退出？`).then(async () => {
        window.electronAPI?.ipcSend(IPC_CHANNELS.WINDOW_CLOSE)
      })
      return
    }
    window.electronAPI?.ipcSend(IPC_CHANNELS.WINDOW_CLOSE)
  }

  static maxApp() {
    window.electronAPI?.ipcSend(IPC_CHANNELS.WINDOW_MAX)
  }

  static minApp() {
    window.electronAPI?.ipcSend(IPC_CHANNELS.WINDOW_MIN)
  }

  static browsePage(url?: string) {
    window.electronAPI?.ipcSend(IPC_CHANNELS.BROWSE_PAGE, url)
  }

  static async openPath(path?: string) {
    if (path) {
      const result = (await window.electronAPI?.ipcInvoke(IPC_CHANNELS.OPEN_PATH, path)) as BuResult<void>
      if (!result.success) {
        this.showResultMessage(result)
      }
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

  static showResultMessage(result: BuResult<any>, onlyFail: boolean = true): void {
    if (!result.success || !onlyFail) {
      this.message({
        message: result.msg,
        type: result.success ? 'success' : 'error',
      })
    }
  }

  static showErrorMessage(e: unknown): void {
    this.message({
      message: BaseUtil.getErrorMessage(e),
      type: 'error',
    })
  }

  static showTaskMessage(task: PluginExecTask, e?: unknown | string): void {
    const execName = getPluginExecName(task.pluginExecType)
    const msgStart = `${execName}[${task.pluginId}]：`
    if (e !== undefined) {
      // 有异常信息
      this.message({
        message: `${msgStart}${typeof e === 'string' ? e : BaseUtil.getErrorMessage(e)}`,
        type: 'error',
      })
    } else {
      if (task.state !== 'finished') {
        // 未结束，简单提示
        this.message({
          message: `${msgStart}${getTaskStateText(task.state)}`,
          type: 'info',
        })
      } else {
        this.message({
          message: `${msgStart}${task.message}`,
          type: task.success ? 'success' : 'error',
        })
      }
    }
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
