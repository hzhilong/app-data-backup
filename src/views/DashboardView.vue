<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { parseAllInstalledSoftware, type SoftwareLib } from '@/models/Software'
import { AppSessionStore } from '@/stores/app-session.ts'
import { initTableView } from '@/views/table/table.tsx'
import { useInstalledSoftwareTable } from '@/views/table/useInstalledSoftwareTable.tsx'

const loading = ref(false)
const loadingText = ref('正在获取已安装的软件列表，请稍候...')

const { tableData, refreshDB } = initTableView(useInstalledSoftwareTable(), loading)
const allInstalledSoftware = computed(() => {
  return parseAllInstalledSoftware(tableData.value ?? [])
})

const softwareLib = ref({} as SoftwareLib)

const initData = () => {}

onMounted(() => {
  initData()
})
</script>

<template>
  <div class="dashboard-container" v-loading.fullscreen.lock="loading" :element-loading-text="loadingText">
    <div class="installed-container content-wrapper">
      <div class="header">
        <div class="title">已安装的软件</div>
        <span class="iconfont icon-refresh icon-btn t-rotate" @click="refreshDB"></span>
      </div>
      <div class="cards cards-multiple">
        <div class="card" v-for="group in allInstalledSoftware" :key="group.title">
          <div class="card-name">{{ group.title }}</div>
          <div class="card-info">
            <div class="info-item">
              个数：<span class="value">{{ group.totalNumber }}</span>
            </div>
            <div class="info-item">
              大小：<span class="value">{{ group.totalSize }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="header">
        <div class="title">可备份的软件</div>
      </div>
      <div class="cards cards-single">
        <div class="card-info">
          <div class="info-item" v-for="type in softwareLib" :key="type.title">
            {{ type.title }}：
            <div class="value">{{ type.list ? type.list.length : 0 }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="content-wrapper">
      <div class="header">
        <div class="title">已备份的数据</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/dashboard';
</style>
