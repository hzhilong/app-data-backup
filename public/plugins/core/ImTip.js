module.exports = {
  type: 'PORTABLE',
  id: 'ImTip数据',
  name: 'ImTip',
  backupConfigs: [
    {
      name: 'ImTip数据',
      items: [
        {
          type: 'file',
          sourcePath: '%LOCALAPPDATA%/aardio/std/ImTip',
          targetRelativePath: 'aardio/std/ImTip',
        },
      ],
    },
  ],
  detect(list, env) {
    return this.detectByPath(env, '%LOCALAPPDATA%/aardio/std/ImTip')
  },
}
