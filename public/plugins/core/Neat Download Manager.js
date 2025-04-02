module.exports = {
  type: 'INSTALLER',
  id: 'Neat Download Manager数据',
  name: 'Neat Download Manager',
  backupConfigs: [
    {
      name: '注册表',
      items: [
        {
          type: 'registry',
          sourcePath: 'HKEY_CURRENT_USER\\SOFTWARE\\NeatDM',
          targetRelativePath: 'Settings.reg',
        },
      ],
    },
    {
      name: '数据库',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%\\NeatDM\\NeatDB.db',
          targetRelativePath: 'NeatDB.db',
        },
      ],
    },
  ],
}
