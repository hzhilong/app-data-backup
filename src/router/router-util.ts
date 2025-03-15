import router from '@/router/index.ts'
import { logger } from '@/utils/logger.ts'
import { type SoftwareQueryParams } from '@/table/useInstalledSoftwareTable.tsx'
import { type PluginConfigQueryParams } from '@/table/usePluginConfigTable.tsx'

export class RouterUtil {
  static gotoPage(path: string, query: Record<string, any> = {}): any {
    logger.debug('gotoPage', path, query)
    return router.push({
      path: path,
      query: query ?? {},
    })
  }

  static gotoSoft(query: SoftwareQueryParams): any {
    return this.gotoPage('/soft', query)
  }

  static gotoPluginConfig(query: PluginConfigQueryParams): any {
    return this.gotoPage('/plugins', query)
  }
}
