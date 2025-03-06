import { consola } from 'consola'

// 根据环境控制日志级别
const isProd = import.meta.env.PROD

// 配置 consola
// 可选，让 console.xxx 也受控
// consola.wrapAll();

// silent(沉默, 即不打印任何级别的日志): -1
// level 0: fatal、error
// level 1: warn
// level 2: log
// level 3: info、success、ready、start
// level 4: debug
// level 5: trace、verbose
if (isProd) {
  consola.level = 3
} else {
  consola.level = 4
}

// 统一封装导出
export const logger = {
  trace: consola.trace,
  debug: consola.debug,
  info: consola.info,
  warn: consola.warn,
  error: consola.error,
  success: consola.success,
  fatal: consola.fatal,
}
