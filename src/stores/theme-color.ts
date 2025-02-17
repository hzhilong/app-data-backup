import { defineStore } from 'pinia'

function switchTheme(color: string) {
  setCssVar('--app-color-primary', color)
  setCssVar('--app-color-active', color + '60')
  setCssVar('--app-color-hover', color + '20')
}

function setCssVar(k: string, v: string) {
  document.documentElement.style.setProperty(k, v)
}

export const ThemeColorStore = defineStore('ThemeColorStore', {
  state: () => {
    return {
      colors: [
        '#6284DF',
        '#FF0000',
        '#FF7D00',
        '#dada39',
        '#20a820',
        '#4cd5d5',
        '#2424c4',
        '#b439b4',
      ],
      colorIndex: 0,
      primaryColor: '#6284DF',
    }
  },
  getters: {
    getThemeColor: (state) => state.primaryColor,
  },
  actions: {
    initThemeColor(){
      switchTheme(this.primaryColor)
    },
    switchThemeColor() {
      this.colorIndex++
      this.primaryColor = this.colors[this.colorIndex % this.colors.length]
      switchTheme(this.primaryColor)
    },
    setDefaultTheme() {
      this.primaryColor = this.colors[0]
      switchTheme(this.primaryColor)
    },
  },
  persist: true,
})
