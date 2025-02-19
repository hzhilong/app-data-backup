export default {
  exitApp() {
    if (window.windowAPI) {
      window.windowAPI.closeWindow()
    } else {
      // 非 Electron 环境，忽略窗口关闭操作
    }
  },
  maxApp() {
    if (window.windowAPI) {
      window.windowAPI.maxWindow()
    }
  },
  minApp() {
    if (window.windowAPI) {
      window.windowAPI.minWindow()
    }
  },
  browsePage(url: string) {
    if (window.windowAPI) {
      window.windowAPI.browsePage(url)
    }
  },
}
