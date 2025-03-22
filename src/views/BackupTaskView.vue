<script setup lang="ts">
import { ref } from 'vue'

import { useBackupTasksStore } from '@/stores/backup-task'
import type { TabsPaneContext } from 'element-plus'
import { getTaskStateText, type PluginExecTask } from '@/plugins/plugin-task'
import { debounce } from 'lodash'
import BackupUtil from '@/utils/backup-util'
import TaskList from '@/components/TaskList.vue'

const activeTabName = ref('未完成')
const { tasks: backupTasks } = useBackupTasksStore()

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}
const getTaskStateMessage = (task: PluginExecTask) => {
  if (task.success) {
    return '已完成'
  } else if (task.success === false) {
    return `失败：${task.message}`
  } else {
    return getTaskStateText(task.state)
  }
}
const getELProgressStatus = (success?: boolean) => {
  if (success === undefined) {
    return undefined
  }
  return success ? 'success' : 'exception'
}
const resumeTask = (task: PluginExecTask) => {
  debounce(() => {
    BackupUtil.resumedTask(task)
  }, 100)()
}
</script>

<template>
  <div class="page-content">
    <el-tabs v-model="activeTabName" class="task-tabs" @tab-click="handleClick">
      <el-tab-pane class="task-tab" label="未完成" name="未完成">
        <TaskList
          :run-types="['manual', 'auto']"
          :states="['pending', 'stopped', 'running']"
          plugin-exec-type="backup"
        ></TaskList>
      </el-tab-pane>
      <el-tab-pane class="task-tab" label="已完成" name="已完成">
        <TaskList :run-types="['manual', 'auto']" :states="['finished']" plugin-exec-type="backup"></TaskList>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/tasks';
</style>
