module.exports = {
  type: 'INSTALLER',
  id: 'HiBit Uninstaller软件数据',
  name: 'HiBit Uninstaller',
  backupConfigs: [
    {
      name: '所有数据',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%/HiBit Uninstaller',
          targetRelativePath: 'HiBit Uninstaller',
        },
      ],
    },
  ]
}
