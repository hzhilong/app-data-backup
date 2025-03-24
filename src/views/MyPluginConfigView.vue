<script setup lang="ts">
import { ref } from 'vue'
import { initTable } from '@/table/table'
import { RouterUtil } from '@/router/router-util'
import { usePluginConfigTable } from '@/table/plugin-config-table'
import type { TableInstance } from 'element-plus'
import type { MyPluginConfig, ValidatedPluginConfig } from '@/plugins/plugin-config'
import AppUtil from '@/utils/app-util'
import BaseUtil from '@/utils/base-util'
import { db } from '@/db/db'
import { cloneDeep } from 'lodash'
import BackupUtil from '@/utils/backup-util'
import { useAppSettingsStore } from '@/stores/app-settings'

const refTable = ref<TableInstance>()
const { tableData, tableColumns, queryParams, loading, searchData, refreshData } = initTable(
  usePluginConfigTable(true, true),
)
const settings = useAppSettingsStore()

const bulkBackup = () => {
  const list = refTable.value?.getSelectionRows() as MyPluginConfig[]
  if (!list || list.length == 0) {
    return AppUtil.showFailedMessage('未选择配置')
  }
  BackupUtil.startBackupData('manual', list, settings.bulkBackupShowMsg).then((r) => {
    AppUtil.message('批量执行任务...')
  })
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
        <el-button type="primary">批量还原最近备份的数据</el-button>
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
