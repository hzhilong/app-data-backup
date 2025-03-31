<script setup lang="ts">
import { type PluginExecType, type TaskRunType, type TaskState } from '@/types/PluginTask'
import { storeToRefs } from 'pinia'
import { useBackupTasksStore } from '@/stores/backup-task'
import { useRestoreTasksStore } from '@/stores/restore-task'
import { computed, ref } from 'vue'
import { logger } from '@/utils/logger-util'

const props = defineProps<{
  runTypes: TaskRunType[]
  states: TaskState[]
  success: (boolean | undefined)[]
  pluginExecType: PluginExecType
}>()

const { tasks } =
  props.pluginExecType === 'backup' ? storeToRefs(useBackupTasksStore()) : storeToRefs(useRestoreTasksStore())

const paramPluginId = ref('')

const filteredTasks = computed(() => {
  logger.debug('filteredTasks', tasks.value)
  return tasks.value.filter((task) => {
    const pid = paramPluginId.value.toLowerCase()
    if (props.success === undefined) {
      return (
        task.pluginId.toLowerCase().includes(pid) &&
        props.runTypes.some((type) => type === task.runType) &&
        props.states.some((state) => state === task.state)
      )
    } else {
      return (
        task.pluginId.toLowerCase().includes(pid) &&
        props.success.some((success) => success === task.success) &&
        props.runTypes.some((type) => type === task.runType) &&
        props.states.some((state) => state === task.state)
      )
    }
  })
})
</script>

<template>
  <div class="task-list">
    <div class="header">
      <div class="header__item">
        <div class="header__item__label">配置名称</div>
        <el-input class="header__item__value" v-model="paramPluginId" placeholder="" size="small" clearable />
      </div>
    </div>
    <div class="scroll-container">
      <div class="scroll-content">
        <Task class="task-item" v-for="task in filteredTasks" :key="task.id" :task="task" :show-options="true"></Task>
        <el-empty v-show="filteredTasks.length === 0" description="暂无数据" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/task/task-list';
</style>
