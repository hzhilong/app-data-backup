<script setup lang="ts">
import TaskList from '@/components/TaskList.vue'
import { ref } from 'vue'

const activeTab = ref('未完成')
</script>

<template>
  <div class="page-content">
    <el-tabs class="task-tabs" v-model="activeTab">
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
