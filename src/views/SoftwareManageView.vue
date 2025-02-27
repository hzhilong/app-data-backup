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
        highlight-current-row
        @current-change="handleCurrentChange"
      >
        <el-table-column v-bind="item" v-for="item in tableColumns" :key="item.label"></el-table-column>
      </el-table>
    </div>
    <div class="footer" v-show="currentData">
      <div class="soft-infos">
        <div class="line">
          <div class="info-item">
            <div class="label">软件名称：</div>
            <div class="value">{{currentData?.name}}</div>
          </div>
          <div class="info-item">
            <div class="label">安装位置：</div>
            <a class="value actionable">{{currentData?.installLocation}}</a>
          </div>
          <div class="info-item">
            <div class="label">注册表位置：</div>
            <a class="value actionable">{{currentData?.regeditDir}}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { type InstalledSoftware, SOFTWARE_REGEDIT_GROUP, type SoftwareRegeditGroupKey } from '@/models/Software.ts'
import { db, DBUtil, type QueryParams } from '@/db/db.ts'
import { h, type VNode } from 'vue'
import RegeditUtil from '@/utils/regedit-util.ts'

export default {
  data() {
    return {
      tableColumns: [
        {
          label: '图标',
          prop: 'iconPath',
          width: '50',
          align: 'center',
          formatter: (row: InstalledSoftware): VNode | string => {
            return h('img', {
              src: row.base64Icon,
              alt: '',
              style: 'width: 32px; height: 32px; object-fit: cover;',
            })
          },
        },
        { label: '软件名', prop: 'name', width: '200', showOverflowTooltip: true, sortable: true },
        { label: '软件图标', prop: 'iconPath', width: '200', showOverflowTooltip: true },
        { label: '安装位置', prop: 'installLocation', width: '200', showOverflowTooltip: true, sortable: true },
        { label: '安装日期', prop: 'installDate', width: '90', align: 'center', sortable: true },
        { label: '大小', prop: 'formatSize', width: '70' },
        {
          label: '注册表位置',
          prop: 'regeditGroupKey',
          width: '100',
          formatter: (row: InstalledSoftware) => {
            if (row.regeditGroupKey) {
              return SOFTWARE_REGEDIT_GROUP[row.regeditGroupKey].title
            } else {
              return '-'
            }
          },
        },
        { label: '版本', prop: 'version', width: '100' },
        { label: '发布者', prop: 'publisher', minWidth: '100', showOverflowTooltip: true },
        {
          label: '操作',
          prop: 'iconPath',
          width: '200',
          align: 'center',
          formatter: (row: InstalledSoftware): VNode | string => {
            return h(
              'div',
              {
                class: 'table-opt-btns',
              },
              [
                h(
                  'span',
                  {
                    class: 'table-opt-btn',
                    onClick: () => {
                      RegeditUtil.openRegedit(row.regeditDir)
                    },
                  },
                  '注册表位置',
                ),
              ],
            )
          },
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
  },
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/software-manage';
</style>
