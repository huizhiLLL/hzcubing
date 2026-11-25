<script setup lang="ts">
import { Plus, Search } from '@lucide/vue'
import IconButton from '../components/IconButton.vue'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api, categories, day, eventList, message, time, type RecordInfo } from '../api'
const props = defineProps<{ historyMode?: boolean }>()
const route = useRoute()
const router = useRouter()
const event = computed(() => typeof route.query.event === 'string' ? route.query.event : '333')
const metric = computed(() => route.query.type === 'average' ? 'average' : 'single')
const search = ref('')
const query = ref('')
const rows = ref<RecordInfo[]>([])
const loading = ref(false)
const error = ref('')
const groups = computed(() => Object.entries(categories).map(([key, label]) => ({ label, events: eventList.value.filter(row => row.category === key) })))
function update(key: string, value: string) { return router.replace({ query: { ...route.query, [key]: value } }) }
watch([event, metric, query, () => props.historyMode], async ([code, kind, term, history], _, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  loading.value = true; error.value = ''
  try {
    const params = new URLSearchParams({ event: code, type: kind, q: term })
    const result = history ? (await api<Record<'single' | 'average', RecordInfo[]>>(`/records/gr?${params}`, { signal: controller.signal }))[kind]
      : await api<RecordInfo[]>(`/records/leaderboard?${params}`, { signal: controller.signal })
    if (!controller.signal.aborted) rows.value = result
  } catch (cause) { if (!controller.signal.aborted) error.value = message(cause) }
  finally { if (!controller.signal.aborted) loading.value = false }
}, { immediate: true })
</script>

<template>
  <header class="page-heading"><h1>{{ historyMode ? '群纪录' : '成绩榜单' }}</h1><RouterLink class="icon-action" to="/submit" aria-label="录入成绩" title="录入成绩"><Plus aria-hidden="true" /></RouterLink></header>
  <div class="toolbar">
    <label>项目 <select :value="event" @change="update('event', ($event.target as HTMLSelectElement).value)">
      <optgroup v-for="group in groups" :key="group.label" :label="group.label"><option v-for="item in group.events" :key="item.code" :value="item.code">{{ item.name }}</option></optgroup>
    </select></label>
    <div class="segments" aria-label="成绩类型"><button type="button" :aria-pressed="metric === 'single'" @click="update('type', 'single')">单次</button><button type="button" :aria-pressed="metric === 'average'" @click="update('type', 'average')">平均</button></div>
    <form v-if="!historyMode" class="search" role="search" @submit.prevent="query = search">
      <input v-model="search" aria-label="选手昵称" type="search" maxlength="50" placeholder="选手昵称">
      <IconButton type="submit" label="搜索"><Search /></IconButton>
    </form>
  </div>
  <p v-if="loading" class="notice" role="status">正在加载成绩…</p>
  <p v-else-if="error" class="notice error" role="alert">{{ error }}</p>
  <p v-else-if="!rows.length" class="notice">暂无成绩。</p>
  <div v-else class="table-wrap"><table>
    <thead><tr><th v-if="!historyMode" scope="col" class="rank">排名</th><th scope="col">选手</th><th scope="col" class="numeric">成绩</th><th scope="col" class="secondary-col">器材</th><th scope="col" class="date-col">日期</th></tr></thead>
    <tbody><tr v-for="row in rows" :key="row.id">
      <td v-if="!historyMode" class="rank" :class="{ podium: row.rank && row.rank <= 3 }">{{ row.rank }}</td>
      <td><RouterLink :to="`/user/${row.userNo}`">{{ row.nickname }}</RouterLink></td>
      <td class="numeric result-time">{{ time(metric === 'average' ? row.averageSeconds : row.singleSeconds) }}</td>
      <td class="secondary-col">{{ row.cube || '—' }}</td><td class="date-col">{{ day(row.timestamp) }}</td>
    </tr></tbody>
  </table></div>
</template>
