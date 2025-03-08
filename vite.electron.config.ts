import { defineConfig, mergeConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import baseConfig from './vite.base.config'
import path from 'path'

export default defineConfig(({ mode }) => {
  const base = baseConfig({ mode })
  const viteAlias = {
    vite: {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
    },
  }
  // 深度合并配置
  return mergeConfig(base, {
    plugins: [
      electron({
        main: {
          entry: 'electron/main.ts',
          ...viteAlias,
        },
        preload: {
          input: 'electron/preload.ts',
          ...viteAlias,
        },
      }),
    ],
  })
})
