<script setup lang="ts">
import { ref } from 'vue'
import { usePluginConfigTable } from '@/composables/table/usePluginConfigTable'
import AppUtil from '@/utils/app-util'
import type { MyPluginConfig, ValidatedPluginConfig } from '@/types/PluginConfig'
import BaseUtil from '@/utils/base-util'
import { db } from '@/db/db'
import { cloneDeep } from 'lodash'
import { CommonError } from '@/types/CommonError'
import type { TablePageWithConfigProps } from '@/types/Table'
import TableUtil from '@/utils/table-util'
import TablePageWithConfig from '@/components/table/TablePageWithConfig.vue'

const loading = ref(false)
const config = {
  tableConfig: usePluginConfigTable({ selection: true, isGetMyPluginConfig: false }),
  showRefreshDBOption: true,
} satisfies TablePageWithConfigProps<ValidatedPluginConfig, 'id'>
const table = TableUtil.getTablePageWithConfig<ValidatedPluginConfig>('tableRef')

const getSelectionRows = () => {
  const list = table.value?.getSelectionRows() as ValidatedPluginConfig[]
  if (!list || list.length == 0) {
    throw new CommonError('未选择配置')
  }
  return list
}

const addToMyConfig = async () => {
  const list = getSelectionRows()
  const cTime = BaseUtil.getFormatedDateTime()
  const myPlugins = cloneDeep(list).map((item) => {
    item.cTime = cTime
    return item as MyPluginConfig
  })
  await db.myConfig.bulkPut(myPlugins)
  AppUtil.message('添加成功')
}
</script>
<template>
  <div class="page-container">
    <TablePageWithConfig ref="tableRef" v-bind="config" v-model:loading="loading">
      <template #query-options>
        <el-button type="primary" @click="addToMyConfig" :loading="loading">添加到我的配置</el-button>
      </template>
    </TablePageWithConfig>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/plugin-config';
</style>
