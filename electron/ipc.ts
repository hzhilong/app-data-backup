import { ipcMain, shell } from 'electron'
import { setExternalVBSLocation } from 'regedit'
import path from 'node:path'
import { IPC_CHANNELS } from '../src/models/IpcChannels'
import { SoftwareRegeditGroupKey } from '../src/models/Software'
import BrowserWindow = Electron.BrowserWindow
import { CMDUtil } from './utils/win-util'
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
      return CMDUtil.openRegedit(path)
    })
  },
}
