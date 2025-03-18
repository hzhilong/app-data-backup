<script setup lang="ts">
import { useAppSettingsStore } from '@/stores/app-settings.ts'
import FileUtil from '@/utils/file-util.ts'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import ThemeUtil from '@/utils/theme-util.ts'
import { DEFAULT_PRIMARY_COLORS, useAppThemeStore } from '@/stores/app-theme.ts'

const { primaryColor, themeMode } = storeToRefs(useAppThemeStore())
const { backupRootDir } = storeToRefs(useAppSettingsStore())

const chooseBackupRootDir = () => {
  FileUtil.chooseDirectory({ defaultPath: backupRootDir.value, title: '选择备份目录' }).then((res) => {
    console.log(res)
    if (res.filePaths?.length > 0) {
      backupRootDir.value = res.filePaths[0]
    }
  })
}
const value1 = ref(false)
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
  console.log('resetTheme', oldPrimaryColor)
  selectedPrimaryColor.value = oldPrimaryColor
  ThemeUtil.updatePrimaryColor(oldPrimaryColor)
  dialogSaveTheme.value = false
}
</script>

<template>
  <div class="page-content settings-container">
    <div class="left-content">
      <div class="settings-group">
        <div class="title">备份设置</div>
        <div class="setting-item">
          <span class="item-label">备份目录</span>
          <div class="item-right">
            <span class="item-value">
              <span class="item-value-text" :title="backupRootDir">{{ backupRootDir }}</span>
            </span>
            <el-button type="primary" @click="chooseBackupRootDir()">选择</el-button>
          </div>
        </div>
        <div class="setting-item">
          <span class="item-label">还原之前确认操作</span>
          <div class="item-right">
            <span class="item-value">
              <el-switch v-model="value1" />
            </span>
          </div>
        </div>
        <div class="setting-item">
          <span class="item-label">还原之前自动备份一次</span>
          <div class="item-right">
            <span class="item-value">
              <el-switch v-model="value1" />
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="right-content">
      <div class="settings-group">
        <div class="title">应用设置</div>
        <div class="setting-item">
          <span class="item-label">主题颜色</span>
          <div class="item-right">
            <span class="item-value">
              <div class="item-value-text">
                <el-color-picker
                  v-model="selectedPrimaryColor"
                  @change="updatePrimaryColor"
                  :predefine="predefineColors"
                />
              </div>
            </span>
          </div>
        </div>
        <div class="setting-item">
          <span class="item-label">主题模式</span>
          <div class="item-right">
            <span class="item-value-text">
              <el-radio-group v-model="themeMode" @change="ThemeUtil.toggleDarkTheme(themeMode)">
                <el-radio-button label="浅色" value="light" />
                <el-radio-button label="深色" value="dark" />
                <el-radio-button label="系统" value="system" />
              </el-radio-group>
            </span>
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
