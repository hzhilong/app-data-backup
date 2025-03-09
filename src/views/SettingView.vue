<script setup lang="ts">
import { onMounted } from 'vue'
import { IPC_CHANNELS } from '@/models/IpcChannels.ts'
import { getBackupDir } from '@/plugins/plugin-config.ts'

onMounted(async () => {
  console.log('initSoftwareLib', await window.electronAPI?.ipcInvoke(IPC_CHANNELS.GET_PLUGINS))
})

function test1() {
  window.electronAPI?.ipcInvoke(IPC_CHANNELS.EXEC_PLUGIN, 'MusicBee', {
    execType: 'backup',
    installDir: 'D:\\Program Files (x86)\\MusicBee/',
    dataDir: getBackupDir('MusicBee'),
  })
  window.electronAPI?.ipcOn(IPC_CHANNELS.GET_PLUGIN_PROGRESS, (...args: unknown[]) => {
    console.log('进度', ...args)
  })
}
</script>

<template>
  <div>
    <el-button @click="test1">测试</el-button>
  </div>
</template>

<style scoped lang="scss"></style>
