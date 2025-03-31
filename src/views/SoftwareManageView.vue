<script setup lang="ts">
import { useInstalledSoftwareTable } from '@/composables/table/useInstalledSoftwareTable'
import { type InstalledSoftware } from '@/types/Software'
import { type Ref, ref } from 'vue'
import type { TablePageWithConfigProps } from '@/types/Table'
import TableUtil from '@/utils/table-util'
import TablePageWithConfig from '@/components/table/TablePageWithConfig.vue'

const loading = ref(false)
const currentData: Ref<InstalledSoftware | undefined> = ref(undefined)
const table = TableUtil.getTablePageWithConfig<InstalledSoftware>('tableRef')
const config = {
  tableConfig: useInstalledSoftwareTable(),
  onCurrentChange: (curr: InstalledSoftware) => {
    currentData.value = curr
  },
  onAfterTableRefresh: (data) => {
    if (data.length === 1) {
      table.value?.setCurrentRow(data[0])
    }
  },
} satisfies TablePageWithConfigProps<InstalledSoftware, 'regeditDir'>
</script>

<template>
  <div class="page-container">
    <TablePageWithConfig
      class="table-page"
      ref="tableRef"
      v-bind="config"
      v-model:loading="loading"
    ></TablePageWithConfig>
    <SoftwareInfo v-show="currentData" :soft="currentData" type="double column" />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/software-manage';
</style>
