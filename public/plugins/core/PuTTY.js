module.exports = {
  type: 'INSTALLER',
  id: 'PuTTY设置',
  name: 'PuTTY',
  backupConfigs: [
    {
      name: '设置',
      items: [
        {
          type: 'registry',
          sourcePath: 'HKEY_CURRENT_USER\\SOFTWARE\\SimonTatham\\PuTTY',
          targetRelativePath: 'Settings.reg',
        },
      ],
    },
  ],
  detect(list, env) {
    return this.detectByIncludeName(list)
  },
}
