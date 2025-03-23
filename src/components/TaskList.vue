<script setup lang="ts">
import { debounce } from 'lodash'
import BackupUtil from '@/utils/backup-util'
import {
  getTaskStateText,
  type PluginExecTask,
  type PluginExecType,
  type TaskItemResult,
  type TaskRunType,
  type TaskState,
} from '@/plugins/plugin-task'
import { storeToRefs } from 'pinia'
import { useBackupTasksStore } from '@/stores/backup-task'
import { useRestoreTasksStore } from '@/stores/restore-task'
import { computed, ref } from 'vue'
import AppUtil from '@/utils/app-util'

const props = defineProps<{
  runTypes: TaskRunType[]
  states: TaskState[]
  success: (boolean | undefined)[]
  pluginExecType: PluginExecType
}>()

const { tasks } =
  props.pluginExecType === 'backup' ? storeToRefs(useBackupTasksStore()) : storeToRefs(useRestoreTasksStore())
const expandItems = ref<Set<string>>(new Set())
const expandTaskInfo = (task: PluginExecTask) => {
  const id = task.id
  if (expandItems.value.has(id)) {
    expandItems.value.delete(id)
  } else {
    expandItems.value.add(id)
  }
}

const paramPluginId = ref('')

const filteredTasks = computed(() => {
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

const getELProgressStatus = (success?: boolean) => {
  if (success === undefined) {
    return undefined
  }
  return success ? 'success' : 'exception'
}

const resumeTask = (task: PluginExecTask) => {
  debounce(() => {
    BackupUtil.resumedTask(task, true)
  }, 100)()
}
const stopTask = (task: PluginExecTask) => {
  debounce(() => {
    BackupUtil.stopTask(task, true)
  }, 100)()
}
const removeTask = (task: PluginExecTask) => {
  debounce(() => {
    BackupUtil.removeTask(task, true)
  }, 100)()
}
const restoreTask = (task: PluginExecTask) => {
  debounce(() => {
    BackupUtil.restoreBackupData('manual', [task], true)
  }, 100)()
}
const getTaskItemResultState = (item: TaskItemResult) => {
  if (!item.finished) {
    return '等待操作'
  } else {
    if (item.success) {
      return '成功'
    } else {
      return `失败：${item.message}`
    }
  }
}
const getTaskItemResultStateClass = (item: TaskItemResult) => {
  if (!item.finished) {
    return 'ri-question-line'
  } else {
    if (item.success) {
      return 'ri-checkbox-circle-line'
    } else {
      return 'ri-close-circle-line'
    }
  }
}
</script>

<template>
  <div class="task-list">
    <div class="header">
      <div class="search-item">
        <div class="label">配置名称</div>
        <el-input class="value" v-model="paramPluginId" placeholder="" size="small" clearable />
      </div>
    </div>
    <div class="scroll-container">
      <el-card class="task-item" shadow="hover" v-for="task in filteredTasks" :key="task.id">
        <div class="task-badge" v-if="task.runType === 'auto'">auto</div>
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
            <el-popconfirm
              v-if="task.state !== 'running'"
              title="移除该任务？"
              placement="left"
              @confirm="removeTask(task)"
            >
              <template #reference>
                <i class="ri-close-circle-fill icon-btn" title="移除"></i>
              </template>
            </el-popconfirm>
            <i
              class="ri-inbox-unarchive-line icon-btn"
              v-if="task.state === 'finished' && task.success === true"
              @click="restoreTask(task)"
              title="还原"
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
            <el-tooltip effect="dark" :content="task.progressText" placement="top-start">
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
        <i
          class="btn-expand"
          :class="expandItems.has(task.id) ? 'ri-arrow-down-wide-line' : 'ri-arrow-up-wide-line'"
          @click="expandTaskInfo(task)"
        ></i>
        <div class="expand-info-container" :class="expandItems.has(task.id) ? 'expand' : 'collapse'">
          <div class="expand-info">
            <div class="plugin-config" v-for="config in task.taskResults">
              <div class="config-name"><i class="ri-list-settings-fill"></i>{{ config.configName }}</div>
              <div class="config-item" v-for="item in config.configItems">
                <div class="item-field" style="flex: 6">
                  <el-tooltip effect="dark" :content="item.sourcePath" placement="top-start">
                    <span class="path-field" @click="BackupUtil.openTaskConfigPath(task, item, true)"
                      ><i class="ri-file-2-line"></i>{{ item.sourcePath }}</span
                    >
                  </el-tooltip>
                </div>
                <div class="item-field">
                  <i :class="`ri-arrow-${task.pluginExecType === 'backup' ? 'right' : 'left'}-long-line`"></i>
                </div>
                <div class="item-field" style="flex: 4">
                  <el-tooltip effect="dark" :content="item.targetRelativePath" placement="top-start">
                    <span class="path-field" @click="BackupUtil.openTaskConfigPath(task, item, false)"
                      ><i class="ri-file-2-line"></i>{{ item.targetRelativePath }}</span
                    >
                  </el-tooltip>
                </div>
                <div class="item-field" style="flex: 2">
                  <span><i :class="item.sizeStr ? 'ri-file-info-fill' : ''"></i>{{ item.sizeStr }}</span>
                </div>
                <div class="item-field" style="flex: 6">
                  <el-tooltip effect="dark" :content="getTaskItemResultState(item)" placement="top-start">
                    <span><i :class="getTaskItemResultStateClass(item)"></i>{{ getTaskItemResultState(item) }}</span>
                  </el-tooltip>
                </div>
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
