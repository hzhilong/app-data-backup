<script setup lang="tsx">
import { RouterView } from 'vue-router'
import { ref } from 'vue'
import AppUtil from '@/utils/app-util'
import { AppSessionStore } from '@/stores/app-session'
import AppMenu from '@/components/AppMenu.vue'

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
  <div class="home">
    <div class="home__left">
      <div class="home__left__app-title">
        <div class="home__left__app-title__logo"></div>
        {{ appTitle }}
      </div>
      <AppMenu></AppMenu>
    </div>
    <div class="home__right">
      <div class="home__top-bar">
        <div class="window-options">
          <span class="window-options__item icon-minimize" @click="AppUtil.minApp()" />
          <span
            class="window-options__item"
            :class="windowMax ? 'icon-cancel-maximize' : 'icon-maximize'"
            @click="switchWindowMax"
          ></span>
          <span class="window-options__item icon-close" @click="AppUtil.exitApp()"></span>
        </div>
      </div>
      <div class="home__content-border">
        <div class="home__content">
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
