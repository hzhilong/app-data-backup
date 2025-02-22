<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <el-container class="app-container">
    <el-aside class="left-side">
      <div class="app-infos">
        <div class="app-title">
          <div class="app-logo"></div>
          {{ appTitle }}
        </div>
      </div>
      <el-menu class="menus" mode="vertical" :default-active="defaultMenuIndex">
        <el-menu-item
          class="menu"
          :index="menu.viewPath"
          v-for="menu in menus"
          :key="menu.text"
          @click="menu.onclick !== undefined ? menu.onclick() : onClickMenu(menu)"
        >
          <span class="iconfont" :class="menu.iconClass"></span>
          <span>{{ menu.text }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container class="right-side">
      <div class="top-bar">
        <div class="top-bar-btns">
          <span class="btn iconfont icon-min" @click="$appUtil.minApp()"></span>
          <span
            class="btn iconfont"
            :class="windowMax ? 'icon-max2' : 'icon-max'"
            @click="
              () => {
                windowMax = !windowMax
                $appUtil.maxApp()
              }
            "
          ></span>
          <span class="btn iconfont icon-close" @click="$appUtil.exitApp()"></span>
        </div>
      </div>
      <el-main class="content-wrapper">
        <div class="content">
          <RouterView />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ThemeColorStore } from '@/stores/theme-color'

interface MenuItem {
  text: string
  menuTitle?: string
  iconClass: string
  viewPath: string
  onclick?: () => void
}

export default defineComponent({
  components: {},
  data: function () {
    return {
      windowMax: false as boolean,
      appTitle: import.meta.env.APP_PRODUCT_NAME as string,
      menus: [
        {
          text: '首页',
          iconClass: 'icon-dashboard',
          viewPath: '/dashboard',
        },
        {
          text: '数据备份',
          iconClass: 'icon-app',
          viewPath: '/backup',
        },
        {
          text: '数据还原',
          iconClass: 'icon-app',
          viewPath: '/res',
        },
        {
          text: '应用管理',
          iconClass: 'icon-app',
          viewPath: '/man',
        },
        {
          text: '设置',
          iconClass: 'icon-setting',
          viewPath: '/settings',
        },
        {
          text: '关于',
          iconClass: 'icon-about',
          viewPath: '/about',
        },
        {
          text: '退出',
          iconClass: 'icon-exit',
          viewPath: '/exit',
          onclick: () => {
            this.$appUtil.exitApp()
          },
        },
      ] as MenuItem[],
    }
  },
  computed: {
    defaultMenuIndex(): string {
      // 当前页面所属菜单
      const matchedItem = this.menus.find((item: MenuItem) => item.viewPath === this.$route.path)
      return matchedItem ? matchedItem.viewPath : this.menus[0].viewPath
    },
    menuTitle: function (): string {
      const menuTitle:string = this.$route.query.menuTitle as string
      return menuTitle !== undefined ? menuTitle : this.getMenuTitle(this.menus[0])
    },
  },
  created() {
    ThemeColorStore().initThemeColor()
  },
  methods: {
    getMenuTitle(menu: MenuItem): string {
      return menu.menuTitle !== undefined ? menu.menuTitle : menu.text
    },
    onClickMenu(menu: MenuItem): void {
      this.$router.push({
        path: menu.viewPath,
        query: {
          menuTitle: this.getMenuTitle(menu),
        },
      })
    },
  },
})
</script>

<style scoped lang="scss">
@use '@/assets/scss/home';
</style>
