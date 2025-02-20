import BaseUtil from '@/utils/base-util'
import { IPC_CHANNELS } from "../models/ipcChannels.ts";
import { Software } from "../models/Software.ts";

export default class RegeditUtil {
  public static async findAllSoftware(): Promise<Software[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const list = await window.electronAPI?.ipcInvoke(IPC_CHANNELS.FIND_ALL_SOFTWARE)
        console.log('reg-util', list)
        resolve(list)
      } catch (error: unknown) {
        reject(BaseUtil.convertToCommonError(error, '读取注册表失败：'))
      }
    })
  }
}
