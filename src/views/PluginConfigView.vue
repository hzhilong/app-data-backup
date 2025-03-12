<script setup lang="ts">
import { usePluginConfigTable } from '@/views/table/usePluginConfigTable.tsx'
import { initTable } from '@/views/table/table.tsx'

const { tableData, tableColumns, queryParams, loading, searchData, refreshData } = initTable(usePluginConfigTable())
</script>
<template>
  <div class="content-wrapper">
    <div class="header">
      <div class="header-left">
        <div class="search-item">
          <span class="label">类型</span>
          <el-select class="value" v-model="queryParams.type.value" placeholder="" size="small" clearable>
            <el-option v-for="(item, key) in queryParams.type.options" :key="key" :label="item" :value="key" />
          </el-select>
        </div>
        <div class="search-item">
          <span class="label">名称</span>
          <el-input class="value" v-model="queryParams.name.value" placeholder="" size="small" clearable />
        </div>
        <el-button type="primary" @click="searchData" :loading="loading">搜索</el-button>
        <el-button type="primary" @click="refreshData" :loading="loading">刷新</el-button>
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

<style scoped lang="scss">
@use '@/assets/scss/software-manage';
</style>
