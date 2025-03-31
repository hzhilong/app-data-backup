<script setup lang="ts">
import { useAppThemeStore } from '@/stores/app-theme'
import { storeToRefs } from 'pinia'
import ThemeUtil from '@/utils/theme-util'

const appThemeStore = useAppThemeStore()
const { themeMode } = storeToRefs(appThemeStore)

const toggleTheme = () => {
  ThemeUtil.toggleThemeMode(themeMode.value)
}
</script>

<template>
  <el-radio-group v-model="themeMode" @change="toggleTheme">
    <el-radio-button label="浅色" value="light" />
    <el-radio-button label="深色" value="dark" />
    <el-radio-button label="系统" value="system" />
  </el-radio-group>
</template>

<style scoped lang="scss"></style>
