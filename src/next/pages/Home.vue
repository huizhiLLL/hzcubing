<script setup lang="ts">
import { ListOrdered, Plus } from '@lucide/vue'
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
      <h1>魔方成绩册</h1>
      <div class="actions home-actions">
        <RouterLink class="button primary action-label" to="/leaderboard"><ListOrdered aria-hidden="true" />榜单</RouterLink>
        <RouterLink class="icon-action" to="/submit" aria-label="录入成绩" title="录入成绩"><Plus aria-hidden="true" /></RouterLink>
      </div>
    </div>
    <dl v-if="summary" class="summary-grid" aria-label="社区统计">
      <div><dt>成绩</dt><dd>{{ summary.records.toLocaleString() }}</dd></div>
      <div><dt>选手</dt><dd>{{ summary.users.toLocaleString() }}</dd></div>
      <div><dt>项目</dt><dd>{{ summary.events.toLocaleString() }}</dd></div>
    </dl>
    <p v-else-if="error" class="notice error" role="alert">{{ error }}</p>
  </section>
  <section class="section">
    <div class="section-head">
      <h2>项目榜单</h2>
      <RouterLink class="text-link" to="/events">全部项目</RouterLink>
    </div>
    <ul class="directory-list">
      <li v-for="event in eventList.filter(row => row.category === 'official').slice(0, 8)" :key="event.code">
        <RouterLink class="directory-link" :to="{ path: '/leaderboard', query: { event: event.code } }">
          <strong>{{ event.name }}</strong>
          <small>{{ event.code }}</small>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
