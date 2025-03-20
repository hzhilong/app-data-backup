import log4js from 'log4js'
import path from 'path'
import { getAppBasePath } from './app-path'

// 定义日志目录路径
const LOG_DIR = path.join(getAppBasePath(), '/logs')

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
      filename: path.join(LOG_DIR, 'error-logs.log'),
      compress: true,
    },
  },
  categories: {
    default: { appenders: ['all', 'console'], level: import.meta.env.APP_LOG_LEVEL },
    error: { appenders: ['error'], level: 'error' },
  },
})

// 获取 Logger 实例
const nLogger = log4js.getLogger()

export default nLogger
