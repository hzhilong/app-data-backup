<script setup lang="ts">
interface IconButtonProps {
  confirm?: string
  icon: string
  tip: string
}

const props = defineProps<IconButtonProps>()
const emit = defineEmits(['onClick'])

const handleClick = () => {
  emit('onClick')
}
</script>

<template>
  <template v-if="confirm">
    <el-popconfirm :title="confirm" placement="left" @confirm="handleClick">
      <template #reference>
        <i class="icon-btn" :class="icon"></i>
      </template>
    </el-popconfirm>
  </template>
  <template v-else>
    <el-tooltip effect="dark" :content="tip" placement="top">
      <slot name="default">
        <i class="icon-btn" :class="icon" @click="handleClick"></i>
      </slot>
    </el-tooltip>
  </template>
</template>

<style scoped lang="scss"></style>
