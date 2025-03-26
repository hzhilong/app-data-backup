import type { IpcRendererEvent } from 'electron'

export type IpcRendererEventListener = (event: IpcRendererEvent, ...args: any[]) => void
