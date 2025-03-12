module.exports = {
  type: 'INSTALLER',
  id: '备份WinRAR设置',
  name: 'WinRAR',
  backupConfigs: [
    {
      name: '设置',
      items: [
        {
          type: 'registry',
          sourcePath: 'HKEY_CURRENT_USER\\SOFTWARE\\WinRAR',
          targetRelativePath: 'Settings.reg',
        },
      ],
    },
  ],
  detect(list, env) {
    return this.detectByInstallLocationDir(list)
  },
}
