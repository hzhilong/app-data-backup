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
const stopTask = (task: PluginExecTask) => {
  debounce(() => {
    AppUtil.message('暂停执行')
    BackupUtil.stopTask(task)
  }, 100)()
}
const removeTask = (task: PluginExecTask) => {
  debounce(() => {
    AppUtil.message('移除任务')
    BackupUtil.removeTask(task)
  }, 100)()
}
</script>

<template>
  <div class="task-list">
    <div class="scroll-container">
      <el-card class="task-item" shadow="hover" v-for="task in filteredTasks" :key="task.id">
        <div class="header">
          <div class="title">{{ task.pluginName }}</div>
          <div class="state" :class="`state-${task.state}`">
            {{ getTaskStateText(task.state) }}
          </div>
          <div class="message" :class="`success-${task.success}`">
            {{ task.message }}
          </div>
          <div class="options">
            <i
              class="ri-play-circle-fill icon-btn"
              v-if="task.state === 'stopped'"
              @click="resumeTask(task)"
              title="继续"
            ></i>
            <i
              class="ri-pause-circle-fill icon-btn"
              v-if="task.state === 'running'"
              @click="stopTask(task)"
              title="暂停"
            ></i>
            <i
              class="ri-close-circle-fill icon-btn"
              v-if="task.state === 'finished'"
              @click="removeTask(task)"
              title="移除"
            ></i>
          </div>
        </div>
        <div class="content">
          <div class="content-item" style="flex: 1.5">
            <div class="plugin-name"><i class="ri-file-code-line"></i>{{ task.pluginId }}</div>
            <div class="date"><i class="ri-time-line"></i>{{ task.cTime }}</div>
          </div>
          <div class="content-item" style="flex: 2">
            <div class="progress">
              <el-progress
                :percentage="Math.floor((task.currProgress * 100) / task.totalProgress)"
                :status="getELProgressStatus(task.success)"
              />
            </div>
            <el-tooltip
              effect="dark"
              :content="task.progressText"
              placement="top-start"
            >
              <div class="progress-text">{{ task.progressText }}</div>
            </el-tooltip>
          </div>
          <div class="content-item" style="flex: 2.5">
            <div class="path-item">
              <i class="ri-folder-2-line"></i>
              <div class="path-label">软件路径：</div>
              <div class="path-wrapper">
                <div class="path" @click="AppUtil.openPath(task.softInstallDir)">{{ task.softInstallDir }}</div>
              </div>
            </div>
            <div class="path-item">
              <i class="ri-folder-2-line"></i>
              <span class="path-label">备份目录：</span>
              <div class="path-wrapper">
                <div class="path" @click="AppUtil.openPath(task.backupPath)">{{ task.backupPath }}</div>
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
