<script setup lang="ts">
const props = defineProps<{
  title: string
  desc?: string
  iconClass?: string
}>()
</script>

<template>
  <div class="setting-item">
    <i class="item-icon" :class="props.iconClass ? props.iconClass : 'ri-equalizer-2-line'"></i>
    <div class="item-content">
      <div class="item-title">{{ props.title }}</div>
      <div class="item-desc" v-if="props.desc">{{ props.desc }}</div>
    </div>
    <div class="options">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/app-settings/setting-item';
</style>
