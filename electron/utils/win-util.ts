// src/utils/dllIconExtractor.ts
import { exec } from 'child_process'
import fs from 'fs'
import { promisified as regedit, RegistryItem } from 'regedit'
import path from 'node:path'
import { shell } from 'electron'
import { logger } from '../../src/utils/logger'

export class WinUtil {
  static openPath(fileOrDir: string): void {
    fileOrDir = path.resolve(fileOrDir)
    if (fs.existsSync(fileOrDir)) {
      if (fs.lstatSync(fileOrDir).isFile()) {
        shell.showItemInFolder(fileOrDir)
      } else {
        shell.openExternal(fileOrDir)
      }
    }
  }

  static openRegedit(path: string) {
    exec(
      `taskkill /f /im regedit.exe & REG ADD "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Applets\\Regedit" /v "LastKey" /d "${path}" /f & regedit`,
      (err, stdout, stderr) => {
        if (err) {
          console.error('打开注册表失败', err)
          return
        }
        if (stderr) {
          console.error('stderr:', stderr)
          return
        }
        // console.log('stdout:', stdout);
      },
    )
  }

  /**
   * 读取注册表值（不遍历子文件夹）
   * @param path
   */
  static async readRegeditValues(path: string) {
    const items = await regedit.list([path])
    const pathResult: RegistryItem = items[path]
    if (!pathResult || !pathResult.exists || !pathResult.values) {
      return null
    } else {
      return pathResult.values
    }
  }

  /**
   * 确保文件路径的目录存在
   * @param filePath 完整的文件路径
   */
  static ensureDirectoryExistence(filePath: string) {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  static exportRegedit(regPath: string, filePath: string): Promise<number> {
    filePath = path.resolve(filePath)
    this.ensureDirectoryExistence(filePath)
    return new Promise((resolve, reject) => {
      exec(`reg export "${regPath}" "${filePath}"`, (err, stdout, stderr) => {
        if (err) {
          reject(err)
        } else if (stderr) {
          reject(stderr)
        } else {
          resolve(this.getFileSizeKB(filePath))
        }
      })
    })
  }

  static importRegedit(regPath: string, filePath: string): Promise<number> {
    filePath = path.resolve(filePath)
    return new Promise((resolve, reject) => {
      exec(`reg import "${filePath}"`, (err, stdout, stderr) => {
        if (err) {
          reject(err)
        } else if (stderr) {
          reject(stderr)
        } else {
          resolve(this.getFileSizeKB(filePath))
        }
      })
    })
  }

  static readJsonFile<T>(filePath: string): T {
    filePath = path.resolve(filePath)
    const data = fs.readFileSync(filePath, { encoding: 'utf-8' })
    return JSON.parse(data) as T
  }

  static writeJsonFile<T>(filePath: string, data: T): number {
    filePath = path.resolve(filePath)
    this.ensureDirectoryExistence(filePath)
    const json = JSON.stringify(data, null, 2)
    fs.writeFileSync(filePath, json, { encoding: 'utf-8' })
    return this.getFileSizeKB(filePath)
  }

  static getFileSizeKB(filePath: string) {
    if (!fs.existsSync(filePath)) {
      return 0
    }
    if (this.isFile(filePath)) {
      return fs.statSync(filePath).size / 1024
    } else {
      return this.getFolderSizeSync(filePath) / 1024
    }
  }

  static getFolderSizeSync(dirPath: string): number {
    let totalSize = 0
    const stack: string[] = [dirPath]

    while (stack.length > 0) {
      const currentPath = stack.pop()!
      const entries = fs.readdirSync(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)

        if (entry.isDirectory()) {
          stack.push(fullPath) // 将子目录加入栈
        } else if (entry.isFile()) {
          const stats = fs.statSync(fullPath)
          totalSize += stats.size
        }
      }
    }

    return totalSize
  }

  /**
   * 判断路径是否是文件
   */
  static isFile(filePath: string): boolean {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile()
  }

  /**
   * 通用拷贝工具：支持文件或文件夹
   */
  static copyFile(source: string, destination: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const src = path.resolve(source)
      const dest = path.resolve(destination)

      let command: string

      const isFile = this.isFile(source)
      if (isFile) {
        // 文件用 copy 命令
        command = `copy "${src}" "${dest}"`
      } else {
        // 文件夹用 robocopy
        command = `robocopy "${src}" "${dest}" /E /NFL /NDL /NJH /NJS /NC /NS /NP`
      }

      exec(command, (error, stdout, stderr) => {
        const exitCode = error ? ((error as NodeJS.ErrnoException).code ?? 0) : 0
        logger.debug(`命令${command}执行结果(code: ${exitCode}):${stderr || stdout}`)
        const isFileCopyFailed = isFile && Number(exitCode) !== 0
        const isFolderCopyFailed = !isFile && Number(exitCode) > 1

        if (isFileCopyFailed || isFolderCopyFailed) {
          reject(new Error(`拷贝失败 (code: ${exitCode}): ${stderr || stdout}`))
        } else {
          resolve(this.getFileSizeKB(dest))
        }
      })
    })
  }
}
