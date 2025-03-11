module.exports = {
  type: 'INSTALLER',
  id: 'MusicBee',
  backupConfigs: [
    {
      name: '插件',
      items: [
        {
          type: 'directory',
          sourcePath: '%installDir%/Plugins',
          targetRelativePath: 'Plugins',
        },
      ],
    },
    {
      name: '设置',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%/MusicBee/MusicBee3Settings.ini',
          targetRelativePath: 'MusicBee3Settings.ini',
        },
      ],
    },
  ],
}
