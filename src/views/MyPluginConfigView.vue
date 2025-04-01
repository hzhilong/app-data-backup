<script setup lang="ts">
import { RouterUtil } from '@/utils/router-util'
import { usePluginConfigTable } from '@/composables/table/usePluginConfigTable'
import type { MyPluginConfig } from '@/types/PluginConfig'
import AppUtil from '@/utils/app-util'
import BackupUtil from '@/utils/backup-util'
import { useAppSettingsStore } from '@/stores/app-settings'
import { CommonError } from '@/types/CommonError'
import TablePageWithConfig from '@/components/table/TablePageWithConfig.vue'
import TableUtil from '@/utils/table-util'
import type { TablePageWithConfigProps } from '@/types/Table'
import { ref } from 'vue'

const config = {
  tableConfig: usePluginConfigTable({ selection: true, isGetMyPluginConfig: true }),
  showRefreshOption: true,
} satisfies TablePageWithConfigProps<MyPluginConfig, 'id'>
const table = TableUtil.getTablePageWithConfig<MyPluginConfig>('tableRef')
const settings = useAppSettingsStore()
const getSelectionRows = () => {
  const list = table.value?.getSelectionRows() as MyPluginConfig[]
  if (!list || list.length == 0) {
    throw new CommonError('未选择配置')
  }
  return list
}

const bulkBackup = async () => {
  const list = getSelectionRows()
  await BackupUtil.startBackupData('manual', list, settings.bulkBackupShowMsg)
  AppUtil.message('批量备份中...')
}

const bulkRestoreRecent = async () => {
  const list = getSelectionRows()
  await BackupUtil.bulkRestoreRecent('manual', list, settings.bulkBackupShowMsg)
  AppUtil.message('批量还原中...')
}
const editVisible = ref(false)
const editData = ref<MyPluginConfig | undefined>()
const addData = () => {
  editData.value = undefined
  editVisible.value = true
}
</script>
<template>
  <div class="page-container">
    <TablePageWithConfig ref="tableRef" v-bind="config">
      <template #query-options>
        <el-button type="primary" @click="bulkBackup">批量备份</el-button>
        <el-button type="primary" @click="bulkRestoreRecent">批量还原最近备份的数据</el-button>
        <el-button type="primary" @click="addData">自定义</el-button>
      </template>
      <template #empty>
        <div class="empty-hint">
          当前数据为空。<br />
          可前往<span class="link" @click="RouterUtil.gotoPluginConfig()">配置仓库</span>添加需要备份的配置。<br />
          后续可在当前页面一键备份所有配置。
        </div>
      </template>
    </TablePageWithConfig>
    <EditMyPluginConfigModal v-model="editVisible" :plugin="editData"></EditMyPluginConfigModal>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/my-plugin-config';
</style>
