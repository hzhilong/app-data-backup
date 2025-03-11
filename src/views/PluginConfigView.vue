<template>
  <div class="content-wrapper">
    <div class="header">
      <div class="header-left">
        <div class="search-item">
          <span class="label"> 类型 </span>
          <el-select class="value" v-model="queryParams.type.value" placeholder="" size="small" clearable>
            <el-option v-for="(item, key) in BACKUP_PLUGIN_TYPE" :key="key" :label="item.title" :value="key" />
          </el-select>
        </div>
        <div class="search-item">
          <span class="label"> 名称 </span>
          <el-input class="value" v-model="queryParams.name.value" placeholder="" size="small" clearable />
        </div>
        <el-button type="primary" @click="searchData" :loadingData="loadingData">搜索</el-button>
        <el-button type="primary" @click="refreshData" :loadingData="loadingData">刷新</el-button>
      </div>
      <div class="header-right"></div>
    </div>
    <div class="table-wrapper">
      <el-table :data="tableData" style="width: 100%" height="100%" stripe border highlight-current-row>
        <el-table-column v-bind="item" v-for="item in tableColumns" :key="item.label"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script lang="tsx">
import { db, DBUtil, type QueryParams } from '@/db/db'
import { BACKUP_PLUGIN_TYPE, type BackupPluginTypeKey, PluginConfig } from '@/plugins/plugin-config'
import { IPC_CHANNELS } from '@/models/IpcChannels'
import { BuResult } from '@/models/BuResult'

export default {
  data() {
    return {
      tableColumns: [
        { label: '序号', type: 'index', width: '90' },
        { label: '名称', prop: 'name', minWidth: '200', showOverflowTooltip: true, sortable: true },
        {
          label: '类型',
          prop: 'type',
          align: 'center',
          width: '100',
          formatter: (row: PluginConfig) => {
            if (row.type) {
              return BACKUP_PLUGIN_TYPE[row.type].title
            } else {
              return '-'
            }
          },
          sortable: true,
        },
        { label: '添加时间', prop: 'cTime', minWidth: '200', showOverflowTooltip: true, sortable: true },
        {
          label: '备份项目',
          prop: 'type',
          align: 'center',
          width: '200',
          formatter: (row: PluginConfig) => {
            const configs = row.backupConfigs
            return (
              <>
                {configs.map(({ name, items }) => {
                  return (
                      <el-tooltip
                        placement="top"
                        v-slots={{
                          content: () => <>{items.map((item) => item.sourcePath).join('<br/>')}</>,
                        }}
                      >
                        <span class="">{name}({items.length})</span>
                      </el-tooltip>
                  )
                })}
              </>
            )
          },
        },
      ],
      tableData: [] as PluginConfig[],
      queryParams: {
        name: {
          connector: 'like',
          value: '',
        },
        type: {
          connector: 'eq',
          value: undefined as BackupPluginTypeKey | undefined,
        },
      } as QueryParams,
      BACKUP_PLUGIN_TYPE: BACKUP_PLUGIN_TYPE,
      loadingData: false,
    }
  },
  created() {
    this.refreshData()
  },
  mounted() {},
  methods: {
    loadData(getData: () => Promise<PluginConfig[]>) {
      this.loadingData = true
      getData()
        .then((data) => {
          this.tableData = data
        })
        .finally(() => {
          this.loadingData = false
        })
    },
    async refreshData() {
      this.loadingData = true
      BuResult.getPromise((await window.electronAPI?.ipcInvoke(IPC_CHANNELS.GET_PLUGINS)) as BuResult<PluginConfig[]>)
        .then((data) => {
          this.tableData = data
        })
        .finally(() => {
          this.loadingData = false
        })
    },
    searchData() {
      this.loadingData = true
      DBUtil.query(db.pluginConfig, this.queryParams)
        .then((data) => {
          this.tableData = data
        })
        .finally(() => {
          this.loadingData = false
        })
    },
  },
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/software-manage';
</style>
