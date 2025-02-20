// https://www.electronjs.org/zh/docs/latest/tutorial/quick-start
// https://blog.csdn.net/Lyrelion/article/details/128264100
// https://juejin.cn/post/7303746615365845002
// app 控制应用程序的事件生命周期（相当于应用程序）
// BrowserWindow 创建并控制浏览器窗口（相当于打开桌面弹框）
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import path from 'node:path'
// import os from 'node:os'
import IPC from './ipc'

// APP目录
const rootPath = path.join(__dirname, '../')
// Vite 打包前端代码的目录（渲染进程）
const rendererDist = path.join(rootPath, 'dist')
// Electron 代码后的目录（主进程）
const mainDist = path.join(rootPath, 'dist-electron')
// 开发环境 url
const devServerUrl = process.env.VITE_DEV_SERVER_URL
// 静态资源目录
const publicPath = devServerUrl ? path.join(rootPath, 'public') : rendererDist

// 禁用 Windows 7 的 GPU 加速
// if (os.release().startsWith('6.1')){
  app.disableHardwareAcceleration()
// }

// 设置 Windows 10+ 通知的应用程序名称
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

// 限制只能开启一个应用
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
  process.exit(0)
}

let mainWindow: BrowserWindow | null = null
const preload = path.join(mainDist, 'preload.js')
const icon = path.join(publicPath, 'favicon.ico')
const indexHtml = path.join(rendererDist, 'index.html')

// 创建窗口 https://www.electronjs.org/zh/docs/latest/api/browser-window
const createWindow = () => {
  mainWindow = new BrowserWindow({
    // 隐藏菜单栏
    autoHideMenuBar: true,
    // 隐藏标题
    titleBarStyle: 'hidden',
    // 在 Windows/Linux 上添加窗口的控件
    // ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    minWidth: 750,
    minHeight: 500,
    resizable: true,
    webPreferences: {
      sandbox: true,
      // 集成网页和 Node.js，也就是在渲染进程中，可以调用 Node.js 方法
      // contextIsolation: false,
      // nodeIntegration: true,
      preload: preload,
    },
    icon: icon,
    show: false,
  })
  // 隐藏 MacOS 交通信号灯
  if (process.platform === 'darwin') {
    mainWindow.setWindowButtonVisibility(false)
  }
  // 在加载页面时，渲染进程第一次完成绘制时，如果窗口还没有被显示，渲染进程会发出 ready-to-show 事件
  // 解决启动后右下角黑边闪烁的问题
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 在开发环境和生产环境均可通过快捷键打开devTools
  globalShortcut.register('CommandOrControl+Shift+i', function () {
    mainWindow?.webContents.openDevTools()
  })

  // 注册 IPC 处理器
  IPC.init(mainWindow)

  if (devServerUrl) {
    // 开发
    mainWindow.loadURL(devServerUrl).then(() => {})
  } else {
    // 生产
    mainWindow.loadFile(indexHtml).then(() => {})
  }
}

// 这段程序将会在 Electron 结束初始化和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此, 通常对应用程序和它们的菜单栏来说应该时刻保持激活状态,
// 直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
  mainWindow = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  // 当运行第二个实例时，将会聚焦到主窗口
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    mainWindow.show()
  }
})

app.on('activate', () => {
  // 在 macOS 系统内, 如果没有已开启的应用窗口
  // 点击托盘图标时通常会重新创建一个新窗口
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})
