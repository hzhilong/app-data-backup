/// <reference types="vite/client" />
// 导入语句会破坏类型增强 https://cn.vite.dev/guide/env-and-mode
interface ImportMetaEnv {
  readonly APP_TITLE: string
  readonly APP_DEFAULT_ROOT_DIR: string
  readonly PROD: boolean
  // 和其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

