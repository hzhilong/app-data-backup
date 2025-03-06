<script setup lang="ts">
import { plugin as WinRAR } from '@/common/plugins/core/WinRAR.ts'
import { plugin } from '@/common/plugins/core/MusicBee.ts'
import { getBackupDir } from '@/common/plugins/plugins-util.ts'
import { IPC_CHANNELS } from '@/common/models/IpcChannels.ts'

async function test11() {
  WinRAR.execPlugin(
    {
      execType: 'backup',
      installDir: '',
      dataDir: getBackupDir(undefined, 'WinRAR'),
    },
    {},
  )
    .then((ret) => {
      console.log('结果', ret)
    })
    .catch((err) => {
      console.error('错误', err)
    })
}

async function test12() {
  WinRAR.execPlugin(
    {
      execType: 'restore',
      installDir: '',
      dataDir: 'E:\\Projects\\io.github.hzhilong\\app-data-backup\\.backup-data\\WinRAR\\2025-03-06_09-28-02\\',
    },
    {},
  )
    .then((ret) => {
      console.log('结果', ret)
    })
    .catch((err) => {
      console.error('错误', err)
    })
}

async function test21() {
  const newVar = await window.electronAPI?.ipcInvoke(IPC_CHANNELS.GET_ENV)
  plugin
    .execPlugin(
      {
        execType: 'backup',
        installDir: 'd:\\Program Files (x86)\\MusicBee',
        dataDir: getBackupDir(undefined, 'MusicBee'),
      },
      newVar as { [p: string]: string },
    )
    .then((ret) => {
      console.log('结果', ret)
    })
    .catch((err) => {
      console.error('错误', err)
    })
}

async function test22() {
  const newVar = await window.electronAPI?.ipcInvoke(IPC_CHANNELS.GET_ENV)
  plugin
    .execPlugin(
      {
        execType: 'restore',
        installDir: 'd:\\Program Files (x86)\\MusicBee',
        dataDir: 'E:\\Projects\\io.github.hzhilong\\app-data-backup\\.backup-data\\MusicBee\\2025-03-06_10-52-00\\',
      },
      newVar as { [p: string]: string },
    )
    .then((ret) => {
      console.log('结果', ret)
    })
    .catch((err) => {
      console.error('错误', err)
    })
}
</script>

<template>
  <div>
    <el-button @click="test11">备份注册表</el-button>
    <el-button @click="test12">还原注册表</el-button>
    <el-button @click="test21">备份文件和文件夹</el-button>
    <el-button @click="test22">还原文件和文件夹</el-button>
  </div>
</template>

<style scoped lang="scss"></style>
