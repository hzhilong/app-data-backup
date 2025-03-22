import router from '@/router/index'
import { logger } from '@/utils/logger'
import { type SoftwareQueryParams } from '@/table/installed-software-table'
import { type PluginConfigQueryParams } from '@/table/plugin-config-table'
import type { MyPluginConfigQueryParams } from '@/table/my-plugin-config-table'
import { type RouteLocationNormalized, type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router'
import { watch } from 'vue'

export class RouterUtil {
  // 跳转页面。如果需要自动根据参数判断是否刷新表格数据请传query，传{}也行
  static gotoPage(path: string, query?: Record<string, any>): any {
    logger.debug('gotoPage', path, query)
    if (query) {
      return router.push({
        path: path,
        query: query,
      })
    } else {
      query = {
        __refresh: false,
      }
      return router.push({
        path: path,
        query: query,
      })
    }
  }

  static gotoSoft(query?: SoftwareQueryParams): any {
    return this.gotoPage('/soft', query)
  }

  static gotoPluginConfig(query?: PluginConfigQueryParams): any {
    return this.gotoPage('/plugins', query)
  }

  static gotoMyPluginConfig(query?: MyPluginConfigQueryParams): any {
    return this.gotoPage('/my-plugins', query)
  }

  static gotoBackupTasks(): any {
    return this.gotoPage('/backup-tasks')
  }

  /**
   * 当前组件路由更新时的监听
   * @param updateFn
   */
  static onCurrRouteUpdate(
    updateFn: (route: RouteLocationNormalizedLoaded<string | symbol> | RouteLocationNormalized) => void,
  ) {
    const router = useRouter()
    const route = useRoute()
    const currRoutePath = route.path
    watch(
      () => router.currentRoute.value.path,
      async (query) => {
        if (router.currentRoute.value.path === currRoutePath) {
          logger.debug(`[onCurrRouteUpdate] 当前组件路由变化`, currRoutePath, router.currentRoute.value.query)
          updateFn(router.currentRoute.value)
        }
      },
    )
  }
}
