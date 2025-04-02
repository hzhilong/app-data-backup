module.exports = {
  type: 'INSTALLER',
  id: 'LAV Filters注册表数据',
  name: 'LAV Filters',
  backupConfigs: [
    {
      name: '注册表数据',
      items: [
        {
          type: 'registry',
          sourcePath: 'HKEY_CURRENT_USER\\SOFTWARE\\LAV',
          targetRelativePath: 'Settings.reg',
        },
      ],
    },
  ],
  detect(list, env) {
    return this.detectByInstallLocationDir(list)
  },
}
