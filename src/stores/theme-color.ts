import { defineStore } from 'pinia'

function switchTheme(color: string) {
  const rgb = color.substring(4, color.length-1)
  setCssVar('--app-theme-color', rgb)
}

function setCssVar(k: string, v: string) {
  document.documentElement.style.setProperty(k, v)
}

export const ThemeColorStore = defineStore('ThemeColorStore', {
  state: () => {
    return {
      colors: [
        'rgb(98,132,223)',
        'rgb(238,82,83)',
        'rgb(255,159,67)',
        'rgb(254,202,87)',
        'rgb(32,168,32)',
        'rgb(29,209,161)',
        'rgb(0,174,236)',
        'rgb(251,114,153)',
      ],
      colorIndex: 0,
    }
  },
  getters: {
    getThemeColor: (state) => state.colors[state.colorIndex % state.colors.length],
  },
  actions: {
    initThemeColor(){
      switchTheme(this.getThemeColor)
    },
    switchThemeColor() {
      this.colorIndex++
      switchTheme(this.getThemeColor)
    },
    setDefaultTheme() {
      this.colorIndex = 0
      switchTheme(this.colors[0])
    },
  },
  persist: true,
})
