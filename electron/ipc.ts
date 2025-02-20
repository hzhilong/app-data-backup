import { ipcMain, shell } from 'electron'
import { promisified as regedit, setExternalVBSLocation } from 'regedit'
import path from 'node:path'
import { IPC_CHANNELS } from '../src/models/ipcChannels'
import { Software } from '../src/models/Software'

if (process.env.NODE_ENV === 'development') {
  setExternalVBSLocation(path.join(__dirname, '../node_modules/regedit/vbs'))
} else {
  setExternalVBSLocation('resources/regedit/vbs')
}

export default {
  init(mainWindow) {
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

    ipcMain.handle(IPC_CHANNELS.FIND_ALL_SOFTWARE, () => {
      return new Promise((resolve, reject) => {
        const registryPaths: string[] = [
          'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
          'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
          'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
        ]
        try {
          const list = regedit.list(registryPaths)
          console.log('ipc', list)
          const all: Software[] = []
          const p1 = new Software('ccc', '/dadasd')
          all.push(p1)
          resolve(all)
        } catch (error) {
          reject(error)
        }
      })
    })
  },
}
