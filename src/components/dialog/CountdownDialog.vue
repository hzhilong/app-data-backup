<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

/**
 * 倒计时弹窗
 */
interface CountdownDialogProps {
  content: string
  // 倒计时，单位 秒
  countdown: number
  // 标题，默认'提示'
  title?: string
  // 确认按钮的文本，默认'确定'
  confirmBtnText?: string
  // 取消按钮的文本，默认'取消'
  cancelBtnText?: string
  // 宽度，默认500
  width?: number
}

const props = withDefaults(defineProps<CountdownDialogProps>(), {
  title: '提示',
  confirmBtnText: '确定',
  cancelBtnText: '取消',
  width: 500,
})

const visible = defineModel<boolean>({ required: true })
const countdown = ref(props.countdown)

const emit = defineEmits(['onConfirm', 'onCancel'])

// 计时器
let interval: ReturnType<typeof setInterval> | null = null
// 是否准备关闭
let isPrepareClose = false

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const closeDialog = (type: 'confirm' | 'cancel') => {
  // 防止倒计时快结束的时候点击按钮重复触发
  if (isPrepareClose) return
  // 标记对话框准备关闭
  isPrepareClose = true
  if (interval) {
    clearInterval(interval)
    interval = null
  }
  visible.value = false
  emit(type === 'confirm' ? 'onConfirm' : 'onCancel', type)
}

const handleConfirm = () => closeDialog('confirm')
const handleCancel = () => closeDialog('cancel')

// 倒计时开始
const startCountdown = () => {
  countdown.value = props.countdown
  isPrepareClose = false
  interval = setInterval(() => {
    if (countdown.value > 1) {
      countdown.value -= 1
    } else {
      // 倒计时结束
      handleCancel()
    }
  }, 1000)
}
// 主动开始倒计时
const show = () => {
  // 重置倒计时状态
  visible.value = true
  startCountdown()
}
// 弹窗展示时自动开始倒计时
watch(visible, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    startCountdown()
  }
})

defineExpose({ show })
</script>

<template>
  <!-- 只留一个右上角的关闭按钮 -->
  <el-dialog
    v-model="visible"
    :title="props.title"
    :width="props.width"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleCancel"
    :append-to-body="true"
  >
    <div>{{ props.content }}</div>
    <div>{{ countdown }}秒后自动取消</div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">{{ props.cancelBtnText }}({{ countdown }}s)</el-button>
        <el-button type="primary" @click="handleConfirm">{{ props.confirmBtnText }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/dialog/countdown-dialog';
</style>
