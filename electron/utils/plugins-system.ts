import fs from 'fs'
import { ipcMain } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { IPC_CHANNELS } from '@/types/IpcChannels'
import WinUtil from './win-util'
import { CommonError } from '@/types/CommonError'
import { BuResult, execBusiness } from '@/types/BuResult'
import { Plugin } from './plugins'
import { Mutex } from 'async-mutex'
import { InstalledSoftware } from '@/types/Software'
import BaseUtil from '@/utils/base-util'
import nLogger from './log4js'
import {
  OpenPluginConfigSourcePathOptions,
  OpenPluginConfigTargetPathOptions,
  PluginExecTask,
  TaskItemResult,
} from '@/types/PluginTask'
import { loadPluginConfig, MyPluginConfig, ValidatedPluginConfig } from '@/types/PluginConfig'
import axios from 'axios'
import { AppPath } from './app-path'
import BrowserWindow = Electron.BrowserWindow

const pluginRootPath = path.join(AppPath.pluginRootPath, 'plugins')

// 初始化互斥锁
const initMutex = new Mutex()
// 已初始化
let initialized = false
// 初始化加载的插件配置
const loadedPluginConfigs: ValidatedPluginConfig[] = []
// 启用的插件 插件type-id ->
const activePlugins = new Map<string, Plugin>()
// 终止信号 任务id->
const abortSignals = new Map<string, AbortController>()
const delActivePlugin = (id: string) => {
  activePlugins.delete(id)
}
const getActivePlugin = (id: string) => activePlugins.get(id)
const setActivePlugin = (id: string, plugin: Plugin) => {
  activePlugins.set(id, plugin)
}

// 初始化插件系统
function initPluginSystem(mainWindow: BrowserWindow) {
  // IPC 事件监听【获取插件】
  ipcMain.handle(IPC_CHANNELS.GET_PLUGINS, async (_event, softList: InstalledSoftware[]) => {
    // 🔒 获取锁（等待其他初始化操作完成）
    const release = await initMutex.acquire()
    try {
      if (initialized) {
        // 已初始化
        return BuResult.createSuccess(loadedPluginConfigs)
      }
      return await execBusiness(() => {
        return initPlugins(softList)
      })
    } finally {
      release()
    }
  })
  // IPC 事件监听【刷新插件】
  ipcMain.handle(IPC_CHANNELS.REFRESH_PLUGINS, async (_event, softList: InstalledSoftware[]) => {
    const release = await initMutex.acquire()
    try {
      return await execBusiness(() => {
        initialized = false
        return initPlugins(softList)
      })
    } finally {
      release()
    }
  })
  // IPC 事件监听【更新本地插件插件】
  ipcMain.handle(IPC_CHANNELS.UPDATE_LOCAL_PLUGINS, async (_event, softList: InstalledSoftware[]) => {
    const release = await initMutex.acquire()
    try {
      return await execBusiness(async () => {
        initialized = false
        await downloadPlugins()
        return initPlugins(softList)
      })
    } finally {
      release()
    }
  })
  // IPC 事件监听【执行插件】
  ipcMain.handle(IPC_CHANNELS.EXEC_PLUGIN, async (event, task: PluginExecTask) => {
    return await execBusiness(async () => {
      return await execPlugin(task, mainWindow)
    })
  })
  // IPC 事件监听【停止执行插件】
  ipcMain.handle(IPC_CHANNELS.STOP_EXEC_PLUGIN, async (event, task: PluginExecTask) => {
    return await execBusiness(async () => {
      const abortController = abortSignals.get(task.id)
      if (abortController) {
        abortController.abort('取消任务')
        // 清空临时资源
        clearOnPluginStop(task.id)
      } else {
        throw new CommonError('该任务未执行')
      }
    })
  })
  // IPC 事件监听【打开插件备份配置源路径】
  ipcMain.handle(
    IPC_CHANNELS.OPEN_PLUGIN_CONFIG_SOURCE_PATH,
    async (event, options: OpenPluginConfigSourcePathOptions) => {
      return await execBusiness(async () => {
        return await openPluginConfigSourcePath(options)
      })
    },
  )
  // IPC 事件监听【打开备份配置保存路径】
  ipcMain.handle(
    IPC_CHANNELS.OPEN_PLUGIN_CONFIG_TARGET_PATH,
    async (event, options: OpenPluginConfigTargetPathOptions) => {
      return await execBusiness(async () => {
        return await openPluginConfigTargetPath(options)
      })
    },
  )
  // IPC 事件监听【保存自定义插件】
  ipcMain.handle(IPC_CHANNELS.SAVE_CUSTOM_PLUGIN, async (event, myPluginConfig: MyPluginConfig) => {
    return await execBusiness(async () => {
      return await saveCustomPlugin(myPluginConfig)
    })
  })
  // IPC 事件监听【删除自定义插件】
  ipcMain.handle(IPC_CHANNELS.DELETE_CUSTOM_PLUGIN, async (event, myPluginConfig: MyPluginConfig) => {
    return await execBusiness(async () => {
      return await deleteCustomPlugin(myPluginConfig)
    })
  })
  // 先在主进程初始化一次
  initPlugins().then((r) => {})
}

// 获取插件文件
function getPluginFiles(...paths: string[]): string[] {
  nLogger.info(`准备加载插件目录`, paths)
  const pluginFiles = []
  for (const item of paths) {
    const pluginsDir = path.join(pluginRootPath, item)
    nLogger.info(`正在加载插件目录 ${pluginsDir}`)
    if (fs.existsSync(pluginsDir)) {
      pluginFiles.push(
        ...fs
          .readdirSync(pluginsDir)
          .filter((file) => file.endsWith('.js'))
          .map((file) => path.join(pluginsDir, file)),
      )
    } else {
      nLogger.info(`插件目录为空 ${pluginsDir}`)
    }
  }
  return pluginFiles
}

// 初始化插件
async function initPlugins(softList?: InstalledSoftware[]): Promise<ValidatedPluginConfig[]> {
  nLogger.info('初始化插件')
  loadedPluginConfigs.length = 0
  activePlugins.clear()
  abortSignals.clear()

  // 获取这两个目录下的插件
  const pluginFiles = getPluginFiles('core', 'custom')
  // 环境变量
  let env = WinUtil.getEnv()

  for (const filePath of pluginFiles) {
    try {
      const fileName = path.parse(filePath).name
      nLogger.info('开始加载插件', fileName)
      // 动态导入插件模块
      const module = await import(pathToFileURL(filePath).href)
      // 模块配置
      const moduleConfig = module.default as Record<string, unknown>
      // 插件创建时间
      const cTime = BaseUtil.getFormatedDateTime(fs.statSync(filePath).birthtime)
      // 实例化插件配置
      const pluginConfig = loadPluginConfig(moduleConfig, cTime, fileName)
      nLogger.debug('加载插件配置：', JSON.stringify(pluginConfig))
      // 实例化插件
      const plugin = new Plugin(pluginConfig, moduleConfig)
      // 已验证的插件
      const validatedPluginConfig: ValidatedPluginConfig = {
        ...pluginConfig,
        softInstallDir: '', // 初始化时的配置不进行验证
      }
      // 如果传递已安装的软件信息，则进行插件验证
      if (softList) {
        try {
          Object.assign(validatedPluginConfig, getValidatedFields(plugin.detect(softList, env)))
        } catch (e) {
          nLogger.error('插件校验出错：', e)
        }
      }
      // 初始化换成
      setActivePlugin(pluginConfig.id, plugin)
      loadedPluginConfigs.push(validatedPluginConfig)
      nLogger.info(`插件加载成功: ${fileName}`)
    } catch (error) {
      nLogger.error(`加载插件 ${path.basename(filePath, '.js')} 失败:`, error)
    }
  }
  initialized = true
  nLogger.debug('插件系统初始化成功')
  loadedPluginConfigs.forEach(config => {
    nLogger.debug(config.id, JSON.stringify(config.backupConfigs))
    nLogger.debug('============================')
  })
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
      softIconPath: detectResult.iconPath,
      softInstallDir: detectResult.installDir || detectResult.uninstallDir,
      softRegeditDir: detectResult.regeditDir,
    }
  }
}

// 停止执行插件后清空临时的资源
function clearOnPluginStop(taskOrId: PluginExecTask | string) {
  if (!taskOrId) return
  if (typeof taskOrId === 'string') {
    if (abortSignals.has(taskOrId)) {
      abortSignals.delete(taskOrId)
    }
  } else if (abortSignals.has(taskOrId.id)) {
    abortSignals.delete(taskOrId.id)
  }
}

// 执行插件
async function execPlugin(task: PluginExecTask, mainWindow: Electron.BrowserWindow) {
  const pluginId = task.pluginId
  nLogger.info(`准备执行插件[${pluginId}] 任务：`, task)
  const taskId = task.id
  const plugin = getActivePlugin(pluginId)
  if (!plugin) {
    nLogger.info(`未找到插件[${pluginId}]，可能已被删除`)
    throw new CommonError(`未找到插件，可能已被删除`)
  }
  const abortController = new AbortController()
  abortSignals.set(taskId, abortController)

  nLogger.info(`开始执行插件[${pluginId}] 任务 ${taskId}`)
  WinUtil.ensureDirectoryExistence(`${task.backupPath}/test`)
  const ranTask = await plugin.execPlugin(
    task,
    WinUtil.getEnv(),
    {
      progress(log: string, curr: number, total: number): void {
        nLogger.info(`插件[${pluginId}] 任务 ${taskId} 执行进度：${curr}/${total} ${log}`)
        // 通知渲染进程该插件的执行进度
        mainWindow?.webContents.send(IPC_CHANNELS.GET_PLUGIN_PROGRESS, taskId, log, curr, total)
      },
      onItemFinished(configName: string, configItemResult: TaskItemResult): void {
        nLogger.info(
          `插件[${pluginId}] 任务 ${taskId} 配置[${configName}]子项[${configItemResult.sourcePath}]执行结束：`,
          configItemResult,
        )
        mainWindow?.webContents.send(IPC_CHANNELS.ON_PLUGIN_ITEM_FINISHED, taskId, configName, configItemResult)
      },
    },
    abortController.signal,
  )
  nLogger.info(`插件[${pluginId}] 任务 ${taskId} 执行完成：`, ranTask)
  clearOnPluginStop(task)
  return ranTask
}

/**
 * 打开插件备份配置源路径
 * @param options
 */
async function openPluginConfigSourcePath(options: OpenPluginConfigSourcePathOptions) {
  if (options.itemConfig.type === 'registry') {
    return WinUtil.openRegedit(options.itemConfig.sourcePath)
  } else {
    if (!options.softInstallDir) {
      throw new CommonError('无关联的软件目录')
    }
    const resolvePath = Plugin.resolvePath(options.itemConfig.sourcePath, WinUtil.getEnv(), options.softInstallDir)
    return WinUtil.openPath(resolvePath)
  }
}

/**
 * 打开备份配置保存路径
 * @param options
 */
async function openPluginConfigTargetPath(options: OpenPluginConfigTargetPathOptions) {
  const resolvePath = Plugin.resolvePath(
    options.itemConfig.targetRelativePath,
    WinUtil.getEnv(),
    options.softInstallDir,
  )
  return WinUtil.openPath(path.join(options.backupPath, resolvePath))
}

interface GitHubFileEntry {
  name: string
  path: string
  type: 'file' | 'dir'
  download_url?: string
}

const downloadPlugins = async () => {
  nLogger.info('准备更新本地插件...')
  const userAgent = 'Electron-App'
  const apiUrl = import.meta.env.APP_PLUGINS_API_URL
  try {
    // 获取目录内容
    const response = await axios.get<GitHubFileEntry[]>(apiUrl, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/vnd.github.v3+json',
      },
    })
    nLogger.debug('API响应内容：', response)

    // 创建基础目录（如果不存在）
    const localBasePath = path.join(pluginRootPath, 'core/')
    if (!fs.existsSync(localBasePath)) {
      fs.mkdirSync(localBasePath, { recursive: true })
    }

    // 处理每个条目
    for (const item of response.data) {
      if (item.type === 'file' && path.extname(item.name) === '.js') {
        // 处理 JS 文件
        try {
          // 下载文件内容
          const fileResponse = await axios.get(item.download_url!, {
            responseType: 'text',
            headers: {
              'User-Agent': userAgent,
            },
          })
          const localFilePath = path.join(localBasePath, item.name)
          fs.writeFileSync(localFilePath, fileResponse.data)
          nLogger.info(`已下载插件：${localFilePath}`)
        } catch (error) {
          nLogger.error(`下载插件[${item.path}]报错：`, error)
        }
      }
    }
  } catch (error) {
    nLogger.error('无法访问github', error)
    throw new CommonError('无法访问github')
  }
}

const getCustomPluginPath = (config: MyPluginConfig) => path.join(pluginRootPath, 'custom', `${config.name}.js`)

const saveCustomPlugin = async (config: MyPluginConfig) => {
  const filePath = getCustomPluginPath(config)
  WinUtil.ensureDirectoryExistence(filePath)
  const backupConfigs: string[] = []
  config.backupConfigs.forEach((backup) => {
    backupConfigs.push(`{
      name: '${backup.name}',
      items: [
        ${backup.items
          .map(
            (item) => `{
          type: '${item.type}',
          sourcePath: '${item.sourcePath}',
          targetRelativePath: '${item.targetRelativePath}',
        }`,
          )
          .join(',')}
      ],
    }`)
  })
  const content = `module.exports = {
  type: 'CUSTOM',
  id: '${config.id}',
  name: '${config.name}',
  backupConfigs: [
    ${backupConfigs.join(',')}
  ],
  detect(list, env) {
    return this.detectByCustom(list, '${config.softInstallDir}')
  },
}

  `
  nLogger.info('即将添加自定义配置：', content)
  fs.writeFileSync(filePath, content, 'utf8')
  nLogger.info('添加自定义配置成功')
}

const deleteCustomPlugin = async (config: MyPluginConfig) => {
  fs.unlinkSync(getCustomPluginPath(config))
  const oldDataIndex = loadedPluginConfigs.indexOf(config)
  if (oldDataIndex > -1) {
    loadedPluginConfigs.splice(oldDataIndex, 1)
  }
  delActivePlugin(config.id)
}

export { initPluginSystem }
