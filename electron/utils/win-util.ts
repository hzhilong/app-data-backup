// src/utils/dllIconExtractor.ts
import { exec } from 'child_process'
import fs from 'fs'
import { promisified as regedit, RegistryItem } from 'regedit'
import path from 'node:path'
import { shell } from 'electron'
import { logger } from '@/utils/logger'

interface ExecCmdOptions {
  codeIsSuccess: (number: number) => boolean
}

export class WinUtil {
  static execCmd(command: string, options?: ExecCmdOptions): Promise<string>
  static execCmd(command: string, options?: ExecCmdOptions, filePath?: string): Promise<number>
  static execCmd(command: string, options?: ExecCmdOptions, filePath?: string): Promise<string | number> {
    return new Promise((resolve, reject) => {
      exec(`chcp 65001 && ${command}`, { encoding: 'utf-8' }, (error, stdout, stderr) => {
        const exitCode = error ? Number((error as NodeJS.ErrnoException).code ?? 0) : 0
        logger.debug(`cmd: [${command}](code: ${exitCode}):${stderr || stdout}`)
        if (options?.codeIsSuccess ? !options.codeIsSuccess(exitCode) : exitCode !== 0) {
          reject(new Error(`exec cmd failed (code: ${exitCode}): ${stderr || stdout}`))
        } else {
          if (filePath) {
            resolve(WinUtil.getFileSizeKB(filePath))
          } else {
            resolve(stdout)
          }
        }
      })
    })
  }

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (err, stdout, stderr) => {},
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
    return this.execCmd(`reg export "${regPath}" "${filePath}"`, undefined, filePath)
  }

  static importRegedit(regPath: string, filePath: string): Promise<number> {
    filePath = path.resolve(filePath)
    return this.execCmd(`reg import "${filePath}"`, undefined, filePath)
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
    const src = path.resolve(source)
    const dest = path.resolve(destination)

    let command: string

    const isFile = this.isFile(source)
    if (isFile) {
      // 文件用 copy 命令
      command = `copy "${src}" "${dest}"`
      return this.execCmd(command, undefined, dest)
    } else {
      // 文件夹用 robocopy
      command = `robocopy "${src}" "${dest}" /E /NFL /NDL /NJH /NJS /NC /NS /NP`
      return this.execCmd(
        command,
        {
          codeIsSuccess: (number) => number < 8,
        },
        dest,
      )
    }
  }

  static getEnv(): { [p: string]: string } {
    const env: { [p: string]: string } = {}
    for (const envKey in process.env) {
      env[envKey] = process.env[envKey] as string
    }
    return env
  }
}
