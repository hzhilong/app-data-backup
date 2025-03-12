<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { parseAllInstalledSoftware, type SoftwareLib, type SoftwareRegeditGroupKey } from '@/models/Software'
import { initTable } from '@/views/table/table.tsx'
import { useInstalledSoftwareTable } from '@/views/table/useInstalledSoftwareTable.tsx'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const loadingText = ref('正在获取已安装的软件列表，请稍候...')

const { tableData, refreshDB } = initTable(useInstalledSoftwareTable(), loading)
const allInstalledSoftware = computed(() => {
  return parseAllInstalledSoftware(tableData.value ?? [])
})

const softwareLib = ref({} as SoftwareLib)

const initData = () => {}

const gotoAppPage = (key:SoftwareRegeditGroupKey)=>{
  console.log('gotoAppPage', key)
  router.push({
    path: '/app',
    query: {
      regeditGroupKey: key
    }
  })
}

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
        <div class="card" v-for="(group, key) in allInstalledSoftware" :key="group.title" @click="gotoAppPage(key)">
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
