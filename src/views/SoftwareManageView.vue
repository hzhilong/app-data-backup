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
    <div class="footer" v-show="currentData">
      <img class="soft-icon" alt="" :src="currentData?.base64Icon ? currentData?.base64Icon : defaultIcon" />
      <div class="soft-infos">
        <div class="line">
          <div class="info-item">
            <span class="label">软件名称</span>
            <span class="value" :title="currentData?.name">{{ currentData?.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">发布者　</span>
            <span class="value" :title="currentData?.publisher">{{ currentData?.publisher }}</span>
          </div>
        </div>
        <div class="line">
          <div class="info-item">
            <span class="label">安装位置</span>
            <span
              class="value actionable"
              :title="currentData?.installLocation"
              @click="openDir(currentData?.installLocation)"
              >{{ currentData?.installLocation }}</span
            >
          </div>
          <div class="info-item">
            <span class="label">图标位置</span>
            <span class="value actionable" :title="currentData?.iconPath" @click="openDir(currentData?.iconPath)">{{
              currentData?.iconPath
            }}</span>
          </div>
        </div>
        <div class="line">
          <div class="info-item">
            <span class="label">卸载位置</span>
            <span
              class="value actionable"
              :title="currentData?.uninstallDir"
              @click="openDir(currentData?.uninstallDir)"
              >{{ currentData?.uninstallDir }}</span
            >
          </div>
          <div class="info-item">
            <div class="label">注册表　</div>
            <span
              class="value actionable"
              :title="currentData?.regeditDir"
              @click="openRegedit(currentData?.regeditDir)"
              >{{ currentData?.regeditDir }}</span
            >
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
import AppUtil from '@/utils/app-util.ts'
import defaultIcon from '../assets/image/software-icon-default.png'

export default {
  data() {
    return {
      defaultIcon: defaultIcon,
      tableColumns: [
        {
          label: '图标',
          prop: 'iconPath',
          width: '50',
          align: 'center',
          formatter: (row: InstalledSoftware): VNode | string => {
            return h('img', {
              src: row.base64Icon ? row.base64Icon : defaultIcon,
              alt: '',
              style: 'display: block;width: 32px; height: 32px; object-fit: cover;',
            })
          },
        },
        { label: '软件名', prop: 'name', minWidth: '200', showOverflowTooltip: true, sortable: true },
        { label: '安装日期', prop: 'installDate', width: '90', align: 'center', sortable: true },
        { label: '大小', prop: 'formatSize', align: 'center', width: '70', sortable: true, sortBy: 'size' },
        {
          label: '类型',
          prop: 'regeditGroupKey',
          align: 'center',
          width: '100',
          formatter: (row: InstalledSoftware) => {
            if (row.regeditGroupKey) {
              return SOFTWARE_REGEDIT_GROUP[row.regeditGroupKey].title
            } else {
              return '-'
            }
          },
          sortable: true,
        },
        { label: '版本', prop: 'version', width: '80', showOverflowTooltip: true },
        {
          label: '操作',
          prop: 'iconPath',
          minWidth: '100',
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
                  '测试',
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
