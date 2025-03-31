<script setup lang="ts">
import AppUtil from '@/utils/app-util'
import { useRoute, useRouter } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterUtil } from '@/utils/router-util'
import { ElMenuItem } from 'element-plus'
import { useStartTaskAnimation } from '@/components/animation/task-animation'
import { useAppSettingsStore } from '@/stores/app-settings'
import { useAppThemeStore } from '@/stores/app-theme'
import { logger } from '@/utils/logger-util'

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
    icon: 'dashboard-3',
    viewPath: '/dashboard',
  },
  {
    text: '软件管理',
    icon: 'apps',
    viewPath: '/soft',
  },
  {
    text: '配置仓库',
    icon: 'database-2',
    viewPath: '/plugins',
  },
  {
    text: '我的配置',
    icon: 'user-settings',
    viewPath: '/my-plugins',
  },
  {
    text: '备份任务',
    icon: 'dashboard',
    viewPath: '/backup-tasks',
  },
  {
    text: '还原任务',
    icon: 'dashboard-horizontal',
    viewPath: '/restore-tasks',
  },
  /*  {
      text: '备份计划',
      icon: 'dashboard',
      viewPath: '/backup-tasks2',
    },*/
  {
    text: '设置',
    icon: 'settings-3',
    viewPath: '/settings',
  },
  {
    text: '关于',
    icon: 'information',
    viewPath: '/about',
  },
  {
    text: '退出',
    icon: 'shut-down',
    viewPath: '/exit',
    onclick: () => {
      AppUtil.exitApp()
    },
  },
]
const router = useRouter()
const route = useRoute()
const menus = ref(APP_MENUS)
const menuIndex = ref(APP_MENUS.findIndex((item) => item.viewPath === route.path) ?? 0)

const onClickMenu = (index: number): void => {
  const menu: AppMenuItem = APP_MENUS[index]
  menuIndex.value = index
  if (menu.onclick) {
    menu.onclick()
  } else {
    RouterUtil.gotoPage(menu.viewPath)
  }
}
const backupRecordIndex = APP_MENUS.findIndex((m) => m.text === '备份任务')
const menuRefs = ref<HTMLElement[]>([])
onMounted(() => {
  useStartTaskAnimation(menuRefs.value[backupRecordIndex])
})
const theme = useAppThemeStore()
const getIcon = (menu: AppMenuItem) => {
  if (theme.dark) {
    return `ri-${menu.icon}-line`
  }
  return `ri-${menu.icon}-fill`
}
watch(
  () => router.currentRoute.value.path,
  async () => {
    const index = APP_MENUS.findIndex((m) => m.viewPath === router.currentRoute.value.path)
    if (index !== -1) {
      menuIndex.value = index
    }
  },
)
</script>

<template>
  <div class="menu">
    <div
      ref="menuRefs"
      class="menu__item"
      v-for="(menu, index) in menus"
      :key="menu.viewPath"
      :class="index === menuIndex ? 'menu__item--active' : ''"
      @click="onClickMenu(index)"
    >
      <i class="menu__item__icon" :class="getIcon(menu)"></i>
      <span class="menu__item__text">{{ menu.text }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/app-menu';
</style>
