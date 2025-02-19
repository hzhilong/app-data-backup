// 所有的 Node.js API接口 都可以在 preload 进程中被调用.
// 它拥有与Chrome扩展一样的沙盒。

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer, shell } = require('electron')

// 该项目需要动态执行js
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = String(true)

contextBridge.exposeInMainWorld('windowAPI', {
  closeWindow: () => ipcRenderer.send('window-close'),
  minWindow: () => ipcRenderer.send('window-min'),
  maxWindow: () => ipcRenderer.send('window-max'),
  browsePage: (url: string) => shell.openExternal(url),
})
