// 所有的 Node.js API接口 都可以在 preload 进程中被调用.
// 它拥有与Chrome扩展一样的沙盒。

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IpcChannels } from '@/types/IpcChannels'

// 该项目需要动态执行js
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = String(true)
contextBridge.exposeInMainWorld('electronAPI', {
  // https://www.electronjs.org/zh/docs/latest/api/ipc-renderer
  ipcSend(channel: IpcChannels, ...args: unknown[]) {
    ipcRenderer.send(channel, ...args)
  },
  // ipcSendSync(channel: IpcChannels, ...args: unknown[]) {
  //   return ipcRenderer.sendSync(channel, ...args)
  // },
  ipcOn(channel: IpcChannels, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) {
    ipcRenderer.on(channel, listener)
  },
  ipcOnce(channel: IpcChannels, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) {
    ipcRenderer.once(channel, listener)
  },
  ipcOff(channel: IpcChannels, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) {
    ipcRenderer.removeListener(channel, listener)
  },
  ipcOffAll(channel: IpcChannels) {
    ipcRenderer.removeAllListeners(channel)
  },
  ipcInvoke(channel: IpcChannels, ...args: unknown[]) {
    return ipcRenderer.invoke(channel, ...args)
  },
})
