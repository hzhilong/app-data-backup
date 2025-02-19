/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly APP_TITLE?: string
  // 和其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  windowAPI?: {
    closeWindow: () => void
    minWindow: () => void
    maxWindow: () => void
    browsePage: (url) => void
    test: (url) => string
  }
}

