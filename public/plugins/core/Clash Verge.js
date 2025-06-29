module.exports = {
  type: 'INSTALLER',
  id: 'Clash Verge 配置',
  name: 'Clash Verge',
  backupConfigs: [
    {
      name: 'Clash Verge 配置',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%/io.github.clash-verge-rev.clash-verge-rev',
          targetRelativePath: 'io.github.clash-verge-rev.clash-verge-rev',
        },
      ],
    },
  ],
};
