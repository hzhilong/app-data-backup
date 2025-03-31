import { h, useTemplateRef } from 'vue'
import type { OptionButton, Tag } from '@/types/Table'
import type { ComponentExposed } from 'vue-component-type-helpers'
import TablePageWithConfig from '@/components/table/TablePageWithConfig.vue'
import type { MyPluginConfig } from '@/types/PluginConfig'
import type TablePage from '@/components/table/TablePage.vue'

export default class TableUtil {
  /**
   * 创建操作按钮
   */
  static createOptions<T>(row: T, list: OptionButton<T>[]) {
    return (
      <div class="cell-options">
        {list.map((item) => {
          if (item.confirmContent) {
            return (
              <el-popconfirm
                title={item.confirmContent(row)}
                confirmButtonText="Yes"
                cancelButtonText="No"
                hideIcon
                onConfirm={(e: MouseEvent) => {
                  item.onClick(row, e)
                }}
                v-slots={{
                  reference: () => <span class="cell-options__item">{item.text}</span>,
                }}
              ></el-popconfirm>
            )
          } else {
            return (
              <span
                class="cell-options__item"
                onClick={(e) => {
                  item.onClick(row, e)
                }}
              >
                {item.text}
              </span>
            )
          }
        })}
      </div>
    )
  }

  /**
   * 创建标签
   */
  static createTags<T>(row: T, tags: Tag<T>[] | string[] | undefined, color?: string) {
    if (!tags) {
      return <></>
    }
    if (tags.every((tag) => typeof tag === 'string')) {
      return (
        <div class="cell-tags">
          {tags.map((tag) => {
            return (
              <el-tag class="cell-tags__item" type="primary">
                {tag}
              </el-tag>
            )
          })}
        </div>
      )
    } else {
      return (
        <div class="cell-tags">
          {tags.map((tag) => {
            return (
              <el-tag
                class="cell-tags__item"
                type="primary"
                disable-transitions
                style={{ cursor: tag.onClick ? 'pointer' : 'unset' }}
                onClick={(e: MouseEvent) => {
                  if (tag.onClick) {
                    tag.onClick(row, e)
                  }
                }}
              >
                {tag.text}
              </el-tag>
            )
          })}
        </div>
      )
    }
  }

  static getTablePage<T>(refName: string) {
    return useTemplateRef<ComponentExposed<typeof TablePage<T>>>(refName)
  }

  static getTablePageWithConfig<T>(refName: string) {
    return useTemplateRef<ComponentExposed<typeof TablePageWithConfig<T>>>(refName)
  }
}
