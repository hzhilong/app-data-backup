<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import { computed, type Ref, ref } from 'vue'
import { getMenus, type MenuItem } from '@/router/menus.ts'
import { ThemeColorStore } from '@/stores/theme-color.ts'
import AppUtil from '@/utils/app-util.ts'

const route = useRoute()
const router = useRouter()

const windowMax = ref(false)
const appTitle = ref(import.meta.env.APP_PRODUCT_NAME as string)
const menus = ref(getMenus())

const defaultMenuIndex = computed(() => {
  // 当前页面所属菜单
  const matchedItem = menus.value.find((item: MenuItem) => item.viewPath === route.path)
  return matchedItem ? matchedItem.viewPath : menus.value[0].viewPath
})

const onClickMenu = (menu: MenuItem): void => {
  if (menu.onclick) {
    menu.onclick()
  } else {
    router.push({
      path: menu.viewPath,
    })
  }
}

ThemeColorStore().initThemeColor()
</script>

<template>
  <el-container class="app-container">
    <el-aside class="left-side">
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
        >
          <span class="iconfont" :class="menu.iconClass"></span>
          <span>{{ menu.text }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container class="right-side">
      <div class="top-bar">
        <div class="top-bar-btns">
          <span class="btn iconfont icon-min" @click="AppUtil.minApp()"></span>
          <span
            class="btn iconfont"
            :class="windowMax ? 'icon-max2' : 'icon-max'"
            @click="
              () => {
                windowMax = !windowMax
                AppUtil.maxApp()
              }
            "
          ></span>
          <span class="btn iconfont icon-close" @click="AppUtil.exitApp()"></span>
        </div>
      </div>
      <el-main class="content-wrapper">
        <div class="content">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
@use '@/assets/scss/home';
</style>
