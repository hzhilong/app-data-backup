<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
  desc?: string
  iconClass?: string
}>()
const defaultIconClass = ref('ri-equalizer-2-line')
</script>

<template>
  <div class="setting-item">
    <i class="setting-item__icon" :class="[props.iconClass || defaultIconClass]"></i>
    <div class="setting-item__content">
      <div class="setting-item__content__title">{{ props.title }}</div>
      <div class="setting-item__content__desc" v-if="props.desc">{{ props.desc }}</div>
    </div>
    <div class="setting-item__options">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/global' as *;

.setting-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  box-sizing: border-box;
  user-select: none;
  gap: 10px;
  line-height: 1.4;

  @include card-tech-style;

  &__icon {
    font-size: 20px;
    margin-right: 10px;
    color: var(--el-text-color-regular);
  }

  &__content {
    flex-grow: 1;
    min-width: 0;

    &__title {
      font-size: 16px;
      color: var(--el-text-color-primary);
    }

    &__desc {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  &__options {
    font-size: 16px;
    display: flex;
    align-items: center;
  }
}
</style>
