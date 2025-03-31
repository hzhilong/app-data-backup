<script setup lang="ts">
/**
 * 数据卡片
 */
interface CardProps {
  // 卡片名称
  name?: string
  // 整个卡片的点击事件
  onClick?: () => void
}

const props = defineProps<CardProps>()
const emit = defineEmits(['onClick'])

const handleClickCard = (e: MouseEvent) => {
  emit('onClick')
  props.onClick?.()
  e.stopPropagation()
}
const style = props.onClick ? { cursor: 'pointer' } : {}
</script>

<template>
  <div class="card" @click="handleClickCard" :style="style">
    <div class="card__name" v-if="name">{{ name }}</div>
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/global' as *;

.card {
  @include card-tech-style;
  display: flex;
  flex-direction: column;
  align-items: start;
  padding: 15px 15px;
  box-sizing: border-box;
  font-size: 1em;

  &__name {
    font-size: 1.1em;
    margin-bottom: 10px;
    color: var(--el-text-color-regular);
  }
}
</style>
