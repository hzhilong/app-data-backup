import type { RegistryItemValue } from 'regedit'

/**
 * 软件信息注册表的分组key
 */
export const SOFTWARE_REGEDIT_GROUP_KEY = {
  PATH_SYSTEM_32: 'PATH_SYSTEM_32',
  PATH_SYSTEM_64: 'PATH_SYSTEM_64',
  PATH_USER: 'PATH_USER',
} as const

/**
 * 软件信息注册表的分组key
 */
export type SoftwareRegeditGroupKey = keyof typeof SOFTWARE_REGEDIT_GROUP_KEY

/**
 * 软件信息注册表的分组
 */
export type SoftwareRegeditGroup = {
  [groupKey in SoftwareRegeditGroupKey]: {
    // 路径
    path: string
    // 标题
    title: string
    // 描述
    desc: string
  }
}

/**
 * 软件信息注册表的分组
 */
export const SOFTWARE_REGEDIT_GROUP: SoftwareRegeditGroup = {
  [SOFTWARE_REGEDIT_GROUP_KEY.PATH_SYSTEM_32]: {
    path: 'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    title: '32位系统软件',
    desc: '存储32位应用程序在64位系统中的卸载信息(为了避免32位和64位程序的注册表冲突，32位程序的注册表项会被重定向到WOW6432Node路径下)',
  },
  [SOFTWARE_REGEDIT_GROUP_KEY.PATH_SYSTEM_64]: {
    path: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    title: '64位系统软件',
    desc: '存放在系统范围内安装的 64 位应用程序的卸载信息（以及在 32 位系统上安装的所有程序的信息）',
  },
  [SOFTWARE_REGEDIT_GROUP_KEY.PATH_USER]: {
    path: 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    title: '用户软件',
    desc: '存储当前用户安装的应用程序的卸载信息（无论是 32 位还是 64 位）',
  },
} as const

/**
 * 软件信息注册表的路径 值联合类型
 */
export type SoftwareRegeditPath =
  (typeof SOFTWARE_REGEDIT_GROUP)[keyof typeof SOFTWARE_REGEDIT_GROUP]['path']

/**
 * 已安装的软件
 */
export type InstalledSoftware = {
  regeditGroupKey: SoftwareRegeditGroupKey
  regeditDir: string
  regeditName: string
  regeditValues: { [p: string]: RegistryItemValue }
  name: string
  nameWithoutVersion: string
  version: string
  publisher: string
  installPath: string
  installDate: string
  size: number
  formatSize: string
  uninstallCmd: string
  url: string
  displayIcon?: string
  iconPath?: string
  base64Icon?: string
}

/**
 * 已安装的软件列表
 */
export type InstalledSoftwareGroup = {
  title: string
  list: InstalledSoftware[]
  totalNumber: number
  totalSize: string
}

/**
 * 所有已安装的软件
 */
export type AllInstalledSoftware = {
  [groupKey in SoftwareRegeditGroupKey]: InstalledSoftwareGroup
}

/**
 * 备份的软件类型key
 */
export const BACKUP_SOFTWARE_TYPE_KEY = {
  INSTALLER: 'INSTALLER',
  PORTABLE: 'PORTABLE',
  CUSTOM: 'CUSTOM',
} as const

/**
 * 备份的软件类型key
 */
export type BackupSoftwareTypeKey = keyof typeof BACKUP_SOFTWARE_TYPE_KEY

/**
 * 备份的软件类型
 */
export type BackupSoftwareType = {
  [typeKey in BackupSoftwareTypeKey]: {
    // 标题
    title: string
    desc: string
  }
}

/**
 * 备份的软件类型
 */
export const BACKUP_SOFTWARE_TYPE: BackupSoftwareType = {
  [BACKUP_SOFTWARE_TYPE_KEY.INSTALLER]: {
    title: '安装程序',
    desc: '从注册表读取的已安装软件',
  },
  [BACKUP_SOFTWARE_TYPE_KEY.PORTABLE]: {
    title: '免安装、绿色软件',
    desc: '免安装的绿色软件',
  },
  [BACKUP_SOFTWARE_TYPE_KEY.CUSTOM]: {
    title: '自定义',
    desc: '自定义',
  },
} as const

/**
 * 软件数据备份配置
 */
export type SoftwareBackupConfig = {
  softwareType: BackupSoftwareTypeKey
  softwareName: string
}

/**
 * 支持备份数据的软件库
 */
export type SoftwareLib = {
  [typeKey in BackupSoftwareTypeKey]: BackupSoftwareType[typeKey] & {
    list: null | SoftwareBackupConfig[]
  }
}

export class SoftwareUtil {

  public static parseInstalledSoftwareGroup(
    groupKey: SoftwareRegeditGroupKey,
    list: InstalledSoftware[],
  ): InstalledSoftwareGroup {
    const totalSize = list
      ? list.reduce((sum, item) => {
          if (item.size) {
            return sum + item.size
          } else {
            return sum
          }
        }, 0)
      : 0
    return {
      title: SOFTWARE_REGEDIT_GROUP[groupKey].title,
      list: list,
      totalNumber: list ? list.length : 0,
      totalSize: SoftwareUtil.formatSize(totalSize),
    }
  }

  public static parseInstalledSoftware(
    regeditGroupKey: SoftwareRegeditGroupKey,
    regeditDir: string,
    regeditName: string,
    entry: {
      [p: string]: RegistryItemValue
    },
  ): InstalledSoftware | null {
    const name: string = entry.DisplayName?.value as string
    if (!name || name.startsWith('KB')) {
      // 过滤Windows更新
      return null
    }
    const soft: InstalledSoftware = {
      regeditGroupKey: regeditGroupKey,
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

  static parseIconPath(soft: InstalledSoftware) {
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

  static parseNameWithoutVersion(soft: InstalledSoftware) {
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
