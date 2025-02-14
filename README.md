# app-data-backup

## 开发文档

### 环境变量的使用

1. `import.meta.env`

    - 一些内置常量：

        - **`import.meta.env.MODE`**: {string} 应用运行的 [模式](https://cn.vite.dev/guide/env-and-mode#modes)。

        - **`import.meta.env.BASE_URL`**: {string} 部署应用时的基本 URL。他由 [`base` 配置项](https://cn.vite.dev/config/shared-options.html#base) 决定。

        - **`import.meta.env.PROD`**: {boolean} 应用是否运行在生产环境（使用 `NODE_ENV='production'` 运行开发服务器或构建应用时使用 `NODE_ENV='production'` ）。

        - **`import.meta.env.DEV`**: {boolean} 应用是否运行在开发环境 (永远与 `import.meta.env.PROD` 相反)。

        - **`import.meta.env.SSR`**: {boolean} 应用是否运行在 [server](https://cn.vite.dev/guide/ssr.html#conditional-logic) 上。

    - `.env` 文件中 `VITE_` 和 `APP_` 前缀的环境变量

2. `define` 定义全局常量替换方式。其中每项在开发环境下会被定义在全局，而在构建时被静态替换。

    项目另外定义了一些基础信息的变量，并覆盖了 `import.meta.env`

    例如 `import.meta.env.APP_TITLE`

3. HTML 环境变量

    例如上述复写的变量：

    ```html
    <title>%APP_TITLE%</title>
    ```

4. `vite-plugin-html` 插件

    可向 HTML 注入数据

### 软件图标

1. 安装包和卸载程序的图标（Windows可能需要重启资源管理器才能刷新该图标）

    ```json
    # electron-builder 的配置
    "nsis": {
    	"installerIcon": "public/favicon.ico",
    	"uninstallerIcon": "public/favicon.ico"
    ```

2. 安装后启动程序的图标（Windows可能需要重启资源管理器才能刷新该图标）

    安装后桌面生成的图标（Windows可能需要刷新图标缓存后才能刷新该图标）

    ```json
    "build": {
        "win": {
          "icon": "public/favicon.ico",
    ```

3. 任务栏的图标、软件右上角的图标

    ```js
    new BrowserWindow({
        icon: path.join(path.resolve(), 'public/app.ico'),
      })
    ```

    
