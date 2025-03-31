import { defineStore } from 'pinia'
import type { AppThemeMode } from '@/utils/theme-util'
import { logger } from '@/utils/logger-util'

export const DEFAULT_PRIMARY_COLORS = [
  '#6284DF',
  '#474747',
  '#B04040',
  '#F7A456',
  '#D39C1F',
  '#079307',
  '#21AB86',
  '#00AEEC',
  '#FB7299',
]

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
      primaryColor: DEFAULT_PRIMARY_COLORS[0],
      themeMode: 'light',
      dark: false,
    } as AppThemeState
  },
  getters: {},
  actions: {
    switchThemeColor() {
      this.currPrimaryColorIndex = (this.currPrimaryColorIndex + 1) % DEFAULT_PRIMARY_COLORS.length
      const newColor = DEFAULT_PRIMARY_COLORS[this.currPrimaryColorIndex]
      logger.debug(`SwitchThemeColor`, this.currPrimaryColorIndex, newColor)
      return this.setPrimaryColor(newColor)
    },
    setPrimaryColor(color: string) {
      this.primaryColor = color
      return this.primaryColor
    },
    setThemeMode(themeMode: AppThemeMode, dark: boolean) {
      this.themeMode = themeMode
      this.dark = dark
      return this.themeMode
    },
  },
  persist: true,
})
