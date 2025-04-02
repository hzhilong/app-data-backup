module.exports = {
  type: 'INSTALLER',
  id: 'SumatraPDF设置',
  name: 'SumatraPDF',
  backupConfigs: [
    {
      name: '设置',
      items: [
        {
          type: 'file',
          sourcePath: '%LOCALAPPDATA%/SumatraPDF/SumatraPDF-settings.txt',
          targetRelativePath: 'SumatraPDF-settings.txt',
          skipIfMissing: true,
        },
        {
          type: 'file',
          sourcePath: '%installDir%/SumatraPDF-settings.txt',
          targetRelativePath: 'SumatraPDF-settings.txt',
          skipIfMissing: true,
        },
      ],
    },
  ],
}
