<script setup lang="ts">
import type { BackupItemConfig } from '@/types/PluginConfig'
import type { PluginExecType } from '@/types/PluginTask'
import PluginUtil from '@/utils/plugin-util'

const props = defineProps<{
  pluginName: string
  pluginExecType?: PluginExecType
  itemConfig: BackupItemConfig
  softInstallDir?: string
  backupPath?: string
}>()

const getSourcePathStyle = () => {
  return props.itemConfig.sourcePath ? { cursor: 'pointer' } : {}
}

const getArrowClass = () => {
  if (!props.pluginExecType || props.pluginExecType === 'backup') {
    return 'ri-arrow-right-long-line'
  }
  return 'ri-arrow-left-long-line'
}

const getTargetPathStyle = () => {
  return props.softInstallDir && props.backupPath ? { cursor: 'pointer' } : {}
}

const openSourcePath = () => {
  PluginUtil.openPluginConfigSourcePath({
    itemConfig: props.itemConfig,
    softName: props.pluginName,
    softInstallDir: props.softInstallDir,
  })
}
const openTargetPath = () => {
  if (!props.backupPath || !props.softInstallDir) return
  PluginUtil.openPluginConfigTargetPath({
    itemConfig: props.itemConfig,
    softName: props.pluginName,
    softInstallDir: props.softInstallDir,
    backupPath: props.backupPath,
  })
}
</script>

<template>
  <div class="backup-item-config">
    <div class="flex-col" style="flex: 1">
      <i class="ri-file-2-line"></i>
      <el-tooltip effect="dark" :content="itemConfig.sourcePath" placement="top">
        <div
          class="backup-item-config__path txt-reverse-ellipsis"
          :style="getSourcePathStyle()"
          @click="openSourcePath()"
        >
          &lrm;{{ itemConfig.sourcePath }}&lrm;
        </div>
      </el-tooltip>
    </div>
    <div class="flex-col arrow">
      <i :class="getArrowClass()"></i>
    </div>
    <div class="flex-col" style="flex: 1">
      <i class="ri-file-2-line"></i>
      <el-tooltip effect="dark" :content="itemConfig.targetRelativePath" placement="top">
        <div
          class="backup-item-config__path txt-reverse-ellipsis"
          :style="getTargetPathStyle()"
          @click="openTargetPath()"
        >
          &lrm;{{ itemConfig.targetRelativePath }}&lrm;
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/plugin/backup-item-config';
</style>
