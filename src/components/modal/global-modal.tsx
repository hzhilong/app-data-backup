import { createVNode, render, type VNode } from 'vue'
import {
  type BackupConfig,
  isValidatedPluginConfig,
  type PluginConfig,
  type ValidatedPluginConfig,
} from '@/types/PluginConfig'
import PluginConfigModal from '@/components/modal/PluginConfigModal.vue'
import type { PluginExecTask, PluginExecType } from '@/types/PluginTask'

export interface PluginConfigModalData {
  pluginId: string
  pluginName: string
  totalItemNum: number
  configs: BackupConfig[]
  cTime?: string
  softInstallDir?: string
  pluginExecType?: PluginExecType
  backupPath?: string
}

export interface PluginConfigModalOptions {
  plugins: PluginConfigModalData[]
  modal?: boolean
  title?: string
  showCancel?: boolean
  confirmBtnText?: string
  onBeforeClose?: () => boolean
}

let instances: VNode[] = []

/**
 * 全局弹窗
 */
export const GPluginConfigModal = {
  /**
   * 显示插件配置详细信息
   * @param pluginConfigs
   * @param modalOptions
   */
  showPluginConfig(
    pluginConfigs: PluginConfig[] | ValidatedPluginConfig[],
    modalOptions: Omit<PluginConfigModalOptions, 'plugins'>,
  ): Promise<'confirm' | 'cancel'> {
    return this.show({
      title: '配置详情',
      plugins: pluginConfigs.map((pluginConfig) => {
        return {
          pluginId: pluginConfig.id,
          pluginName: pluginConfig.name,
          totalItemNum: pluginConfig.totalItemNum,
          configs: pluginConfig.backupConfigs,
          cTime: pluginConfig.cTime,
          softInstallDir: isValidatedPluginConfig(pluginConfig) ? pluginConfig.softInstallDir : undefined,
        } satisfies PluginConfigModalData
      }),
      confirmBtnText: modalOptions.showCancel ? '确定' : '关闭',
      ...modalOptions,
    })
  },
  /**
   * 显示任务的插件配置详细信息
   * @param tasks
   * @param modalOptions
   */
  showTask(
    tasks: PluginExecTask[],
    modalOptions: Omit<PluginConfigModalOptions, 'plugins'>,
  ): Promise<'confirm' | 'cancel'> {
    return this.show({
      title: '任务配置详情',
      plugins: tasks.map((task) => {
        return {
          pluginId: task.pluginId,
          pluginName: task.pluginName,
          totalItemNum: task.totalProgress,
          configs: task.taskResults.map((item) => ({ name: item.configName, items: item.configItems })),
          cTime: task.cTime,
          softInstallDir: task.softInstallDir,
          pluginExecType: task.pluginExecType,
          backupPath: task.backupPath,
        }
      }),
      confirmBtnText: modalOptions.showCancel ? '确定' : '关闭',
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
        modelValue: true,
        modal: true,
        ...options,
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
