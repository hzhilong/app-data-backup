// src/utils/dllIconExtractor.ts
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import type { RegistryItemValue } from 'regedit'
import { formatSize, InstalledSoftware, SoftwareRegeditGroupKey } from '../src/models/Software'
import { app } from 'electron'

export class SoftwareUtil {
  public static async parseInstalledSoftware(
    regeditGroupKey: SoftwareRegeditGroupKey,
    regeditDir: string,
    regeditName: string,
    entry: {
      [p: string]: RegistryItemValue
    },
  ): Promise<InstalledSoftware | null> {
    const name: string = this.strTrim(entry.DisplayName?.value as string)
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
      version: this.strTrim(this.parseVersion(entry) as string),
      publisher: this.strTrim(entry.Publisher?.value as string),
      installPath: this.strTrim(this.parseInstallPath(entry)),
      installDate: this.parseInstallDate(entry.InstallDate?.value as string),
      size: entry.EstimatedSize?.value as number,
      formatSize: formatSize(entry.EstimatedSize?.value as number),
      uninstallString: this.strTrim(entry.UninstallString?.value as string),
      url: this.strTrim(entry.URLUpdateInfo?.value as string),
      displayIcon: this.strTrim(entry.DisplayIcon?.value as string),
    }
    soft.nameWithoutVersion = this.strTrim(this.parseNameWithoutVersion(soft))
    soft.iconPath = this.parseIconPath(soft) as string
    await this.initIconBase64(soft)
    return soft
  }

  static async initIconBase64(soft: InstalledSoftware) {
    if (soft.iconPath) {
      // 解决中间带有相对路径的path
      soft.iconPath = path.resolve(soft.iconPath)
      try {
        if (soft.iconPath.endsWith('.exe')) {
          soft.base64Icon = (await app.getFileIcon(soft.iconPath, { size: 'large' })).toDataURL()
        } else if (soft.iconPath.endsWith('.ico') || soft.iconPath?.indexOf('.') < 0) {
          // 同步读取 ICO 文件
          const data = fs.readFileSync(soft.iconPath)
          // 将文件数据转换为 Base64 编码
          soft.base64Icon = `data:image/x-icon;base64,${data.toString('base64')}`
        } else if (soft.iconPath.endsWith('.dll')) {
          soft.base64Icon = await getDllIconBase64(soft.iconPath)
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e: unknown) {}
    }
  }

  static parseIconPath(soft: InstalledSoftware): string {
    if (soft.displayIcon) {
      soft.displayIcon = this.iconPathTrim(this.strTrim(soft.displayIcon))
      if (fs.existsSync(soft.displayIcon)) {
        return soft.displayIcon
      }
    }
    if (soft.installPath) {
      const regex = /^(.*\.exe)(?:,[-\d]*)?$/
      const match = soft.installPath?.match(regex)
      if (match) {
        if (fs.existsSync(match[1])) {
          return match[1]
        }
      }
      if (soft.nameWithoutVersion) {
        const dir = `${soft.installPath}`
        const exe = path.join(dir, `${soft.nameWithoutVersion}.exe`)
        if (fs.existsSync(exe)) {
          return exe
        }
        const binExe = path.join(dir, 'bin', `${soft.nameWithoutVersion}.exe`)
        if (fs.existsSync(binExe)) {
          return binExe
        }
      }
    }
    if (soft.uninstallString) {
      let temp = this.strTrim(soft.uninstallString)
      let regex = /^MsiExec\.exe +\/.*(\{[\dA-Za-z-]+\})$/
      let match = temp.match(regex)
      if (match) {
        const systemDrive = process.env.SystemDrive as string
        const dir = `${systemDrive}\\Windows\\Installer\\${match[1]}\\`
        if (fs.existsSync(dir)) {
          temp = path.join(dir, `ARPPRODUCTICON.exe`)
          if (fs.existsSync(match[1])) {
            return temp
          } else {
            const files = fs.readdirSync(dir) // 获取目录中的所有文件和子文件夹
            for (const file of files) {
              if (file.endsWith('.ico')) {
                return path.join(dir, file)
              } else if (files.length == 1 && (file.indexOf('.') < 0 || file.endsWith('.exe'))) {
                return path.join(dir, file)
              }
            }
          }
        }
      }

      temp = temp.split('.exe ')[0]
      temp = temp.endsWith('.exe') ? temp : temp + '.exe'
      regex = /^(.*)\.*\.exe$/
      match = temp.match(regex)
      if (match) {
        if (fs.existsSync(match[1] + '\\' + soft.nameWithoutVersion)) {
          return match[1] + '\\' + soft.nameWithoutVersion
        }
      }

      if (fs.existsSync(temp)) {
        return temp
      }
    }
    return ''
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

  static parseInstallPath(values: { [p: string]: RegistryItemValue }): string {
    // 优先尝试InstallLocation
    if (values.InstallLocation?.value) {
      return values.InstallLocation.value as string
    }

    // 次选DisplayIcon路径解析
    if (values.DisplayIcon?.value) {
      return this.iconPathTrim(values.DisplayIcon.value as string)
    }

    return ''
  }

  static parseInstallDate(dateStr: string) {
    if (!dateStr) {
      return ''
    }
    if (/\d{8}/.test(dateStr)) {
      return this.formatInstallDate(dateStr.slice(0, 4), dateStr.slice(4, 6), dateStr.slice(6, 8))
    }
    let regex = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/
    let match = dateStr.match(regex)
    if (match) {
      return this.formatInstallDate(match[1], match[2], match[3])
    }
    regex = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
    match = dateStr.match(regex)
    if (match) {
      return this.formatInstallDate(match[3], match[1], match[2])
    }
    return dateStr
  }

  static formatInstallDate(year: string, month: string, day: string) {
    return `${year}-${month.padStart(2, '-')}-${day.padStart(2, '-')}`
  }

  static strTrim(str: string) {
    return str?.trim().replace(/^"+|"+$/g, '')
  }

  static iconPathTrim(str: string) {
    const regex = /^(.*?)(?:,[-\d]*)?$/
    const match = str?.match(regex)
    if (match) {
      return match[1]
    }
    return str
  }
}

/**
 * 从 .dll 文件中提取图标并转为 Base64
 * @param dllPath .dll 文件路径
 * @param iconIndex 图标索引
 */
export const getDllIconBase64 = (dllPath: string): Promise<string> => {
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
          console.log(`11= ${stderr}`)
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
            console.log(`22=无法生成图标文件`, tempIcoPath)
            reject('无法生成图标文件')
          }
        }, 100)
      })
    } catch (err) {
      reject(err)
    }
  })
}
