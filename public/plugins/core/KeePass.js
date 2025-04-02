module.exports = {
  type: 'INSTALLER',
  id: 'KeePass设置和插件',
  name: 'KeePass Password Safe 2',
  backupConfigs: [
    {
      name: '设置',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%/KeePass',
          targetRelativePath: 'KeePass',
        },
        {
          type: 'file',
          sourcePath: '%installDir%/KeePass.exe.config',
          targetRelativePath: 'KeePass.exe.config',
        },
        {
          type: 'file',
          sourcePath: '%installDir%/KeePass.config.xml',
          targetRelativePath: 'KeePass.config.xml',
        },
        {
          type: 'file',
          sourcePath: '%installDir%/KeePass.config.enforced.xml',
          targetRelativePath: 'KeePass.config.enforced.xml',
        },
      ],
    },
    {
      name: '插件',
      items: [
        {
          type: 'file',
          sourcePath: '%installDir%/Plugins',
          targetRelativePath: 'Plugins',
        },
        {
          type: 'file',
          sourcePath: '%installDir%/Languages',
          targetRelativePath: 'Languages',
        },
      ],
    },
  ],
  detect(list, env) {
    return this.detectByInstallLocationDir(list)
  },
}
