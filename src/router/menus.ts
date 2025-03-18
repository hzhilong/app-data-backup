import AppUtil from '@/utils/app-util.ts'
import type { Ref } from 'vue'

export interface MenuItem {
  text: string
  menuTitle?: string
  iconClass: string
  viewPath: string
  onclick?: () => void
}

export function getMenus():MenuItem[] {
  return [
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
}
