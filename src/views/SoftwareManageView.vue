<template>
  <div class="test">备份</div>
</template>

<script lang="ts">
import type { InstalledSoftware, SoftwareRegeditGroupKey } from '@/models/Software.ts'
import { db } from '@/db/db.ts'

export default {
  data() {
    return {
      regeditGroupKey: undefined as undefined | SoftwareRegeditGroupKey,
      list: [] as InstalledSoftware[],
    }
  },
  created() {
    this.regeditGroupKey = this.$route.query.regeditGroupKey
  },
  mounted() {},
  methods: {
    refreshData(regeditGroupKey: undefined | SoftwareRegeditGroupKey) {
      db.installedSoftware
        .where(regeditGroupKey ? { regeditGroupKey: regeditGroupKey } : {})
        .toArray()
        .then((data) => {
          this.list = data
        })
    },
  },
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/software-manage';
</style>
