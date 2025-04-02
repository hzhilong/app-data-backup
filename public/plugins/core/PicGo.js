module.exports = {
  type: 'INSTALLER',
  id: 'PicGo设置',
  name: 'PicGo',
  backupConfigs: [
    {
      name: '设置',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%\\PicGo\\data.json',
          targetRelativePath: 'data.json',
        },
      ],
    },
  ],
  detect(list, env) {
    return this.detectByInstallLocationDir(list)
  },
}
