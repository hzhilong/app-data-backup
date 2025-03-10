<template>
  <div class="content-wrapper">
    <div class="header">
      <div class="header-left">
        <div class="search-item">
          <span class="label"> 类型 </span>
          <el-select
            class="value"
            v-model="queryParams.regeditGroupKey.value as string"
            placeholder=""
            size="small"
            clearable
          >
            <el-option v-for="(item, key) in SOFTWARE_REGEDIT_GROUP" :key="key" :label="item.title" :value="key" />
          </el-select>
        </div>
        <div class="search-item">
          <span class="label"> 名称 </span>
          <el-input class="value" v-model="queryParams.name.value as string" placeholder="" size="small" clearable />
        </div>
        <el-button type="primary" @click="refreshData">搜索</el-button>
      </div>
      <div class="header-right"></div>
    </div>
    <div class="table-wrapper">
      <el-table
        :data="tableData"
        style="width: 100%"
        height="100%"
        stripe
        border
        highlight-current-row
        @current-change="handleCurrentChange"
      >
        <el-table-column v-bind="item" v-for="item in tableColumns" :key="item.label"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script lang="ts">
import { type InstalledSoftware, SOFTWARE_REGEDIT_GROUP, type SoftwareRegeditGroupKey } from '@/models/Software.ts'
import { db, DBUtil, type QueryParams } from '@/db/db.ts'
import RegeditUtil from '@/utils/regedit-util.ts'
import AppUtil from '@/utils/app-util.ts'
import defaultIcon from '../assets/image/software-icon-default.png'
import { BACKUP_PLUGIN_TYPE, PluginConfig } from '@/plugins/plugin-config.ts'

export default {
  data() {
    return {
      defaultIcon: defaultIcon,
      tableColumns: [
        { label: '序号', type: 'index', width: '90'},
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
        {
          label: '备份项目',
          prop: 'type',
          align: 'center',
          width: '100',
          formatter: (row: PluginConfig) => {
            return <div>a</div>
          },
          sortable: true,
        },
      ],
      tableData: [] as InstalledSoftware[],
      queryParams: {
        name: {
          connector: 'like',
          value: '',
        },
        regeditGroupKey: {
          connector: 'eq',
          value: undefined as SoftwareRegeditGroupKey | undefined,
        },
      } as QueryParams,
      SOFTWARE_REGEDIT_GROUP: SOFTWARE_REGEDIT_GROUP,
      currentData: null as InstalledSoftware | null,
    }
  },
  created() {
    this.queryParams.regeditGroupKey.value = this.$route.query.regeditGroupKey as SoftwareRegeditGroupKey
    this.refreshData()
  },
  mounted() {},
  methods: {
    refreshData() {
      DBUtil.query(db.installedSoftware, this.queryParams).then((data) => {
        this.currentData = null
        this.tableData = data
      })
    },
    handleCurrentChange(currentRow: InstalledSoftware) {
      this.currentData = currentRow
    },
    openDir(path: string | undefined) {
      if (path) {
        AppUtil.openPath(path)
      }
    },
    openRegedit(path: string | undefined) {
      if (path) {
        RegeditUtil.openRegedit(path)
      }
    },
  },
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/software-manage';
</style>
