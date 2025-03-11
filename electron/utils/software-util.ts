// 去除首尾的双引号和空白字符
import fs from 'fs'
import {
  formatSize,
  type InstalledSoftware,
  SOFTWARE_REGEDIT_GROUP,
  type SoftwareRegeditGroupKey,
} from '@/models/Software'
import { promisified as regedit, type RegistryItem, type RegistryItemValue } from 'regedit'
import path from 'path'
import { app } from 'electron'
import os from 'os'
import { exec } from 'child_process'

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
    const year = String(yearOrDate.getFullYear())
    const month = String(yearOrDate.getMonth() + 1) // 月份从 0 开始，需要 +1
    const day = String(yearOrDate.getDate())
    return formatDate(year, month, day)
  } else {
    const yearStr = String(yearOrDate)
    const monthStr = String(month)
    const dayStr = String(day)
    return `${yearStr}-${monthStr.padStart(2, '0')}-${dayStr.padStart(2, '0')}`
  }
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

// 解析卸载路径
function parseUninstallString(soft: InstalledSoftware, uninstallString: string): void {
  if (!uninstallString) {
    soft.uninstallString = ''
    return
  }
  soft.uninstallString = uninstallString
  let regex = /^MsiExec\.exe +\/.*(\{[\dA-Za-z-]+})$/
  let match = uninstallString.match(regex)
  if (match) {
    const dir = path.join(process.env.SystemDrive as string, 'Windows', 'Installer', match[1])
    if (fs.existsSync(dir)) {
      soft.uninstallDir = dir
      return
    }
    const dir2 = path.join(process.env.APPDATA as string, 'Microsoft', 'Installer', match[1])
    if (fs.existsSync(dir2)) {
      soft.uninstallDir = dir2
      return
    }
  }
  regex = /^((.*)\\.*\.exe)[\\"]?/
  match = uninstallString.match(regex)
  if (match) {
    if (fs.existsSync(match[2])) {
      soft.uninstallFile = match[1]
      soft.uninstallDir = match[2]
      if (!soft.installDir) {
        soft.installDir = match[2]
      }
      return
    }
  }
}

// 解析安装日期
function parseInstallDate(
  soft: InstalledSoftware,
  installDate: string,
  uninstallFile: string | undefined,
  iconPath: string | undefined,
): void {
  if (installDate) {
    if (/\d{8}/.test(installDate)) {
      soft.installDate = formatDate(installDate.slice(0, 4), installDate.slice(4, 6), installDate.slice(6, 8))
      return
    }
    let regex = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/
    let match = installDate.match(regex)
    if (match) {
      soft.installDate = formatDate(match[1], match[2], match[3])
      return
    }
    regex = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
    match = installDate.match(regex)
    if (match) {
      soft.installDate = formatDate(match[3], match[1], match[2])
      return
    }
  } else {
    const arrTime: Date[] = []
    if (uninstallFile) {
      if (fs.existsSync(uninstallFile)) {
        const stats = fs.statSync(uninstallFile)
        if (stats.isFile()) {
          arrTime.push(stats.ctime)
        }
      }
    }
    if (iconPath) {
      const stats = fs.statSync(iconPath)
      if (stats.isFile()) {
        arrTime.push(stats.ctime)
      }
    }
    arrTime.sort((a, b) => a.getTime() - b.getTime())

    if (arrTime.length > 0) {
      soft.installDate = formatDate(arrTime[0])
    } else {
      soft.installDate = ''
    }
    return
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

// 解析不带版本的软件名称
function parseNameWithoutVersion(soft: InstalledSoftware, name: string): void {
  if (!name) {
    soft.nameWithoutVersion = ''
  } else {
    const regex = /\s(版本)?([vV]ersion\s?)?[Vv]?[0-9.]*$/
    const match = name.match(regex)
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
  if (displayIcon) {
    soft.displayIcon = displayIcon
    const icon = iconPathTrimIndex(displayIcon)
    soft.displayIconWithoutIndex = icon
    if (fs.existsSync(icon)) {
      soft.iconPath = icon
      return
    }
  }
  if (installLocation) {
    const regex = /^(.*?\.exe)(?:,[-\d]+)?$/
    const match = installLocation.match(regex)
    if (match) {
      if (fs.existsSync(match[1])) {
        soft.iconPath = match[1]
        return
      }
    }
    if (nameWithoutVersion) {
      const dir = `${installLocation}`
      const exe = path.join(dir, `${nameWithoutVersion}.exe`)
      if (fs.existsSync(exe)) {
        soft.iconPath = exe
        return
      }
      const binExe = path.join(dir, 'bin', `${nameWithoutVersion}.exe`)
      if (fs.existsSync(binExe)) {
        soft.iconPath = binExe
        return
      }
    }
  }
  if (uninstallDir) {
    let temp = path.join(uninstallDir, nameWithoutVersion + '.exe')
    if (fs.existsSync(temp)) {
      soft.iconPath = temp
      return
    }
    if (displayIcon) {
      const regex = /([^\/\\]+?)(?=\.[^\/\\]*$|$)/
      const match = displayIcon.match(regex)
      if (match) {
        const name = match[1]
        temp = path.join(uninstallDir, name + '.exe')
        if (fs.existsSync(temp)) {
          soft.iconPath = temp
          return
        }
      }
    }

    temp = path.join(uninstallDir, `ARPPRODUCTICON.exe`)
    if (fs.existsSync(temp)) {
      // MsiExec 安装
      soft.iconPath = temp
      return
    } else {
      // 获取目录中的所有文件和子文件夹
      const files = fs.readdirSync(uninstallDir)
      const icoArr = []
      for (const file of files) {
        if (file.endsWith('.ico')) {
          icoArr.push(path.join(uninstallDir, file))
        } else if (files.length == 1 && (file.indexOf('.') < 0 || file.endsWith('.exe'))) {
          soft.iconPath = path.join(uninstallDir, file)
          return
        }
      }
      if (icoArr.length === 1) {
        soft.iconPath = icoArr[0]
        return
      }
    }
  }
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
  try {
    // 解决中间带有相对路径的path
    iconPath = path.resolve(iconPath)
    if (iconPath.endsWith('.exe')) {
      return (await app.getFileIcon(iconPath, { size: 'large' }))?.toDataURL()
    } else if (iconPath.endsWith('.ico') || iconPath.indexOf('.') < 0) {
      // ico / 无后缀
      const data = fs.readFileSync(iconPath)
      return `data:image/x-icon;base64,${data.toString('base64')}`
    } else if (iconPath.endsWith('.dll')) {
      return await getDllIconBase64(iconPath)
    }
    return ''
  } catch (e: unknown) {
    throw e
  }
}

async function getDllIconBase64(dllPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // 生成临时 .ico 文件路径
      const tempIcoPath = path.join(os.tmpdir(), 'extracted_icon.ico')

      // PowerShell 脚本
      const script = `
        Add-Type -AssemblyName System.Drawing
        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon("${dllPath.replace(/\\/g, '\\')}")
        $icon.ToBitmap().Save("${tempIcoPath.replace(/\\/g, '\\')}")
        Write-Output "${tempIcoPath.replace(/\\/g, '\\')}"
      `
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
  if (soft.installLocation) {
    soft.installDir = soft.installLocation
  }
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
