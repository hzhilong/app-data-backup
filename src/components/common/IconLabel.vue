<script setup lang="ts">
defineProps<{
  icon: string
}>()
</script>

<template>
  <div class="icon-label">
    <i :class="icon"></i>
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.icon-label {
  display: flex;
  align-items: center;
  > i {
    margin-right: 2px;
  }
}
</style>
