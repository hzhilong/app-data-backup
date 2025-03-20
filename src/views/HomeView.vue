<script setup lang="tsx">
import { RouterView } from 'vue-router'
import { ref } from 'vue'
import AppUtil from '@/utils/app-util.ts'
import { AppSessionStore } from '@/stores/app-session.ts'
import AppMenus from '@/components/AppMenus.vue'

const appTitle = ref(import.meta.env.APP_PRODUCT_NAME as string)

const windowMax = ref(false)
const appSessionStore = AppSessionStore()
const switchWindowMax = () => {
  windowMax.value = !windowMax.value
  appSessionStore.setMaxWindow(windowMax.value)
  AppUtil.maxApp()
}
</script>

<template>
  <div class="home-container">
    <div class="left-side">
      <div class="app-infos">
        <div class="app-title">
          <div class="app-logo"></div>
          {{ appTitle }}
        </div>
      </div>
      <AppMenus></AppMenus>
    </div>
    <div class="right-side">
      <div class="top-bar">

        <div class="top-bar-btn-list">
          <span class="btn iconfont icon-min" @click="AppUtil.minApp()"></span>
          <span class="btn iconfont" :class="windowMax ? 'icon-max2' : 'icon-max'" @click="switchWindowMax"></span>
          <span class="btn iconfont icon-close" @click="AppUtil.exitApp()"></span>
        </div>
      </div>
      <div class="page-wrapper">
        <div class="page">
          <router-view v-slot="{ Component }">
            <keep-alive exclude="SettingView">
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/home';
</style>
