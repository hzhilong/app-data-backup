import fs from 'fs'
import { app, ipcMain } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { IPC_CHANNELS } from '@/models/IpcChannels'
import { WinUtil } from './win-util'
import BrowserWindow = Electron.BrowserWindow
import { CommonError } from '@/models/CommonError'
import { BuResult, execBusiness } from '@/models/BuResult'
import { PluginConfig, PluginOptions } from '@/plugins/plugin-config'
import { Plugin } from './plugins'
import { Mutex } from 'async-mutex'


const initMutex = new Mutex();
let initialized = false
const loadedPluginConfigs: PluginConfig[] = []
const activePlugins = new Map<string, Plugin>()

const abortSignals = new Map<string, AbortController>()

const initPluginSystem = (mainWindow: BrowserWindow) => {
  ipcMain.handle(IPC_CHANNELS.GET_PLUGINS, async () => {
    // 🔒 获取锁（等待其他初始化操作完成）
    const release = await initMutex.acquire();
    try {
      if (initialized) {
        return BuResult.createSuccess(loadedPluginConfigs)
      }
      return execBusiness(() => {
        return initPlugins()
      })
    }finally {
      release();
    }
  })
  ipcMain.handle(IPC_CHANNELS.REFRESH_PLUGINS, async () => {
    const release = await initMutex.acquire();
    try {
      return execBusiness(() => {
        initialized = false
        return initPlugins()
      })
    }finally {
      release();
    }
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

const getPluginFiles = (...paths: string[]): string[] => {
  const pluginFiles = []
  const rootDir = process.env.VITE_DEV_SERVER_URL ? 'dist/' : ''
  for (const item of paths) {
    const pluginsDir = path.join(app.getAppPath(), rootDir, item)
    if (fs.existsSync(pluginsDir)) {
      pluginFiles.push(...fs.readdirSync(pluginsDir).filter((file) => file.endsWith('.js')).map(file => path.join(pluginsDir, file)))
    }
  }
  return pluginFiles
}

const initPlugins = async (): Promise<PluginConfig[]> => {
  loadedPluginConfigs.length = 0
  activePlugins.clear()
  abortSignals.clear()

  const pluginFiles = getPluginFiles('plugins/core','plugins/custom')

  for (const filePath of pluginFiles) {
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
      console.error(`❌ 加载插件 ${path.basename(filePath, '.js')} 失败:`, error)
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

export { initPluginSystem }
