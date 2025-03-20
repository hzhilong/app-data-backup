<script setup lang="ts">
import AppUtil from '@/utils/app-util.ts'
import { useRoute } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import { RouterUtil } from '@/router/router-util.ts'
import { useAddCartAnimation } from '@/components/animation/AddCartAnimation.ts'
import { ElMenuItem } from 'element-plus'

export interface AppMenuItem {
  text: string
  menuTitle?: string
  iconClass: string
  viewPath: string
  onclick?: () => void
}

const APP_MENUS: AppMenuItem[] = [
  {
    text: '首页',
    iconClass: 'icon-dashboard',
    viewPath: '/dashboard',
  },
  {
    text: '软件管理',
    iconClass: 'icon-app',
    viewPath: '/soft',
  },
  {
    text: '配置仓库',
    iconClass: 'icon-app',
    viewPath: '/plugins',
  },
  {
    text: '我的配置',
    iconClass: 'icon-app',
    viewPath: '/my-plugins',
  },
  {
    text: '备份记录',
    iconClass: 'icon-app',
    viewPath: '/backup-records',
  },
  {
    text: '数据还原',
    iconClass: 'icon-app',
    viewPath: '/res',
  },
  {
    text: '任务进度',
    iconClass: 'icon-setting',
    viewPath: '/settings2',
  },
  {
    text: '设置',
    iconClass: 'icon-setting',
    viewPath: '/settings',
  },
  {
    text: '关于',
    iconClass: 'icon-about',
    viewPath: '/about',
  },
  {
    text: '退出',
    iconClass: 'icon-exit',
    viewPath: '/exit',
    onclick: () => {
      AppUtil.exitApp()
    },
  },
]
const route = useRoute()
const refMenus = ref<(typeof ElMenuItem)[]>([])
const menus = ref(APP_MENUS)
// 根据路由判断默认显示的菜单下标
const defaultMenuIndex = computed(() => {
  // 当前页面所属菜单
  const matchedItem = menus.value.find((item: AppMenuItem) => item.viewPath === route.path)
  return matchedItem ? matchedItem.viewPath : menus.value[0].viewPath
})
const onClickMenu = (menu: AppMenuItem): void => {
  if (menu.onclick) {
    menu.onclick()
  } else {
    RouterUtil.gotoPage(menu.viewPath)
  }
}
const backupRecordIndex = APP_MENUS.findIndex((m) => m.text === '备份记录')
onMounted(() => {
  useAddCartAnimation(refMenus.value[backupRecordIndex].$el)
})
</script>

<template>
  <el-menu class="menus" mode="vertical" :default-active="defaultMenuIndex">
    <el-menu-item
      class="menu"
      :index="menu.viewPath"
      v-for="menu in menus"
      :key="menu.text"
      @click="onClickMenu(menu)"
      ref="refMenus"
    >
      <span class="iconfont" :class="menu.iconClass"></span>
      <span>{{ menu.text }}</span>
    </el-menu-item>
  </el-menu>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/app-menus';
</style>
