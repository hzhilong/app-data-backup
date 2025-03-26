import { h } from 'vue'
import type { OptionButton, Tag } from '@/types/Table'

export default class TableUtil {
  /**
   * 创建操作按钮
   */
  static createOptions<T>(row: T, list: OptionButton<T>[]) {
    return (
      <div class="table-option-list">
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
                  reference: () => <span class="table-option-btn">{item.text}</span>,
                }}
              ></el-popconfirm>
            )
          } else {
            return (
              <span
                class="table-option-btn"
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
        <div class="table-tag-list">
          {tags.map((tag) => {
            return <el-tag type="primary">{tag}</el-tag>
          })}
        </div>
      )
    } else {
      return (
        <div class="table-tag-list">
          {tags.map((tag) => {
            return (
              <el-tag
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
}
