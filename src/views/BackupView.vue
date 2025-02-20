<template>
  <div v-loading.fullscreen.lock="fullscreenLoading" element-loading-text="正在获取已安卓的软件列表，请稍候...">{{ test }}</div>
</template>

<script lang="ts">
import RegeditUtil from '@/utils/regedit-util.ts'

export default {
  data() {
    return {
      test: '备份页面',
      fullscreenLoading: false,
    }
  },
  mounted() {
    this.fullscreenLoading = true
    RegeditUtil.initAllInstalledSoftware().finally(() => {
      this.fullscreenLoading = false
    })
  },
}
</script>

<style scoped lang="scss"></style>
