<script setup lang="ts">
import { initTable } from '@/table/table.tsx'
import { onMounted } from 'vue'
import { useMyPluginConfigTable } from '@/table/useMyPluginConfigTable.tsx'
import { RouterUtil } from '@/router/router-util.ts'

const { tableData, tableColumns, queryParams, loading, searchData, refreshData } = initTable(useMyPluginConfigTable())
onMounted(() => {
  searchData().then((r) => {})
})
</script>
<template>
  <div class="content-wrapper">
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
        v-loading="loading"
      >
        <template #empty>
          <div class="empty-hint">
            当前数据为空。<br/>
            可前往<span class="link" @click="RouterUtil.gotoPluginConfig()">配置仓库</span>添加需要备份的配置。<br/>
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
