module.exports = {
  type: 'INSTALLER',
  id: '软件配置',
  name: '哔哩哔哩账号备份',
  backupConfigs: [
    {
      name: '软件配置和已登录的账号',
      items: [
        {
          type: 'file',
          sourcePath: '%installDir%/bin',
          targetRelativePath: 'bin',
        },
      ],
    },
    {
      name: '备份数据',
      items: [
        {
          type: 'file',
          sourcePath: '%installDir%/backup-data',
          targetRelativePath: 'backup-data',
        },
      ],
    },
    {
      name: '其他数据',
      items: [
        {
          type: 'file',
          sourcePath: '%installDir%/backup-other',
          targetRelativePath: 'backup-other',
        },
      ],
    },
  ],
};
