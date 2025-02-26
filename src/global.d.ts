import { Route, Router } from 'vue-router'
import AppUtil from '@/utils/app-util.ts'
import type { IpcChannels } from '@/models/IpcChannels'

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
      ipcSend: (channel: IpcChannels, ...data: unknown[]) => void
      ipcSendSync: (channel: IpcChannels, ...data: unknown[]) => unknown
      ipcOn: (channel: IpcChannels, listener: IpcListener) => void
      ipcOnce: (channel: IpcChannels, listener: IpcListener) => void
      ipcOff: (channel: IpcChannels) => void
      ipcInvoke: (channel: IpcChannels, ...data: unknown[]) => unknown
    }
  }
}

export {}
