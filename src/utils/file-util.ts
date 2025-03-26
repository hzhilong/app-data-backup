import { IPC_CHANNELS } from '@/types/IpcChannels'
import { ipcInvoke } from '@/utils/electron-api'
import type { OpenDialogOptions } from 'electron'

/**
 * 打开对话框的结果
 */
export interface OpenDialogResult {
  canceled: boolean
  filePaths: string[]
  bookmarks: string[]
}

export default class FileUtil {
  // 展示文件选择的弹窗
  static async showOpenDialog(options?: OpenDialogOptions, defaultCurrDir: boolean = true) {
    return ipcInvoke<OpenDialogResult>(IPC_CHANNELS.SHOW_OPEN_DIALOG, options, defaultCurrDir)
  }

  // 选择目录
  static async chooseDirectory(options?: OpenDialogOptions) {
    return this.showOpenDialog(
      Object.assign(
        {
          buttonLabel: '选择',
          properties: ['openFile', 'openDirectory'],
        },
        options,
      ),
    )
  }
}
