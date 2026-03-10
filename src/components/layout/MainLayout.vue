<template>
  <div class="layout" :class="{ 'sidebar-collapsed': isCollapsed }">
    <!-- 移动端遮罩 -->
    <div
      v-if="isMobileMenuOpen"
      class="mobile-overlay"
      @click="closeMobileMenu"
    ></div>

    <!-- 侧边栏 -->
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
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ 'active': isActive(item.path) }"
          @click="closeMobileMenu"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <!-- 主题切换 -->
        <button class="nav-item" @click="toggleTheme">
          <span class="nav-icon" v-html="isDark ? sunIcon : moonIcon"></span>
          <span v-if="!isCollapsed" class="nav-label">{{ isDark ? '浅色模式' : '深色模式' }}</span>
        </button>

        <!-- 用户状态 -->
        <template v-if="userStore.isLoggedIn">
          <router-link to="/settings" class="nav-item" @click="closeMobileMenu">
            <span class="nav-icon user-avatar">
              <img v-if="userStore.user?.avatar" :src="userStore.user.avatar" alt="avatar" />
              <span v-else>{{ (userStore.user?.nickname || userStore.user?.email || 'U')[0].toUpperCase() }}</span>
            </span>
            <span v-if="!isCollapsed" class="nav-label">{{ userStore.user?.nickname || userStore.user?.email }}</span>
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

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 移动端顶部栏 -->
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useThemeStore } from '../../stores/theme'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const userStore = useUserStore()

const isCollapsed = ref(false)
const isMobileMenuOpen = ref(false)
const windowWidth = ref(window.innerWidth)

const isDark = computed(() => themeStore.isDark)

// 图标
const homeIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>'
const leaderboardIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21V11M16 21V7M12 21V3"/></svg>'
const recordIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>'
const submitIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
const moonIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
const sunIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
const loginIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10,17 15,12 10,7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>'
const logoutIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
const algdbIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <text x="6" y="10" font-size="10" text-anchor="middle" font-family="Arial" font-weight="770" stroke="none" fill="currentColor">R</text>
  <text x="18" y="10" font-size="10" text-anchor="middle" font-family="Arial" font-weight="770" stroke="none" fill="currentColor">F'</text>
  <text x="6" y="22" font-size="10" text-anchor="middle" font-family="Arial" font-weight="770" stroke="none" fill="currentColor">U'</text>
  <text x="18" y="22" font-size="10" text-anchor="middle" font-family="Arial" font-weight="770" stroke="none" fill="currentColor">D</text>
</svg>`;

const navItems = [
  { path: '/', label: '首页', icon: homeIcon },
  { path: '/leaderboard', label: '排行榜', icon: leaderboardIcon },
  { path: '/players', label: '选手', icon: recordIcon },
  { path: '/algdb', label: '公式库', icon: algdbIcon },
  { path: '/submit', label: '提交成绩', icon: submitIcon, requiresAuth: true }
]

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

/* 侧边栏 */
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

/* 导航 */
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
  background: var(--color-primary);
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

/* 主内容区 */
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

/* 移动端 */
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

  .main-content {
    margin-left: 0;
  }

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