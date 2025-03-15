<script setup lang="ts">
import { useInstalledSoftwareTable } from '@/table/useInstalledSoftwareTable.tsx'
import { initTable } from '@/table/table.tsx'
import { type InstalledSoftware } from '@/models/Software.ts'
import { onMounted, type Ref, ref } from 'vue'
import defaultIcon from '../assets/image/software-icon-default.png'
import RegeditUtil from '@/utils/regedit-util'
import AppUtil from '@/utils/app-util'
import type { TableInstance } from 'element-plus'

const softTable = ref<TableInstance | null>(null)
const { tableColumns, queryParams, tableData, searchData, loading, onAfterTableRefresh } =
  initTable(useInstalledSoftwareTable())
const currentData: Ref<InstalledSoftware | null> = ref(null)
onMounted(() => {
  searchData()
})
onAfterTableRefresh(() => {
  if (tableData.value?.length === 1) {
    softTable.value?.setCurrentRow(tableData.value?.[0])
  }
})
</script>

<template>
  <div class="content-wrapper">
    <div class="header">
      <div class="header-left">
        <div class="search-item">
          <span class="label"> 类型 </span>
          <el-select
            class="value"
            v-model="queryParams.regeditGroupKey.value"
            placeholder=""
            size="small"
            clearable
            @change="searchData"
          >
            <el-option
              v-for="(item, key) in queryParams.regeditGroupKey.options"
              :key="key"
              :label="item"
              :value="key"
            />
          </el-select>
        </div>
        <div class="search-item">
          <span class="label"> 名称 </span>
          <el-input
            class="value"
            v-model="queryParams.name.value"
            placeholder=""
            size="small"
            clearable
            @change="searchData"
          />
        </div>
        <el-button type="primary" @click="searchData" :loading="loading">搜索</el-button>
      </div>
      <div class="header-right"></div>
    </div>
    <div class="table-wrapper">
      <el-table
        ref="softTable"
        :data="tableData"
        style="width: 100%"
        height="100%"
        stripe
        border
        highlight-current-row
        @current-change="(curr: InstalledSoftware) => (currentData = curr)"
        v-loading="loading"
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
              :title="currentData?.installDir"
              @click="AppUtil.openPath(currentData?.installDir)"
              >{{ currentData?.installDir }}</span
            >
          </div>
          <div class="info-item">
            <span class="label">卸载命令</span>
            <span class="value" :title="currentData?.uninstallString">{{ currentData?.uninstallString }}</span>
          </div>
        </div>
        <div class="line">
          <div class="info-item">
            <span class="label">图标位置</span>
            <span
              class="value actionable"
              :title="currentData?.iconPath"
              @click="AppUtil.openPath(currentData?.iconPath)"
              >{{ currentData?.iconPath }}</span
            >
          </div>
          <div class="info-item">
            <div class="label">注册表　</div>
            <span
              class="value actionable"
              :title="currentData?.regeditDir"
              @click="RegeditUtil.openRegedit(currentData?.regeditDir)"
              >{{ currentData?.regeditDir }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/software-manage';
</style>
