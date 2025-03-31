<script setup lang="ts" generic="T, TKeyPropName extends keyof T = never">
/* 表格页面（使用TableConfig配置） */
import type { TablePageWithConfigProps } from '@/types/Table'
import { useTable } from '@/composables/table/useTable'
import TableUtil from '@/utils/table-util'

const table = TableUtil.getTablePage<T>('tableRef')
const loading = defineModel('loading', { type: Boolean, required: false, default: false })
const props = withDefaults(defineProps<TablePageWithConfigProps<T, TKeyPropName>>(), {
  refreshOptionText: '刷新',
  refreshDBOptionText: '刷新',
})
const { tableData, tableColumns, queryParams, searchData, refreshData, onAfterTableRefresh, refreshDB } = useTable(
  props.tableConfig,
  { loading: loading },
)

onAfterTableRefresh(() => {
  if (props.onAfterTableRefresh) {
    props.onAfterTableRefresh(tableData.value)
  }
})

defineExpose({
  getSelectionRows: () => table.value?.getSelectionRows(),
  setCurrentRow: (row: T) => table.value?.setCurrentRow(row),
})

const handleCurrentChange = (curr: T) => {
  if (props.onCurrentChange) {
    props.onCurrentChange(curr)
  }
}
</script>

<template>
  <TablePage
    ref="tableRef"
    :table-columns="tableColumns"
    :data="tableData"
    v-model:loading="loading"
    v-model:query-params="queryParams"
    @on-search-data="searchData"
    @on-current-change="handleCurrentChange"
  >
    <template #query-options>
      <el-button v-if="showRefreshOption" type="primary" @click="refreshData" :loading="loading"
        >{{ refreshOptionText }}
      </el-button>
      <el-button v-if="showRefreshDBOption" type="primary" @click="refreshDB" :loading="loading"
        >{{ refreshDBOptionText }}
      </el-button>
      <slot name="query-options"></slot>
    </template>
    <template #empty>
      <slot name="empty"></slot>
    </template>
  </TablePage>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/table/table-page-with-config.scss';
</style>
