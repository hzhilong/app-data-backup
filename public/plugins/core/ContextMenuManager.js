module.exports = {
  type: 'PORTABLE',
  id: 'ContextMenuManager 设置',
  name: 'ContextMenuManager',
  backupConfigs: [
    {
      name: '设置',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%/ContextMenuManager/Config',
          targetRelativePath: 'Config',
        },
      ],
    },
  ],
  detect(list, env) {
    return this.detectByAppData(list, env)
  },
}
