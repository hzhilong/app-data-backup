import { createVNode, render, type VNode, type VNodeTypes } from 'vue'
import { type MyPluginConfig, type ValidatedPluginConfig } from '@/types/PluginConfig'
import PluginConfigModal from '@/components/modal/PluginConfigModal.vue'
import type { PluginExecTask } from '@/types/PluginTask'
import TaskModal from '@/components/modal/TaskModal.vue'

export interface PluginConfigModalOptions {
  plugins: ValidatedPluginConfig[] | MyPluginConfig[]
  modal?: boolean
  title?: string
  showCancel?: boolean
  confirmBtnText?: string
  onBeforeClose?: () => boolean
}

export interface TaskModalOptions {
  tasks: PluginExecTask[]
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
export const GlobalModal = {
  /**
   * 显示插件配置详细信息
   * @param pluginConfigs
   * @param modalOptions
   */
  showPluginConfig(
    pluginConfigs: ValidatedPluginConfig[] | MyPluginConfig[],
    modalOptions: Omit<PluginConfigModalOptions, 'plugins'>,
  ): Promise<'confirm' | 'cancel'> {
    return this.show(PluginConfigModal, {
      title: '配置详情',
      plugins: pluginConfigs,
      confirmBtnText: modalOptions.showCancel ? '确定' : '关闭',
      ...modalOptions,
    })
  },
  showTasks(tasks: PluginExecTask[], modalOptions: Omit<TaskModalOptions, 'tasks'>): Promise<'confirm' | 'cancel'> {
    return this.show(TaskModal, {
      title: '配置详情',
      tasks: tasks,
      confirmBtnText: modalOptions.showCancel ? '确定' : '关闭',
      ...modalOptions,
    })
  },
  show(vNodeTypes: VNodeTypes, options: any): Promise<'confirm' | 'cancel'> {
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
      const vNode = createVNode(vNodeTypes, {
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
