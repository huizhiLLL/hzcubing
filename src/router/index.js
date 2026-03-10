import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('../views/LeaderboardView.vue')
  },
  {
    path: '/gr',
    name: 'GR',
    component: () => import('../views/GRView.vue')
  },
  {
    path: '/players',
    name: 'Players',
    component: () => import('../views/RecordHistoryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/:id',
    redirect: to => ({ name: 'UserProfile', params: { id: to.params.id } })
  },
  {
    path: '/profile/:id',
    name: 'UserProfile',
    component: () => import('../views/UserProfileView.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileHomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/submit',
    name: 'SubmitRecord',
    component: () => import('../views/SubmitRecordView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('../views/AuthView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Auth', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
