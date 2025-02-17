export default {
  exitApp() {
    if (window.electronAPI) {
      window.electronAPI.closeWindow()
    } else {
      // 非 Electron 环境，忽略窗口关闭操作
    }
  },
  maxApp() {
    if (window.electronAPI) {
      window.electronAPI.maxWindow()
    }
  },
  minApp() {
    if (window.electronAPI) {
      window.electronAPI.minWindow()
    }
  },
  browsePage(url: string) {
    if (window.electronAPI) {
      window.electronAPI.browsePage(url)
    }
  },
}
