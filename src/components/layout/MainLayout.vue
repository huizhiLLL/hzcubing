<template>
  <div class="layout" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div
      v-if="isMobileMenuOpen"
      class="mobile-overlay"
      @click="closeMobileMenu"
    ></div>

    <aside class="sidebar" :class="{ 'mobile-open': isMobileMenuOpen }">
      <div class="sidebar-header">
        <router-link to="/" class="logo" @click="handleLogoClick">
          <img src="@/assets/favicon.ico" alt="hzcubing" class="nav-logo" />
          <span v-if="!isCollapsed" class="logo-text">hzcubing</span>
        </router-link>
        <button class="collapse-btn" @click="toggleSidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="isCollapsed" d="M9 18l6-6-6-6"/>
            <path v-else d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in visibleNavItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="closeMobileMenu"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button class="nav-item" @click="toggleTheme">
          <span class="nav-icon" v-html="isDark ? sunIcon : moonIcon"></span>
          <span v-if="!isCollapsed" class="nav-label">{{ isDark ? '浅色模式' : '深色模式' }}</span>
        </button>

        <template v-if="userStore.isLoggedIn">
          <router-link :to="profilePath" class="nav-item" @click="closeMobileMenu">
            <span class="nav-icon user-avatar" :style="{ background: avatarBackground }">
              <img v-if="userStore.user?.avatar" :src="userStore.user.avatar" alt="avatar" />
              <span v-else>{{ avatarInitial }}</span>
            </span>
            <span v-if="!isCollapsed" class="nav-label">{{ userStore.user?.nickname || userStore.user?.email }}</span>
          </router-link>
          <router-link
            v-if="['admin', 'super_admin'].includes(userStore.user?.role)"
            to="/admin/meme-events"
            class="nav-item"
            :class="{ active: isActive('/admin/meme-events') }"
            @click="closeMobileMenu"
          >
            <span class="nav-icon" v-html="adminIcon"></span>
            <span v-if="!isCollapsed" class="nav-label">整活项目管理</span>
          </router-link>
          <button class="nav-item" @click="handleLogout">
            <span class="nav-icon" v-html="logoutIcon"></span>
            <span v-if="!isCollapsed" class="nav-label">退出登录</span>
          </button>
        </template>
        <router-link v-else to="/auth" class="nav-item" @click="closeMobileMenu">
          <span class="nav-icon" v-html="loginIcon"></span>
          <span v-if="!isCollapsed" class="nav-label">登录 / 注册</span>
        </router-link>
      </div>
    </aside>

    <main class="main-content">
      <header class="mobile-header">
        <button class="menu-btn" @click="toggleMobileMenu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
        <span class="mobile-title">hzcubing</span>
      </header>

      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useThemeStore } from '../../stores/theme'
import { useUserStore } from '../../stores/user'
import { getAvatarGradient, getInitial } from '@/utils/avatar'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const userStore = useUserStore()

const isCollapsed = ref(false)
const isMobileMenuOpen = ref(false)
const windowWidth = ref(window.innerWidth)

const isDark = computed(() => themeStore.isDark)
const profilePath = computed(() => '/profile')
const avatarInitial = computed(() => getInitial(userStore.user?.nickname || userStore.user?.email))
const avatarBackground = computed(() => getAvatarGradient(userStore.user?.nickname || userStore.user?.email))

const homeIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>'
const leaderboardIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21V11M16 21V7M12 21V3"/></svg>'
const recordIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>'
const grIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16"/><path d="M7 16l3-6 4 3 3-7"/></svg>'
const submitIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
const adminIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"/><path d="M9.5 12.5l1.5 1.5 3.5-3.5"/></svg>'
const moonIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
const sunIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
const loginIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10,17 15,12 10,7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>'
const logoutIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'

const navItems = [
  { path: '/', label: '首页', icon: homeIcon },
  { path: '/leaderboard', label: '排行榜', icon: leaderboardIcon },
  { path: '/gr', label: 'GR', icon: grIcon },
  { path: '/players', label: '选手', icon: recordIcon },
  { path: '/submit', label: '提交成绩', icon: submitIcon }
]

const visibleNavItems = computed(() => navItems)

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleLogoClick = () => {
  if (isCollapsed.value) {
    isCollapsed.value = false
  }
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const handleLogout = () => {
  userStore.logout()
  router.push('/')
  closeMobileMenu()
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
  if (windowWidth.value > 768) {
    isMobileMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 240px;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal), transform var(--transition-normal);
  z-index: 100;
}

.sidebar-collapsed .sidebar {
  width: 72px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-border);
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--color-text);
  font-weight: 600;
  font-size: 1.125rem;
}

.logo-text {
  font-weight: 700;
  letter-spacing: -0.02em;
}

.nav-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.sidebar-collapsed .logo-text {
  display: none;
}

.collapse-btn {
  padding: var(--space-xs);
  color: var(--color-text-tertiary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.sidebar-collapsed .collapse-btn {
  display: none;
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-md) var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  overflow-y: auto;
}

.sidebar-footer {
  padding: var(--space-md) var(--space-sm);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  font-size: 0.9375rem;
  font-family: 'Outfit', sans-serif;
  font-weight: 500;
}

.nav-item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.nav-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.sidebar-collapsed .nav-label {
  display: none;
}

.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: var(--space-sm);
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  min-height: 100vh;
  transition: margin-left var(--transition-normal);
}

.sidebar-collapsed .main-content {
  margin-left: 72px;
}

.page-content {
  padding: var(--space-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--space-md);
  align-items: center;
  gap: var(--space-md);
  z-index: 90;
}

.menu-btn {
  padding: var(--space-sm);
  color: var(--color-text);
}

.mobile-title {
  font-weight: 600;
  font-size: 1.125rem;
}

.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .main-content,
  .sidebar-collapsed .main-content {
    margin-left: 0;
  }

  .page-content {
    padding: var(--space-md);
    padding-top: calc(56px + var(--space-md));
  }

  .mobile-header {
    display: flex;
  }

  .mobile-overlay {
    display: block;
  }
}
</style>
