import { IPC_CHANNELS } from '@/types/IpcChannels'
import { useAppThemeStore } from '@/stores/app-theme'
import { ipcInvoke } from '@/utils/electron-api'

const whiteColor = '#ffffff'
const blackColor = '#000000'

export type AppThemeMode = 'light' | 'dark' | 'system'

export type AppThemeCssVars = Record<string, any>

function setCssVar(k: string, v: string) {
  document.documentElement.style.setProperty(k, v)
}

function mixColor(
  color1: string,
  color2: string,
  percentage: number,
  colorSpace: 'srgb' | 'hsl' = 'srgb',
  percentage2?: number,
): string {
  return `color-mix(in ${colorSpace}, ${color1} ${percentage}%, ${color2} ${percentage2 ? percentage2 : 100 - percentage}%)`
}

// 将十六进制颜色转换为 RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function switchThemeMode(dark: boolean, vars: AppThemeCssVars) {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  vars['--app-foreground-color'] = dark ? whiteColor : blackColor
  vars['--app-background-color'] = dark ? '#191919' : whiteColor
  return { foreground: vars['--app-foreground-color'], background: vars['--app-background-color'] }
}

function initTransparentColors(primaryColor: string, vars: AppThemeCssVars, preKey: string) {
  const { r, g, b } = hexToRgb(primaryColor)
  for (let i = 2; i < 100; ) {
    const opacity = i / 100
    vars[`${preKey}-transparent-${i}`] = `rgba(${r}, ${g}, ${b}, ${opacity})`
    if (i >= 10) {
      i += 5
    } else {
      i++
    }
  }
}

/**
 * 更新主题色
 */
async function baseUpdateThemeColor(primaryColor: string, themeMode: AppThemeMode, isDark: boolean) {
  const vars: AppThemeCssVars = {}
  let foreground: string
  let background: string
  ;({ foreground, background } = switchThemeMode(isDark, vars))
  vars['--app-primary-color'] = primaryColor
  vars['--el-color-primary'] = primaryColor
  vars['--el-color-primary-light-1'] = mixColor(primaryColor, background, 90)
  vars['--el-color-primary-light-2'] = mixColor(primaryColor, background, 80)
  vars['--el-color-primary-light-3'] = mixColor(primaryColor, background, 70)
  vars['--el-color-primary-light-4'] = mixColor(primaryColor, background, 60)
  vars['--el-color-primary-light-5'] = mixColor(primaryColor, background, 50)
  vars['--el-color-primary-light-6'] = mixColor(primaryColor, background, 40)
  vars['--el-color-primary-light-7'] = mixColor(primaryColor, background, 30)
  vars['--el-color-primary-light-8'] = mixColor(primaryColor, background, 20)
  vars['--el-color-primary-light-9'] = mixColor(primaryColor, background, 12)

  vars['--el-color-primary-dark-1'] = mixColor(primaryColor, foreground, 90)
  vars['--el-color-primary-dark-2'] = mixColor(primaryColor, foreground, 80)
  vars['--el-color-primary-dark-3'] = mixColor(primaryColor, foreground, 70)
  vars['--el-color-primary-dark-4'] = mixColor(primaryColor, foreground, 60)
  vars['--el-color-primary-dark-5'] = mixColor(primaryColor, foreground, 50)
  vars['--el-color-primary-dark-6'] = mixColor(primaryColor, foreground, 40)
  vars['--el-color-primary-dark-7'] = mixColor(primaryColor, foreground, 30)
  vars['--el-color-primary-dark-8'] = mixColor(primaryColor, foreground, 20)
  vars['--el-color-primary-dark-9'] = mixColor(primaryColor, foreground, 12)

  if (isDark) {
    vars['--el-bg-color'] = mixColor(primaryColor, background, 3)
    vars['--el-bg-color-page'] = mixColor(primaryColor, background, 4)
    vars['--el-bg-color-overlay'] = mixColor(primaryColor, background, 3)
  } else {
    vars['--el-bg-color'] = '#ffffff'
    vars['--el-bg-color-page'] = '#f2f3f5'
    vars['--el-bg-color-overlay'] = '#ffffff'
  }
  const { r, g, b } = hexToRgb(primaryColor)

  // 半透明遮罩，用于更高层级的背景覆盖。
  vars['--app-bg-color-overlay'] = `rgba(${r}, ${g}, ${b}, 0.05)`
  vars['--app-bg-color-overlay-hover'] = `rgba(${r}, ${g}, ${b}, 0.15)`
  // 主页面遮罩
  vars['--app-bg-color-page'] = isDark ? `rgba(${r}, ${g}, ${b}, 0.05)` : 'transparent'

  vars['--el-border-color'] = mixColor(primaryColor, background, 30)
  ;`rgba(${r}, ${g}, ${b}, 0.3)`
  vars['--el-border-color-light'] = mixColor(primaryColor, background, 25)
  vars['--el-border-color-lighter'] = mixColor(primaryColor, background, 20)
  vars['--el-border-color-extra-light'] = mixColor(primaryColor, background, 10)
  vars['--el-border-color-dark'] = mixColor(primaryColor, foreground, 60)
  vars['--el-border-color-darker'] = mixColor(primaryColor, foreground, 50)
  vars['--el-border-color-hover'] = mixColor(primaryColor, foreground, 40)

  // vars['--el-fill-color'] = `rgba(0,0,0, 0.05)`
  vars['--el-fill-color-light'] = `rgba(${r}, ${g}, ${b}, 0.1)`
  vars['--el-fill-color-lighter'] = `rgba(${r}, ${g}, ${b}, 0.15)`
  vars['--el-fill-color-extra-light'] = `rgba(${r}, ${g}, ${b}, 0.2)`
  // vars['--el-fill-color-dark'] = `rgba(255,255,255, 0.93)`
  // vars['--el-fill-color-darker'] = `rgba(255, 255, 255, 0.91)`
  // vars['--el-fill-color-blank'] = `rgba(255,255,255, 1)`

  initTransparentColors(primaryColor, vars, '--app-color-primary')
  initTransparentColors(background, vars, '--app-color-background')
  initTransparentColors(foreground, vars, '--app-color-foreground')

  for (let key in vars) {
    setCssVar(key, vars[key])
  }
}

async function isDark(themeMode: AppThemeMode) {
  let dark = false
  if (themeMode === 'system') {
    return await ipcInvoke<boolean>(IPC_CHANNELS.SHOULD_USE_DARK_COLORS)
  } else {
    return themeMode === 'dark'
  }
}

export default class ThemeUtil {
  static async toggleThemeMode(themeMode: AppThemeMode) {
    let themeStore = useAppThemeStore()
    const dark = await isDark(themeMode)
    themeStore.setThemeMode(themeMode, dark)
    await baseUpdateThemeColor(themeStore.primaryColor, themeMode, dark)
  }

  static async updatePrimaryColor(primaryColor: string) {
    let themeStore = useAppThemeStore()
    const dark = await isDark(themeStore.themeMode)
    themeStore.setPrimaryColor(primaryColor)
    await baseUpdateThemeColor(primaryColor, themeStore.themeMode, dark)
  }

  static async switchDefaultTheme() {
    let themeStore = useAppThemeStore()
    const dark = await isDark(themeStore.themeMode)
    await baseUpdateThemeColor(themeStore.switchThemeColor(), themeStore.themeMode, dark)
  }

  static async initAppTheme() {
    let themeStore = useAppThemeStore()
    const dark = await isDark(themeStore.themeMode)
    themeStore.setThemeMode(themeStore.themeMode, dark)
    await baseUpdateThemeColor(themeStore.primaryColor, themeStore.themeMode, dark)
  }
}
