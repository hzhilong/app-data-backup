<script setup lang="ts">
import { ref, watch } from 'vue'
import { type BackupConfig, type MyPluginConfig } from '@/types/PluginConfig'
import type { FormInstance, FormItemRule, FormRules } from 'element-plus'
import BaseUtil from '@/utils/base-util'
import { cloneDeep } from 'lodash'
import PluginUtil from '@/utils/plugin-util'
import AppUtil from '@/utils/app-util'

const visible = defineModel({ required: true, type: Boolean })

interface EditMyPluginConfigModalProps {
  plugin?: MyPluginConfig
}

const getDefaultData = () =>
  ({
    type: 'CUSTOM',
    id: '',
    name: '',
    totalItemNum: 0,
    softInstallDir: '',
    backupConfigs: [
      {
        name: '',
        items: [
          {
            type: 'file',
            sourcePath: '',
            targetRelativePath: '',
          },
        ],
      },
    ],
  }) satisfies MyPluginConfig
const props = defineProps<EditMyPluginConfigModalProps>()

const pluginLocal = ref<MyPluginConfig>(props.plugin ? { ...props.plugin } : { ...getDefaultData() })

watch(
  () => visible,
  (newVisible) => {
    if (newVisible) {
      console.log('watch visible', newVisible)
      if (props.plugin) {
        Object.assign(pluginLocal.value, props.plugin)
      } else {
        Object.assign(pluginLocal.value, getDefaultData())
      }
      formRef.value?.resetFields()
    }
  },
  { deep: true, immediate: false },
)

const emit = defineEmits<{
  (e: 'close', type: 'saved' | 'cancel'): void
}>()

const formRef = ref<FormInstance>()
const pluginRules = ref<FormRules<MyPluginConfig>>({
  name: [
    {
      required: true,
      trigger: 'blur',
      message: '软件名称不能为空',
    },
  ],
  id: [
    {
      required: true,
      trigger: 'blur',
      message: '备份信息不能为空',
    },
  ],
  softInstallDir: [
    {
      required: true,
      trigger: 'blur',
      message: '关联的软件路径不能为空',
    },
  ],
})
const backupConfigNameRule = ref<FormItemRule[]>([
  {
    required: true,
    trigger: 'blur',
    message: '配置名不能为空',
  },
])
const sourcePathRule = ref<FormItemRule[]>([
  {
    required: true,
    trigger: 'blur',
    message: '源路径不能为空',
  },
])
const targetRelativePathRule = ref<FormItemRule[]>([
  {
    required: true,
    trigger: 'blur',
    message: '目标相对路径不能为空',
  },
])
const closeModal = (type: 'saved' | 'cancel') => {
  visible.value = false
  emit('close', type)
}
const addBackupConfig = () => {
  pluginLocal.value.backupConfigs?.push({
    name: '',
    items: [
      {
        type: 'file',
        sourcePath: '',
        targetRelativePath: '',
      },
    ],
  })
}
const addBackupItemConfig = (config: Partial<BackupConfig>) => {
  config.items?.push({
    type: 'file',
    sourcePath: '',
    targetRelativePath: '',
  })
}
const handleConfirm = async () => {
  await formRef.value?.validate(async (valid, fields) => {
    if (valid) {
      pluginLocal.value.totalItemNum = pluginLocal.value.backupConfigs.reduce((sum, c) => sum + c.items.length, 0)
      pluginLocal.value.cTime = BaseUtil.getFormatedDateTime()
      try {
        await PluginUtil.saveCustomPlugin(pluginLocal.value)
        visible.value = false
      } catch (e) {
        AppUtil.handleError(e)
      }
    } else {
    }
  })
}
const handleCancel = () => closeModal('cancel')
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="plugin ? '保存配置' : '添加配置'"
    width="700px"
    top="5vh"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <div class="plugin" spellcheck="false">
      <el-form ref="formRef" :inline="true" :size="'default'" :model="pluginLocal" :rules="pluginRules">
        <el-form-item label="软件名称" prop="name">
          <el-input v-model="pluginLocal.name" placeholder="示例：MusicBee" />
        </el-form-item>
        <el-form-item label="备份信息" prop="id">
          <el-input v-model="pluginLocal.id" placeholder="示例：MusicBee设置和插件" />
        </el-form-item>
        <el-form-item label="关联的软件路径" prop="softInstallDir">
          <el-input class="plugin__soft-path" v-model="pluginLocal.softInstallDir" placeholder="" />
        </el-form-item>
        <el-form-item class="plugin__configs-container" label="可备份的数据">
          <div class="plugin__configs-wrapper">
            <el-button @click="addBackupConfig" style="width: fit-content">添加</el-button>
            <div class="plugin__configs">
              <div class="plugin__config" v-for="(config, index) in pluginLocal.backupConfigs" :key="index">
                <el-form-item
                  class="plugin__config__name"
                  label="备份配置名称"
                  :prop="`backupConfigs.${index}.name`"
                  :rules="backupConfigNameRule"
                >
                  <el-input v-model="config.name" style="width: 200px" placeholder="示例：插件" />
                  <el-button
                    v-if="(pluginLocal.backupConfigs?.length || 2) > 1"
                    @click="pluginLocal.backupConfigs?.splice(index, 1)"
                    style="width: fit-content"
                    >删除
                  </el-button>
                </el-form-item>
                <el-form-item label="具体的操作项">
                  <div class="plugin__config__items">
                    <el-button @click="addBackupItemConfig(config)" style="width: fit-content">添加</el-button>
                    <div class="plugin__config__item" v-for="(item, itemIndex) in config.items" :key="itemIndex">
                      <el-form-item label="数据类型" :prop="`backupConfigs.${index}.items.${itemIndex}.type`">
                        <el-select v-model="item.type" style="width: 140px">
                          <el-option label="注册表" value="registry" />
                          <el-option label="文件/文件夹" value="file" />
                        </el-select>
                      </el-form-item>
                      <el-form-item
                        label="数据路径"
                        :prop="`backupConfigs.${index}.items.${itemIndex}.sourcePath`"
                        :rules="sourcePathRule"
                      >
                        <div class="single-line">
                          <el-input v-model="item.sourcePath" placeholder="示例：%installDir%/Plugins" />
                          <el-popover v-if="item.type === 'file'" placement="top" :width="320" trigger="hover">
                            <template #default>
                              <div>
                                支持以下变量：
                                <div>
                                  <span>%installDir%</span>：关联的软件路径
                                  <span>%APPDATA%</span>：C:\Users\用户名\AppData
                                </div>
                              </div>
                            </template>
                            <template #reference>
                              <i class="ri-question-line"></i>
                            </template>
                          </el-popover>
                        </div>
                      </el-form-item>
                      <el-form-item
                        label="保存的相对路径"
                        :prop="`backupConfigs.${index}.items.${itemIndex}.targetRelativePath`"
                        :rules="targetRelativePathRule"
                      >
                        <el-input v-model="item.targetRelativePath" placeholder="示例：Plugins" />
                      </el-form-item>
                      <el-button
                        v-if="(config.items?.length || 2) > 1"
                        @click="config.items?.splice(itemIndex, 1)"
                        style="width: fit-content"
                        >删除
                      </el-button>
                    </div>
                  </div>
                </el-form-item>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" size="small">取消</el-button>
        <el-button type="primary" @click="handleConfirm" size="small">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/modal/my-plugin-config-modal';
</style>
