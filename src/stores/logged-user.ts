import { defineStore } from 'pinia'

type LoggedUser = {
  mid: string
  name: string
  face: string
  cookie: string
}

interface State {
  // 当前登录的用户
  userList: LoggedUser[]
  // 当前选择的用户
  currUser: LoggedUser | null
}

export const LoggedUserStore = defineStore('LoggedUserStore', {
  state: (): State => {
    return {
      userList: [],
      currUser: null,
    }
  },
  getters: {
    getLoggedUserList: (state) => state.userList,
    getCurrUser: (state) => state.currUser,
  },
  actions: {
    save(newUser: LoggedUser) {
      let isNewUser = true
      this.userList.forEach((user: LoggedUser) => {
        if (user.mid === newUser.mid) {
          isNewUser = false
          for (let key in user) {
            user[key] = newUser[key]
          }
          this.currUser = user
        }
      })
      if (isNewUser) {
        this.userList.push(newUser)
        this.currUser = newUser
      }
    },
    delete(mid: string) {
      this.userList = this.userList.filter((user: LoggedUser) => {
        if (mid === this.currUser.mid) {
          this.currUser = null
        }
        return user.mid !== mid
      })
    },
  },
  persist: true,
})
