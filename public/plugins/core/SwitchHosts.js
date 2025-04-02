module.exports = {
  type: 'INSTALLER',
  id: 'SwitchHosts设置',
  name: 'SwitchHosts',
  backupConfigs: [
    {
      name: '设置',
      items: [
        {
          type: 'file',
          sourcePath: '%USERPROFILE%\\.SwitchHosts',
          targetRelativePath: '.SwitchHosts',
        },
      ],
    },
  ],
  detect(list, env) {
    return this.detectByInstallLocationDir(list)
  },
}
