import type { RegistryItemValue } from 'regedit'

/**
 * 存储软件信息的注册表路径
 */
export const SOFTWARE_REGEDIT_PATH = {
  // 存储 32 位应用程序 在 64 位 Windows 系统 中的卸载信息(为了避免 32 位和 64 位程序的注册表冲突，32 位程序的注册表项会被重定向到 WOW6432Node 路径下。为了避免 32 位和 64 位程序的注册表冲突，32 位程序的注册表项会被重定向到 WOW6432Node 路径下。)
  PATH_SYSTEM_32: 'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  // 存放在系统范围内安装的 64 位应用程序的卸载信息（以及在 32 位系统上安装的所有程序的信息）
  PATH_SYSTEM_64: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  // 存储 当前用户 安装的应用程序的卸载信息（无论是 32 位还是 64 位）。
  PATH_USER: 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
} as const

/**
 * 存储软件信息的注册表路径描述
 */
export const SOFTWARE_REGEDIT_DESC = {
  PATH_SYSTEM_32: '32位系统软件',
  PATH_SYSTEM_64: '64位系统软件',
  PATH_USER: '用户软件',
} as const

/**
 * 存储软件信息的注册表 值联合类型
 */
export type SoftwareRegeditPath = (typeof SOFTWARE_REGEDIT_PATH)[keyof typeof SOFTWARE_REGEDIT_PATH]

/**
 * 存储软件信息的注册表 键联合类型
 */
export type SoftwareRegeditPathKey = keyof typeof SOFTWARE_REGEDIT_PATH

export const BACKUP_TYPE_KEY = {
  PORTABLE: 'PORTABLE',
  CUSTOM: 'CUSTOM',
}

/**
 * 备份的软件类型
 */
export const BACKUP_TYPE_DESC = {
  ...SOFTWARE_REGEDIT_DESC,
  [BACKUP_TYPE_KEY.PORTABLE]: '免安装',
  [BACKUP_TYPE_KEY.CUSTOM]: '自定义'
}

/**
 * 备份的软件类型 键联合类型
 */
export type BackupTypeKey = keyof typeof BACKUP_TYPE_DESC

export type InstalledSoftware = {
  title: string
  list: Software[]
  totalNumber: number
  totalSize: string
}

export type AllInstalledSoftware = {
  [path in SoftwareRegeditPathKey]: InstalledSoftware
}

export type BackupableSoftware = {
  title: string
  totalNumber: number
  backupableNumber: number
}

export type AllBackupableSoftware = {
  [path in BackupTypeKey]: BackupableSoftware
}

export class Software {
  regeditDir!: string
  regeditName!: string
  regeditValues!: { [p: string]: RegistryItemValue }
  name!: string
  nameWithoutVersion!: string
  version!: string
  publisher!: string
  installPath!: string
  installDate!: string
  size!: number
  formatSize!: string
  uninstallCmd!: string
  url!: string
  displayIcon?: string
  iconPath?: string
  base64Icon?: string

  public static parseSoftwareEntry(
    regeditDir: string,
    regeditName: string,
    entry: {
      [p: string]: RegistryItemValue
    },
  ): Software | null {
    const name: string = entry.DisplayName?.value as string
    if (!name || name.startsWith('KB')) {
      // 过滤Windows更新
      return null
    }
    const soft: Software = {
      regeditDir: regeditDir,
      regeditName: regeditName,
      regeditValues: entry,
      name: name,
      nameWithoutVersion: '',
      version: this.parseVersion(entry) as string,
      publisher: entry.Publisher?.value as string,
      installPath: this.cleanPath(this.getInstallPath(entry)),
      installDate: this.parseInstallDate(entry.InstallDate?.value as string),
      size: entry.EstimatedSize?.value as number,
      formatSize: this.formatSize(entry.EstimatedSize?.value as number),
      uninstallCmd: entry.UninstallString?.value as string,
      url: entry.URLUpdateInfo?.value as string,
      displayIcon: entry.DisplayIcon?.value as string,
    }
    soft.nameWithoutVersion = this.parseNameWithoutVersion(soft)
    soft.iconPath = this.parseIconPath(soft) as string
    return soft
  }

  static parseIconPath(soft: Software) {
    if (soft.displayIcon) {
      return soft.displayIcon
    }
    if (soft.installPath) {
      if (soft.installPath.endsWith('.exe')) {
        return soft.installPath
      }
      if (soft.nameWithoutVersion) {
        return `${soft.installPath}${soft.installPath.endsWith('\\') ? '' : '\\'}${soft.nameWithoutVersion}.exe`
      }
    }
  }

  public static formatSize(estimatedSize: number) {
    if (!estimatedSize) {
      return ''
    }
    let size = (estimatedSize as number) * 100
    // 定义文件大小单位
    const units = ['KB', 'MB', 'GB']
    // 计算文件大小的单位和对应的大小
    let unitIndex = 0
    // 根据文件大小单位进行换算
    while (size >= 1024 * 100 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    let newSize = Math.round(size) / 100
    const integerPart = ('' + newSize).split('.')[0]
    if (integerPart.length > 2) {
      newSize = Number(integerPart)
    } else if (integerPart.length > 1) {
      newSize = Math.round(size / 10) / 10
    }
    return `${newSize} ${units[unitIndex]}`
  }

  static parseVersion(entry: { [p: string]: RegistryItemValue }) {
    const innoVersion = entry['Inno Setup: Setup Version']
    if (innoVersion) {
      return innoVersion.value
    }
    return entry.DisplayVersion?.value
  }

  static parseNameWithoutVersion(soft: Software) {
    if (soft.regeditName === soft.name) {
      return soft.name
    }
    const installPathName = soft.installPath?.split('\\').pop()
    if (installPathName && soft.name.startsWith(installPathName)) {
      return installPathName
    }
    return soft.name
  }

  static getInstallPath(values: { [p: string]: RegistryItemValue }): string {
    // 优先尝试InstallLocation
    if (values.InstallLocation?.value) {
      return values.InstallLocation.value as string
    }

    // 次选DisplayIcon路径解析
    if (values.DisplayIcon?.value) {
      return (values.DisplayIcon.value as string).split(',')[0].trim()
    }

    return ''
  }

  static cleanPath(rawPath: string) {
    if (!rawPath) return ''
    const cleaned = rawPath.replace(/^"+|"+$/g, '') // 去除首尾引号
    return cleaned.endsWith('\\') ? cleaned.slice(0, -1) : cleaned
  }

  static parseInstallDate(dateStr: string) {
    if (!dateStr || dateStr.length !== 8) return ''
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
  }
}
