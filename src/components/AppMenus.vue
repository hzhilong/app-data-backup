<script setup lang="ts">
import AppUtil from '@/utils/app-util'
import { useRoute } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import { RouterUtil } from '@/router/router-util'
import { ElMenuItem } from 'element-plus'
import { useStartTaskAnimation } from '@/components/animation/task-animation'

export interface AppMenuItem {
  text: string
  menuTitle?: string
  icon: string
  viewPath: string
  onclick?: () => void
}

const APP_MENUS: AppMenuItem[] = [
  {
    text: '首页',
    icon: 'dashboard-3-line',
    viewPath: '/dashboard',
  },
  {
    text: '软件管理',
    icon: 'apps-line',
    viewPath: '/soft',
  },
  {
    text: '配置仓库',
    icon: 'database-2-line',
    viewPath: '/plugins',
  },
  {
    text: '我的配置',
    icon: 'user-settings-line',
    viewPath: '/my-plugins',
  },
  {
    text: '备份任务',
    icon: 'dashboard-line',
    viewPath: '/backup-tasks',
  },
  {
    text: '还原任务',
    icon: 'dashboard-horizontal-line',
    viewPath: '/restore-tasks',
  },
  {
    text: '设置',
    icon: 'settings-3-line',
    viewPath: '/settings',
  },
  {
    text: '关于',
    icon: 'information-line',
    viewPath: '/about',
  },
  {
    text: '退出',
    icon: 'shut-down-line',
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
const backupRecordIndex = APP_MENUS.findIndex((m) => m.text === '备份任务')
onMounted(() => {
  useStartTaskAnimation(refMenus.value[backupRecordIndex].$el)
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
      <i class="menu-icon" :class="`ri-${menu.icon}`"></i>
      <span>{{ menu.text }}</span>
    </el-menu-item>
  </el-menu>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/app-menus';
</style>
