<template>
  <div>{{ test }}</div>
</template>

<script lang="ts">
import RegeditUtil from '@/utils/regedit-util.ts'

export default {
  data() {
    return {
      test: '备份页面',
    }
  },
  mounted() {
    RegeditUtil.findAllSoftware().then((data) => {
      console.log('view', data)
    })
  },
}
</script>

<style scoped lang="scss"></style>
