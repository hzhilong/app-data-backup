<script setup lang="ts">
import type { PluginConfigModalOptions } from '@/components/modal/global-modal'
import type { BackupItemConfig } from '@/plugins/plugin-config'
import PluginUtil from '@/plugins/plugin-util'
import AppUtil from '@/utils/app-util'
import type { PluginExecType } from '@/plugins/plugin-task'

const visible = defineModel({ required: true, type: Boolean })

const props = withDefaults(defineProps<PluginConfigModalOptions>(), {
  title: '提示',
  confirmBtnText: '确定',
  modal: false,
  showCancel: false,
})

const emit = defineEmits<{
  (e: 'close', type: 'confirm' | 'cancel'): void
}>()

const closeModal = (type: 'confirm' | 'cancel') => {
  if (!props.onBeforeClose || props.onBeforeClose()) {
    visible.value = false
    emit('close', type)
  }
}
const handleConfirm = () => closeModal('confirm')
const handleCancel = () => closeModal('cancel')

const openPath = (itemOrPath: string | undefined | BackupItemConfig, isSource?: boolean) => {
  if (typeof itemOrPath === 'string' || typeof itemOrPath === 'undefined' || isSource === undefined) {
    if (typeof itemOrPath === 'string' && itemOrPath) {
      AppUtil.openPath(itemOrPath)
    }
  } else {
    if (props.backupPath && props.softInstallDir) {
      PluginUtil.openTaskConfigPath(
        {
          pluginName: props.pluginName,
          softInstallDir: props.softInstallDir,
          backupPath: props.backupPath,
        },
        itemOrPath,
        isSource,
      )
    } else {
      isSource && PluginUtil.openPluginConfigSourcePath(props.pluginName, props.softInstallDir ?? '', itemOrPath)
    }
  }
}

const getPathStyle = (path?: string) => {
  return path ? { cursor: 'pointer' } : {}
}

const getArrowClass = (pluginExecType?: PluginExecType) => {
  return `ri-arrow-${props.pluginExecType === 'restore' ? 'left' : 'right'}-long-line`
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="props.title"
    width="700"
    :close-on-click-modal="!props.modal"
    :close-on-press-escape="!props.modal"
    :show-close="!props.modal"
  >
    <div class="config-container">
      <div class="header-x">
        <div class="header-y">
          <div class="config-name">
            软件名称：<span>{{ props.pluginName }}</span>
          </div>
          <div class="config-desc">
            备份配置：<span>{{ props.pluginId }}</span>
          </div>
        </div>
        <div class="header-y">
          <div class="config-ctime">
            添加时间：<span>{{ props.cTime }}</span>
          </div>
          <div class="soft-install-dir">
            关联目录：<span @click="openPath(props.softInstallDir)" :style="getPathStyle(props.softInstallDir)">{{
              props.softInstallDir
            }}</span>
          </div>
        </div>
      </div>
      <div class="configs">
        <div>可备份的数据：</div>
        <div class="config" v-for="config in props.configs">
          <div class="config-name"><i class="ri-list-settings-fill"></i>{{ config.name }}</div>
          <div class="config-item" v-for="item in config.items">
            <div class="item-field" style="flex: 1">
              <el-tooltip effect="dark" :content="item.sourcePath" placement="top-start">
                <span class="path-field" @click="openPath(item, true)" :style="getPathStyle(item.sourcePath)"
                  ><i class="ri-file-2-line"></i>{{ item.sourcePath }}</span
                >
              </el-tooltip>
            </div>
            <div class="item-field">
              <i :class="getArrowClass(props.pluginExecType)"></i>
            </div>
            <div class="item-field" style="flex: 1">
              <el-tooltip effect="dark" :content="item.targetRelativePath" placement="top-start">
                <span class="path-field" @click="openPath(item, false)" :style="getPathStyle(props.backupPath)"
                  ><i class="ri-file-2-line"></i>{{ item.targetRelativePath }}</span
                >
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="showCancel" @click="handleCancel" size="small">取消</el-button>
        <el-button type="primary" @click="handleConfirm" size="small">{{ props.confirmBtnText }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/plugin-config-modal';
</style>
