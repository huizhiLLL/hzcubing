<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api, eventList, message } from '../api'
const summary = ref<{ users: number; records: number; events: number }>()
const error = ref('')
onMounted(async () => {
  try { summary.value = await api('/summary') }
  catch (cause) { error.value = message(cause) }
})
</script>

<template>
  <section class="home-intro">
    <div>
      <p class="overline">HZCUBING · 魔方社区</p>
      <h1>魔方成绩册</h1>
      <p class="lead">录下每一次进步，看看群友们拧得有多快。</p>
      <div class="actions"><RouterLink class="button primary" to="/leaderboard">查看榜单 <span aria-hidden="true">↗</span></RouterLink><RouterLink class="button" to="/submit">录入成绩</RouterLink></div>
    </div>
    <dl v-if="summary" class="summary-grid" aria-label="社区统计">
      <div><dt>成绩</dt><dd>{{ summary.records.toLocaleString() }}</dd></div>
      <div><dt>选手</dt><dd>{{ summary.users.toLocaleString() }}</dd></div>
      <div><dt>项目</dt><dd>{{ summary.events.toLocaleString() }}</dd></div>
    </dl>
    <p v-else-if="error" class="notice error" role="alert">{{ error }}</p>
  </section>
  <section class="section">
    <div class="section-head"><h2>常用项目</h2><RouterLink to="/events">全部项目 ↗</RouterLink></div>
    <ul class="quick-grid">
      <li v-for="event in eventList.filter(row => row.category === 'official').slice(0, 8)" :key="event.code">
        <RouterLink :to="{ path: '/leaderboard', query: { event: event.code } }"><strong>{{ event.name }}</strong><span>{{ event.code }}</span></RouterLink>
      </li>
    </ul>
  </section>
</template>
