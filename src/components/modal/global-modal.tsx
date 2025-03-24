import { createVNode, render, type VNode } from 'vue'
import {
  type BackupConfig,
  isValidatedPluginConfig,
  type PluginConfig,
  type ValidatedPluginConfig
} from '@/plugins/plugin-config'
import PluginConfigModal from '@/components/modal/PluginConfigModal.vue'
import type { PluginExecTask, PluginExecType } from '@/plugins/plugin-task'

export interface PluginConfigModalOptions {
  configs: BackupConfig[]
  modal?: boolean
  pluginId: string
  pluginName: string
  totalItemNum: number
  title?: string
  cTime?: string
  softInstallDir?: string
  pluginExecType?: PluginExecType
  backupPath?: string
  showCancel?: boolean
  confirmBtnText?: string
  onBeforeClose?: () => boolean
}

let instances: VNode[] = []

export const GPluginConfigModal = {
  /**
   * 显示插件配置详细信息
   * @param pluginConfig
   * @param modalOptions
   */
  showPluginConfig(
    pluginConfig: PluginConfig|ValidatedPluginConfig,
    modalOptions: Omit<PluginConfigModalOptions, 'configs' | 'pluginId' | 'pluginName' | 'totalItemNum'>,
  ): Promise<'confirm' | 'cancel'> {
    return this.show({
      title: '配置详情',
      configs: pluginConfig.backupConfigs,
      pluginId: pluginConfig.id,
      pluginName: pluginConfig.name,
      totalItemNum: pluginConfig.totalItemNum,
      cTime: pluginConfig.cTime,
      confirmBtnText: modalOptions.showCancel?'确定':'关闭',
      softInstallDir: isValidatedPluginConfig(pluginConfig) ? pluginConfig.softInstallDir : undefined,
      ...modalOptions,
    })
  },
  /**
   * 显示任务的插件配置详细信息
   * @param task
   * @param modalOptions
   */
  showTask(
    task: PluginExecTask,
    modalOptions: Omit<PluginConfigModalOptions, 'configs' | 'pluginId' | 'pluginName' | 'totalItemNum'>,
  ): Promise<'confirm' | 'cancel'> {
    return this.show({
      title: '任务配置详情',
      configs: task.taskResults.map((item) => ({ name: item.configName, items: item.configItems })),
      pluginId: task.pluginId,
      pluginName: task.pluginName,
      totalItemNum: task.totalProgress,
      softInstallDir: task.softInstallDir,
      cTime: task.cTime,
      backupPath: task.backupPath,
      confirmBtnText: modalOptions.showCancel?'确定':'关闭',
      ...modalOptions,
    })
  },
  show(options: PluginConfigModalOptions): Promise<'confirm' | 'cancel'> {
    return new Promise((resolve) => {
      // 创建容器
      const container = document.createElement('div')
      // 关闭处理器
      const close = (type: 'confirm' | 'cancel') => {
        // 等待动画完成
        setTimeout(() => {
          // 卸载相关资源
          render(null, container)
          container.remove()
          instances = instances.filter((ins) => ins !== vNode)
          resolve(type)
        }, 300)
      }
      // 创建虚拟节点
      const vNode = createVNode(PluginConfigModal, {
        ...options,
        modelValue: true,
        modal: true,
        onClose: close,
      })
      // 记录实例
      instances.push(vNode)
      // 渲染到DOM
      render(vNode, container)
      document.body.appendChild(container.firstElementChild!)
    })
  },
}
