<script setup lang="ts">
import { computed, ref } from 'vue'
import { parseAllInstalledSoftware } from '@/models/software'
import SoftwareGraph from '@/components/graph/SoftwareGraph.vue'
import { RouterUtil } from '@/router/router-util'
import { initTable } from '@/table/table'
import { useInstalledSoftwareTable } from '@/table/installed-software-table'
import { usePluginConfigTable } from '@/table/plugin-config-table'
import { useBackupTasksStore } from '@/stores/backup-task'
import { storeToRefs } from 'pinia'
import { parsePluginConfigGroup } from '@/plugins/plugin-config'

const loading1 = ref(true)
const loading2 = ref(false)
const loadingText = ref('正在获取已安装的软件列表，请稍候...')

const { refreshDB: refreshInstalledList, tableData: softwareList } = initTable(useInstalledSoftwareTable(false), {
  loading: loading1,
  isTryInit: true,
})
const { refreshDB: refreshPluginList, tableData: pluginList } = initTable(usePluginConfigTable(false, false), {
  loading: loading2,
  isTryInit: true,
})

const allInstalledSoftware = computed(() => parseAllInstalledSoftware(softwareList.value ?? []))
const pluginConfigGroup = computed(() => parsePluginConfigGroup(pluginList.value ?? []))
const { tasks: backupTasks } = storeToRefs(useBackupTasksStore())
const backupTaskInfo = computed(() => {
  return {
    totalCount: backupTasks.value.length,
    successCount: backupTasks.value.filter((task) => task.success).length,
    recentCTime: backupTasks.value.length > 0 ? backupTasks.value[0].cTime : 0,
  }
})

const refGraph = ref<InstanceType<typeof SoftwareGraph> | null>(null)
RouterUtil.onCurrRouteUpdate(() => {
  refGraph.value?.refreshGraph()
})
</script>

<template>
  <div
    class="page-content dashboard-container"
    v-loading.fullscreen.lock="loading1"
    :element-loading-text="loadingText"
  >
    <div class="content-wrapper installed-cards">
      <div class="header">
        <div class="title" @click="RouterUtil.gotoSoft({})">已安装的软件({{ softwareList?.length ?? 0 }})</div>
        <i class="ri-loop-right-line icon-btn t-rotate" @click="() => refreshInstalledList()"></i>
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
            <SoftwareGraph ref="refGraph" :softwareList="softwareList"></SoftwareGraph>
          </div>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="content-x">
        <div class="card-container">
          <div class="header">
            <div class="title" @click="RouterUtil.gotoPluginConfig({})">备份配置({{ pluginList?.length ?? 0 }})</div>
            <i class="ri-loop-right-line icon-btn t-rotate" @click="() => refreshPluginList()"></i>
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
        <div class="card-container" @click="RouterUtil.gotoBackupTasks()">
          <div class="header">
            <div class="title">已备份的数据</div>
          </div>
          <div class="card has-transition" @click="RouterUtil.gotoBackupTasks()">
            <div class="card-info">
              <div class="info-item">
                已备份次数：<span class="value">{{ backupTaskInfo.totalCount }}</span>
              </div>
              <div class="info-item">
                成功备份次数：<span class="value">{{ backupTaskInfo.successCount }}</span>
              </div>
              <div class="info-item">
                最近备份日期：<span class="value">{{ backupTaskInfo.recentCTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/dashboard';
</style>
