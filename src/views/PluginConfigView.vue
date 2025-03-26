<script setup lang="ts">
import { useTable } from '@/composables/table/useTable'
import { ref } from 'vue'
import { usePluginConfigTable } from '@/composables/table/usePluginConfigTable'
import { type TableInstance } from 'element-plus'
import AppUtil from '@/utils/app-util'
import type { MyPluginConfig, ValidatedPluginConfig } from '@/types/PluginConfig'
import BaseUtil from '@/utils/base-util'
import { db } from '@/db/db'
import { cloneDeep } from 'lodash'
import { CommonError } from '@/types/CommonError'

const refTable = ref<TableInstance>()
const { tableData, tableColumns, queryParams, loading, searchData, refreshDB } = useTable(
  usePluginConfigTable(true, false),
)

const getSelectionRows = () => {
  const list = refTable.value?.getSelectionRows() as ValidatedPluginConfig[]
  if (!list || list.length == 0) {
    throw new CommonError('未选择配置')
  }
  return list
}

const addToMyConfig = async () => {
  const list = getSelectionRows()
  const cTime = BaseUtil.getFormatedDateTime()
  const myPlugins = cloneDeep(list).map((item) => {
    item.cTime = cTime
    return item as MyPluginConfig
  })
  await db.myConfig.bulkPut(myPlugins)
  AppUtil.message('添加成功')
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
        <el-button type="primary" @click="refreshDB" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="addToMyConfig" :loading="loading">添加到我的配置</el-button>
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
        <el-table-column v-bind="item" v-for="item in tableColumns" :key="item.label"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/plugin-config';
</style>
