import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      redirect: "/dashboard",
      children: [
        {
          path: '/dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
        },
        {
          path: '/app',
          name: 'app',
          component: () => import('../views/SoftwareManageView.vue'),
        },
        {
          path: '/plugins',
          name: 'plugins',
          component: () => import('../views/PluginConfigView.vue'),
        },
        {
          path: '/backup',
          name: 'backup',
          component: () => import('../views/BackupView.vue'),
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
