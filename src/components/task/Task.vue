<script setup lang="ts">
import AppUtil from '@/utils/app-util'
import { getTaskStateText, type PluginExecTask } from '@/types/PluginTask'
import IconLabel from '@/components/common/IconLabel.vue'
import { debounce } from 'lodash'
import BackupUtil from '@/utils/backup-util'

interface TaskProps {
  task: PluginExecTask
  showOptions: boolean
}

const props = withDefaults(defineProps<TaskProps>(), {})
const expand = defineModel('expand', {
  required: false,
  default: false,
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
</script>

<template>
  <div class="task">
    <div class="task__badge" v-if="task.runType === 'auto'">auto</div>
    <div class="task__header">
      <div class="task__header__title">{{ task.pluginName }}</div>
      <div class="task__header__state" :class="`task__header__state--${task.state}`">
        {{ getTaskStateText(task.state) }}
      </div>
      <Tooltip
        class="task__header__message"
        :class="`task__header__message--success-${task.success}`"
        :content="task.message"
        type="ltr"
      />
      <div v-if="showOptions" class="task__header__options">
        <slot name="options">
          <IconButton
            v-if="task.state === 'stopped'"
            icon="ri-play-circle-fill"
            tip="继续"
            @on-click="resumeTask(task)"
          />
          <IconButton
            v-if="task.state === 'running'"
            icon="ri-pause-circle-fill"
            tip="暂停"
            @on-click="stopTask(task)"
          />
          <IconButton
            v-if="task.state === 'finished' && task.pluginExecType === 'backup' && task.success === true"
            icon="ri-inbox-unarchive-line"
            tip="还原"
            @on-click="restoreTask(task)"
          />
          <IconButton
            v-if="task.state !== 'running'"
            icon="ri-close-circle-fill"
            tip="移除"
            confirm="移除该任务？"
            @on-click="removeTask(task)"
          />
        </slot>
      </div>
    </div>
    <div class="task__content">
      <div class="flex-col" style="flex: 1.5">
        <Tooltip icon-class="ri-file-code-line" class="task__content__plugin-id" :content="task.pluginId" />
        <IconLabel class="task__content__date" icon="ri-time-line">{{ task.cTime }}</IconLabel>
      </div>
      <div class="flex-col" style="flex: 2">
        <div class="task__content__progress">
          <el-progress
            :percentage="Math.floor((task.currProgress * 100) / task.totalProgress)"
            :status="getELProgressStatus(task.success)"
          />
        </div>
        <Tooltip class="task__content__progress-text" :content="task.progressText" type="ltr" />
      </div>
      <div class="flex-col" style="flex: 2.5">
        <div class="task__content__path-wrapper">
          <IconLabel class="task__content__label" icon="ri-folder-2-line">软件路径：</IconLabel>
          <Tooltip
            class="task__content__path"
            :content="task.softInstallDir"
            @click="AppUtil.openPath(task.softInstallDir)"
          />
        </div>
        <div class="task__content__path-wrapper">
          <IconLabel class="task__content__label" icon="ri-folder-2-line">备份目录：</IconLabel>
          <Tooltip class="task__content__path" :content="task.backupPath" @click="AppUtil.openPath(task.backupPath)" />
        </div>
      </div>
    </div>
    <i
      class="task__expand-button"
      :class="expand ? 'ri-arrow-down-wide-line' : 'ri-arrow-up-wide-line'"
      @click="expand = !expand"
    ></i>
    <div class="task__expand-info-container" :class="expand ? 'task__expand-info-container--expand' : ''">
      <div class="task__expand-info">
        <div class="task__expand-info__results">
          <TaskResult v-for="config in task.taskResults" :key="config.configName" :task="task" :result="config" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/task/task';
</style>
