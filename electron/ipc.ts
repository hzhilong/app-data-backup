import { dialog, ipcMain, nativeTheme, shell } from 'electron'
import { setExternalVBSLocation } from 'regedit'
import path from 'node:path'
import { IPC_CHANNELS } from '@/models/ipc-channels'
import { SoftwareRegeditGroupKey } from '@/models/software'
import WinUtil from './utils/win-util'
import { getIconBase64, getInstalledSoftware } from './utils/software-util'
import { execBusiness } from '@/models/bu-result'
import fs from 'fs'
import nLogger from './utils/log4js'
import { getAppBasePath } from './utils/app-path'
import { AppLog } from '@/models/app-log'
import BrowserWindow = Electron.BrowserWindow
import OpenDialogOptions = Electron.OpenDialogOptions

if (process.env.NODE_ENV === 'development') {
  setExternalVBSLocation(path.join(__dirname, '../node_modules/regedit/vbs'))
} else {
  setExternalVBSLocation('resources/regedit/vbs')
}

export default {
  init(mainWindow: BrowserWindow) {
    ipcMain.on(IPC_CHANNELS.WINDOW_MIN, function () {
      mainWindow?.minimize()
    })

    ipcMain.on(IPC_CHANNELS.WINDOW_MAX, function () {
      if (mainWindow?.isMaximized()) {
        mainWindow?.restore()
      } else {
        mainWindow?.maximize()
      }
    })

    ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, function () {
      mainWindow?.close()
    })

    ipcMain.on(IPC_CHANNELS.BROWSE_PAGE, function (event, url) {
      shell.openExternal(url)
    })

    ipcMain.handle(IPC_CHANNELS.GET_INSTALLED_SOFTWARE, (event, regeditGroupKey: SoftwareRegeditGroupKey) => {
      return getInstalledSoftware(regeditGroupKey)
    })

    ipcMain.handle(IPC_CHANNELS.GET_ICON, async (event, iconPath: string) => {
      // nLogger.debug('获取的图标大小：', buResult.data?.length)
      return await execBusiness(async () => {
        return await getIconBase64(iconPath)
      })
    })

    ipcMain.handle(IPC_CHANNELS.OPEN_REGEDIT, async (event, path: string) => {
      return await execBusiness(async () => {
        return WinUtil.openRegedit(path)
      })
    })

    ipcMain.handle(IPC_CHANNELS.READ_REGEDIT_VALUES, (event, path: string) => {
      return WinUtil.readRegeditValues(path)
    })

    ipcMain.handle(IPC_CHANNELS.OPEN_PATH, async (event, fileOrDir: string) => {
      return await execBusiness(async () => {
        return await WinUtil.openPath(fileOrDir)
      })
    })

    ipcMain.handle(IPC_CHANNELS.READ_JSON_FILE, (event, filePath: string) => {
      return WinUtil.readJsonFile(filePath)
    })

    ipcMain.handle(IPC_CHANNELS.WRITE_JSON_FILE, (event, filePath: string, data: unknown) => {
      return WinUtil.writeJsonFile(filePath, data)
    })

    ipcMain.handle(IPC_CHANNELS.EXPORT_REGEDIT, (event, regPath: string, filePath: string) => {
      return WinUtil.exportRegedit(regPath, filePath)
    })

    ipcMain.handle(IPC_CHANNELS.IMPORT_REGEDIT, (event, regPath: string, filePath: string) => {
      return WinUtil.importRegedit(regPath, filePath)
    })

    ipcMain.handle(IPC_CHANNELS.COPY_FILE, (event, src: string, des: string) => {
      return WinUtil.copyFile(src, des)
    })

    ipcMain.handle(IPC_CHANNELS.SHOULD_USE_DARK_COLORS, () => {
      return nativeTheme.shouldUseDarkColors
    })

    ipcMain.handle(
      IPC_CHANNELS.SHOW_OPEN_DIALOG,
      async (_event, options: OpenDialogOptions, defaultCurrDir: boolean = true) => {
        return await execBusiness(async () => {
          if (!options.defaultPath && defaultCurrDir) {
            options.defaultPath = getAppBasePath()
          }
          return dialog.showOpenDialog(options)
        })
      },
    )

    ipcMain.handle(IPC_CHANNELS.CREATE_BACKUP_DIR, async () => {
      return await execBusiness(async () => {
        const dir = path.join(getAppBasePath(), import.meta.env.APP_DEFAULT_BACKUP_DIR)
        if (!fs.existsSync(dir)) {
          const ret = fs.mkdirSync(dir)
          nLogger.debug('Create backup directory', dir, ret)
        }
        return dir
      })
    })

    ipcMain.handle(IPC_CHANNELS.SAVE_LOG, (event, appLog: AppLog) => {
      let level = appLog.level
      if (level === 'error') {
        nLogger.error(appLog.contents)
      } else if (level === 'debug') {
        nLogger.debug(appLog.contents)
      } else {
        nLogger.info(appLog.contents)
      }
    })
  },
}
