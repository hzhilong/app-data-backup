<script setup lang="tsx">
import { RouterView } from 'vue-router'
import { onMounted, ref } from 'vue'
import { useAppMenus } from '@/router/menus.ts'
import AppUtil from '@/utils/app-util.ts'
import { AppSessionStore } from '@/stores/app-session.ts'
import { useAppSettingsStore } from '@/stores/app-settings.ts'
import { IPC_CHANNELS } from '@/models/IpcChannels.ts'
import { storeToRefs } from 'pinia'
import { BuResult } from '@/models/BuResult.ts'
import { logger } from '@/utils/logger.ts'
import { ElMenuItem } from 'element-plus'

const appTitle = ref(import.meta.env.APP_PRODUCT_NAME as string)
const { menus, onClickMenu, defaultMenuIndex, setMenuItemRef } = useAppMenus()

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
      <el-menu class="menus" mode="vertical" :default-active="defaultMenuIndex">
        <el-menu-item
          class="menu"
          :index="menu.viewPath"
          v-for="menu in menus"
          :key="menu.text"
          @click="onClickMenu(menu)"
          :ref="(el) => setMenuItemRef(el, menu)"
        >
          <span class="iconfont" :class="menu.iconClass"></span>
          <span>{{ menu.text }}</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="right-side">
      <div class="top-bar">
        <div class="top-bar-btns">
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
