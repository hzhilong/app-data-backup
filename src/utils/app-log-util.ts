import { IPC_CHANNELS } from '@/models/ipc-channels'
import type { AppLog, LogLevel } from '@/models/app-log'

export default class AppLogUtil {
  static saveLog(level: LogLevel = 'info', ...args: unknown[]): AppLog {
    const appLog: AppLog = {
      level: level,
      contents: args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)),
    }
    window.electronAPI?.ipcInvoke(IPC_CHANNELS.SAVE_LOG, appLog)
    return appLog
  }
}
