<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <el-container>
    <el-aside width="180px">
      <el-menu class="menus" mode="vertical" :default-active="menus[0].viewPath">
        <el-menu-item
          class="menu"
          :index="menu.viewPath"
          v-for="menu in menus"
          :key="menu.text"
          @click="menu.onclick !== undefined ? menu.onclick(menu) : {}"
        >
          <span class="iconfont" :class="menu.iconClass"></span>
          <span>{{ menu.text }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-main>
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>

export default {
  components: {},
  data: function () {
    let _this = this
    return {
      menus: [
        {
          text: '数据备份',
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
  mounted() {
    console.log(import.meta.env)
  },
  methods: {
    exitApp: function () {
      try {
        window.require('electron').send('closeWindow')
      }catch (e) {

      }
    },
  },
}
</script>

<style scoped>
@import 'assets/iconfont/iconfont.css';
@import 'assets/home.css';
</style>
