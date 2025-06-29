<script setup lang="ts">
import { useAppSettingsStore } from '@/stores/app-settings'
import { storeToRefs } from 'pinia'
import SettingItem from '@/components/app-settings/SettingItem.vue'
import SettingGroup from '@/components/app-settings/SettingGroup.vue'
import UpdateThemeColorButton from '@/components/app-settings/UpdateThemeColorButton.vue'
import ClearIconCacheButton from '@/components/app-settings/ClearIconCacheButton.vue'
import ChooseBackupRootButton from '@/components/app-settings/ChooseBackupRootButton.vue'
import UpdateThemeModeButton from '@/components/app-settings/UpdateThemeModeButton.vue'
import AppUtil from '@/utils/app-util'

const appSettingsStore = useAppSettingsStore()
const { backupRootDir, confirmBeforeRestore, autoBackupBeforeRestore, bulkBackupShowMsg, backupPathType } =
  storeToRefs(appSettingsStore)
</script>

<template>
  <div class="page-container settings">
    <SettingGroup name="备份设置">
      <SettingItem title="备份目录" :desc="backupRootDir">
        <ChooseBackupRootButton />
      </SettingItem>
      <SettingItem title="还原之前确认操作" desc="还原之前弹窗提示将要操作的项目，防止误操作">
        <el-switch v-model="confirmBeforeRestore" />
      </SettingItem>
      <SettingItem title="还原之前自动备份一次" desc="建议开启，防止误操作">
        <el-switch v-model="autoBackupBeforeRestore" />
      </SettingItem>
      <SettingItem title="提示批量任务的结果" desc="批量备份时可能因为任务过多/执行过快，导致大量提示信息">
        <el-switch v-model="bulkBackupShowMsg" />
      </SettingItem>
      <SettingItem title="备份文件夹路径格式" desc="设置日期开头可方便整理批量备份的内容">
        <el-radio-group v-model="backupPathType">
          <el-radio-button label="/软件名/日期" value="name/date" />
          <el-radio-button label="/日期/软件名" value="date/name" />
        </el-radio-group>
      </SettingItem>
    </SettingGroup>
    <SettingGroup name="应用设置">
      <SettingItem title="应用数据导入导出">
        <AppDataBackupOptions />
      </SettingItem>
      <SettingItem title="主题颜色">
        <UpdateThemeColorButton />
      </SettingItem>
      <SettingItem title="主题模式">
        <UpdateThemeModeButton />
      </SettingItem>
      <SettingItem title="更新配置仓库" desc="从github仓库获取最新的备份配置">
        <UpdatePluginsButton />
      </SettingItem>
      <SettingItem title="清空软件图标的缓存" desc="获取已安装的软件时，本应用会缓存软件图标">
        <ClearIconCacheButton />
      </SettingItem>
      <SettingItem title="软件日志">
        <el-button type="primary" @click="AppUtil.openLogsDir()">打开</el-button>
      </SettingItem>
    </SettingGroup>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/settings.scss';
</style>
