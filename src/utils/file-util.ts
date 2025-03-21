import { IPC_CHANNELS } from '@/models/ipc-channels'
import { BuResult } from '@/models/bu-result'

interface OpenDialogOptions {
  title?: string
  defaultPath?: string
  /**
   * Custom label for the confirmation button, when left empty the default label will be used.
   */
  buttonLabel?: string
  /**
   * File types that can be displayed or selected.
   */
  filters?: {
    name: string
    /**
     * Extensions without wildcards or dots (e.g. 'png' is good but '.png' and '*.png' are bad).
     * To show all files, use the '*' wildcard (no other wildcard is supported).
     */
    extensions: string[]
  }[]
  /**
   * Contains which features the dialog should use.
   */
  properties?: (
    | 'openFile'
    | 'openDirectory'
    | 'multiSelections'
    | 'createDirectory'
    | 'showHiddenFiles'
    | 'promptToCreate'
    | 'noResolveAliases'
  )[]
  /**
   * Normalize the keyboard access keys across platforms.
   */
  normalizeAccessKeys?: boolean
  /**
   * Message to display above input boxes.
   */
  message?: string
}

interface OpenDialogResult {
  canceled: boolean
  filePaths: string[]
  bookmarks: string[]
}

export default class FileUtil {
  static async showOpenDialog(options?: OpenDialogOptions, defaultCurrDir: boolean = true) {
    return BuResult.getPromise(
      (await window.electronAPI?.ipcInvoke(
        IPC_CHANNELS.SHOW_OPEN_DIALOG,
        options,
        defaultCurrDir,
      )) as BuResult<OpenDialogResult>,
    )
  }

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
