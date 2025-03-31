<script setup lang="ts">
import type { PluginExecType } from '@/types/PluginTask'
import type { BackupConfig } from '@/types/PluginConfig'
import BackupItemConfig from '@/components/plugin/BackupItemConfig.vue'

defineProps<{
  pluginName: string
  pluginExecType?: PluginExecType
  backupConfig: BackupConfig
  softInstallDir?: string
  backupPath?: string
}>()
</script>

<template>
  <div class="backup-config">
    <div class="backup-config__name"><i class="ri-list-settings-fill"></i>{{ backupConfig.name }}</div>
    <div class="backup-config__items">
      <BackupItemConfig
        v-for="item in backupConfig.items"
        :key="item.sourcePath"
        :plugin-name="pluginName"
        :plugin-exec-type="pluginExecType"
        :item-config="item"
        :soft-install-dir="softInstallDir"
        :backup-path="backupPath"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/plugin/backup-config';
</style>
