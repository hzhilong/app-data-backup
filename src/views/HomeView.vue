<script setup lang="tsx">
import { RouterView } from 'vue-router'
import { ref } from 'vue'
import AppUtil from '@/utils/app-util'
import { AppSessionStore } from '@/stores/app-session'
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
          <div class="btn icon-minimize" @click="AppUtil.minApp()"/>
          <div
            class="btn"
            :class="windowMax ? 'icon-cancel-maximize' : 'icon-maximize'"
            @click="switchWindowMax"
          ></div>
          <div class="btn icon-close" @click="AppUtil.exitApp()"></div>
        </div>
      </div>
      <div class="page-wrapper">
        <router-view v-slot="{ Component }">
          <keep-alive exclude="SettingView">
            <component :is="Component" class="page"/>
          </keep-alive>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/home';
</style>
