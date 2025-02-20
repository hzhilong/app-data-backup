import { app, ipcMain, shell } from 'electron'
import { promisified as regedit, RegistryItem, setExternalVBSLocation } from 'regedit'
import path from 'node:path'
import { IPC_CHANNELS } from '../src/models/IpcChannels'
import { Software, SoftwareRegeditPath } from '../src/models/Software'
import BrowserWindow = Electron.BrowserWindow

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

    ipcMain.handle(IPC_CHANNELS.GET_INSTALLED_SOFTWARE, (event, regeditPath: SoftwareRegeditPath) => {
      return new Promise(async (resolve, reject) => {
        try {
          const pathList = await regedit.list([regeditPath])
          const pathResult: RegistryItem = pathList[regeditPath]
          if (!pathResult.exists || !pathResult.keys) {
            resolve([])
          } else {
            const softArr: Software[] = []
            const subPathNames:Record<string, string> = {}
            const subPaths:string[] = []
            for (const key of pathResult.keys) {
              const subPath = `${regeditPath}\\${key}`
              subPathNames[subPath] = key
              subPaths.push(subPath)
            }
            const subPathResults = await regedit.list(subPaths)
            for (const softPath in subPathResults) {
              const infoResult: RegistryItem = subPathResults[softPath]
              if (!infoResult.exists) {
              } else {
                const software = Software.parseSoftwareEntry(regeditPath, subPathNames[softPath], infoResult.values)
                if (software) {
                  if (software.iconPath) {
                    try {
                      software.base64Icon = (await app.getFileIcon(path.dirname(software.iconPath))).toDataURL()
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e: unknown) {}
                  }
                  softArr.push(software)
                }
              }
            }
            resolve(softArr)
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  },
}
