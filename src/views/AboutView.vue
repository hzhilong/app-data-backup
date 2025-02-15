<template>
  <div class="about">
    <img class="app-logo" src="@/assets/logo.svg" />
    <div class="app-title">{{ appTitle }}</div>
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
        <span class="title">开源：</span>
        <span class="desc"
          ><a href="" @click.prevent="browsePage(env.APP_AUTHOR_URL)">{{
            env.APP_AUTHOR_URL
          }}</a></span
        >
      </div>
    </div>
  </div>
</template>

<script>
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
    console.log(this.env)
  },
  methods: {
    browsePage(url) {
      try {
        window.require('electron').shell.openExternal(url)
      } catch (e) {
        window.open(url, '_blank')
      }
    },
  },
}
</script>

<style scoped lang="scss">
@use '@/assets/scss/about';
</style>
