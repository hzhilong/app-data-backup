import { app } from 'electron'
import path from 'path'

/**
 * 应用相关路径数据
 *
 * app.getAppPath()
 *    dev：E:\Projects\io.github.hzhilong\app-data-backup
 *    pro:
 *      asar: E:\Projects\io.github.hzhilong\app-data-backup\release\0.0.1\win-unpacked\resources\app.asar
 *      !asar: E:\Projects\io.github.hzhilong\app-data-backup\release\0.0.1\win-unpacked\resources\app
 *
 * app.getPath('exe')
 *    dev：E:\Projects\io.github.hzhilong\app-data-backup\node_modules\electron\dist\electron.exe
 *    pro: E:\Projects\io.github.hzhilong\app-data-backup\release\0.0.1\win-unpacked\软件数据备份.exe
 */

// 开发环境 url
const devUrl = process.env.VITE_DEV_SERVER_URL
// 获取应用根目录  开发：项目路径 / 生产： 启用了asar：返回app.asar所在目录 / 未启用asar：安装后的app目录
const appRootPath = app.getAppPath()
// 获取程序根目录  开发：项目路径 / 生产：安装路径
const programRoot = devUrl ? appRootPath : path.dirname(app.getPath('exe'))
// 构建后的资源路径（开发环境不要使用）
const appResourcesPath = path.dirname(appRootPath)
// 前端代码打包后的目录（渲染进程）
const appRendererDist = path.join(appRootPath, 'dist')
// Electron代码打包的目录（主进程）
const appMainDist = path.join(appRootPath, 'dist-electron')
// 静态资源目录 开发环境直接取根目录下的 public
const appPublicPath = devUrl ? path.join(appRootPath, 'public') : appRendererDist
/**
 * 插件根目录
 * 生产环境需根据electron-builder的extraFiles/extraResources配置进行读取
 * 此项目目前的打包配置 public/plugins => resources/plugins
 */
const pluginRootPath = devUrl ? appPublicPath : appResourcesPath

export const AppPath = {
  devUrl,
  appRootPath,
  programRoot,
  appResourcesPath,
  appRendererDist,
  appMainDist,
  appPublicPath,
  pluginRootPath,
}
