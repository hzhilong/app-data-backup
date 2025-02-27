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
export type SoftwareRegeditPath = (typeof SOFTWARE_REGEDIT_GROUP)[keyof typeof SOFTWARE_REGEDIT_GROUP]['path']

/**
 * 已安装的软件
 */
export type InstalledSoftware = {
  // 注册表类型
  regeditGroupKey: SoftwareRegeditGroupKey
  // 注册表路径
  regeditDir: string
  // 注册表文件夹名称
  regeditName: string
  // 注册表值
  regeditValues: { [p: string]: RegistryItemValue }
  // 软件名称
  name: string
  // 不含版本号的软件名称
  nameWithoutVersion: string
  // 版本
  version: string
  // 发布者
  publisher: string
  // 安装位置
  installLocation: string
  // 安装日期
  installDate: string
  // 占用大小
  size: number
  // 格式化后的占用大小 带单位
  formatSize: string
  // 卸载命令
  uninstallString: string
  // 卸载程序所在文件夹
  uninstallDir: string
  // 卸载程序路径
  uninstallFile: string
  // 网站
  url: string
  // 显示的图标，可能带索引
  displayIcon?: string
  // 显示的图标，不带索引
  displayIconWithoutIndex?: string
  // 解析的图标路径
  iconPath?: string
  // 图标base64
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

export function formatSize(estimatedSize: number) {
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

export function parseInstalledSoftwareGroup(
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
    totalSize: formatSize(totalSize),
  }
}
