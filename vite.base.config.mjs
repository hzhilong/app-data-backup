import { fileURLToPath, URL } from 'node:url'

import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from 'vite-plugin-html'
import path from 'path'
import packageJson from './package.json'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

/**
 * 获取应用标题
 */
function getAppTitle(mode, env, packageJson) {
  if (mode === 'production') {
    return `${packageJson.productName} ${packageJson.version}`
  } else {
    return `${packageJson.productName} ${packageJson.version} ${mode}`
  }
}

// https://vite.dev/config/ or https://vitejs.cn/vite5-cn/guide/
export default ({ mode }) => {
  // 环境变量前缀
  const envPrefixes = ['VITE_', 'APP_']
  // 环境变量目录
  let envDir = path.resolve(__dirname, 'env')
  // 加载当前模式的所有环境变量
  const env = loadEnv(mode, envDir, '')
  env.APP_PRODUCT_NAME = packageJson.productName
  env.APP_VERSION = packageJson.version
  env.APP_TITLE = getAppTitle(mode, env, packageJson)
  let defineData = {
    // __APP_NAME__: JSON.stringify(packageJson.productName),
    // __APP_VERSION__: JSON.stringify(packageJson.version),
    // __API_AUTHOR_NAME__: JSON.stringify(packageJson.author.name),
    // __API_AUTHOR_URL__: JSON.stringify(packageJson.author.url),
    'import.meta.env.APP_PRODUCT_NAME': JSON.stringify(env.APP_PRODUCT_NAME),
    'import.meta.env.APP_VERSION': JSON.stringify(env.APP_VERSION),
    'import.meta.env.APP_TITLE': JSON.stringify(env.APP_TITLE),
  }
  console.log('========================================================')
  console.log('项目名称：', packageJson.productName)
  console.log('当前模式：', mode)
  console.log('当前环境变量：')
  Object.keys(env).forEach((key) => {
    for (let envPrefix of envPrefixes) {
      if (key.startsWith(envPrefix)) {
        console.log(`   ${key} = ${env[key]}`)
      }
    }
  })
  console.log('========================================================')
  return {
    // 环境变量目录
    envDir: envDir,
    // 环境变量前缀
    envPrefix: envPrefixes,
    plugins: [
      vue(),
      // 按需引入组件 https://github.com/unplugin/unplugin-vue-components
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      // https://github.com/vbenjs/vite-plugin-html/blob/main/README.zh_CN.md
      createHtmlPlugin({
        // 注入 HTML 的数据
        inject: {
          // 注入的数据
          data: {
            // 目前该变量的注入方法使用vite自带的【HTML 环境变量替换】+ define复写【import.meta.env.*】
            // APP_TITLE: env.APP_TITLE,
          },
        },
      }),
    ],
    // 定义全局常量替换（适用于一些常量，在js使用）
    define: defineData,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
}
