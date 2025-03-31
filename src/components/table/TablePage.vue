<script setup lang="ts" generic="T">
/* 表格页面 */
import type { QueryParams } from '@/db/db'
import { ref } from 'vue'
import type { TableInstance } from 'element-plus'
import type { TablePageProps } from '@/types/Table'

const refTable = ref<TableInstance>()
const loading = defineModel('loading', { type: Boolean, required: false, default: false })
const queryParams = defineModel<QueryParams>('queryParams', { required: false })
defineProps<TablePageProps<T>>()
const emit = defineEmits<{
  (e: 'onSearchData'): void
  (e: 'onCurrentChange', curr: T): void
}>()

defineExpose({
  getSelectionRows: () => refTable.value?.getSelectionRows(),
  setCurrentRow: (row: T) => refTable.value?.setCurrentRow(row),
})

const handleSearchData = () => {
  emit('onSearchData')
}
const handleCurrentChange = (curr: T) => {
  emit('onCurrentChange', curr)
}
</script>

<template>
  <div class="table-page">
    <div class="table-page__query">
      <template v-for="(param, key) in queryParams" :key="key">
        <div class="table-page__query__item">
          <span class="table-page__query__item__label">{{ param.title }}</span>
          <span class="table-page__query__item__value">
            <el-select
              v-if="param.options"
              class="value"
              v-model="param.value"
              placeholder=""
              size="small"
              clearable
              @change="handleSearchData"
            >
              <el-option v-for="(item, key) in param.options" :key="key" :label="item" :value="key" />
            </el-select>
            <el-input
              v-else
              class="value"
              v-model="param.value"
              placeholder=""
              size="small"
              clearable
              @change="handleSearchData"
            />
          </span>
        </div>
      </template>
      <div class="table-page__query__options">
        <el-button type="primary" @click="handleSearchData" :loading="loading">搜索</el-button>
        <slot name="query-options"></slot>
      </div>
    </div>
    <div class="table-page__table-wrapper">
      <el-table
        ref="refTable"
        :data="data"
        style="width: 100%"
        height="100%"
        border
        highlight-current-row
        @current-change="handleCurrentChange"
        v-loading="loading"
      >
        <el-table-column v-bind="item" v-for="item in tableColumns" :key="item.label"></el-table-column>
        <template #empty>
          <slot name="empty"></slot>
        </template>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/table/table-page.scss';
</style>
