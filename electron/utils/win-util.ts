// src/utils/dllIconExtractor.ts
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { promisified as regedit, RegistryItem, RegistryItemValue } from 'regedit'
import {
  formatSize,
  InstalledSoftware,
  SOFTWARE_REGEDIT_GROUP,
  SoftwareRegeditGroupKey,
} from '../../src/models/Software'
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
      installLocation: this.strTrim(this.parseInstallLocation(entry)),
      installDate: this.parseInstallDate(entry.InstallDate?.value as string),
      size: entry.EstimatedSize?.value as number,
      formatSize: formatSize(entry.EstimatedSize?.value as number),
      uninstallString: this.strTrim(entry.UninstallString?.value as string),
      url: this.strTrim(entry.URLUpdateInfo?.value as string),
      displayIcon: this.strTrim(entry.DisplayIcon?.value as string),
    }
    soft.nameWithoutVersion = this.strTrim(this.parseNameWithoutVersion(soft))
    soft.iconPath = this.parseIconPath(soft) as string
    // soft.base64Icon = await this.getIconBase64(soft)
    soft.installDate = this.parseNonEmptyInstallDate(soft) as string
    return soft
  }

  static formatDate(time:Date){
    return this.formatInstallDate(String(time.getFullYear()), String(time.getMonth()+1), String(time.getDate()))
  }

  static parseNonEmptyInstallDate(soft: InstalledSoftware): string {
    if(soft.installDate){
      return soft.installDate
    }
    const arrTime:Date[] = [];
    if(soft.uninstallString){
      const regex = /^((.*)\\.*\.exe)[\\"]?/
      const match = soft.uninstallString.match(regex)
      if (match) {
        if (fs.existsSync(match[1])) {
          const stats = fs.statSync(match[1]);
          if (stats.isFile()) {
            arrTime.push(stats.ctime)
          }
        }
      }
    }
    if(soft.iconPath){
      const stats = fs.statSync(soft.iconPath);
      if (stats.isFile()) {
        arrTime.push(stats.ctime)
      }
    }
    arrTime.sort((a, b) => a.getTime() - b.getTime())

    if(arrTime.length > 0){
      return this.formatDate(arrTime[0])
    }

    return ''
  }

  static async getIconBase64(iconPath: string) {
    if (iconPath) {
      // 解决中间带有相对路径的path
      iconPath = path.resolve(iconPath)
      try {
        if (iconPath.endsWith('.exe')) {
          // exe
          return (await app.getFileIcon(iconPath, { size: 'large' })).toDataURL()
        } else if (iconPath.endsWith('.ico') || iconPath?.indexOf('.') < 0) {
          // ico / 无后缀
          const data = fs.readFileSync(iconPath)
          return `data:image/x-icon;base64,${data.toString('base64')}`
        } else if (iconPath.endsWith('.dll')) {
          // dll
          return await this.getDllIconBase64(iconPath)
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e: unknown) {}
    }
  }

  static getDllIconBase64(dllPath: string): Promise<string> {
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

  static parseIconPath(soft: InstalledSoftware): string {
    if (soft.displayIcon) {
      soft.displayIcon = this.iconPathTrim(this.strTrim(soft.displayIcon))
      if (fs.existsSync(soft.displayIcon)) {
        return soft.displayIcon
      }
    }
    if (soft.installLocation) {
      const regex = /^(.*\.exe)(?:,[-\d]*)?$/
      const match = soft.installLocation?.match(regex)
      if (match) {
        if (fs.existsSync(match[1])) {
          return match[1]
        }
      }
      if (soft.nameWithoutVersion) {
        const dir = `${soft.installLocation}`
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

      regex = /^((.*)\\.*\.exe)[\\"]?/
      match = temp.match(regex)
      if (match) {
        if (fs.existsSync(match[2] + '\\' + soft.nameWithoutVersion)) {
          return match[2] + '\\' + soft.nameWithoutVersion
        } else if (fs.existsSync(match[1])) {
          return match[1]
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
    if(!soft.name){
      return ''
    }
    const regex = /\s(版本)?([vV]ersion\s?)?[Vv]?[0-9.]*$/
    const match = soft.name.match(regex)
    if (match) {
        return soft.name.substring(0,match.index)
    }
    return soft.name
  }

  static parseInstallLocation(values: { [p: string]: RegistryItemValue }): string {
    // 优先尝试InstallLocation
    if (values.InstallLocation?.value) {
      return values.InstallLocation.value as string
    }

    // 次选DisplayIcon路径解析
    if (values.DisplayIcon?.value) {
      const icon = this.iconPathTrim(this.strTrim(values.DisplayIcon.value as string))
      return icon.substring(0, icon.lastIndexOf(path.sep))
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
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
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

  static getInstalledSoftware(regeditGroupKey: SoftwareRegeditGroupKey) {
    return new Promise(async (resolve, reject) => {
      const softArr: InstalledSoftware[] = []
      try {
        const regeditPath = SOFTWARE_REGEDIT_GROUP[regeditGroupKey].path
        const pathList = await regedit.list([regeditPath])
        const pathResult: RegistryItem = pathList[regeditPath]
        if (!pathResult.exists || !pathResult.keys) {
          resolve([])
          return
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
              const software = await SoftwareUtil.parseInstalledSoftware(
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
        reject(error)
        return
      }
      resolve(softArr)
    })
  }
}

export class CMDUtil {
  static openRegedit(path: string) {
    exec(`taskkill /f /im regedit.exe & REG ADD "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Applets\\Regedit" /v "LastKey" /d "${path}" /f & regedit`, (err, stdout, stderr) => {
      if (err) {
        console.error('打开注册表失败', err)
        return
      }
      if (stderr) {
        console.error('stderr:', stderr)
        return
      }
      // console.log('stdout:', stdout);
    })
  }
}
