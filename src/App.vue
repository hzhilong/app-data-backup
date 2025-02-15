<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <el-container class="app-container">
    <el-aside class="left-side">
      <div class="app-infos">
        <div class="app-title"><img src="/favicon.ico" alt="favicon" />{{ appTitle }}</div>
      </div>
      <el-menu class="menus" mode="vertical" :default-active="menus[0].text">
        <el-menu-item
          class="menu"
          :index="menu.text"
          v-for="menu in menus"
          :key="menu.text"
          @click="menu.onclick !== undefined ? menu.onclick(menu) : onClickMenu(menu)"
        >
          <span class="iconfont" :class="menu.iconClass"></span>
          <span>{{ menu.text }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container class="right-side">
      <div class="top-bar">{{  }}</div>
      <el-main class="content-wrapper">
        <div class="content">
          <RouterView />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  components: {},
  data: function () {
    return {
      appTitle: import.meta.env.APP_PRODUCT_NAME,
      menus: [
        {
          text: '备份',
          iconClass: 'icon-app-data',
          viewPath: '/app/data-backup',
        },
        {
          text: '设置',
          iconClass: 'icon-setting',
          viewPath: '/setting',
        },
        {
          text: '关于',
          iconClass: 'icon-about',
          viewPath: '/about',
        },
        {
          text: '退出',
          iconClass: 'icon-exit',
          viewPath: '/',
          onclick: (menu) => {
            this.exitApp()
          },
        },
      ],
    }
  },
  computed: {
    menuTitle: function () {
      let menuTitle = this.$route.query.menuTitle
      return menuTitle !== undefined ? menuTitle : this.getMenuTitle(this.menus[0])
    },
    appSubTitle: function () {
      if (import.meta.env.MODE === 'production') {
        return import.meta.env.APP_VERSION
      } else {
        return `${import.meta.env.APP_VERSION} ${import.meta.env.MODE}`
      }
    },
  },
  mounted() {
    console.log(import.meta.env)
  },
  methods: {
    exitApp() {
      try {
        window.require('electron').ipcRenderer.send('closeWindow')
      } catch (e) {}
    },
    getMenuTitle(menu) {
      return menu.menuTitle !== undefined ? menu.menuTitle : menu.text
    },
    onClickMenu(menu) {
      this.$router.push({
        path: menu.viewPath,
        query: {
          t: new Date().getTime(),
          menuTitle: this.getMenuTitle(menu),
        },
      })
    },
  },
}
</script>

<style scoped lang="scss">
@use 'assets/scss/home';
</style>
