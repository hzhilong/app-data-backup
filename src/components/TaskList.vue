<script setup lang="ts">
import { debounce } from 'lodash'
import BackupUtil from '@/utils/backup-util'
import type { PluginExecTask, PluginExecType, TaskRunType, TaskState } from '@/plugins/plugin-task'
import { getTaskStateText } from '@/plugins/plugin-task'
import { storeToRefs } from 'pinia'
import { useBackupTasksStore } from '@/stores/backup-task'
import { useRestoreTasksStore } from '@/stores/restore-task'
import { computed } from 'vue'
import AppUtil from '@/utils/app-util'

const props = defineProps<{
  runTypes: TaskRunType[]
  states: TaskState[]
  pluginExecType: PluginExecType
}>()

const { tasks } =
  props.pluginExecType === 'backup' ? storeToRefs(useBackupTasksStore()) : storeToRefs(useRestoreTasksStore())

const filteredTasks = computed(() => {
  return tasks.value.filter((task) => {
    return props.runTypes.some((type) => type === task.runType) && props.states.some((state) => state === task.state)
  })
})

const getELProgressStatus = (success?: boolean) => {
  if (success === undefined) {
    return undefined
  }
  return success ? 'success' : 'exception'
}

const resumeTask = (task: PluginExecTask) => {
  debounce(() => {
    AppUtil.message('开始执行')
    BackupUtil.resumedTask(task)
  }, 100)()
}
</script>

<template>
  <div class="task-list">
    <div class="scroll-container">
      <el-card class="task-item" shadow="hover" v-for="task in filteredTasks">
        <div class="header">
          <div class="title">{{ task.pluginName }}</div>
          <div class="state" :class="`state-${task.state}`">
            {{ getTaskStateText(task.state) }}
          </div>
          <div class="message" :class="`success-${task.success}`">
            {{ task.message }}
          </div>
          <div class="options">
            <el-button v-if="task.state === 'stopped'" type="primary" @click="resumeTask(task)">继续</el-button>
          </div>
        </div>
        <div class="content">
          <div class="content-item" style="flex: 1.5">
            <div class="plugin-name">{{ task.pluginId }}</div>
            <div class="date">{{ task.cTime }}</div>
          </div>
          <div class="content-item" style="flex: 2">
            <div class="progress">
              <el-progress
                :percentage="Math.floor((task.currProgress * 100) / task.totalProgress)"
                :status="getELProgressStatus(task.success)"
              />
            </div>
            <div class="progress-text">{{ task.progressText }}</div>
          </div>
          <div class="content-item" style="flex: 2.5">
            <div class="path-item">
              <div class="path-label">软件路径：</div>
              <div class="path-wrapper">
                <div class="path">{{ task.softInstallDir }}</div>
              </div>
            </div>
            <div class="path-item">
              <span class="path-label">备份目录：</span>
              <div class="path-wrapper">
                <div class="path">{{ task.backupPath }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
      <el-empty v-show="filteredTasks.length === 0" description="暂无数据" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/tasks-list';
</style>
