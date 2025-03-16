import fs from 'fs'
import { app, ipcMain } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { IPC_CHANNELS } from '@/models/IpcChannels'
import WinUtil from './win-util'
import { CommonError } from '@/models/CommonError'
import { BuResult, execBusiness } from '@/models/BuResult'
import { loadPluginConfig, PluginOptions, ValidatedPluginConfig } from '@/plugins/plugin-config'
import { Plugin } from './plugins'
import { Mutex } from 'async-mutex'
import { InstalledSoftware } from '@/models/Software'
import BaseUtil from '@/utils/base-util'
import BrowserWindow = Electron.BrowserWindow
import { logger } from '@/utils/logger'

const initMutex = new Mutex()
let initialized = false
const loadedPluginConfigs: ValidatedPluginConfig[] = []
const activePlugins = new Map<string, Plugin>()

const abortSignals = new Map<string, AbortController>()

function initPluginSystem(mainWindow: BrowserWindow) {
  ipcMain.handle(IPC_CHANNELS.GET_PLUGINS, async (_event, softList: InstalledSoftware[]) => {
    // 🔒 获取锁（等待其他初始化操作完成）
    const release = await initMutex.acquire()
    try {
      if (initialized) {
        return BuResult.createSuccess(loadedPluginConfigs)
      }
      return execBusiness(() => {
        return initPlugins(softList)
      })
    } finally {
      release()
    }
  })
  ipcMain.handle(IPC_CHANNELS.REFRESH_PLUGINS, async (_event, softList: InstalledSoftware[]) => {
    const release = await initMutex.acquire()
    try {
      return execBusiness(() => {
        initialized = false
        return initPlugins(softList)
      })
    } finally {
      release()
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

function getPluginFiles(...paths: string[]): string[] {
  const pluginFiles = []
  const rootDir = process.env.VITE_DEV_SERVER_URL ? 'dist/' : ''
  for (const item of paths) {
    const pluginsDir = path.join(app.getAppPath(), rootDir, item)
    if (fs.existsSync(pluginsDir)) {
      pluginFiles.push(
        ...fs
          .readdirSync(pluginsDir)
          .filter((file) => file.endsWith('.js'))
          .map((file) => path.join(pluginsDir, file)),
      )
    }
  }
  return pluginFiles
}

async function initPlugins(softList: InstalledSoftware[]): Promise<ValidatedPluginConfig[]> {
  loadedPluginConfigs.length = 0
  activePlugins.clear()
  abortSignals.clear()

  const pluginFiles = getPluginFiles('plugins/core', 'plugins/custom')
  let env = WinUtil.getEnv()

  for (const filePath of pluginFiles) {
    try {
      logger.debug('加载插件', filePath)
      // 动态导入插件模块
      const module = await import(pathToFileURL(filePath).href)
      const config = module.default as Record<string, unknown>
      const cTime = BaseUtil.getFormatedDateTime(fs.statSync(filePath).birthtime)
      // 实例化插件
      const pluginConfig = loadPluginConfig(config, cTime)
      const plugin = new Plugin(pluginConfig, cTime)
      // 覆盖方法
      Object.assign(plugin, config)
      const validatedPluginConfig: ValidatedPluginConfig = {
        ...pluginConfig,
        ...getValidatedFields(plugin.detect(softList, env)),
      }
      activePlugins.set(pluginConfig.id, plugin)
      loadedPluginConfigs.push(validatedPluginConfig)
      console.log(`✔ 插件加载成功: ${config.id}`)
    } catch (error) {
      console.error(`❌ 加载插件 ${path.basename(filePath, '.js')} 失败:`, error)
    }
  }
  initialized = true
  return loadedPluginConfigs
}

// 获取验证后的字段
function getValidatedFields(detectResult: InstalledSoftware | string | undefined) {
  if (!detectResult) {
    return {}
  } else if (typeof detectResult === 'string') {
    return {
      softInstallDir: detectResult,
    }
  } else {
    return {
      softName: detectResult.name,
      softBase64Icon: detectResult.base64Icon,
      softInstallDir: detectResult.installDir,
      softRegeditDir: detectResult.regeditDir,
    }
  }
}

function clearOnPluginStop(pluginOrId: Plugin | string) {
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
