<script setup></script>

<template>
  <main>
    <div>
      <el-button type="primary" @click="del">del</el-button>
      <el-button type="primary" @click="set">set</el-button>
      <div v-if="currUser != null">当前: {{ `${currUser.mid} ${currUser.name}` }}</div>
      <div v-for="user in loggedUsers" :key="user.mid">
        <div>{{ user.mid }}</div>
        <div>{{ user.name }}</div>
        <div>{{ user.face }}</div>
        <div>{{ user.cookie }}</div>
      </div>
    </div>
  </main>
</template>

<script>
import { LoggedUserStore } from '@/stores/logged-user'
import { mapActions } from 'pinia'

export default {
  components: {
  },
  data() {
    return {}
  },
  computed: {
    loggedUsers() {
      let loggedUserStore = LoggedUserStore()
      return loggedUserStore.getLoggedUserList
    },
    currUser() {
      let loggedUserStore = LoggedUserStore()
      return loggedUserStore.getCurrUser
    },
  },
  methods: {
    ...mapActions(LoggedUserStore, ['save', 'delete']),
    async del() {
      let id = Math.floor(Math.random() * 10)
      this.delete('' + id)
    },
    async set() {
      let id = Math.floor(Math.random() * 10)
      let id2 = Math.floor(Math.random() * 1000)
      this.save({
        mid: `${id}`,
        name: `name-${id}`,
        face: `face-${id2}`,
        cookie: `cookie-${id2}`,
      })
    },
  },
}
</script>
