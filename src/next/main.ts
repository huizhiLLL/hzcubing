import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./pages/Home.vue') },
    { path: '/leaderboard', component: () => import('./pages/Board.vue') },
    { path: '/gr', component: () => import('./pages/Board.vue'), props: { historyMode: true } },
    { path: '/players', component: () => import('./pages/Players.vue') },
    { path: '/user/:userNo', component: () => import('./pages/Player.vue') },
    { path: '/auth', component: () => import('./pages/Auth.vue') },
    { path: '/submit', component: () => import('./pages/Submit.vue') },
    { path: '/events', component: () => import('./pages/Events.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
createApp(App).use(router).mount('#app')
