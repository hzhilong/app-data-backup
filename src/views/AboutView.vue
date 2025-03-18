<script setup lang="ts">
import { computed, type Ref, ref } from 'vue'
import AppUtil from '@/utils/app-util.ts'
import ThemeUtil, { type AppThemeMode } from '@/utils/theme-util.ts'
import { useAppThemeStore } from '@/stores/app-theme.ts'
import { storeToRefs } from 'pinia'

const appTitle = ref(import.meta.env.APP_PRODUCT_NAME)
const env = ref(import.meta.env)

const appVersion = computed(() => {
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.APP_VERSION
  } else {
    return `${import.meta.env.APP_VERSION} ${import.meta.env.MODE}`
  }
})

const { themeMode } = storeToRefs(useAppThemeStore())

const newThemeMode: Ref<AppThemeMode> = computed(() => {
  if (themeMode.value === 'dark') {
    return 'light'
  } else if (themeMode.value === 'light') {
    return 'dark'
  } else if (themeMode.value === 'system') {
    return 'system'
  }else {
    return 'light'
  }
})
</script>

<template>
  <div class="page-content about">
    <div class="app-logo" @click="ThemeUtil.switchDefaultTheme()"></div>
    <div class="app-title" @click="ThemeUtil.toggleDarkTheme(newThemeMode)">{{ appTitle }}</div>
    <div class="infos">
      <div class="info">
        <span class="title">版本：</span>
        <span class="desc">{{ appVersion }}</span>
      </div>
      <div class="info">
        <span class="title">描述：</span>
        <span class="desc">{{ env.APP_DESCRIPTION }}</span>
      </div>
      <div class="info">
        <span class="title">作者：</span>
        <span class="desc">{{ env.APP_AUTHOR_NAME }}</span>
      </div>
      <div class="info">
        <span class="title">邮箱：</span>
        <span class="desc">{{ env.APP_AUTHOR_EMAIL }}</span>
      </div>
      <div class="info">
        <div class="title">开源：</div>
        <div class="desc">
          <div class="url" @click.prevent="AppUtil.browsePage(env.APP_AUTHOR_URL)">{{ env.APP_AUTHOR_URL }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/about';
</style>
