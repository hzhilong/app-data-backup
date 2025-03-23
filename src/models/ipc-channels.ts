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
  /** 打开任务备份配置路径 参数 OpenTaskConfigPathOptions */
  OPEN_TASK_CONFIG_PATH: 'OPEN_TASK_CONFIG_PATH',
} as const

export type IpcChannels = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
