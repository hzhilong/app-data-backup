import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      redirect: '/dashboard',
      children: [
        {
          path: '/dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
        },
        {
          path: '/soft',
          name: 'soft',
          component: () => import('../views/SoftwareManageView.vue'),
        },
        {
          path: '/plugins',
          name: 'plugins',
          component: () => import('../views/PluginConfigView.vue'),
        },
        {
          path: '/my-plugins',
          name: 'my-plugins',
          component: () => import('../views/MyPluginConfigView.vue'),
        },
        {
          path: '/backup-records',
          name: 'backup-records',
          component: () => import('../views/BackupRecordView.vue'),
        },
        {
          path: '/settings',
          name: 'settings',
          component: () => import('../views/SettingView.vue'),
        },
        {
          path: '/about',
          name: 'about',
          component: () => import('../views/AboutView.vue'),
        },
      ],
    },
    {
      path: '/test',
      name: 'test',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
