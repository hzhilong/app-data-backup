<script setup lang="ts">
import type { PluginExecTask, TaskResult } from '@/types/PluginTask'
import TaskItemResult from './TaskItemResult.vue'

defineProps<{
  task: PluginExecTask
  result: TaskResult
}>()
</script>

<template>
  <div class="task-result">
    <div class="task-result__name"><i class="ri-list-settings-fill"></i>{{ result.configName }}</div>
    <div class="task-result__items">
      <TaskItemResult
        v-for="item in result.configItems"
        :key="item.sourcePath"
        :task="task"
        :item-result="item"
        :show-msg="true"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/task/task-result';
</style>
