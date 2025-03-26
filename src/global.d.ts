import { Route, Router } from 'vue-router'
import AppUtil from '@/utils/app-util'
import type { IpcChannels } from '@/types/IpcChannels'
import type { IpcRendererEventListener } from '@/types/ElectronRenderer'

// 对vue进行类型补充说明
declare module 'vue' {
  interface ComponentCustomOptions {
    beforeRouteEnter?(to: Route, from: Route, next: () => void): void
  }

  interface ComponentCustomProperties {
    $route: Route
    $router: Router
    $appUtil: AppUtil
  }
}

// 全局类型
declare global {
  export interface Window {
    electronAPI?: {
      ipcSend: (channel: IpcChannels, ...args: any[]) => void
      // ipcSendSync: (channel: IpcChannels, ...args: any[]) => any
      ipcOn: (channel: IpcChannels, listener: IpcRendererEventListener) => void
      ipcOnce: (channel: IpcChannels, listener: IpcRendererEventListener) => void
      ipcOff: (channel: IpcChannels, listener: IpcRendererEventListener) => void
      ipcOffAll: (channel: IpcChannels) => void
      ipcInvoke: (channel: IpcChannels, ...args: any[]) => any
    }
  }
}

export {}
