import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { createHtmlPlugin } from 'vite-plugin-html'
import packageJson from './package.json'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

/**
 * 获取应用标题
 */
function getAppTitle(mode: string, packageJsonData: typeof packageJson): string {
  if (mode === 'production') {
    return `${packageJsonData.productName} ${packageJsonData.version}`
  } else {
    return `${packageJsonData.productName} ${packageJsonData.version} ${mode}`
  }
}

function initEnvDefine(env: Record<string, string>, newEnv: Record<string, string>) {
  const defineData: Record<string, string> = {}
  Object.keys(newEnv).forEach((key) => {
    env[key] = newEnv[key]
    defineData[`import.meta.env.${key}`] = JSON.stringify(newEnv[key])
  })
  return defineData
}

// https://vite.dev/config/ or https://vitejs.cn/vite5-cn/guide/
export default ({ mode }: { mode: string }) => {
  // 环境变量前缀
  const envPrefixes = ['VITE_', 'APP_']
  // 环境变量目录
  const envDir = path.resolve(__dirname, 'env')
  // 加载当前模式的所有环境变量
  const env = loadEnv(mode, envDir, '')
  const defineData = initEnvDefine(env, {
    APP_PRODUCT_NAME: packageJson.productName,
    APP_DESCRIPTION: packageJson.appDescription,
    APP_VERSION: packageJson.version,
    APP_AUTHOR_NAME: packageJson.author.name,
    APP_AUTHOR_EMAIL: packageJson.author.email,
    APP_AUTHOR_URL: packageJson.author.url,
    APP_TITLE: getAppTitle(mode, packageJson),
  })
  console.log('========================================================')
  console.log('项目名称：', packageJson.productName)
  console.log('当前模式：', mode)
  console.log('当前环境变量：')
  Object.keys(env).forEach((key) => {
    for (const envPrefix of envPrefixes) {
      if (key.startsWith(envPrefix)) {
        console.log(`   ${key} = ${env[key]}`)
      }
    }
  })
  console.log('========================================================')
  return {
    base: './', // 关键！确保静态资源使用相对路径
    // 环境变量目录
    envDir: envDir,
    // 环境变量前缀
    envPrefix: envPrefixes,
    plugins: [
      vue(),
      vueJsx(),
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
    css: {
      preprocessorOptions: {
        scss: {
          // 全局引入,但webstorm好像不识别,算了,手动在home.scss引入
          // additionalData: '@import "@/assets/scss/global.scss";',
          // 覆盖 element-plus的变量
          // additionalData: `@use "@/assets/scss/element.scss" as *;`,
        },
      },
    },
  }
}
