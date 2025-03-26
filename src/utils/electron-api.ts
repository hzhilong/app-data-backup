import { BuResult } from '@/types/BuResult'
import { type IpcChannels } from '@/types/IpcChannels'
import { CommonError } from '@/types/CommonError'
import type { IpcRendererEventListener } from '@/types/ElectronRenderer'

// 项目规定的标准调用方法
export async function ipcInvoke(channel: IpcChannels, ...args: any[]): Promise<void>
export async function ipcInvoke<T>(channel: IpcChannels, ...args: any[]): Promise<T>
export async function ipcInvoke<T = void>(channel: IpcChannels, ...args: any[]): Promise<T> {
  // 当作前后端通信就行，后端只能传序列化的数据，所有异步任务的结果需要包装成BuResult，获取后再解包成Promise
  const result = (await window.electronAPI?.ipcInvoke(channel, ...args)) as BuResult<T>
  if (result.success) {
    return result.data as T
  } else {
    throw new CommonError(result.msg)
  }
}

export function ipcOn(channel: IpcChannels, listener: IpcRendererEventListener) {
  window.electronAPI?.ipcOn(channel, listener)
}

export function ipcOnce(channel: IpcChannels, listener: IpcRendererEventListener) {
  window.electronAPI?.ipcOnce(channel, listener)
}

export function ipcOff(channel: IpcChannels, listener: IpcRendererEventListener) {
  window.electronAPI?.ipcOff(channel, listener)
}

export function ipcOffAll(channel: IpcChannels, listener: IpcRendererEventListener) {
  window.electronAPI?.ipcOffAll(channel)
}

export function ipcSend(channel: IpcChannels, ...args: any[]) {
  window.electronAPI?.ipcSend(channel, ...args)
}
