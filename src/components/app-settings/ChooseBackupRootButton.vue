<script setup lang="ts">
import { useAppSettingsStore } from '@/stores/app-settings'
import { storeToRefs } from 'pinia'
import FileUtil from '@/utils/file-util'

const appSettingsStore = useAppSettingsStore()
const { backupRootDir } = storeToRefs(appSettingsStore)

const chooseBackupRootDir = () => {
  FileUtil.chooseDirectory({ defaultPath: backupRootDir.value, title: '选择备份目录' }).then((res) => {
    if (res.filePaths?.length > 0) {
      backupRootDir.value = res.filePaths[0]
    }
  })
}
</script>

<template>
  <el-button type="primary" @click="chooseBackupRootDir()">选择</el-button>
</template>

<style scoped lang="scss"></style>
