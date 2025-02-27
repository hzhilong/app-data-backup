// src/utils/dllIconExtractor.ts
import { exec } from 'child_process'

export class CMDUtil {
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
}
