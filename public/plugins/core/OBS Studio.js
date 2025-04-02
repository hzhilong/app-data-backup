module.exports = {
  type: 'INSTALLER',
  id: 'OBS Studio设置和插件',
  name: 'OBS Studio',
  backupConfigs: [
    {
      name: '设置',
      items: [
        {
          type: 'file',
          sourcePath: '%APPDATA%\\obs-studio\\basic',
          targetRelativePath: 'basic',
        },
        {
          type: 'file',
          sourcePath: '%APPDATA%\\obs-studio\\plugin_config',
          targetRelativePath: 'plugin_config',
        },
        {
          type: 'file',
          sourcePath: '%APPDATA%\\obs-studio\\profiler_data',
          targetRelativePath: 'profiler_data',
        },
        {
          type: 'file',
          sourcePath: '%APPDATA%\\obs-studio\\global.ini',
          targetRelativePath: 'global.ini',
        },
      ],
    },
    {
      name: '插件',
      items: [
        {
          type: 'file',
          sourcePath: '%installDir%\\obs-plugins',
          targetRelativePath: 'obs-plugins',
        },
        {
          type: 'file',
          sourcePath: '%installDir%\\data\\obs-plugins',
          targetRelativePath: 'data\\obs-plugins',
        },
      ],
    },
  ],
}
