<script setup lang="ts">

interface TooltipProps {
  content?: string
  type?: 'ltr' | 'rtl'
  // 图标类名
  iconClass?: string
  contentClass?: string
}

const props = withDefaults(defineProps<TooltipProps>(), {
  type: 'rtl',
})
</script>

<template>
  <div class="tooltip">
    <slot name="label">
      <i v-if="iconClass" :class="iconClass" />
    </slot>
    <template v-if="content">
      <el-tooltip effect="dark" :content="content" placement="top">
        <slot name="default">
          <div v-if="type === 'rtl'" class="tooltip__content txt-reverse-ellipsis" :class="contentClass">
            &lrm;{{ content }}&lrm;
          </div>
          <div v-else class="tooltip__content txt-ellipsis" :class="contentClass">{{ content }}</div>
        </slot>
      </el-tooltip>
    </template>
    <template v-else>
      <slot name="default"></slot>
    </template>
  </div>
</template>

<style scoped lang="scss">
.tooltip {
  min-width: 0;

  > i {
    margin-right: 2px;
  }
}
</style>
