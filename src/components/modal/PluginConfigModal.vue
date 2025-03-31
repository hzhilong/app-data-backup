<script setup lang="ts">
import type { PluginConfigModalOptions } from '@/components/modal/global-modal'

const visible = defineModel({ required: true, type: Boolean })

const props = withDefaults(defineProps<PluginConfigModalOptions>(), {
  title: '提示',
  confirmBtnText: '确定',
  modal: false,
  showCancel: false,
})

const emit = defineEmits<{
  (e: 'close', type: 'confirm' | 'cancel'): void
}>()

const closeModal = (type: 'confirm' | 'cancel') => {
  if (!props.onBeforeClose || props.onBeforeClose()) {
    visible.value = false
    emit('close', type)
  }
}
const handleConfirm = () => closeModal('confirm')
const handleCancel = () => closeModal('cancel')
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="82%"
    :close-on-click-modal="!modal"
    :close-on-press-escape="!modal"
    :show-close="!modal"
  >
    <div class="content-container">
      <div class="plugins">
        <PluginConfig v-for="plugin in plugins" :key="plugin.id" :plugin="plugin"></PluginConfig>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="showCancel" @click="handleCancel" size="small">取消</el-button>
        <el-button type="primary" @click="handleConfirm" size="small">{{ props.confirmBtnText }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/modal/plugin-config-modal';
</style>
