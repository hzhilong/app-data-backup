import dayjs from 'dayjs'
import fs from 'fs'
import { app } from 'electron'
import path from 'path'
import { BasePlugin } from '../../src/plugins/plugins'
import { pathToFileURL } from 'url'

/**
 * 默认的数据根目录
 */
const DEFAULT_ROOT_DIR = '.backup-data'

/**
 * 获取备份目录
 */
const getBackupDir = (rootDir: string = DEFAULT_ROOT_DIR, softName: string) =>
  `${rootDir}/${softName}/${dayjs().format('YYYY-MM-DD_HH-mm-ss')}/`

const getPlugins = async (): Promise<BasePlugin[]> => {
  const pluginsDir = path.join(app.getAppPath(), process.env.VITE_DEV_SERVER_URL ? 'dist/plugins/core' : 'plugins/core')
  console.log('pluginsDir')
  console.log(pluginsDir)
  // 确保插件目录存在
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true })
    return []
  }

  const pluginInstances: BasePlugin[] = []
  const pluginFiles = fs.readdirSync(pluginsDir).filter((file) => file.endsWith('.js'))

  for (const file of pluginFiles) {
    const filePath = path.join(pluginsDir, file)
    try {
      // 动态导入插件模块
      const module = await import(pathToFileURL(filePath).href)
      const config = module.default as Record<string, unknown>

      // 实例化插件
      const plugin = new BasePlugin(config)
      pluginInstances.push(plugin)
      console.log(`✔ 插件加载成功: ${config.id}`)
    } catch (error) {
      console.error(`❌ 加载插件 ${file} 失败:`, error)
    }
  }

  return pluginInstances
}

export { DEFAULT_ROOT_DIR, getBackupDir, getPlugins }
