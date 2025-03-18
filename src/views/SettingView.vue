<script setup lang="ts">
import { useAppSettingsStore } from '@/stores/app-settings.ts'

let store = useAppSettingsStore()
</script>

<template>
  <div class="page-content settings-container">
    <div class="left-content">

      <div class="setting-item">
        <span class="item-label">备份目录</span>
        <el-input class="item-value" type="file" v-model="store.backupRootDir"></el-input>
      </div>

    </div>
    <div class="right-content">
      <div class="setting-item"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/scss/page/settings.scss";
</style>
