<script setup lang="ts">
import { ref } from 'vue'
import { useTable } from '@/composables/table/useTable'
import { RouterUtil } from '@/utils/router-util'
import { usePluginConfigTable } from '@/composables/table/usePluginConfigTable'
import type { TableInstance } from 'element-plus'
import type { MyPluginConfig } from '@/types/PluginConfig'
import AppUtil from '@/utils/app-util'
import BackupUtil from '@/utils/backup-util'
import { useAppSettingsStore } from '@/stores/app-settings'
import { CommonError } from '@/types/CommonError'

const refTable = ref<TableInstance>()
const { tableData, tableColumns, queryParams, loading, searchData, refreshData } = useTable(
  usePluginConfigTable(true, true),
)
const settings = useAppSettingsStore()

const getSelectionRows = () => {
  const list = refTable.value?.getSelectionRows() as MyPluginConfig[]
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
</script>
<template>
  <div class="page-content">
    <div class="header">
      <div class="header-left">
        <div class="search-item">
          <span class="label">类型</span>
          <el-select
            class="value"
            v-model="queryParams.type.value"
            placeholder=""
            size="small"
            clearable
            @change="searchData"
          >
            <el-option v-for="(item, key) in queryParams.type.options" :key="key" :label="item" :value="key" />
          </el-select>
        </div>
        <div class="search-item">
          <span class="label">名称</span>
          <el-input
            class="value"
            v-model="queryParams.id.value"
            placeholder=""
            size="small"
            clearable
            @change="searchData"
          />
        </div>
        <el-button type="primary" @click="searchData" :loading="loading">搜索</el-button>
        <el-button type="primary" @click="refreshData" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="bulkBackup">批量备份</el-button>
        <el-button type="primary" @click="bulkRestoreRecent">批量还原最近备份的数据</el-button>
      </div>
      <div class="header-right"></div>
    </div>
    <div class="table-wrapper">
      <el-table
        ref="refTable"
        :data="tableData"
        style="width: 100%"
        height="100%"
        border
        highlight-current-row
        v-loading="loading"
      >
        <template #empty>
          <div class="empty-hint">
            当前数据为空。<br />
            可前往<span class="link" @click="RouterUtil.gotoPluginConfig()">配置仓库</span>添加需要备份的配置。<br />
            后续可在当前页面一键备份所有配置。
          </div>
        </template>
        <el-table-column v-bind="item" v-for="item in tableColumns" :key="item.label"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/my-plugin-config';
</style>
