import fs from 'fs'
import { app, ipcMain } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { IPC_CHANNELS } from '@/models/IpcChannels'
import { WinUtil } from './win-util'
import BrowserWindow = Electron.BrowserWindow
import { CommonError } from '@/models/CommonError'
import { execBusiness } from '@/models/BuResult'
import { PluginConfig, PluginOptions } from '@/plugins/plugin-config'
import { Plugin } from './plugins'

let initialized = false
const loadedPluginConfigs: PluginConfig[] = []
const activePlugins = new Map<string, Plugin>()

const abortSignals = new Map<string, AbortController>()

const initPluginSystem = (mainWindow: BrowserWindow) => {
  ipcMain.handle(IPC_CHANNELS.GET_PLUGINS, async () => {
    return execBusiness(() => {
      return initPlugins()
    })
  })
  ipcMain.handle(IPC_CHANNELS.REFRESH_PLUGINS, async () => {
    return execBusiness(() => {
      initialized = false
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
  if (initialized) {
    return loadedPluginConfigs
  }
  loadedPluginConfigs.length = 0
  activePlugins.clear()
  abortSignals.clear()
  const pluginsDir = path.join(app.getAppPath(), process.env.VITE_DEV_SERVER_URL ? 'dist/plugins/core' : 'plugins/core')
  // 确保插件目录存在
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true })
    return []
  }

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
      loadedPluginConfigs.push(pluginConfig)
      console.log(`✔ 插件加载成功: ${config.id}`)
    } catch (error) {
      console.error(`❌ 加载插件 ${file} 失败:`, error)
    }
  }
  initialized = true
  return loadedPluginConfigs
}

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
        console.log(log, curr, total)
        mainWindow?.webContents.send(IPC_CHANNELS.GET_PLUGIN_PROGRESS, id, log, curr, total)
      },
    },
    abortController.signal,
  )
  clearOnPluginStop(id)
  return backupResults
}

export { initPluginSystem, initPlugins }
