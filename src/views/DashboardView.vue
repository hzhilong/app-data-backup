<script setup lang="ts">
import { computed, ref } from 'vue'
import { parseAllInstalledSoftware } from '@/models/Software'
import SoftwareGraph from '@/components/graph/SoftwareGraph.vue'
import { RouterUtil } from '@/router/router-util'
import PluginUtil from '@/plugins/plugin-util.ts'
import { initTable } from '@/table/table.tsx'
import { useInstalledSoftwareTable } from '@/table/InstalledSoftwareTable.tsx'
import { usePluginConfigTable } from '@/table/PluginConfigTable.tsx'

const loading1 = ref(true)
const loading2 = ref(true)
const loadingText = ref('正在获取已安装的软件列表，请稍候...')

const { refreshDB: refreshInstalledList, tableData: softwareList } = initTable(
  useInstalledSoftwareTable(false),
  loading1,
)
const { refreshDB: refreshPluginList, tableData: pluginList } = initTable(usePluginConfigTable(), loading2)

const allInstalledSoftware = computed(() => parseAllInstalledSoftware(softwareList.value ?? []))
const pluginConfigGroup = computed(() => PluginUtil.parsePluginConfigGroup(pluginList.value ?? []))

const refreshSoftList = async () => {
  await refreshInstalledList()
}
</script>

<template>
  <div class="page-content dashboard-container" v-loading.fullscreen.lock="loading1 || loading2" :element-loading-text="loadingText">
    <div class="content-wrapper installed-cards">
      <div class="header">
        <div class="title" @click="RouterUtil.gotoSoft({})">已安装的软件({{ softwareList?.length ?? 0 }})</div>
        <span class="iconfont icon-refresh icon-btn t-rotate" @click="() => refreshSoftList()"></span>
      </div>
      <div class="content-x">
        <div class="content-y card-container">
          <div
            class="card has-transition"
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
                安装大小：<span class="value">{{ group.totalSize }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="soft-graph-wrapper">
          <div class="card no-transition">
            <SoftwareGraph :softwareList="softwareList"></SoftwareGraph>
          </div>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="content-x">
        <div class="card-container">
          <div class="header">
            <div class="title" @click="RouterUtil.gotoPluginConfig({})">备份配置({{ pluginList?.length ?? 0 }})</div>
            <span class="iconfont icon-refresh icon-btn t-rotate" @click="() => refreshPluginList()"></span>
          </div>
          <div class="card">
            <div class="card-info">
              <div
                class="info-item has-transition"
                v-for="(type, key) in pluginConfigGroup"
                :key="type.title"
                @click="RouterUtil.gotoPluginConfig({ type: key })"
              >
                {{ type.title }}：<span class="value">{{ type.list?.length ?? 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card-container">
          <div class="header">
            <div class="title">已备份的数据</div>
          </div>
          <div class="card"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/dashboard';
</style>
