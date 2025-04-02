module.exports = {
  type: 'INSTALLER',
  id: 'Mirroid设置',
  name: 'Mirroid',
  backupConfigs: [
    {
      name: '设置',
      items: [
        {
          type: 'file',
          sourcePath: '%LOCALAPPDATA%/Mirroid/mirroid_conf.ini',
          targetRelativePath: 'mirroid_conf.ini',
        },
      ],
    },
  ],
}
