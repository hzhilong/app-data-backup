export default {
  exitApp() {
    try {
      window.require('electron').ipcRenderer.send('window-close')
    } catch (e) {}
  },
  maxApp() {
    try {
      window.require('electron').ipcRenderer.send('window-max')
    } catch (e) {
      console.log(e)
    }
  },
  minApp() {
    try {
      window.require('electron').ipcRenderer.send('window-min')
    } catch (e) {}
  },
  browsePage(url) {
    console.log(url)
    try {
      window.require('electron').shell.openExternal(url)
    } catch (e) {
      window.open(url, '_blank')
    }
  }
}
