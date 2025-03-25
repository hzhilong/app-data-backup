<script setup lang="ts">
import { useAppSettingsStore } from '@/stores/app-settings'
import FileUtil from '@/utils/file-util'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import ThemeUtil from '@/utils/theme-util'
import { DEFAULT_PRIMARY_COLORS, useAppThemeStore } from '@/stores/app-theme'
import PluginUtil from '@/plugins/plugin-util'
import AppUtil from '@/utils/app-util'
import { usePluginConfigTable } from '@/table/plugin-config-table'
import { db } from '@/db/db'
import { initTable } from '@/table/table'

const { primaryColor, themeMode } = storeToRefs(useAppThemeStore())
const { backupRootDir, confirmBeforeRestore, autoBackupBeforeRestore, bulkBackupShowMsg, backupPathType } =
  storeToRefs(useAppSettingsStore())

const chooseBackupRootDir = () => {
  FileUtil.chooseDirectory({ defaultPath: backupRootDir.value, title: '选择备份目录' }).then((res) => {
    if (res.filePaths?.length > 0) {
      backupRootDir.value = res.filePaths[0]
    }
  })
}
const dialogSaveTheme = ref(false)
const autoCancelCountdownDefault = 5
const autoCancelCountdown = ref(autoCancelCountdownDefault)
const selectedPrimaryColor = ref(primaryColor.value)
const predefineColors = ref(DEFAULT_PRIMARY_COLORS)
let interval: ReturnType<typeof setInterval>
let oldPrimaryColor = ''

const updatePrimaryColor = () => {
  if (!selectedPrimaryColor.value) return
  oldPrimaryColor = primaryColor.value
  ThemeUtil.updatePrimaryColor(selectedPrimaryColor.value)
  autoCancelCountdown.value = autoCancelCountdownDefault
  dialogSaveTheme.value = true
  interval = setInterval(() => {
    if (autoCancelCountdown.value > 1 && dialogSaveTheme.value) {
      autoCancelCountdown.value -= 1
    } else {
      clearInterval(interval)
      if (autoCancelCountdown.value <= 1) {
        resetTheme()
      }
    }
  }, 1000)
}
const resetTheme = () => {
  selectedPrimaryColor.value = oldPrimaryColor
  ThemeUtil.updatePrimaryColor(oldPrimaryColor)
  dialogSaveTheme.value = false
}

const { refreshDB: refreshPluginDB } = initTable(usePluginConfigTable(true, false))
const updateLocalPlugins = () => {
  AppUtil.message('更新中...')
  PluginUtil.updateLocalPlugins()
    .then((res) => {
      AppUtil.message('更新成功...')
      refreshPluginDB()
        .then((list) => {
          AppUtil.message(`目前已有${list.length}个备份配置`)
        })
        .catch(AppUtil.showErrorMessage)
    })
    .catch(AppUtil.showErrorMessage)
}
const clearIconCache = () => {
  db.iconCache
    .clear()
    .then(() => {
      AppUtil.message('已清空图标缓存')
    })
    .catch(AppUtil.showErrorMessage)
}
</script>

<template>
  <div class="settings-container">
    <div class="setting-group">
      <div class="group-name">应用设置</div>
      <div class="setting-list">
        <div class="setting-item">
          <i class="item-icon ri-equalizer-2-line"></i>
          <div class="item-content">
            <div class="item-title">主题颜色</div>
          </div>
          <div class="options">
            <el-color-picker v-model="selectedPrimaryColor" @change="updatePrimaryColor" :predefine="predefineColors" />
          </div>
        </div>
        <div class="setting-item">
          <i class="item-icon ri-equalizer-2-line"></i>
          <div class="item-content">
            <div class="item-title">主题模式</div>
          </div>
          <div class="options">
            <el-radio-group v-model="themeMode" @change="ThemeUtil.toggleDarkTheme(themeMode)">
              <el-radio-button label="浅色" value="light" />
              <el-radio-button label="深色" value="dark" />
              <el-radio-button label="系统" value="system" />
            </el-radio-group>
          </div>
        </div>
        <div class="setting-item">
          <i class="item-icon ri-equalizer-2-line"></i>
          <div class="item-content">
            <div class="item-title">更新配置仓库</div>
            <div class="item-desc">从github仓库获取最新的备份配置</div>
          </div>
          <div class="options">
            <el-button type="primary" @click="updateLocalPlugins()">更新</el-button>
          </div>
        </div>
        <div class="setting-item">
          <i class="item-icon ri-equalizer-2-line"></i>
          <div class="item-content">
            <div class="item-title">清空软件图标的缓存</div>
            <div class="item-desc">获取已安装的软件时，应用会缓存软件图标</div>
          </div>
          <div class="options">
            <el-button type="primary" @click="clearIconCache()">清空</el-button>
          </div>
        </div>
      </div>
    </div>
    <div class="setting-group">
      <div class="group-name">备份设置</div>
      <div class="setting-list">
        <div class="setting-item">
          <i class="item-icon ri-equalizer-2-line"></i>
          <div class="item-content">
            <div class="item-title">备份目录</div>
            <div class="item-desc">{{ backupRootDir }}</div>
          </div>
          <div class="options">
            <el-button type="primary" @click="chooseBackupRootDir()">选择</el-button>
          </div>
        </div>
        <div class="setting-item">
          <i class="item-icon ri-equalizer-2-line"></i>
          <div class="item-content">
            <div class="item-title">还原之前确认操作</div>
            <div class="item-desc">还原之前弹窗提示将要操作的项目，防止误操作</div>
          </div>
          <div class="options">
            <el-switch v-model="confirmBeforeRestore" />
          </div>
        </div>
        <div class="setting-item">
          <i class="item-icon ri-equalizer-2-line"></i>
          <div class="item-content">
            <div class="item-title">还原之前自动备份一次</div>
            <div class="item-desc">建议开启，防止误操作</div>
          </div>
          <div class="options">
            <el-switch v-model="autoBackupBeforeRestore" />
          </div>
        </div>
        <div class="setting-item">
          <i class="item-icon ri-equalizer-2-line"></i>
          <div class="item-content">
            <div class="item-title">批量备份时显示任务结果的提示</div>
            <div class="item-desc">批量备份时可能因为任务过多/执行过快，导致大量结果提示信息</div>
          </div>
          <div class="options">
            <el-switch v-model="bulkBackupShowMsg" />
          </div>
        </div>
        <div class="setting-item">
          <i class="item-icon ri-equalizer-2-line"></i>
          <div class="item-content">
            <div class="item-title">备份文件夹路径格式</div>
            <div class="item-desc">设置日期开头可方便整理批量备份的内容</div>
          </div>
          <div class="options">
            <el-radio-group v-model="backupPathType">
              <el-radio-button label="/软件名/日期" value="name/date" />
              <el-radio-button label="/日期/软件名" value="date/name" />
            </el-radio-group>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogSaveTheme" title="提示" width="500" :close-on-click-modal="false">
      <span
        >是否保存当前主题？<br />
        {{ autoCancelCountdown }}秒后自动取消</span
      >
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resetTheme">取消({{ autoCancelCountdown }}s)</el-button>
          <el-button type="primary" @click="dialogSaveTheme = false"> 保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/page/settings.scss';
</style>
