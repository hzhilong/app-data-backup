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

function switchThemeMode(dark: boolean, vars: AppThemeCssVars) {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  vars['--app-foreground-color'] = dark ? whiteColor : blackColor
  vars['--app-background-color'] = dark ? '#3C3F41' : whiteColor
  return { foreground: vars['--app-foreground-color'], background: vars['--app-background-color'] }
}

/**
 * 更新主题色
 */
async function baseUpdateThemeColor(primaryColor: string, themeMode: AppThemeMode) {
  const vars: AppThemeCssVars = {}
  let foreground: string
  let background: string
  if (themeMode === 'system') {
    const shouldUseDarkColors = await ipcInvoke<boolean>(IPC_CHANNELS.SHOULD_USE_DARK_COLORS)
    ;({ foreground, background } = switchThemeMode(shouldUseDarkColors, vars))
  } else {
    ;({ foreground, background } = switchThemeMode(themeMode === 'dark', vars))
  }
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
  vars['--el-color-primary-light-9'] = mixColor(primaryColor, background, 10)

  vars['--el-color-primary-dark-1'] = mixColor(primaryColor, foreground, 90)
  vars['--el-color-primary-dark-2'] = mixColor(primaryColor, foreground, 80)
  vars['--el-color-primary-dark-3'] = mixColor(primaryColor, foreground, 70)
  vars['--el-color-primary-dark-4'] = mixColor(primaryColor, foreground, 60)
  vars['--el-color-primary-dark-5'] = mixColor(primaryColor, foreground, 50)
  vars['--el-color-primary-dark-6'] = mixColor(primaryColor, foreground, 40)
  vars['--el-color-primary-dark-7'] = mixColor(primaryColor, foreground, 30)
  vars['--el-color-primary-dark-8'] = mixColor(primaryColor, foreground, 20)
  vars['--el-color-primary-dark-9'] = mixColor(primaryColor, foreground, 10)

  for (let key in vars) {
    setCssVar(key, vars[key])
  }
}

export default class ThemeUtil {
  static async toggleDarkTheme(themeMode: AppThemeMode) {
    let themeStore = useAppThemeStore()
    themeStore.setThemeMode(themeMode)
    await baseUpdateThemeColor(themeStore.primaryColor, themeMode)
  }

  static async updatePrimaryColor(primaryColor: string) {
    let themeStore = useAppThemeStore()
    themeStore.setPrimaryColor(primaryColor)
    await baseUpdateThemeColor(primaryColor, themeStore.themeMode)
  }

  static async switchDefaultTheme() {
    let themeStore = useAppThemeStore()
    await baseUpdateThemeColor(themeStore.switchThemeColor(), themeStore.themeMode)
  }

  static async initAppTheme() {
    let themeStore = useAppThemeStore()
    await baseUpdateThemeColor(themeStore.primaryColor, themeStore.themeMode)
  }
}
