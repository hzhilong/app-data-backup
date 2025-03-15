import { type InstalledSoftware, SOFTWARE_REGEDIT_GROUP } from '@/models/Software.ts'
import { createVNode, render, type VNode } from 'vue'
import { Fragment } from 'vue'

export function initSoftwareGraph(containerId: string, softList: InstalledSoftware[]) {
  const el: HTMLElement = document.getElementById(containerId) as HTMLElement
  if (!el) return null
  const containerWidth = el.clientWidth
  const containerHeight = el.clientHeight

  const iconSoftList = softList.filter((soft) => soft.base64Icon !== undefined)
  const list: InstalledSoftware[] = Object.assign([], iconSoftList)

  const [defaultMinSize, defaultMaxSize] = [40, 120]
  const maxSize = Math.max(...list.map((soft) => (soft.size ? soft.size : defaultMinSize)))

  const sizeList = list.map((item) => Math.max(defaultMinSize, (item.size * defaultMaxSize) / maxSize))

  // 放置图标
  const placeIcons = () => {
    // 缩放系数
    let scale = 1
    // 最小缩放系数
    const minScale = 0.1
    // 每次缩放的比例
    const scaleFactor = 0.9
    // 每个项最多重置次数
    const maxAttempts = 100
    // 最小间距
    const minSpacing = 6

    // 开始计算
    while (scale >= minScale) {
      // 缩放后的数据
      const scaledRadii = sizeList.map((r) => r * scale)

      // 按半径从大到小排序的索引
      const indices = scaledRadii.map((_, i) => i).sort((a, b) => scaledRadii[b] - scaledRadii[a])

      const circles = []
      let allPlaced = true

      // 从大圆开始尝试
      for (const i of indices) {
        const radius = scaledRadii[i]
        let placed = false

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const x = radius + Math.random() * (containerWidth - 2 * radius)
          const y = radius + Math.random() * (containerHeight - 2 * radius)

          // 碰撞检测
          let hasCollision = false
          for (const circle of circles) {
            const dx = x - circle.x
            const dy = y - circle.y
            const minDistance = radius + circle.radius + minSpacing
            if (dx * dx + dy * dy < minDistance * minDistance) {
              hasCollision = true
              break
            }
          }

          if (!hasCollision) {
            circles.push({ x, y, radius, data: list[i] })
            placed = true
            break
          }
        }

        if (!placed) {
          allPlaced = false
          break
        }
      }

      if (allPlaced) {
        drawCircles(circles)
        return
      }

      // 缩小比例继续尝试
      scale *= scaleFactor
    }
  }

  function drawCircles(circles: { x: number; y: number; radius: number; data: InstalledSoftware }[]) {
    const icons: VNode[] = []
    for (const { x, y, radius, data } of circles) {
      const div = (
        <el-tooltip
          class="soft-icon"
          placement="top"
          style={{
            left: `${x - radius}px`,
            top: `${y - radius}px`,
            width: `${radius * 2}px`,
            height: `${radius * 2}px`,
            backgroundImage: `url(${data.base64Icon})`,
          }}
          v-slots={{
            content: () => (
              <>
                <div>{data.nameWithoutVersion}</div>
                <div>{data.formatSize}</div>
                <div>{data.regeditGroupKey ? SOFTWARE_REGEDIT_GROUP[data.regeditGroupKey].title : '-'}</div>
              </>
            ),
          }}
        >
        </el-tooltip>
      )
      // icons.push(div)
      render(createVNode(()=>{
        return div
      }), el)
    }
    // render(createVNode(Fragment, null, icons), el)
  }

  placeIcons()
}
