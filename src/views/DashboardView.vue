<template>
  <div
    class="dashboard-container"
    v-loading.fullscreen.lock="initializing"
    :element-loading-text="loadingText"
  >
    <div class="installed-container content-wrapper">
      <div class="title">已安装的软件</div>
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
      <div class="title">可备份的软件</div>
      <div class="cards cards-single">
        <div class="card-info">
          <div class="info-item" v-for="(type, typeKey) in softwareLib" :key="type.title">
            {{ type.title }}：
            <div
              class="proportion-chart"
              :total-number="totalInstalledNumber"
              v-if="typeKey === BACKUP_SOFTWARE_TYPE_KEY.INSTALLER"
            >
              <div
                class="value"
                :style="{
                  width:
                    parseInt(
                      String(((type.list ? type.list.length : 0) * 100) / totalInstalledNumber),
                    ) + '%',
                }"
                :total-number="totalInstalledNumber"
              >
                {{ type.list ? type.list.length : 0 }}
              </div>
            </div>
            <div class="value" v-else>{{ type.list ? type.list.length : 0 }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="content-wrapper">
      <div class="title">已备份的数据</div>
    </div>
  </div>
</template>

<script lang="ts">
import { mapActions } from 'pinia'
import { AppSessionStore } from '@/stores/app-session.ts'
import { SoftwareStore } from '@/stores/software.ts'
import RegeditUtil from '@/utils/regedit-util.ts'
import {
  BACKUP_SOFTWARE_TYPE,
  BACKUP_SOFTWARE_TYPE_KEY,
  SOFTWARE_REGEDIT_GROUP_KEY,
  type AllInstalledSoftware,
  type SoftwareBackupConfig,
  type SoftwareLib,
  type SoftwareRegeditGroupKey,
} from '@/models/Software.ts'

export default {
  data() {
    return {
      loadingText: '正在获取已安装的软件列表，请稍候...',
      softwareLib: {} as SoftwareLib,
    }
  },
  computed: {
    SOFTWARE_REGEDIT_GROUP_KEY() {
      return SOFTWARE_REGEDIT_GROUP_KEY
    },
    BACKUP_SOFTWARE_TYPE_KEY() {
      return BACKUP_SOFTWARE_TYPE_KEY
    },
    initializing() {
      return AppSessionStore().isInitializing
    },
    initialized() {
      return AppSessionStore().isInitialized
    },
    allInstalledSoftware(): AllInstalledSoftware {
      return SoftwareStore().getAllInstalledSoftware
    },
    totalInstalledNumber(): number {
      let total = 0
      for (const key in this.allInstalledSoftware) {
        const groupKey = key as SoftwareRegeditGroupKey
        const groupTotalNumber = this.allInstalledSoftware[groupKey].totalNumber
        if (groupTotalNumber) {
          total = total + groupTotalNumber
        }
      }
      return total
    },
  },
  mounted() {
    if (!this.initializing && !this.initialized) {
      this.setInitializing(true)
      RegeditUtil.initAllInstalledSoftware().finally(() => {
        this.initSoftwareLib()
        this.setInitializing(false)
        this.setInitialized(true)
      })
    } else if (this.initialized) {
      this.initSoftwareLib()
    }
  },
  methods: {
    ...mapActions(AppSessionStore, ['setInitializing', 'setInitialized']),
    initSoftwareLib() {
      this.softwareLib = {
        [BACKUP_SOFTWARE_TYPE_KEY.INSTALLER]: {
          ...BACKUP_SOFTWARE_TYPE[BACKUP_SOFTWARE_TYPE_KEY.INSTALLER],
          list: new Array(23).fill({
            softwareType: BACKUP_SOFTWARE_TYPE_KEY.INSTALLER,
            softwareName: '测试软件1',
          }) as SoftwareBackupConfig[],
        },
        [BACKUP_SOFTWARE_TYPE_KEY.PORTABLE]: {
          ...BACKUP_SOFTWARE_TYPE[BACKUP_SOFTWARE_TYPE_KEY.PORTABLE],
          list: new Array(3).fill({
            softwareType: BACKUP_SOFTWARE_TYPE_KEY.PORTABLE,
            softwareName: '测试软件2',
          }) as SoftwareBackupConfig[],
        },
        [BACKUP_SOFTWARE_TYPE_KEY.CUSTOM]: {
          ...BACKUP_SOFTWARE_TYPE[BACKUP_SOFTWARE_TYPE_KEY.CUSTOM],
          list: null,
        },
      }
    },
  },
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/dashboard';
</style>
