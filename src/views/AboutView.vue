<template>
  <div class="about">
    <div class="app-logo" @click="switchThemeColor"></div>
    <div class="app-title" @click="setDefaultTheme">{{ appTitle }}</div>
    <div class="infos">
      <div class="info">
        <span class="title">版本：</span>
        <span class="desc">{{ appVersion }}</span>
      </div>
      <div class="info">
        <span class="title">描述：</span>
        <span class="desc">{{ env.APP_DESCRIPTION }}</span>
      </div>
      <div class="info">
        <span class="title">作者：</span>
        <span class="desc">{{ env.APP_AUTHOR_NAME }}</span>
      </div>
      <div class="info">
        <span class="title">邮箱：</span>
        <span class="desc">{{ env.APP_AUTHOR_EMAIL }}</span>
      </div>
      <div class="info">
        <div class="title">开源：</div>
        <div class="desc">
          <a href="" @click.prevent="$appUtil.browsePage(env.APP_AUTHOR_URL)">{{
            env.APP_AUTHOR_URL
          }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'pinia'
import { ThemeColorStore } from '@/stores/theme-color'

export default {
  name: 'AboutView',
  data() {
    return {
      appTitle: import.meta.env.APP_PRODUCT_NAME,
      env: import.meta.env,
    }
  },
  computed: {
    appVersion: function () {
      if (import.meta.env.MODE === 'production') {
        return import.meta.env.APP_VERSION
      } else {
        return `${import.meta.env.APP_VERSION} ${import.meta.env.MODE}`
      }
    },
  },
  mounted() {
    console.log(this.colors)
  },
  methods: {
    ...mapActions(ThemeColorStore, ['switchThemeColor', 'setDefaultTheme']),
  },
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/about';
</style>
