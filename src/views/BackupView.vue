<template>
  <div>{{test}}</div>
</template>

<script lang="ts">
  import RegeditUtil from '@/utils/regedit-util.ts'
  export default {
    data() {
      return {
        test: '备份页面'
      }
    },
    mounted() {
      this.test = window.electronAPI.test()
    }
  }
</script>

<style scoped lang="scss">

</style>
