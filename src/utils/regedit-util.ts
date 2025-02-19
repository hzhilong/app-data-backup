import { promisified as regedit, setExternalVBSLocation } from 'regedit'

setExternalVBSLocation('resources/regedit/vbs')

export default {
  findAllSoftware: async () => {
    const registryPaths: string[] = [
      'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
      // 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
      // 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    ]
    return await regedit.list(registryPaths)
  },
}
