<script setup lang="ts">
import { DEFAULT_PRIMARY_COLORS, useAppThemeStore } from '@/stores/app-theme'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import ThemeUtil from '@/utils/theme-util'
import CountdownDialog from '@/components/dialog/CountdownDialog.vue'

// 保存的主题状态
const appThemeStore = useAppThemeStore()
const { primaryColor } = storeToRefs(appThemeStore)

// 预设的颜色
const predefineColors = ref(DEFAULT_PRIMARY_COLORS)
// 新的主题色
const selectedPrimaryColor = ref(primaryColor.value)
// 旧的主题色
let oldPrimaryColor = ''
// 倒计时可见
const countdownVisible = ref(false)

// 更新主题色
const updatePrimaryColor = () => {
  if (!selectedPrimaryColor.value) return
  // 尝试更新主题
  oldPrimaryColor = primaryColor.value
  ThemeUtil.updatePrimaryColor(selectedPrimaryColor.value)
  // 倒计时提示是否保存
  countdownVisible.value = true
}
const restoreTheme = () => {
  selectedPrimaryColor.value = oldPrimaryColor
  ThemeUtil.updatePrimaryColor(oldPrimaryColor)
}
</script>

<template>
  <el-color-picker v-model="selectedPrimaryColor" @change="updatePrimaryColor" :predefine="predefineColors" />
  <CountdownDialog
    v-model="countdownVisible"
    content="是否保存当前主题？"
    :countdown="10"
    @onCancel="restoreTheme"
  ></CountdownDialog>
</template>

<style scoped lang="scss"></style>
