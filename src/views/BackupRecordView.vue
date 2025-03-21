<script setup lang="ts">

import { useBackupTasksStore } from '@/stores/backup-task'

const {backupTasks} = useBackupTasksStore()
</script>

<template>
  <div>
    <div v-for="(item,index) in backupTasks" :key="index" class="backup-record">
      {{`${item.pluginName} ${item.currProgress} `}}
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
