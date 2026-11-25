<script setup lang="ts">
import { CircleUserRound, Layers3, ListOrdered, LogIn, LogOut, Plus, Trophy, UsersRound } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import IconButton from './components/IconButton.vue'
import { loadEvents, loadSession, message, send, session } from './api'
const router = useRouter()
const error = ref('')
onMounted(async () => {
  const results = await Promise.allSettled([loadEvents(), loadSession()])
  const failed = results.find(result => result.status === 'rejected')
  if (failed?.status === 'rejected') error.value = message(failed.reason)
})
async function logout() {
  try { await send('/auth/logout', 'POST'); session.value = null; await router.push('/') }
  catch (cause) { error.value = message(cause) }
}
</script>

<template>
  <a class="skip" href="#main">跳到正文</a>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink class="brand" to="/"><img src="/logo.png" alt="" width="36" height="36">HZCubing</RouterLink>
      <nav aria-label="站点导航">
        <RouterLink class="nav-link" to="/leaderboard"><ListOrdered aria-hidden="true" />榜单</RouterLink>
        <RouterLink class="nav-link" to="/gr"><Trophy aria-hidden="true" />群纪录</RouterLink>
        <RouterLink class="nav-link" to="/players"><UsersRound aria-hidden="true" />选手</RouterLink>
        <RouterLink class="nav-link" to="/events"><Layers3 aria-hidden="true" />项目</RouterLink>
      </nav>
      <div class="header-actions">
        <RouterLink v-if="session" class="icon-action" :to="`/user/${session.userNo}`" aria-label="我的主页" title="我的主页">
          <CircleUserRound aria-hidden="true" />
        </RouterLink>
        <RouterLink v-else class="icon-action" to="/auth" aria-label="登录" title="登录">
          <LogIn aria-hidden="true" />
        </RouterLink>
        <IconButton v-if="session" label="退出登录" @click="logout"><LogOut /></IconButton>
      </div>
    </div>
  </header>
  <main id="main" class="site-main">
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <RouterView />
  </main>
  <footer class="site-footer">
    <span>HZCubing</span>
    <RouterLink class="icon-action" to="/submit" aria-label="录入成绩" title="录入成绩"><Plus aria-hidden="true" /></RouterLink>
  </footer>
</template>
