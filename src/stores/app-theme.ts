import { defineStore } from 'pinia'
import type { AppThemeMode } from '@/utils/theme-util.ts'
import { logger } from '@/utils/logger.ts'

const defaultPrimaryColors = ['#6284DF', '#EE5253', '#FF9F43', '#FECA57', '#20A820', '#1DD1A1', '#00AEEC', '#FB7299']

export type AppThemeState = {
  // 当前使用的默认主题下标
  currPrimaryColorIndex: number
  // 主题色
  primaryColor: string
  // 主题模式
  themeMode: AppThemeMode
  // 当前是否为 dark
  dark: boolean
}

export const useAppThemeStore = defineStore('AppThemeStore', {
  state: () => {
    return {
      currPrimaryColorIndex: 0,
      primaryColor: defaultPrimaryColors[0],
      themeMode: 'light',
      dark: false,
    } as AppThemeState
  },
  getters: {},
  actions: {
    switchThemeColor() {
      this.currPrimaryColorIndex = (this.currPrimaryColorIndex+1) % defaultPrimaryColors.length
      const newColor = defaultPrimaryColors[this.currPrimaryColorIndex]
      logger.debug(`SwitchThemeColor`, this.currPrimaryColorIndex, newColor)
      return this.setPrimaryColor(newColor)
    },
    setPrimaryColor(color: string) {
      this.primaryColor = color
      return this.primaryColor
    },
    setThemeMode(themeMode: AppThemeMode) {
      this.themeMode = themeMode
      return this.themeMode
    },
  },
  persist: true,
})
