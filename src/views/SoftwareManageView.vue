<template>
  <div class="content-wrapper">
    <div class="table-wrapper">
      <el-table :data="tableData" style="width: 100%" height="100%" stripe border>
        <el-table-column v-bind="item" v-for="item in tableColumns" :key="item.label"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script lang="ts">
import { type InstalledSoftware, SOFTWARE_REGEDIT_GROUP, type SoftwareRegeditGroupKey } from '@/models/Software.ts'
import { db } from '@/db/db.ts'
import { h, type VNode } from 'vue'
import RegeditUtil from '@/utils/regedit-util.ts'

export default {
  data() {
    return {
      regeditGroupKey: null as SoftwareRegeditGroupKey|null,
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
            return h('div', {
              class: 'table-opt-btns',
            }, [
              h('span', {
                class: 'table-opt-btn',
                onClick:()=>{
                  RegeditUtil.openRegedit(row.regeditDir)
                }
              }, '注册表位置')
            ])
          },
        },
      ],
      tableData: [] as InstalledSoftware[],
    }
  },
  created() {
    this.regeditGroupKey = this.$route.query.regeditGroupKey as SoftwareRegeditGroupKey
    this.refreshData(this.regeditGroupKey)
  },
  mounted() {},
  methods: {
    refreshData(regeditGroupKey: null | SoftwareRegeditGroupKey) {
      if (regeditGroupKey) {
        db.installedSoftware
          .where({ regeditGroupKey: regeditGroupKey })
          .toArray()
          .then((data) => {
            this.tableData = data
          })
      } else {
        db.installedSoftware.toArray().then((data) => {
          this.tableData = data
        })
      }
    },
  },
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/software-manage';
</style>
