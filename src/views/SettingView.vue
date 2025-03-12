<script setup lang="ts">
import { onMounted } from 'vue'
import { IPC_CHANNELS } from '@/models/IpcChannels'
import { execPlugin } from '@/plugins/plugins-util'

onMounted(async () => {
})

function test1() {
}
</script>

<template>
  <div>
    <el-button @click="test1">测试</el-button>
  </div>
</template>

<style scoped lang="scss"></style>
