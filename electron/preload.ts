// 所有的 Node.js API接口 都可以在 preload 进程中被调用.
// 它拥有与Chrome扩展一样的沙盒。

// eslint-disable-next-line @typescript-eslint/no-require-imports

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import {  IpcChannels } from '../src/common/models/IpcChannels'

// 该项目需要动态执行js
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = String(true)
contextBridge.exposeInMainWorld('electronAPI', {
  // https://www.electronjs.org/zh/docs/latest/api/ipc-renderer
  ipcSend(channel: IpcChannels, ...data: unknown[]) {
    ipcRenderer.send(channel, ...data)
  },
  ipcSendSync(channel: IpcChannels, ...data: unknown[]) {
    return ipcRenderer.sendSync(channel, ...data)
  },
  ipcOn(channel: IpcChannels, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) {
    ipcRenderer.on(channel, listener)
  },
  ipcOnce(channel: IpcChannels, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) {
    ipcRenderer.once(channel, listener)
  },
  ipcOff(channel: IpcChannels) {
    ipcRenderer.removeAllListeners(channel)
  },
  ipcInvoke(channel: IpcChannels, ...data: unknown[]) {
    return ipcRenderer.invoke(channel, ...data)
  },
})
