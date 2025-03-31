<script setup lang="ts">
import type { PluginExecTask, TaskItemResult } from '@/types/PluginTask'
import PluginUtil from '@/utils/plugin-util'

const props = defineProps<{
  task: PluginExecTask
  itemResult: TaskItemResult
  showMsg?: boolean
}>()

const getArrowClass = () => {
  if (props.task.pluginExecType === 'backup') {
    return 'ri-arrow-right-long-line'
  }
  return 'ri-arrow-left-long-line'
}

const openSourcePath = () => {
  PluginUtil.openPluginConfigSourcePath({
    itemConfig: props.itemResult,
    softName: props.task.pluginName,
    softInstallDir: props.task.softInstallDir,
  })
}
const openTargetPath = () => {
  PluginUtil.openPluginConfigTargetPath({
    itemConfig: props.itemResult,
    softName: props.task.pluginName,
    softInstallDir: props.task.softInstallDir,
    backupPath: props.task.backupPath,
  })
}

const getTaskItemResultState = () => {
  if (!props.itemResult.finished) {
    return '等待操作'
  } else {
    if (props.itemResult.success) {
      return '成功'
    } else {
      return `失败：${props.itemResult.message}`
    }
  }
}
const getTaskItemResultStateClass = () => {
  if (!props.itemResult.finished) {
    return 'ri-question-line'
  } else {
    if (props.itemResult.success) {
      return 'ri-checkbox-circle-line'
    } else {
      return 'ri-close-circle-line'
    }
  }
}
</script>

<template>
  <div class="task-item-result">
    <div class="flex-col" style="flex: 6">
      <i class="ri-file-2-line"></i>
      <Tooltip class="task-item-result__path" :content="itemResult.sourcePath" @click="openSourcePath()"/>
    </div>
    <div class="flex-col arrow">
      <i :class="getArrowClass()"></i>
    </div>
    <div class="flex-col" style="flex: 4">
      <i class="ri-file-2-line"></i>
      <Tooltip class="task-item-result__path" :content="itemResult.targetRelativePath" @click="openTargetPath()"/>
    </div>
    <div class="flex-col" style="flex: 2">
      <i :class="itemResult.sizeStr ? 'ri-file-info-fill' : ''"></i>
      {{ itemResult.sizeStr }}
    </div>
    <div class="flex-col" style="flex: 3">
      <i :class="getTaskItemResultStateClass()"></i>
      <Tooltip class="task-item-result__state" :content="getTaskItemResultState()" type="ltr"/>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/task/task-item-result';
</style>
