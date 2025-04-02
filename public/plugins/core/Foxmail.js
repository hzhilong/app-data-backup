module.exports = {
  type: 'INSTALLER',
  id: 'Foxmail帐号数据',
  name: 'Foxmail',
  backupConfigs: [
    {
      name: '帐号数据',
      items: [
        {
          type: 'file',
          sourcePath: '%installDir%/FMStorage.list',
          targetRelativePath: 'FMStorage.list',
        },
        {
          type: 'file',
          sourcePath: '%installDir%/Storage',
          targetRelativePath: 'Storage',
        },
      ],
    },
  ],
}
