import router from '@/router/index'
import { logger } from '@/utils/logger'
import { type SoftwareQueryParams } from '@/table/installed-software-table'
import { type PluginConfigQueryParams } from '@/table/plugin-config-table'
import type { MyPluginConfigQueryParams } from '@/table/my-plugin-config-table'

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
}
