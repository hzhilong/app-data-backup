import log4js from 'log4js'
import path from 'path'
import { AppPath } from './app-path'

// 定义日志目录路径
export const LOG_DIR = path.join(AppPath.programRoot, '/logs')

log4js.configure({
  appenders: {
    console: { type: 'stdout' },
    all: {
      type: 'dateFile',
      filename: path.join(LOG_DIR, 'all-logs.log'),
      compress: true,
    },
    error: {
      type: 'dateFile',
      level: 'ERROR',
      filename: path.join(LOG_DIR, 'error-logs.log'),
      compress: true,
    },
    errorFilter: {
      type: 'logLevelFilter',
      level: 'ERROR',
      appender: 'error'
    },
  },
  categories: {
    default: { appenders: ['all', 'console', 'errorFilter'], level: import.meta.env.APP_LOG_LEVEL || 'info' },
  },
})

// 获取 Logger 实例
const nLogger = log4js.getLogger()

export default nLogger
