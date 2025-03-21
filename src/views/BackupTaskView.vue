<script setup lang="ts">
import {ref} from 'vue'

import { useBackupTasksStore } from '@/stores/backup-task'
import type { TabsPaneContext } from 'element-plus'

const activeTabName = ref('未完成')
const {backupTasks} = useBackupTasksStore()

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}
</script>

<template>
  <div class="page-content">
    <el-tabs v-model="activeTabName" class="task-tabs" @tab-click="handleClick">
      <el-tab-pane class="task-tab" label="未完成" name="未完成">
        <div class="table-wrapper">
          <!-- 固定表头 -->
          <div class="table-header">
            <div class="row header">
              <div class="col">备份配置</div>
              <div class="col">备份时间</div>
              <div class="col">任务信息</div>
              <div class="col">任务进度</div>
              <div class="col">操作</div>
            </div>
          </div>
          <div class="table-body">
            <div class="scroll-container">
              <div class="row task-item" v-for="task in backupTasks">
                <div class="col">{{task.pluginId}}</div>
                <div class="col">{{task.cTime}}</div>
                <div class="col">{{task.message}}</div>
                <div class="col">{{task.progressText}}</div>
                <div class="col">操作</div>
              </div>
              <div class="row task-item" v-for="task in backupTasks">
                <div class="col">{{task.pluginId}}</div>
                <div class="col">{{task.cTime}}</div>
                <div class="col">{{task.message}}</div>
                <div class="col">{{task.progressText}}</div>
                <div class="col">操作</div>
              </div>
              <div class="row task-item" v-for="task in backupTasks">
                <div class="col">{{task.pluginId}}</div>
                <div class="col">{{task.cTime}}</div>
                <div class="col">{{task.message}}</div>
                <div class="col">{{task.progressText}}</div>
                <div class="col">操作</div>
              </div>
              <div class="row task-item" v-for="task in backupTasks">
                <div class="col">{{task.pluginId}}</div>
                <div class="col">{{task.cTime}}</div>
                <div class="col">{{task.message}}</div>
                <div class="col">{{task.progressText}}</div>
                <div class="col">操作</div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane class="task-tab" label="已完成" name="已完成">已完成</el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/tasks';
</style>
