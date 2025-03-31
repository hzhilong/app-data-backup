export const IPC_CHANNELS = {
  WINDOW_CLOSE: 'WINDOW_CLOSE',
  WINDOW_MAX: 'WINDOW_MAX',
  WINDOW_MIN: 'WINDOW_MIN',
  BROWSE_PAGE: 'BROWSE_PAGE',
  GET_INSTALLED_SOFTWARE: 'GET_INSTALLED_SOFTWARE',
  GET_ICON: 'GET_ICON',
  OPEN_REGEDIT: 'OPEN_REGEDIT',
  EXPORT_REGEDIT: 'EXPORT_REGEDIT',
  IMPORT_REGEDIT: 'IMPORT_REGEDIT',
  READ_REGEDIT_VALUES: 'READ_REGEDIT_VALUES',
  OPEN_PATH: 'OPEN_PATH',
  READ_JSON_FILE: 'READ_JSON_FILE',
  WRITE_JSON_FILE: 'WRITE_JSON_FILE',
  COPY_FILE: 'COPY_FILE',
  GET_ENV: 'GET_ENV',
  GET_PLUGINS: 'GET_PLUGINS',
  REFRESH_PLUGINS: 'REFRESH_PLUGINS',
  EXEC_PLUGIN: 'EXEC_PLUGIN',
  STOP_EXEC_PLUGIN: 'STOP_EXEC_PLUGIN',
  GET_PLUGIN_PROGRESS: 'GET_PLUGIN_PROGRESS',
  ON_PLUGIN_ITEM_FINISHED: 'ON_PLUGIN_ITEM_FINISHED',
  SHOULD_USE_DARK_COLORS: 'SHOULD_USE_DARK_COLORS',
  SHOW_OPEN_DIALOG: 'SHOW_OPEN_DIALOG',
  CREATE_BACKUP_DIR: 'CREATE_BACKUP_DIR',
  SAVE_LOG: 'SAVE_LOG',
  /** 打开插件备份配置源路径的选项 参数 OpenPluginConfigSourcePathOptions */
  OPEN_PLUGIN_CONFIG_SOURCE_PATH: 'OPEN_PLUGIN_CONFIG_SOURCE_PATH',
  /** 打开插件备份配置保存路径的选项 参数 OpenPluginConfigTargetPathOptions */
  OPEN_PLUGIN_CONFIG_TARGET_PATH: 'OPEN_PLUGIN_CONFIG_TARGET_PATH',
  /** 更新本地插件 返回类型和REFRESH_PLUGINS一样*/
  UPDATE_LOCAL_PLUGINS: 'UPDATE_LOCAL_PLUGINS',
  /* 打开日志文件目录 */
  OPEN_LOGS_DIR: 'OPEN_LOGS_DIR',
} as const

export type IpcChannels = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
