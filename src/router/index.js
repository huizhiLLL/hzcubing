import { createRouter, createWebHistory } from 'vue-router'

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
    path: '/record-history',
    name: 'RecordHistory',
    component: () => import('../views/RecordHistoryView.vue')
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: () => import('../views/UserProfileView.vue')
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

export default router