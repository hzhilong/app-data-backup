module.exports = {
  type: 'INSTALLER',
  id: 'HxD Hex Editor数据',
  name: 'HxD Hex Editor',
  backupConfigs: [
    {
      name: '数据',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%/Mael Horz/HxD Hex Editor',
          targetRelativePath: 'HxD Hex Editor',
        },
      ],
    },
  ],
  detect(list, env) {
    return this.detectByInstallLocationDir(list, 'HxD')
  },
}
