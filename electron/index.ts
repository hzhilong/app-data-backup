// https://www.electronjs.org/zh/docs/latest/tutorial/quick-start
// https://blog.csdn.net/Lyrelion/article/details/128264100
// https://juejin.cn/post/7303746615365845002

// app 控制应用程序的事件生命周期（相当于应用程序）
// BrowserWindow 创建并控制浏览器窗口（相当于打开桌面弹框）
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import path from 'path'

// 定义全局变量获取 窗口实例
let mainWindow: BrowserWindow

// 关闭GPU加速
app.disableHardwareAcceleration()

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
      // 集成网页和 Node.js，也就是在渲染进程中，可以调用 Node.js 方法
      // contextIsolation: false,
      // nodeIntegration: true,
      preload: path.join(path.resolve(), 'electron/preload.ts'),
    },
    icon: path.join(path.resolve(), 'public/favicon.ico'),
    show: false,
  })
  if (process.platform === 'darwin') {
    // 隐藏MacOS交通信号灯
    mainWindow.setWindowButtonVisibility(false)
  }
  // 在加载页面时，渲染进程第一次完成绘制时，如果窗口还没有被显示，渲染进程会发出 ready-to-show 事件
  // 解决启动后右下角黑边闪烁的问题
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 在开发环境和生产环境均可通过快捷键打开devTools
  globalShortcut.register('CommandOrControl+Shift+i', function () {
    mainWindow.webContents.openDevTools()
  })

  // 主窗口最小化
  ipcMain.on('window-min', function () {
    mainWindow.minimize()
  })

  // 主窗口最大化
  ipcMain.on('window-max', function () {
    if (mainWindow.isMaximized()) {
      mainWindow.restore()
    } else {
      mainWindow.maximize()
    }
  })

  // 关闭主窗口
  ipcMain.on('window-close', function () {
    mainWindow.close()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    // 开发
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).then(() => {})
  } else {
    // 生产
    mainWindow.loadFile('dist/index.html').then(() => {})
  }
}

// 这段程序将会在 Electron 结束初始化和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // 在 macOS 系统内, 如果没有已开启的应用窗口
    // 点击托盘图标时通常会重新创建一个新窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此, 通常对应用程序和它们的菜单栏来说应该时刻保持激活状态,
// 直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
