import { ipcMain, shell } from 'electron'
import { setExternalVBSLocation } from 'regedit'
import path from 'node:path'
import { IPC_CHANNELS } from '@/models/IpcChannels'
import { SoftwareRegeditGroupKey } from '@/models/Software'
import BrowserWindow = Electron.BrowserWindow
import { WinUtil } from './utils/win-util'
import { getIconBase64, getInstalledSoftware } from './utils/software-util'

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

    ipcMain.handle(IPC_CHANNELS.GET_ICON, (event, iconPath: string) => {
      return getIconBase64(iconPath)
    })

    ipcMain.handle(IPC_CHANNELS.OPEN_REGEDIT, (event, path: string) => {
      WinUtil.openRegedit(path)
    })

    ipcMain.handle(IPC_CHANNELS.READ_REGEDIT_VALUES, (event, path: string) => {
      return WinUtil.readRegeditValues(path)
    })

    ipcMain.handle(IPC_CHANNELS.OPEN_PATH, (event, fileOrDir: string) => {
      WinUtil.openPath(fileOrDir)
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

  },
}
