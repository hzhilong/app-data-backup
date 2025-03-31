<script setup lang="ts">
import { BACKUP_PLUGIN_TYPE, type MyPluginConfig, type ValidatedPluginConfig } from '@/types/PluginConfig'
import BackupConfig from '@/components/plugin/BackupConfig.vue'
import AppUtil from '@/utils/app-util'

const props = defineProps<{
  plugin: ValidatedPluginConfig | MyPluginConfig
}>()
const openBindPath = () => {
  AppUtil.openPath(props.plugin.softInstallDir)
}
</script>

<template>
  <div class="plugin">
    <div class="plugin__info-container">
      <div class="plugin__info">
        <div class="plugin__info__label">软件名称：</div>
        <Tooltip class="plugin__info__value plugin__info__value--name" :content="plugin.name" />
      </div>
      <div class="plugin__info">
        <div class="plugin__info__label">配置类型：</div>
        <div class="plugin__info__value">{{ BACKUP_PLUGIN_TYPE[plugin.type].title }}</div>
      </div>
      <div class="plugin__info">
        <div class="plugin__info__label">备份信息：</div>
        <div class="plugin__info__value">{{ plugin.id }}</div>
      </div>
      <div class="plugin__info">
        <div class="plugin__info__label">添加时间：</div>
        <div class="plugin__info__value">{{ plugin.cTime }}</div>
      </div>
      <div class="plugin__info plugin__info--path" v-if="plugin.softInstallDir">
        <div class="plugin__info__label">关联软件：</div>
        <Tooltip class="plugin__info__value" :content="plugin.softInstallDir" @click="openBindPath" />
      </div>
    </div>
    <div class="plugin__backup-configs">
      <div>可备份的数据：</div>
      <BackupConfig
        v-for="config in plugin.backupConfigs"
        :key="config.name"
        :plugin-name="plugin.name"
        :backup-config="config"
        :soft-install-dir="plugin.softInstallDir"
      >
      </BackupConfig>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/plugin/plugin-info';
</style>
