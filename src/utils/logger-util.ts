import { consola } from 'consola'
import type { AppLog, LogLevel } from '@/types/AppLog'
import { IPC_CHANNELS } from '@/types/IpcChannels'
import { ipcSend } from '@/utils/electron-api'

// 配置 consola
// 可选，让 console.xxx 也受控
// consola.wrapAll();

// silent(沉默, 即不打印任何级别的日志): -1
// level 0: fatal、error
// level 1: warn
// level 2: log
// level 3: plugin、success、ready、start
// level 4: debug
// level 5: trace、verbose
// 根据环境控制日志级别
if (import.meta.env.APP_LOG_LEVEL === 'info') {
  consola.level = 3
} else {
  consola.level = 4
}

// 统一封装导出
export const logger = {
  trace: consola.trace,
  debug: consola.debug,
  info: consola.info,
  log: consola.info,
  warn: consola.warn,
  error: consola.error,
  success: consola.success,
  fatal: consola.fatal,
}

// 保存日志到后端
export const saveLog = (level: LogLevel = 'info', ...args: unknown[]): AppLog => {
  const appLog: AppLog = {
    level: level,
    contents: args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)),
  }
  ipcSend(IPC_CHANNELS.SAVE_LOG, appLog)
  return appLog
}
