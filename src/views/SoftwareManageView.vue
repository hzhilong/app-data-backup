<script setup lang="ts">
import { useInstalledSoftwareTable } from '@/views/table/useInstalledSoftwareTable.tsx'
import { initTableView } from '@/views/table/table.tsx'
import { type InstalledSoftware, SOFTWARE_REGEDIT_GROUP, type SoftwareRegeditGroupKey } from '@/models/Software.ts'
import { type Ref, ref } from 'vue'
import defaultIcon from '../assets/image/software-icon-default.png'
import RegeditUtil from '@/utils/regedit-util'
import AppUtil from '@/utils/app-util'
import {
  type NavigationGuardNext,
  onBeforeRouteUpdate,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
} from 'vue-router'

const { tableColumns, queryParams, tableData, searchData, refreshData, loading } =
  initTableView(useInstalledSoftwareTable())
const currentData: Ref<InstalledSoftware | null> = ref(null)

onBeforeRouteUpdate((to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded, next: NavigationGuardNext) => {
  const newGroupKey = to.query.regeditGroupKey as SoftwareRegeditGroupKey
  if (queryParams.value.regeditGroupKey.value !== newGroupKey) {
    queryParams.value.regeditGroupKey.value = newGroupKey
    searchData()
  }
})
</script>

<template>
  <div class="content-wrapper">
    <div class="header">
      <div class="header-left">
        <div class="search-item">
          <span class="label"> 类型 </span>
          <el-select class="value" v-model="queryParams.regeditGroupKey.value" placeholder="" size="small" clearable>
            <el-option v-for="(item, key) in SOFTWARE_REGEDIT_GROUP" :key="key" :label="item.title" :value="key" />
          </el-select>
        </div>
        <div class="search-item">
          <span class="label"> 名称 </span>
          <el-input class="value" v-model="queryParams.name.value" placeholder="" size="small" clearable />
        </div>
        <el-button type="primary" @click="searchData" :loading="loading">搜索</el-button>
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
        @current-change="(curr) => (currentData = curr)"
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
