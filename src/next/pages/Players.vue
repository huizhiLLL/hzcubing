<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api, message, type Player } from '../api'
const people = ref<Player[]>([])
const search = ref('')
const key = ref('')
const page = ref(1)
const more = ref(false)
const loading = ref(true)
const error = ref('')
watch([page, key], async ([number, term], _, onCleanup) => {
  const control = new AbortController()
  onCleanup(() => control.abort())
  loading.value = true; error.value = ''
  try {
    const result = await api<{ users: Player[]; more: boolean }>(`/players?${new URLSearchParams({ q: term, page: String(number) })}`, { signal: control.signal })
    people.value = result.users; more.value = result.more
  } catch (cause) { if (!control.signal.aborted) error.value = message(cause) }
  finally { if (!control.signal.aborted) loading.value = false }
}, { immediate: true })
</script>

<template>
  <header class="page-heading"><h1>选手</h1></header>
  <form class="search toolbar" @submit.prevent="page = 1; key = search"><label>选手 <input v-model="search" type="search" placeholder="昵称或 WCA ID" maxlength="50"></label><button>搜索</button></form>
  <p v-if="loading" class="notice" role="status">正在加载选手…</p>
  <p v-else-if="error" class="notice error" role="alert">{{ error }}</p>
  <p v-else-if="!people.length" class="notice">没有找到符合条件的选手。</p>
  <ul v-else class="players-grid">
    <li v-for="player in people" :key="player.userNo"><RouterLink :to="`/user/${player.userNo}`" class="player-link">
      <img v-if="player.avatar" class="avatar" :src="player.avatar" alt="" width="42" height="42" loading="lazy">
      <span v-else class="avatar fallback" aria-hidden="true">{{ [...player.nickname][0] }}</span>
      <span><strong>{{ player.nickname }}</strong><small>{{ player.wcaId || `#${player.userNo}` }}</small></span>
    </RouterLink></li>
  </ul>
  <div v-if="page > 1 || more" class="actions pagination"><button :disabled="page === 1 || loading" @click="page--">上一页</button><button :disabled="!more || loading" @click="page++">下一页</button></div>
</template>
