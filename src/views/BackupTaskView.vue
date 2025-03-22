<script setup lang="ts">
import { ref } from 'vue'
import type { TabsPaneContext } from 'element-plus'
import TaskList from '@/components/TaskList.vue'

const activeTabName = ref('未完成')

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}
</script>

<template>
  <div class="page-content">
    <el-tabs v-model="activeTabName" class="task-tabs" @tab-click="handleClick">
      <el-tab-pane class="task-tab" label="未完成" name="未完成">
        <TaskList
          :run-types="['manual', 'auto']"
          :states="['pending', 'stopped', 'running', 'finished']"
          :success="[false, undefined]"
          plugin-exec-type="backup"
        ></TaskList>
      </el-tab-pane>
      <el-tab-pane class="task-tab" label="已完成" name="已完成">
        <TaskList
          :run-types="['manual', 'auto']"
          :states="['finished']"
          :success="[true]"
          plugin-exec-type="backup"
        ></TaskList>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/tasks';
</style>
