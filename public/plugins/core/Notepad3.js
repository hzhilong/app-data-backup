module.exports = {
  type: 'INSTALLER',
  id: 'Notepad3设置',
  name: 'Notepad3',
  backupConfigs: [
    {
      name: '设置',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%\\Rizonesoft\\Notepad3',
          targetRelativePath: 'Notepad3',
        },
      ],
    },
  ],
  detect(list, env) {
    return this.detectByInstallLocationDir(list)
  },
}
