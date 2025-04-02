module.exports = {
  type: 'INSTALLER',
  id: 'Typora高级设置',
  name: 'Typora',
  backupConfigs: [
    {
      name: '高级设置',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%\\Typora\\conf',
          targetRelativePath: 'conf',
        },
      ],
    },
  ],
}
