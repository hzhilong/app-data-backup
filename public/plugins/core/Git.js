module.exports = {
  type: 'INSTALLER',
  id: '备份Git和OpenSSH设置',
  name: 'Git',
  backupConfigs: [
    {
      name: 'Git设置',
      items: [
        {
          type: 'file',
          sourcePath: '%USERPROFILE%/.gitconfig',
          targetRelativePath: '.gitconfig',
        },
      ],
    },
    {
      name: 'OpenSSH设置',
      items: [
        {
          type: 'file',
          sourcePath: '%USERPROFILE%/.ssh',
          targetRelativePath: '.ssh',
        },
      ],
    },
  ],
}
