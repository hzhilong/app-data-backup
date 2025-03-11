module.exports = {
  type: 'INSTALLER',
  id: 'WinRAR',
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
}
