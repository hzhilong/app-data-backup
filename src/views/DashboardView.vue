<template>
  <div
    class="dashboard-container"
    v-loading.fullscreen.lock="initializing"
    :element-loading-text="loadingText"
  >
    <div class="installed-container content-wrapper">
      <div class="title">已安装的软件</div>
      <div class="cards cards-multiple">
        <div class="card" v-for="type in allInstalledSoftware" :key="type.title">
          <div class="card-name">{{ type.title }}</div>
          <div class="card-info">
            <div class="info-item">
              个数：<span class="value">{{ type.totalNumber }}</span>
            </div>
            <div class="info-item">
              大小：<span class="value">{{ type.totalSize }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="title">可备份的软件</div>
      <div class="cards cards-single">
        <div class="card-info">
          <div class="info-item" v-for="type in allBackupableSoftware" :key="type.title">
            {{ type.title }}：
            <div
              class="proportion-chart"
              :total-number="type.totalNumber"
              v-if="type.totalNumber > -1"
            >
              <div
                class="value"
                :style="{
                  width: parseInt(String((type.backupableNumber * 100) / type.totalNumber)) + '%',
                }"
                :total-number="type.backupableNumber"
              >
                {{ type.backupableNumber }}
              </div>
            </div>
            <div class="value" v-else>{{ type.backupableNumber }}</div>
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
  type AllBackupableSoftware,
  type AllInstalledSoftware,
  BACKUP_TYPE_DESC, BACKUP_TYPE_KEY,
  BackupableSoftware,
  type BackupTypeKey,
  SOFTWARE_REGEDIT_DESC,
  SOFTWARE_REGEDIT_PATH,
  SoftwareRegeditPath,
  type SoftwareRegeditPathKey
} from '@/models/Software.ts'

export default {
  data() {
    return {
      loadingText: '正在获取已安装的软件列表，请稍候...',
      allBackupableSoftware: {} as AllBackupableSoftware,
    }
  },
  computed: {
    SOFTWARE_REGEDIT_PATH() {
      return SOFTWARE_REGEDIT_PATH
    },
    SOFTWARE_REGEDIT_DESC() {
      return SOFTWARE_REGEDIT_DESC
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
  },
  mounted() {
    if (!this.initializing && !this.initialized) {
      this.setInitializing(true)
      RegeditUtil.initAllInstalledSoftware().finally(() => {
        this.initAllBackupableSoftware()
        this.setInitializing(false)
        this.setInitialized(true)
      })
    } else if (this.initialized) {
      this.initAllBackupableSoftware()
    }
  },
  methods: {
    ...mapActions(AppSessionStore, ['setInitializing', 'setInitialized']),
    initAllBackupableSoftware() {
      for (const key in this.allInstalledSoftware) {
        const typedKey = key as BackupTypeKey
        if (Object.prototype.hasOwnProperty.call(SOFTWARE_REGEDIT_DESC, typedKey)) {
          const typedPathKey = key as SoftwareRegeditPathKey
          const install = this.allInstalledSoftware[typedPathKey]
          this.allBackupableSoftware[typedKey] = {
            title: install.title,
            totalNumber: install.totalNumber,
            backupableNumber: Math.max(0, install.totalNumber - 20),
          }
        }
      }
      for (const key in BACKUP_TYPE_DESC) {
        const typedKey = key as BackupTypeKey
        if (!Object.prototype.hasOwnProperty.call(SOFTWARE_REGEDIT_DESC, typedKey)) {
          this.allBackupableSoftware[typedKey] = {
            title: BACKUP_TYPE_DESC[typedKey],
            totalNumber: -1,
            backupableNumber: typedKey === BACKUP_TYPE_KEY.CUSTOM?0:11,
          }
        }
      }
    },
  },
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/dashboard';
</style>
