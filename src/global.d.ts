export {}
import { Route, Router } from 'vue-router'
import AppUtil from '@/utils/app-util.ts'

// 对vue进行类型补充说明
declare module 'vue' {
  interface ComponentCustomOptions {
    beforeRouteEnter?(to: Route, from: Route, next: () => void): void
  }

  interface ComponentCustomProperties {
    $route: Route
    $router: Router
    $appUtil: AppUtil
  }
}

// 全局类型
declare global {
  // 软件信息
  interface Software {
    name: string
    installPath: string
  }
}
