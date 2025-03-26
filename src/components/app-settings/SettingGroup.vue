<script setup lang="ts">
const props = defineProps<{
  name: string
}>()
</script>

<template>
  <div class="setting-group">
    <div class="group-name">{{ props.name}}</div>
    <div class="setting-list">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/app-settings/setting-group';
</style>
