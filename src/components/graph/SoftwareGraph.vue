<script setup lang="tsx">
import { type CSSProperties, onMounted, ref, watch } from 'vue'
import { type InstalledSoftware, SOFTWARE_REGEDIT_GROUP } from '@/models/Software.ts'

const props = defineProps<{
  softwareList?: InstalledSoftware[]
}>()
const softGraph = ref<HTMLElement | null>(null)
const softIcons = ref<{ data: InstalledSoftware; style: CSSProperties }[]>([])

// 线性缩放
const getLinearScaleSize = (list: number[], defaultMinSize: number, defaultMaxSize: number) => {
  const maxSize = Math.max(...list)
  return list.map((size) => Math.max(defaultMinSize, (size * defaultMaxSize) / maxSize))
}
// 对数缩放
const getLogarithmScaleSize = (validSizes: number[], defaultMinSize: number, defaultMaxSize: number) => {
  const logSizes = validSizes.map((size) => Math.log10(size + 1)) // +1 避免size=0时出现-Infinity
  const maxLogSize = Math.max(...logSizes)
  return logSizes.map((logSize) => {
    return defaultMinSize + (logSize / maxLogSize) * (defaultMaxSize - defaultMinSize)
  })
}
// 平均分布
const getAverageDistributionSize = (validSizes: number[], defaultMinSize: number, defaultMaxSize: number) => {
  return validSizes.map(
    (item, i) => defaultMaxSize - ((defaultMaxSize - defaultMinSize) * i) / Math.max(validSizes.length - 1, 1),
  )
}

const refreshGraph = () => {
  if (!softGraph.value || !props.softwareList || props.softwareList.length < 1) return
  const containerWidth = softGraph.value.clientWidth
  const containerHeight = softGraph.value.clientHeight

  const iconSoftList = props.softwareList.filter((soft) => soft.base64Icon !== undefined)
  const list: InstalledSoftware[] = Object.assign(
    [],
    // 从大到小
    iconSoftList.sort((a, b) => (b.size ?? 0) - (a.size ?? 0)),
  )
  const sizeList = list.map((item) => item.size ?? 0)
  const cutOffSize = 1024 * 500
  const cutOffIndex = sizeList.findIndex((size) => size <= cutOffSize)
  let newSizeList: number[]
  if (cutOffIndex < 0) {
    newSizeList = getLinearScaleSize(sizeList, 40, 120)
  } else {
    // 大区间用平均分布
    const bigItems = sizeList.slice(0, cutOffIndex)
    const bigSizes = getAverageDistributionSize(bigItems, 80, 140)
    // 小区间用对数缩放
    const smallItems = sizeList.slice(cutOffIndex)
    const smallSizes = getLogarithmScaleSize(smallItems, 40, 80)
    newSizeList = [...bigSizes, ...smallSizes]
  }

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
      const scaledRadii = newSizeList.map((r) => r * scale)

      // 按半径从大到小排序的索引
      const indices = scaledRadii.map((_, i) => i)

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
    softIcons.value.length = 0
    for (const { x, y, radius, data } of circles) {
      softIcons.value.push({
        data: data,
        style: {
          left: `${x - radius}px`,
          top: `${y - radius}px`,
          width: `${radius * 2}px`,
          height: `${radius * 2}px`,
          backgroundImage: `url(${data.base64Icon})`,
        },
      })
    }
  }

  placeIcons()
}

// 初始化逻辑
onMounted(() => {
  refreshGraph()
})

// 监听父组件传递的 props 变化
watch(
  () => props.softwareList,
  (newValue) => {
    refreshGraph()
  },
)

window.onresize = () => {
  return (() => {
    refreshGraph()
  })()
}
</script>

<template>
  <div class="soft-graph" ref="softGraph">
    <el-tooltip v-for="item in softIcons" placement="top-start" effect="light">
      <template #content>
        <div>{{ item.data.nameWithoutVersion }}</div>
        <div>{{ item.data.formatSize }}</div>
        <div>{{ item.data.regeditGroupKey ? SOFTWARE_REGEDIT_GROUP[item.data.regeditGroupKey].title : '-' }}</div>
      </template>
      <div class="soft-icon" :style="item.style"></div>
    </el-tooltip>
  </div>
</template>

<style scoped lang="scss">
@use '/src/assets/scss/global' as *;

.soft-graph {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  position: relative;

  :deep(.soft-icon) {
    position: absolute;
    border-radius: 50%;
    border: 2px solid $app-color-bg-hover;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: 68%;
    background-color: #fff;
    transition: transform 0.3s ease-in 0s;

    &:hover {
      z-index: 1;
      transform: scale(1.2);
      border-color: transparent;
      box-shadow: 0 0 4px #808080;
    }
  }
}
</style>
