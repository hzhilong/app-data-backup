import { exec } from 'child_process'
import fs from 'fs'
import { promisified as regedit, type RegistryItem } from 'regedit'
import path from 'node:path'
import { shell } from 'electron'
import nLogger from './log4js'
import { AbortedError } from '@/models/common-error'

interface ExecCmdOptions {
  codeIsSuccess: (number: number) => boolean
  signal?: AbortSignal
}

export default class WinUtil {
  /**
   * 执行命令
   * @param command
   * @param options
   */
  static execCmd(command: string, options?: ExecCmdOptions): Promise<string>
  static execCmd(command: string, options?: ExecCmdOptions, filePath?: string): Promise<number>
  static execCmd(command: string, options?: ExecCmdOptions, filePath?: string): Promise<string | number> {
    nLogger.debug(`ExecCmd ${command}`, `with ${filePath}`)
    return new Promise((resolve, reject) => {
      // 前置检查：如果 signal 已终止，直接拒绝
      if (options?.signal?.aborted) {
        reject(new AbortedError())
        return
      }

      const child = exec(`chcp 65001 && ${command}`, { encoding: 'utf-8' }, (error, stdout, stderr) => {
        // 清理 abort 监听（如果存在）
        options?.signal?.removeEventListener('abort', abortHandler)

        const exitCode = error ? Number((error as NodeJS.ErrnoException).code ?? 0) : 0
        nLogger.debug(`cmd: [${command}](code: ${exitCode}):${stderr}`)
        if (options?.codeIsSuccess ? !options.codeIsSuccess(exitCode) : exitCode !== 0) {
          reject(new Error(`Command exec failed (code: ${exitCode}): ${stderr || stdout}`))
        } else {
          if (filePath) {
            resolve(WinUtil.getFileSizeKB(filePath))
          } else {
            resolve(stdout)
          }
        }
      })
      // 定义 abort 处理函数
      const abortHandler = () => {
        child.kill('SIGTERM') // 终止进程
        reject(new AbortedError())
      }
      // 注册 abort 监听
      if (options?.signal) {
        options.signal.addEventListener('abort', abortHandler)
      }

      // 可选：进程意外终止处理
      child.on('close', (code) => {
        options?.signal?.removeEventListener('abort', abortHandler)
      })
    })
  }

  /**
   * 打开资源管理器
   * @param fileOrDir 定义的目录或文件
   */
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

  /**
   * 打开注册表
   * @param path 显示的路径
   */
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

  /**
   * 导出注册表
   * @param regPath 注册表路径
   * @param filePath 导出的文件路径
   */
  static exportRegedit(regPath: string, filePath: string): Promise<number> {
    filePath = path.resolve(filePath)
    this.ensureDirectoryExistence(filePath)
    return this.execCmd(`reg export "${regPath}" "${filePath}"`, undefined, filePath)
  }

  /**
   * 导入注册表
   * @param regPath 注册表路径
   * @param filePath 导入的文件路径
   */
  static importRegedit(regPath: string, filePath: string): Promise<number> {
    filePath = path.resolve(filePath)
    return this.execCmd(`reg import "${filePath}"`, undefined, filePath)
  }

  /**
   * 读取json文件
   * @param filePath 文件路径
   */
  static readJsonFile<T>(filePath: string): T {
    filePath = path.resolve(filePath)
    const data = fs.readFileSync(filePath, { encoding: 'utf-8' })
    return JSON.parse(data) as T
  }

  /**
   * 写入json文件
   * @param filePath 文件路径
   * @param data 写入的数据
   */
  static writeJsonFile<T>(filePath: string, data: T): number {
    filePath = path.resolve(filePath)
    this.ensureDirectoryExistence(filePath)
    const json = JSON.stringify(data, null, 2)
    fs.writeFileSync(filePath, json, { encoding: 'utf-8' })
    return this.getFileSizeKB(filePath)
  }

  /**
   * 获取文件/文件夹大小
   * @param filePath 文件/文件夹路径
   */
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

  /**
   * 同步获取文件夹大小
   * @param dirPath 文件夹路径
   */
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
  static copyFile(source: string, destination: string, signal?: AbortSignal): Promise<number> {
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
          signal: signal,
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
