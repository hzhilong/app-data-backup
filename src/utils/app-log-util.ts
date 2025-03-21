import { IPC_CHANNELS } from '@/models/ipc-channels'

export type LogLevel = 'all' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off'

export interface AppLog {
  level: LogLevel
  contents: unknown[]
}

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
