/// <reference types="vite/client" />
import type { IpcChannels } from '@/models/IpcChannels.ts'
interface ImportMetaEnv {
  readonly APP_TITLE?: string
  // 和其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

