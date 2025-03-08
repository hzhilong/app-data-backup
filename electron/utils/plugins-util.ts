import dayjs from 'dayjs'
import fs from 'fs'
import { app, ipcMain } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { PluginConfig, Plugin, PluginOptions } from "@/plugins/plugins"
import { IPC_CHANNELS } from '@/models/IpcChannels'
import { WinUtil } from './win-util'
import BrowserWindow = Electron.BrowserWindow
import { CommonError } from '@/models/CommonError'
import { execBusiness } from '@/models/BuResult'

/**
 * 默认的数据根目录
 */
const DEFAULT_ROOT_DIR = '.backup-data'
/**
 * 启用的插件
 */
const activePlugins = new Map<string, Plugin>()

const abortSignals = new Map<string, AbortController>()

const initPluginSystem = (mainWindow: BrowserWindow) => {
  ipcMain.handle(IPC_CHANNELS.INIT_PLUGINS, async () => {
    return execBusiness(() => {
      return initPlugins()
    })
  })
  ipcMain.handle(IPC_CHANNELS.EXEC_PLUGIN, async (event, id: string, options: PluginOptions) => {
    return execBusiness(async () => {
      return await execPlugin(id, options, mainWindow)
    })
  })
  ipcMain.handle(IPC_CHANNELS.STOP_EXEC_PLUGIN, async (event, id: string) => {
    const abortController = abortSignals.get(id)
    if (abortController) {
      abortController.abort('取消任务')
      clearOnPluginStop(id)
    }
  })
}

const initPlugins = async (): Promise<PluginConfig[]> => {
  activePlugins.clear()
  abortSignals.clear()
  const pluginsDir = path.join(app.getAppPath(), process.env.VITE_DEV_SERVER_URL ? 'dist/plugins/core' : 'plugins/core')
  // 确保插件目录存在
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true })
    return []
  }

  const pluginConfigInstances: PluginConfig[] = []
  const pluginFiles = fs.readdirSync(pluginsDir).filter((file) => file.endsWith('.js'))

  for (const file of pluginFiles) {
    const filePath = path.join(pluginsDir, file)
    try {
      // 动态导入插件模块
      const module = await import(pathToFileURL(filePath).href)
      const config = module.default as Record<string, unknown>

      // 实例化插件
      const pluginConfig = new PluginConfig(config)
      activePlugins.set(pluginConfig.id, new Plugin(config))
      pluginConfigInstances.push(pluginConfig)
      console.log(`✔ 插件加载成功: ${config.id}`)
    } catch (error) {
      console.error(`❌ 加载插件 ${file} 失败:`, error)
    }
  }
  return pluginConfigInstances
}

/**
 * 获取备份目录
 */
const getBackupDir = (rootDir: string = DEFAULT_ROOT_DIR, softName: string) =>
  `${rootDir}/${softName}/${dayjs().format('YYYY-MM-DD_HH-mm-ss')}/`

const clearOnPluginStop = (pluginOrId: Plugin | string) => {
  if (!pluginOrId) return
  if (typeof pluginOrId === 'string') {
    if (abortSignals.has(pluginOrId)) {
      abortSignals.delete(pluginOrId)
    }
  } else if (abortSignals.has(pluginOrId.id)) {
    abortSignals.delete(pluginOrId.id)
  }
}

async function execPlugin(id: string, options: PluginOptions, mainWindow: Electron.BrowserWindow) {
  const plugin = activePlugins.get(id)
  if (!plugin) {
    throw new CommonError('插件id错误')
  }

  const abortController = new AbortController()
  abortSignals.set(id, abortController)

  const backupResults = await plugin.execPlugin(
    options,
    WinUtil.getEnv(),
    {
      progress(log: string, curr: number, total: number): void {
        mainWindow.webContents.send(IPC_CHANNELS.GET_PLUGIN_PROGRESS, id, log, curr, total)
      },
    },
    abortController.signal,
  )
  clearOnPluginStop(id)
  return backupResults
}

export { initPluginSystem, initPlugins, DEFAULT_ROOT_DIR, getBackupDir }
