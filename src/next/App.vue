<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
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
        <RouterLink to="/leaderboard">榜单</RouterLink>
        <RouterLink to="/gr">群纪录</RouterLink>
        <RouterLink to="/players">选手</RouterLink>
        <RouterLink to="/events">项目</RouterLink>
      </nav>
      <div class="header-actions">
        <RouterLink v-if="session" :to="`/user/${session.userNo}`">我的主页</RouterLink>
        <RouterLink v-else to="/auth">登录</RouterLink>
        <button v-if="session" type="button" class="text-button" @click="logout">退出</button>
      </div>
    </div>
  </header>
  <main id="main" class="site-main">
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <RouterView />
  </main>
  <footer class="site-footer"><span>HZCubing</span><RouterLink to="/submit">录入成绩</RouterLink></footer>
</template>
