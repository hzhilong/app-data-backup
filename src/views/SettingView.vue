<script setup lang="ts">
import { plugin as WinRAR } from '@/common/plugins/core/WinRAR.ts'
import { plugin } from '@/common/plugins/core/MusicBee.ts'
import { getBackupDir } from '@/common/plugins/plugins-util.ts'

async function test0() {
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

async function test1() {
  plugin
    .execPlugin(
      {
        execType: 'backup',
        installDir: 'd:\\Program Files (x86)\\MusicBee',
        dataDir: getBackupDir(undefined, 'MusicBee'),
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

async function test2() {
  plugin
    .execPlugin(
      {
        execType: 'restore',
        installDir: 'd:\\Program Files (x86)\\MusicBee',
        dataDir: 'E:\\Projects\\io.github.hzhilong\\app-data-backup\\.backup-data\\MusicBee\\2025-03-06_09-18-52\\',
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
</script>

<template>
  <div>
    <el-button @click="test0">备份注册表</el-button>
    <el-button @click="test1">备份文件夹</el-button>
    <el-button @click="test2">还原文件夹</el-button>
  </div>
</template>

<style scoped lang="scss"></style>
