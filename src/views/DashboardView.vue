<script setup lang="ts">
import { computed, onMounted, type Ref, ref } from 'vue'
import { type InstalledSoftware, parseAllInstalledSoftware, type SoftwareLib } from '@/models/Software'
import { useInstalledSoftwareData } from '@/data/useInstalledSoftwareData.ts'
import SoftwareGraph from '@/components/graph/SoftwareGraph.vue'
import { RouterUtil } from '@/router/router-util'

const loading = ref(true)
const loadingText = ref('正在获取已安装的软件列表，请稍候...')
const softwareList: Ref<InstalledSoftware[]> = ref([])
let installedSoftwareData = useInstalledSoftwareData(loading, false)
const getInstalledList = installedSoftwareData.getList
const refreshInstalledList = installedSoftwareData.refreshList

const allInstalledSoftware = computed(() => {
  return parseAllInstalledSoftware(softwareList.value ?? [])
})

const softwareLib = ref({} as SoftwareLib)

onMounted(() => {
  getInstalledList().then((list) => {
    softwareList.value = list
  })
})
</script>

<template>
  <div class="dashboard-container" v-loading.fullscreen.lock="loading" :element-loading-text="loadingText">
    <div class="content-wrapper">
      <div class="header">
        <div class="title">已安装的软件</div>
        <span
          class="iconfont icon-refresh icon-btn t-rotate"
          @click="
            () => {
              refreshInstalledList()
            }
          "
        ></span>
      </div>
      <div class="content-x">
        <div class="content-y installed-cards">
          <div
            class="card"
            v-for="(group, key) in allInstalledSoftware"
            :key="group.title"
            @click="RouterUtil.gotoSoft({ regeditGroupKey: key })"
          >
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
        <div class="card soft-graph-wrapper no-transition">
          <SoftwareGraph :softwareList="softwareList"></SoftwareGraph>
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
