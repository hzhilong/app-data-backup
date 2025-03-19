import log4js from 'log4js'
import path from 'path'
import { app } from 'electron'

// 定义日志目录路径
const LOG_DIR = path.join(path.dirname(app.getPath('exe')), '/logs')

log4js.configure({
  appenders: {
    everything: {
      type: 'dateFile',
      filename: path.join(LOG_DIR, 'app-logs.log'),
      compress: true,
    },
  },
  categories: {
    default: { appenders: ['everything'], level: import.meta.env.APP_LOG_LEVEL },
  },
})

// 获取 Logger 实例
const nLogger = log4js.getLogger()

export default nLogger
