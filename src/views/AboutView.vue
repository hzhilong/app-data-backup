<script setup lang="ts">
import { computed, type Ref, ref } from 'vue'
import AppUtil from '@/utils/app-util'
import ThemeUtil, { type AppThemeMode } from '@/utils/theme-util'
import { useAppThemeStore } from '@/stores/app-theme'
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

const themeToggleMap: Record<AppThemeMode, AppThemeMode> = {
  dark: 'light',
  light: 'dark',
  system: 'light',
}

const newThemeMode: Ref<AppThemeMode> = computed(() => {
  return themeToggleMap[themeMode.value] || 'light'
})
</script>

<template>
  <div class="page-container__single-child">
    <div class="about">
      <div class="about__app-logo" @click="ThemeUtil.switchDefaultTheme()"></div>
      <div class="about__app-title" @click="ThemeUtil.toggleThemeMode(newThemeMode)">{{ appTitle }}</div>
      <div class="about__info-list">
        <div class="about__info-list__item">
          <span class="about__info-list__item__title">版本：</span>
          <span class="about__info-list__item__desc">{{ appVersion }}</span>
        </div>
        <div class="about__info-list__item">
          <span class="about__info-list__item__title">描述：</span>
          <span class="about__info-list__item__desc">{{ env.APP_DESCRIPTION }}</span>
        </div>
        <div class="about__info-list__item">
          <span class="about__info-list__item__title">作者：</span>
          <span class="about__info-list__item__desc">{{ env.APP_AUTHOR_NAME }}</span>
        </div>
        <div class="about__info-list__item">
          <span class="about__info-list__item__title">邮箱：</span>
          <span class="about__info-list__item__desc">{{ env.APP_AUTHOR_EMAIL }}</span>
        </div>
        <div class="about__info-list__item">
          <span class="about__info-list__item__title">开源：</span>
          <span class="about__info-list__item__desc url" @click.prevent="AppUtil.browsePage(env.APP_AUTHOR_URL)">{{
            env.APP_AUTHOR_URL
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/about';
</style>
