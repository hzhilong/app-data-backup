module.exports = {
  type: 'INSTALLER',
  id: 'ScreenToGif设置',
  name: 'ScreenToGif',
  backupConfigs: [
    {
      name: '设置1',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%\\ScreenToGif\\Settings.xaml',
          targetRelativePath: 'Settings.xaml',
          skipIfMissing: true,
        },
      ],
    },
    {
      name: '设置2',
      items: [
        {
          type: 'file',
          sourcePath: '%installDir%\\Settings.xaml',
          targetRelativePath: 'Settings.xaml',
          skipIfMissing: true,
        },
      ],
    },
  ],
  detect(list, env) {
    let soft = this.detectOfInstaller(list, env)
    let programPath = this.detectByCommonProgram(env, 'ScreenToGif')
    if (soft !== undefined && !soft.installDir) {
      soft.installDir = programPath
      return soft
    }
    return soft || programPath
  },
}
