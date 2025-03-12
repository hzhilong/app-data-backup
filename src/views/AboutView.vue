<script setup lang="ts">
import { computed, ref } from 'vue'
import { ThemeColorStore } from '@/stores/theme-color.ts'
import AppUtil from '@/utils/app-util.ts'

const appTitle = ref(import.meta.env.APP_PRODUCT_NAME)
const env = ref(import.meta.env)

const appVersion = computed(() => {
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.APP_VERSION
  } else {
    return `${import.meta.env.APP_VERSION} ${import.meta.env.MODE}`
  }
})

const { switchThemeColor, setDefaultTheme } = ThemeColorStore()
</script>

<template>
  <div class="about">
    <div class="app-logo" @click="switchThemeColor"></div>
    <div class="app-title" @click="setDefaultTheme">{{ appTitle }}</div>
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
          <a href="" @click.prevent="AppUtil.browsePage(env.APP_AUTHOR_URL)">{{ env.APP_AUTHOR_URL }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/about';
</style>
