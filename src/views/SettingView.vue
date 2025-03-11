<script setup lang="ts">
import { onMounted } from 'vue'
import { IPC_CHANNELS } from '@/models/IpcChannels'
import { execPlugin } from '@/plugins/plugins-util'

onMounted(async () => {
  console.log('initSoftwareLib', await window.electronAPI?.ipcInvoke(IPC_CHANNELS.GET_PLUGINS))
})

function test1() {
  execPlugin({
    id: 'MusicBee',
    name: 'MusicBee',
    installDir: 'D:\\Program Files (x86)\\MusicBee/',
    type: 'INSTALLER',
    totalItemNum: 2,
    backupConfigs: [
      {
        name: '插件',
        items: [
          {
            type: 'directory',
            sourcePath: '%installDir%/Plugins',
            targetRelativePath: 'Plugins',
          },
        ],
      },
      {
        name: '设置',
        items: [
          {
            type: 'file',
            sourcePath: '%APPDATA%/MusicBee/MusicBee3Settings.ini',
            targetRelativePath: 'MusicBee3Settings.ini',
          },
        ],
      },
    ],
  }, 'backup', {
    progress(log: string, curr: number, total: number): void {
      console.log('进度', log, curr, total)
    }
  }).then(data => {
    console.log('结果：', data)
  }).catch(error => {
    console.log(error)
  })
}
</script>

<template>
  <div>
    <el-button @click="test1">测试</el-button>
  </div>
</template>

<style scoped lang="scss"></style>
