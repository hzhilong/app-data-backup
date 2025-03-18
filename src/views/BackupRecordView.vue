<script setup lang="ts">
import { useBackupRecordsStore } from '@/stores/backup-record.ts'

const {backupRecords} = useBackupRecordsStore()
</script>

<template>
  <div>
    <div v-for="(item,index) in backupRecords" :key="index" class="backup-record">
      {{`${item.pluginName} ${item.currProgress} `}}
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
