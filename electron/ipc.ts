import { dialog, ipcMain, nativeTheme, shell } from 'electron'
import { setExternalVBSLocation } from 'regedit'
import path from 'node:path'
import { IPC_CHANNELS } from '@/types/IpcChannels'
import { SoftwareRegeditGroupKey } from '@/types/Software'
import WinUtil from './utils/win-util'
import { getIconBase64, getInstalledSoftware } from './utils/software-util'
import { execBusiness } from '@/types/BuResult'
import fs from 'fs'
import nLogger, { LOG_DIR } from './utils/log4js'
import { AppLog } from '@/types/AppLog'
import BrowserWindow = Electron.BrowserWindow
import OpenDialogOptions = Electron.OpenDialogOptions
import { AppPath } from './utils/app-path'

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

    ipcMain.handle(IPC_CHANNELS.BROWSE_PAGE, async function (event, url) {
      return await execBusiness(async () => {
        await shell.openExternal(url)
      })
    })

    ipcMain.handle(IPC_CHANNELS.GET_INSTALLED_SOFTWARE, async (event, regeditGroupKey: SoftwareRegeditGroupKey) => {
      return await execBusiness(async () => {
        return await getInstalledSoftware(regeditGroupKey)
      })
    })

    ipcMain.handle(IPC_CHANNELS.GET_ICON, async (event, iconPath: string) => {
      return await execBusiness(async () => {
        return await getIconBase64(iconPath)
      })
    })

    ipcMain.handle(IPC_CHANNELS.OPEN_REGEDIT, async (event, path: string) => {
      return await execBusiness(async () => {
        return WinUtil.openRegedit(path)
      })
    })

    ipcMain.handle(IPC_CHANNELS.OPEN_PATH, async (event, fileOrDir: string) => {
      return await execBusiness(async () => {
        return await WinUtil.openPath(fileOrDir)
      })
    })

    ipcMain.handle(IPC_CHANNELS.SHOULD_USE_DARK_COLORS, async () => {
      return await execBusiness(async () => {
        return nativeTheme.shouldUseDarkColors
      })
    })

    ipcMain.handle(
      IPC_CHANNELS.SHOW_OPEN_DIALOG,
      async (_event, options: OpenDialogOptions, defaultCurrDir: boolean = true) => {
        return await execBusiness(async () => {
          if (!options.defaultPath && defaultCurrDir) {
            options.defaultPath = AppPath.programRoot
          }
          return dialog.showOpenDialog(options)
        })
      },
    )

    ipcMain.handle(IPC_CHANNELS.CREATE_BACKUP_DIR, async () => {
      return await execBusiness(async () => {
        const dir = path.join(AppPath.programRoot, import.meta.env.APP_DEFAULT_BACKUP_DIR)
        if (!fs.existsSync(dir)) {
          const ret = fs.mkdirSync(dir)
          nLogger.debug('Create backup directory', dir, ret)
        }
        return dir
      })
    })

    ipcMain.on(IPC_CHANNELS.SAVE_LOG, (event, appLog: AppLog) => {
      let level = appLog.level
      if (level === 'error') {
        nLogger.error(appLog.contents)
      } else if (level === 'debug') {
        nLogger.debug(appLog.contents)
      } else {
        nLogger.info(appLog.contents)
      }
    })

    ipcMain.handle(IPC_CHANNELS.OPEN_LOGS_DIR, async (event, fileOrDir: string) => {
      return await execBusiness(async () => {
        return await WinUtil.openPath(LOG_DIR)
      })
    })
  },
}
