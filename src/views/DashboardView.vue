<template>
  <div class="dashboard-container" v-loading.fullscreen.lock="initializing" :element-loading-text="loadingText">
    <div class="installed-container content-wrapper">
      <div class="header">
        <div class="title">已安装的软件
        </div>
        <span class="iconfont icon-refresh icon-btn t-rotate" @click="refreshDataFromRegedit"></span>
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
          <div class="info-item" v-for="(type, typeKey) in softwareLib" :key="type.title">
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

<script lang="ts">
import { mapActions } from 'pinia'
import { AppSessionStore } from '@/stores/app-session.ts'
import RegeditUtil from '@/utils/regedit-util.ts'
import {
  BACKUP_SOFTWARE_TYPE,
  BACKUP_SOFTWARE_TYPE_KEY,
  type AllInstalledSoftware,
  type SoftwareBackupConfig,
  type SoftwareLib,
  type SoftwareRegeditGroupKey,
} from '@/models/Software.ts'
import { db, DBUtil } from '@/db/db'

export default {
  data() {
    return {
      loadingText: '正在获取已安装的软件列表，请稍候...',
      allInstalledSoftware: {} as AllInstalledSoftware,
      softwareLib: {} as SoftwareLib,
      BACKUP_SOFTWARE_TYPE_KEY: BACKUP_SOFTWARE_TYPE_KEY
    }
  },
  computed: {
    initializing() {
      return AppSessionStore().isInitializing
    },
    initialized() {
      return AppSessionStore().isInitialized
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
    this.initData()
  },
  methods: {
    ...mapActions(AppSessionStore, ['setInitializing', 'setInitialized']),
    initData() {
      if (!this.initializing && !this.initialized) {
        // 非初始化
        this.refreshDataFromDB()
      } else if (this.initialized) {
        // 已初始化
      }
      this.initSoftwareLib()
    },
    refreshDataFromDB() {
      this.setInitializing(true)
      DBUtil.getAllInstalledSoftware().then((data) => {
        this.allInstalledSoftware = data
      }).finally(() => {
        this.setInitializing(false)
      })
    },
    refreshDataFromRegedit() {
      this.setInitializing(true)
      RegeditUtil.getAllInstalledSoftware().then((data) => {
        if(data){
          for (const dataKey in data) {
            const groupKey = dataKey as SoftwareRegeditGroupKey
            db.installedSoftware.bulkAdd(data[groupKey].list).then(() => {
            }).catch((e) => {
              console.error(e)
            })
          }
        }
        this.allInstalledSoftware = data
        this.setInitialized(true)
      }).finally(() => {
        this.setInitializing(false)
      })
    },
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
