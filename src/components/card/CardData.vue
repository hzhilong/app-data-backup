<script setup lang="ts">
import { computed } from 'vue'

/**
 * 卡片数据
 */
interface CardDataProps {
  name: string
  value: unknown
  // 整个卡片的点击事件
  onClick?: () => void
}

const props = defineProps<CardDataProps>()
const emit = defineEmits(['onClick'])

const handleClickData = (e: MouseEvent) => {
  emit('onClick')
  if (props.onClick) {
    props.onClick?.()
    e.stopPropagation()
  }
}
const extendClass = computed(()=>{
  return props.onClick ? 'card__data--clickable' : ''
})
</script>

<template>
  <div class="card__data" @click="handleClickData" :class="extendClass">
    <div class="card__data__key">{{ name }}：</div>
    <div class="card__data__value">{{ value }}</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/global' as *;

.card__data {
  width: 100%;
  white-space: nowrap;
  display: flex;
  align-items: center;
  font-size: 1em;
  color: var(--el-text-color-secondary);
  padding: 2px 4px;
  box-sizing: border-box;

  &--clickable:hover {
    cursor: pointer;
    background: var(--app-color-primary-transparent-10);
  }

  &__key {
  }

  &__value {
  }
}

</style>
