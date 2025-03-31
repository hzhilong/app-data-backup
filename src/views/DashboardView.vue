<script setup lang="ts">
import { computed, ref } from 'vue'
import { parseAllInstalledSoftware } from '@/types/Software'
import SoftwareGraph from '@/components/graph/SoftwareGraph.vue'
import { RouterUtil } from '@/utils/router-util'
import { useTable } from '@/composables/table/useTable'
import { useInstalledSoftwareTable } from '@/composables/table/useInstalledSoftwareTable'
import { usePluginConfigTable } from '@/composables/table/usePluginConfigTable'
import { useBackupTasksStore } from '@/stores/backup-task'
import { storeToRefs } from 'pinia'
import { parsePluginConfigGroup } from '@/types/PluginConfig'
import Card from '@/components/card/Card.vue'
import CardData from '@/components/card/CardData.vue'

const loading1 = ref(true)
const loading2 = ref(false)
const loadingText = ref('正在获取已安装的软件列表，请稍候...')

const { refreshDB: refreshInstalledList, tableData: softwareList } = useTable(useInstalledSoftwareTable(false), {
  loading: loading1,
  isTryInit: true,
})
const { refreshDB: refreshPluginList, tableData: pluginList } = useTable(usePluginConfigTable(false, false), {
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
  <div class="page-container dashboard" v-loading.fullscreen.lock="loading1" :element-loading-text="loadingText">
    <div class="dashboard__content installed">
      <div class="dashboard__content__header">
        <div class="dashboard__content__header__title" @click="RouterUtil.gotoSoft({})">
          已安装的软件({{ softwareList?.length ?? 0 }})
        </div>
        <i class="ri-loop-right-line circle-icon-btn--rotate" @click="() => refreshInstalledList()"></i>
      </div>
      <div class="dashboard__installed">
        <div class="dashboard__installed__cards">
          <Card
            class="small"
            v-for="(group, key) in allInstalledSoftware"
            :key="key"
            :name="group.title"
            :on-click="() => RouterUtil.gotoSoft({ regeditGroupKey: key })"
          >
            <CardData name="个数" :value="group.totalNumber" />
            <CardData name="大小" :value="group.totalSize" />
          </Card>
        </div>
        <div class="dashboard__installed__graph-container">
          <div class="dashboard__installed__graph">
            <SoftwareGraph ref="refGraph" :softwareList="softwareList"></SoftwareGraph>
          </div>
        </div>
      </div>
    </div>
    <div class="dashboard__content">
      <div class="dashboard__content__header">
        <div class="dashboard__content__header__title" @click="RouterUtil.gotoPluginConfig({})">
          备份配置({{ pluginList?.length ?? 0 }})
        </div>
        <i class="ri-loop-right-line circle-icon-btn--rotate" @click="() => refreshPluginList()"></i>
      </div>
      <Card class="small">
        <CardData
          v-for="(type, key) in pluginConfigGroup"
          :key="key"
          :name="type.title"
          :value="type.list?.length ?? 0"
          :on-click="() => RouterUtil.gotoPluginConfig({ type: key })"
        />
      </Card>
    </div>
    <div class="dashboard__content">
      <div class="dashboard__content__header">
        <div class="dashboard__content__header__title" @click="RouterUtil.gotoBackupTasks()">已备份的数据</div>
      </div>
      <Card>
        <CardData name="已备份次数" :value="backupTaskInfo.totalCount" />
        <CardData name="成功备份次数" :value="backupTaskInfo.successCount" />
        <CardData name="最近备份日期" :value="backupTaskInfo.recentCTime" />
      </Card>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/dashboard';
</style>
