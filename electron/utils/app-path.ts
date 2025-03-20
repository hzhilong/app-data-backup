import { app } from 'electron'
import path from 'path'

// 获取项目主目录（开发时的项目路径/安装后的安装路径）
export const getAppBasePath = () => {
  return process.env.VITE_DEV_SERVER_URL ? app.getAppPath() : path.dirname(app.getPath('exe'))
}
