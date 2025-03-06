import dayjs from 'dayjs'

/**
 * 默认的数据根目录
 */
const DEFAULT_ROOT_DIR = '.backup-data'

/**
 * 获取备份目录
 */
const getBackupDir = (rootDir: string = DEFAULT_ROOT_DIR, softName: string) =>
  `${rootDir}/${softName}/${dayjs().format('YYYY-MM-DD_HH-mm-ss')}/`

export { DEFAULT_ROOT_DIR, getBackupDir }
