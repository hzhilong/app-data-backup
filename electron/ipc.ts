import { app, ipcMain, shell } from 'electron'
import { promisified as regedit, RegistryItem, setExternalVBSLocation } from 'regedit'
import path from 'node:path'
import { IPC_CHANNELS } from '../src/models/IpcChannels'
import {
  InstalledSoftware,
  SOFTWARE_REGEDIT_GROUP,
  SoftwareRegeditGroupKey,
} from '../src/models/Software'
import BrowserWindow = Electron.BrowserWindow
import { SoftwareUtil } from './win-util'

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
      return new Promise(async (resolve, reject) => {
        const softArr: InstalledSoftware[] = []
        try {
          const regeditPath = SOFTWARE_REGEDIT_GROUP[regeditGroupKey].path
          const pathList = await regedit.list([regeditPath])
          const pathResult: RegistryItem = pathList[regeditPath]
          if (!pathResult.exists || !pathResult.keys) {
            resolve([])
            return
          } else {
            const subPathNames: Record<string, string> = {}
            const subPaths: string[] = []
            for (const key of pathResult.keys) {
              // if(key.indexOf('{94D65B56-F9EE-48AE-A96C-83D4CD913BC5}')<0){
              //   continue
              // }
              const subPath = `${regeditPath}\\${key}`
              subPathNames[subPath] = key
              subPaths.push(subPath)
            }
            const subPathResults = await regedit.list(subPaths)
            for (const softPath in subPathResults) {
              const infoResult: RegistryItem = subPathResults[softPath]
              if (!infoResult.exists) {
              } else {
                const software = await SoftwareUtil.parseInstalledSoftware(
                  regeditGroupKey,
                  regeditPath,
                  subPathNames[softPath],
                  infoResult.values,
                )
                if (software) {
                  softArr.push(software)
                }
              }
            }
          }
        } catch (error) {
          reject(error)
          return
        }
        resolve(softArr)
      })
    })
  },
}
