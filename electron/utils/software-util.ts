// 去除首尾的双引号和空白字符
import fs from 'fs'
import {
  formatSize,
  type InstalledSoftware,
  SOFTWARE_REGEDIT_GROUP,
  type SoftwareRegeditGroupKey,
} from '@/models/software'
import { promisified as regedit, type RegistryItem, type RegistryItemValue } from 'regedit'
import path from 'path'
import { app } from 'electron'
import { exec } from 'child_process'
import nLogger from './log4js'

// 去除首位空白字符和双引号
function stripQuotesAndTrim(str: string) {
  return str
    ?.trim()
    .replace(/^"+|"+$/g, '')
    .trim()
}

// 格式化日期
function formatDate(time: Date): string
function formatDate(year: number, month: number, day: number): string
function formatDate(year: string, month: string, day: string): string
function formatDate(yearOrDate: Date | number | string, month?: number | string, day?: number | string): string {
  if (yearOrDate instanceof Date) {
    return formatDate(yearOrDate.getFullYear(), yearOrDate.getMonth() + 1, yearOrDate.getDate())
  }

  const yearStr = String(yearOrDate)
  const monthStr = String(month)
  const dayStr = String(day)

  return `${yearStr}-${monthStr.padStart(2, '0')}-${dayStr.padStart(2, '0')}`
}

// 图标路径去除索引
function iconPathTrimIndex(str: string) {
  if (!str) {
    return str
  }
  const regex = /^(.*?)(?:,[-\d]+)?$/
  const match = str?.match(regex)
  if (match) {
    return match[1]
  }
  return str
}

const MSI_EXEC_REGEX = /^MsiExec\.exe +\/.*(\{[\dA-Za-z-]+})$/
const FILE_PATH_REGEX = /^((.*)\\.*\.exe)[\\"]?/

// 解析卸载路径
function parseUninstallString(soft: InstalledSoftware, uninstallString: string): void {
  if (!uninstallString) {
    soft.uninstallString = ''
    return
  }
  soft.uninstallString = uninstallString
  let match = uninstallString.match(MSI_EXEC_REGEX)
  if (match) {
    // MsiExec 安装类型
    const msiExecId = match[1]
    // 查找 C:\Windows\msiExecId
    const dir1 = path.join(process.env.SystemRoot as string, 'Installer', msiExecId)
    if (fs.existsSync(dir1)) {
      soft.uninstallDir = dir1
      return
    }
    // 查找 C:\Users\hzhilong\AppData\Roaming\msiExecId
    const dir2 = path.join(process.env.APPDATA as string, 'Microsoft/Installer', msiExecId)
    if (fs.existsSync(dir2)) {
      soft.uninstallDir = dir2
      return
    }
  }

  // 其他安装类型，待拓展
  match = uninstallString.match(FILE_PATH_REGEX)
  if (match) {
    const dir = match[2]
    const file = match[1]
    if (fs.existsSync(dir)) {
      soft.uninstallFile = file
      soft.uninstallDir = dir
      if (!soft.installDir) {
        soft.installDir = dir
      }
      return
    }
  }
}

// 安装日期中的格式
const DATE_REGEXS = {
  YYYYMMDD: /^\d{8}$/,
  YMD: /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/,
  DMY: /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/,
}

// 获取文件创建时间的工具函数
function getFileCreationTime(path?: string): Date | undefined {
  if (!path) return undefined
  try {
    const stats = fs.statSync(path)
    return stats.isFile() ? stats.ctime : undefined
  } catch (e) {
    return undefined
  }
}

// 格式化日期统一处理
function formatDateInput(...args: [string, string, string] | [Date]): string {
  return args.length === 3 ? formatDate(args[0], args[1], args[2]) : formatDate(args[0])
}

// 解析安装日期
function parseInstallDate(
  soft: InstalledSoftware,
  installDate: string,
  uninstallFile: string | undefined,
  iconPath: string | undefined,
): void {
  // 处理有明确安装日期的情况
  if (installDate) {
    installDate = installDate.trim()

    // 处理 YYYYMMDD 格式
    if (DATE_REGEXS.YYYYMMDD.test(installDate)) {
      soft.installDate = formatDateInput(installDate.slice(0, 4), installDate.slice(4, 6), installDate.slice(6, 8))
      return
    }

    // 处理 YYYY-MM-DD 格式
    let match = DATE_REGEXS.YMD.exec(installDate)
    if (match) {
      soft.installDate = formatDateInput(match[1], match[2], match[3])
      return
    }

    // 处理 DD-MM-YYYY 格式
    match = DATE_REGEXS.DMY.exec(installDate)
    if (match) {
      soft.installDate = formatDateInput(match[3], match[1], match[2])
      return
    }
  }

  // 处理需要从文件获取时间的情况
  const fileTimes = [getFileCreationTime(uninstallFile), getFileCreationTime(iconPath)].filter((t) => t instanceof Date)

  if (fileTimes.length > 0) {
    // 排序 取最早的
    fileTimes.sort((a, b) => a.getTime() - b.getTime())
    soft.installDate = formatDateInput(fileTimes[0])
  } else {
    soft.installDate = ''
  }
}

// 解析版本
function parseVersion(soft: InstalledSoftware, entry: { [p: string]: RegistryItemValue }): void {
  const innoVersion = entry['Inno Setup: Setup Version']
  if (innoVersion) {
    soft.version = innoVersion.value as string
  } else {
    soft.version = entry.DisplayVersion?.value as string
  }
}

const VERSION_REGEX = /\s(版本)?([vV]ersion\s?)?[Vv]?[0-9.]*$/

// 解析不带版本的软件名称
function parseNameWithoutVersion(soft: InstalledSoftware, name: string): void {
  if (!name) {
    soft.nameWithoutVersion = ''
  } else {
    const match = name.match(VERSION_REGEX)
    if (match) {
      soft.nameWithoutVersion = name.substring(0, match.index)
    } else {
      soft.nameWithoutVersion = name
    }
  }
}

// 解析图标信息 displayIcon displayIconWithoutIndex !iconPath
function parseIconInfo(
  soft: InstalledSoftware,
  displayIcon: string,
  installLocation: string,
  nameWithoutVersion: string,
  uninstallDir: string | undefined,
  uninstallFile: string | undefined,
): void {
  // 优先处理 displayIcon 情况
  if (displayIcon) {
    soft.displayIcon = displayIcon
    const icon = iconPathTrimIndex(displayIcon)
    soft.displayIconWithoutIndex = icon
    if (fs.existsSync(icon)) {
      soft.iconPath = icon
      return
    }
  }

  // 根据 installLocation 查找 .exe 文件
  if (installLocation) {
    // 安装目录有可执行文件？（例如 "xxx.exe,1"）
    const match = installLocation.match(/^(.*?\.exe)(?:,[-\d]+)?$/)
    if (match && fs.existsSync(match[1])) {
      soft.iconPath = match[1]
      return
    }
    // 根据软件名称，在安装目录下查找同名exe
    if (nameWithoutVersion) {
      const dir = installLocation
      const exes = [path.join(dir, `${nameWithoutVersion}.exe`), path.join(dir, 'bin', `${nameWithoutVersion}.exe`)]
      for (const exe of exes) {
        if (fs.existsSync(exe)) {
          soft.iconPath = exe
          return
        }
      }
    }
  }

  // 通过 uninstallDir 查找图标
  if (uninstallDir) {
    // 根据软件名称，在卸载目录下查找同名exe
    let exe = path.join(uninstallDir, nameWithoutVersion + '.exe')
    if (fs.existsSync(exe)) {
      soft.iconPath = exe
      return
    }
    // 根据图标名称，在卸载目录下查找同名exe
    if (displayIcon) {
      const match = displayIcon.match(/([^\/\\]+?)(?=\.[^\/\\]*$|$)/)
      if (match) {
        const name = match[1]
        exe = path.join(uninstallDir, name + '.exe')
        if (fs.existsSync(exe)) {
          soft.iconPath = exe
          return
        }
      }
    }
    // 检查卸载目录下是否有 ARPPRODUCTICON.exe
    exe = path.join(uninstallDir, 'ARPPRODUCTICON.exe')
    if (fs.existsSync(exe)) {
      soft.iconPath = exe
      return
    }
    // 获取卸载目录中的所有文件，尝试从中选出合适的图标
    const files = fs.readdirSync(uninstallDir)
    // 先查找 .ico 文件
    const icoFiles = files.filter((file) => file.endsWith('.ico')).map((file) => path.join(uninstallDir, file))
    // 如果目录只有一个文件，并且该文件没有扩展名 或 以 .exe 结尾，则使用该文件作为图标路径
    if (files.length === 1) {
      const file = files[0]
      if (file.indexOf('.') < 0 || file.endsWith('.exe')) {
        soft.iconPath = path.join(uninstallDir, file)
        return
      }
    }
    // 如果仅有一个 .ico 文件
    if (icoFiles.length === 1) {
      soft.iconPath = icoFiles[0]
      return
    }
  }
  // 最后尝试使用 uninstallFile
  if (uninstallFile && fs.existsSync(uninstallFile)) {
    soft.iconPath = uninstallFile
    return
  }
}

// 获取图标的base64
export async function getIconBase64(iconPath: string): Promise<string> {
  if (!iconPath) {
    throw new Error('iconPath is required')
  }
  // 解决中间带有相对路径的path
  const resolvedIconPath = path.resolve(iconPath)
  // 检查文件是否存在
  if (!fs.existsSync(resolvedIconPath)) {
    throw new Error(`File ${resolvedIconPath} does not exist`)
  }
  const ext = path.extname(resolvedIconPath).toLowerCase()
  if (ext === '.exe') {
    return (await app.getFileIcon(resolvedIconPath, { size: 'large' }))?.toDataURL()
  }
  if (ext === '.ico' || !ext) {
    const data = fs.readFileSync(resolvedIconPath)
    return `data:image/x-icon;base64,${data.toString('base64')}`
  }
  if (ext === '.dll') {
    return getDllIconBase64(resolvedIconPath)
  }
  return ''
}

async function getDllIconBase64(dllPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // 生成临时 .ico 文件路径
      const tempIcoPath = path.join(app.getPath('temp'), 'extracted_icon.ico')

      // PowerShell 脚本
      const script = `
        Add-Type -AssemblyName System.Drawing
        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon("${path.resolve(dllPath)}")
        $icon.ToBitmap().Save("${path.resolve(tempIcoPath)}")
        Write-Output "${path.resolve(tempIcoPath)}"
      `
      // nLogger.debug(`正在调用ps脚本创建图标`, script)
      // 调用 PowerShell
      exec(`powershell -Command "${script}"`, (error, stdout, stderr) => {
        if (error) {
          reject(`PowerShell 执行失败: ${stderr}`)
          return
        }

        setTimeout(() => {
          // 读取生成的 .ico 文件
          if (fs.existsSync(tempIcoPath)) {
            const buffer = fs.readFileSync(tempIcoPath)
            const base64 = buffer.toString('base64')
            resolve(`data:image/x-icon;base64,${base64}`)
            // 删除临时文件
            // fs.unlinkSync(tempIcoPath)
          } else {
            reject('无法生成图标文件')
          }
        }, 100)
      })
    } catch (err) {
      reject(err)
    }
  })
}

export async function parseInstalledSoftware(
  regeditGroupKey: SoftwareRegeditGroupKey,
  regeditDir: string,
  regeditName: string,
  entry: {
    [p: string]: RegistryItemValue
  },
): Promise<InstalledSoftware | null> {
  const name = stripQuotesAndTrim(entry.DisplayName?.value as string)
  if (!name || name.startsWith('KB')) {
    // 过滤Windows更新
    return null
  }
  if (entry.SystemComponent?.value === 1) {
    // 过滤系统组件
    return null
  }
  const soft: InstalledSoftware = {
    installDate: '',
    uninstallDir: '',
    uninstallFile: '',
    uninstallString: '',
    version: '',
    regeditGroupKey: regeditGroupKey,
    regeditDir: regeditDir,
    regeditName: regeditName,
    regeditValues: entry,
    name: name,
    nameWithoutVersion: '',
    publisher: stripQuotesAndTrim(entry.Publisher?.value as string),
    installLocation: stripQuotesAndTrim(entry.InstallLocation?.value as string),
    size: entry.EstimatedSize?.value as number,
    formatSize: formatSize(entry.EstimatedSize?.value as number),
    url: stripQuotesAndTrim(entry.URLUpdateInfo?.value as string),
  }
  if (isNaN(soft.size)) {
    soft.size = 0
  }
  if (soft.installLocation) {
    soft.installDir = soft.installLocation
  }
  // 按顺序进行软件各个属性的初始化
  parseVersion(soft, entry)
  parseNameWithoutVersion(soft, name)
  parseUninstallString(soft, stripQuotesAndTrim(entry.UninstallString?.value as string))
  parseIconInfo(
    soft,
    stripQuotesAndTrim(entry.DisplayIcon?.value as string),
    soft.installLocation,
    soft.nameWithoutVersion,
    soft.uninstallDir,
    soft.uninstallFile,
  )
  parseInstallDate(soft, stripQuotesAndTrim(entry.InstallDate?.value as string), soft.uninstallFile, soft.iconPath)
  return soft
}

/**
 * 获取安装的软件
 * @param regeditGroupKey 注册表分组key
 */
export async function getInstalledSoftware(regeditGroupKey: SoftwareRegeditGroupKey): Promise<InstalledSoftware[]> {
  const softArr: InstalledSoftware[] = []
  try {
    const regeditPath = SOFTWARE_REGEDIT_GROUP[regeditGroupKey].path
    const pathList = await regedit.list([regeditPath])
    const pathResult: RegistryItem = pathList[regeditPath]
    if (!pathResult || !pathResult.exists || !pathResult.keys) {
      return []
    } else {
      const subPathNames: Record<string, string> = {}
      const subPaths: string[] = []
      for (const key of pathResult.keys) {
        const subPath = `${regeditPath}\\${key}`
        subPathNames[subPath] = key
        subPaths.push(subPath)
      }
      const subPathResults = await regedit.list(subPaths)
      for (const softPath in subPathResults) {
        const infoResult: RegistryItem = subPathResults[softPath]
        if (infoResult.exists) {
          const software = await parseInstalledSoftware(
            regeditGroupKey,
            softPath,
            subPathNames[softPath],
            infoResult.values,
          )
          if (software) {
            softArr.push(software)
          }
        }
      }
    }
  } catch (error) {
    throw error
  }
  return softArr
}
