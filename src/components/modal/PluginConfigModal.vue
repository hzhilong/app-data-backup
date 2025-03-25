<script setup lang="ts">
import type { PluginConfigModalData, PluginConfigModalOptions } from '@/components/modal/global-modal'
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

const openPath = (
  plugin: PluginConfigModalData,
  itemOrPath: string | undefined | BackupItemConfig,
  isSource?: boolean,
) => {
  if (typeof itemOrPath === 'string' || typeof itemOrPath === 'undefined' || isSource === undefined) {
    if (typeof itemOrPath === 'string' && itemOrPath) {
      AppUtil.openPath(itemOrPath)
    }
  } else {
    if (plugin.backupPath && plugin.softInstallDir) {
      PluginUtil.openTaskConfigPath(
        {
          pluginName: plugin.pluginName,
          softInstallDir: plugin.softInstallDir,
          backupPath: plugin.backupPath,
        },
        itemOrPath,
        isSource,
      )
    } else {
      isSource && PluginUtil.openPluginConfigSourcePath(plugin.pluginName, plugin.softInstallDir ?? '', itemOrPath)
    }
  }
}

const getPathStyle = (path?: string) => {
  return path ? { cursor: 'pointer' } : {}
}

const getArrowClass = (plugin: PluginConfigModalData, pluginExecType?: PluginExecType) => {
  return `ri-arrow-${plugin.pluginExecType === 'restore' ? 'left' : 'right'}-long-line`
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
    <div class="content-container">
      <div class="plugins">
        <el-card class="plugin" shadow="hover" v-for="plugin in props.plugins" :key="plugin.pluginId">
          <div class="header-x">
            <div class="header-y">
              <div class="plugin-name">
                软件名称：<span>{{ plugin.pluginName }}</span>
              </div>
              <div class="plugin-desc">
                备份配置：<el-tooltip effect="dark" :content="plugin.pluginId" placement="top-start">
                  <span>{{ plugin.pluginId }}</span>
                </el-tooltip>
              </div>
            </div>
            <div class="header-y">
              <div class="plugin-ctime">
                添加时间：<span>{{ plugin.cTime }}</span>
              </div>
              <div class="soft-install-dir">
                关联目录：<el-tooltip effect="dark" :content="plugin.softInstallDir" placement="top-start">
                  <span
                  @click="openPath(plugin, plugin.softInstallDir)"
                  :style="getPathStyle(plugin.softInstallDir)"
                >{{ plugin.softInstallDir }}</span
                >
                </el-tooltip>
              </div>
            </div>
          </div>
          <div class="configs">
            <div>可备份的数据：</div>
            <div class="config" v-for="config in plugin.configs">
              <div class="config-name"><i class="ri-list-settings-fill"></i>{{ config.name }}</div>
              <div class="config-item" v-for="item in config.items">
                <div class="item-field" style="flex: 1">
                  <el-tooltip effect="dark" :content="item.sourcePath" placement="top-start">
                    <span
                      class="path-field"
                      @click="openPath(plugin, item, true)"
                      :style="getPathStyle(item.sourcePath)"
                      ><i class="ri-file-2-line"></i>{{ item.sourcePath }}</span
                    >
                  </el-tooltip>
                </div>
                <div class="item-field">
                  <i :class="getArrowClass(plugin, plugin.pluginExecType)"></i>
                </div>
                <div class="item-field" style="flex: 1">
                  <el-tooltip effect="dark" :content="item.targetRelativePath" placement="top-start">
                    <span
                      class="path-field"
                      @click="openPath(plugin, item, false)"
                      :style="getPathStyle(plugin.backupPath)"
                      ><i class="ri-file-2-line"></i>{{ item.targetRelativePath }}</span
                    >
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </el-card>
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
