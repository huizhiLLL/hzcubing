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
    component: () => import('../views/PlayersOverviewView.vue')
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
    path: '/admin/meme-events',
    name: 'AdminMemeEvents',
    component: () => import('../views/AdminMemeEventsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('../views/AuthView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return {
        el: to.hash,
        top: 16,
      }
    }

    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isAdmin = ['admin', 'super_admin'].includes(userStore.user?.role)

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Auth', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.requiresAdmin && !isAdmin) {
    next({ name: 'Home' })
    return
  }

  next()
})

export default router
