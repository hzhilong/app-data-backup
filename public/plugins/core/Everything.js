module.exports = {
  type: 'INSTALLER',
  id: 'Everything设置和历史记录',
  name: 'Everything',
  backupConfigs: [
    {
      name: '设置',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%/Everything/Everything.ini',
          targetRelativePath: 'Everything.ini',
        },
      ],
    },
    {
      name: '历史记录',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%/Everything/Bookmarks.csv',
          targetRelativePath: 'Bookmarks.csv',
        },
        {
          type: 'file',
          sourcePath: '%APPDATA%/Everything/Search History.csv',
          targetRelativePath: 'Search History.csv',
        },
        {
          type: 'file',
          sourcePath: '%APPDATA%/Everything/Run History.csv',
          targetRelativePath: 'Run History.csv',
        },
      ],
    },
  ],
  detect(list, env) {
    return this.detectByIncludeName(list)
  },
}
