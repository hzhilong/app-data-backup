<script setup lang="ts">
import { useTable } from '@/composables/table/useTable'
import { usePluginConfigTable } from '@/composables/table/usePluginConfigTable'
import { ref } from 'vue'
import AppUtil from '@/utils/app-util'
import PluginUtil from '@/utils/plugin-util'

const { refreshDB: refreshPluginDB } = useTable(usePluginConfigTable(true, false))
const updatingLocalPlugins = ref(false)
const updateLocalPlugins = async () => {
  try {
    updatingLocalPlugins.value = true
    AppUtil.message('更新中...')

    await PluginUtil.updateLocalPlugins()
    AppUtil.message('更新成功...')

    const list = await refreshPluginDB()
    AppUtil.message(`目前已有${list.length}个备份配置`)
  } finally {
    updatingLocalPlugins.value = false
  }
}
</script>

<template>
  <el-button type="primary" @click="updateLocalPlugins()" :loading="updatingLocalPlugins">
    <slot>更新</slot>
  </el-button>
</template>

<style scoped lang="scss"></style>
