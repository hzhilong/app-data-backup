<script setup lang="ts">
import { db } from '@/db/db'
import AppUtil from '@/utils/app-util'

const clearIconCache = () => {
  db.iconCache.clear().then(() => {
    AppUtil.message('已清空图标缓存')
  })
}
</script>

<template>
  <el-button type="primary" @click="clearIconCache()">
    <slot>清空</slot>
  </el-button>
</template>

<style scoped lang="scss"></style>
