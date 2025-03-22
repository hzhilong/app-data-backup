<script setup lang="ts">
import { useAppSettingsStore } from '@/stores/app-settings'
import FileUtil from '@/utils/file-util'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import ThemeUtil from '@/utils/theme-util'
import { DEFAULT_PRIMARY_COLORS, useAppThemeStore } from '@/stores/app-theme'

const { primaryColor, themeMode } = storeToRefs(useAppThemeStore())
const { backupRootDir, confirmBeforeRestore, autoBackupBeforeRestore } = storeToRefs(useAppSettingsStore())

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
</script>

<template>
  <div class="settings-container">
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
            <div class="item-title">备份文件夹路径格式</div>
          </div>
          <div class="options">
            <el-radio-group>
              <el-radio-button label="/软件名/日期" value="light" />
              <el-radio-button label="/日期/软件名" value="dark" />
            </el-radio-group>
          </div>
        </div>
      </div>
    </div>
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
