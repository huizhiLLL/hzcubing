<template>
  <div class="leaderboard">
    <div class="filter-panel">
      <div class="event-selector-wrap">
        <div class="event-selector">
          <button
            v-for="event in visibleEvents"
            :key="event.id"
            class="event-tab"
            :class="{ active: currentEvent === event.id }"
            @click="selectEvent(event.id)"
          >
            <span class="event-name">{{ event.name }}</span>
          </button>
        </div>
        <div v-if="overflowEventOptions.length" class="event-overflow">
          <AppSelect
            :model-value="overflowSelection"
            :options="overflowSelectOptions"
            @update:model-value="handleOverflowSelect"
          />
        </div>
      </div>

      <div class="type-toggle">
        <button class="type-btn" :class="{ active: type === 'single' }" @click="type = 'single'">单次</button>
        <button class="type-btn" :class="{ active: type === 'average' }" @click="type = 'average'">平均</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="sortedRecords.length > 0" class="top-three">
      <div v-for="(player, index) in topThree" :key="player._id || index" class="top-card" :class="['rank-' + (index + 1)]">
        <div class="medal">{{ medals[index] }}</div>
        <router-link :to="`/user/${player.userId}`" class="user-link">
          {{ player.nickname }}
        </router-link>
        <div class="top-time">{{ formatTime(getTimeValue(player)) }}</div>
        <span class="top-date">{{ formatDate(player.timestamp) }}</span>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>暂无{{ currentEventName }}数据</p>
    </div>

    <div v-if="sortedRecords.length > 0" class="rank-table">
      <table>
        <thead>
          <tr>
            <th class="col-rank">排名</th>
            <th class="col-player">选手</th>
            <th class="col-time">成绩</th>
            <th class="col-date">日期</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(player, index) in sortedRecords" :key="player._id || index">
            <td class="col-rank"><span class="rank-num">{{ index + 1 }}</span></td>
            <td class="col-player">
              <router-link :to="`/user/${player.userId}`" class="player-link">
                {{ player.nickname }}
              </router-link>
            </td>
            <td class="col-time">{{ formatTime(getTimeValue(player)) }}</td>
            <td class="col-date">{{ formatDate(player.timestamp) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSelect from '@/components/common/AppSelect.vue'
import { useRecordsStore } from '../stores/records'
import { useEventsStore } from '../stores/events'

const route = useRoute()
const router = useRouter()
const recordsStore = useRecordsStore()
const eventsStore = useEventsStore()

const currentEvent = ref('333')
const type = ref('single')
const loading = ref(false)
const medals = ['🥇', '🥈', '🥉']
const maxVisibleTabs = 8

const allEvents = computed(() => eventsStore.allEvents)
const visibleEvents = computed(() => allEvents.value.slice(0, maxVisibleTabs))
const overflowEventOptions = computed(() => allEvents.value.slice(maxVisibleTabs))
const overflowSelection = computed(() => overflowEventOptions.value.some(event => event.id === currentEvent.value) ? currentEvent.value : '')
const overflowSelectOptions = computed(() => [
  { label: '更多项目', value: '', disabled: true },
  ...overflowEventOptions.value.map(event => ({ label: event.name, value: event.id }))
])
const currentEventName = computed(() => eventsStore.getEventName(currentEvent.value))

const eventRecords = computed(() => recordsStore.records.filter(record => record.event === currentEvent.value))

const sortedRecords = computed(() => {
  const timeField = type.value === 'single' ? 'singleSeconds' : 'averageSeconds'
  const userBestMap = new Map()

  eventRecords.value
    .filter(record => record[timeField] !== null && record[timeField] !== undefined)
    .forEach(record => {
      const userId = String(record.userId)
      if (!userBestMap.has(userId)) {
        userBestMap.set(userId, record)
        return
      }

      const existing = userBestMap.get(userId)
      if (record[timeField] < existing[timeField]) {
        userBestMap.set(userId, record)
      }
    })

  return Array.from(userBestMap.values())
    .sort((a, b) => a[timeField] - b[timeField])
    .slice(0, 100)
})

const topThree = computed(() => sortedRecords.value.slice(0, 3))

function getTimeValue(player) {
  return type.value === 'single' ? player.singleSeconds : player.averageSeconds
}

function formatTime(seconds) {
  return recordsStore.formatTime(seconds) || '--'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function selectEvent(eventId) {
  currentEvent.value = eventId
  router.replace({ query: { ...route.query, event: eventId } })
}

function handleOverflowSelect(eventId) {
  if (!eventId) return
  selectEvent(eventId)
}

watch(() => route.query.event, (newEvent) => {
  if (newEvent && allEvents.value.some(event => event.id === newEvent)) {
    currentEvent.value = newEvent
  }
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      recordsStore.fetchRecords({ pageSize: 2000 }),
      eventsStore.fetchMemeEvents()
    ])

    const initialEvent = route.query.event
    if (initialEvent && allEvents.value.some(event => event.id === initialEvent)) {
      currentEvent.value = initialEvent
    } else {
      currentEvent.value = allEvents.value[0]?.id || '333'
    }
  } catch (err) {
    console.error('Failed to load records:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.leaderboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.filter-panel {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.event-selector-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
  min-width: min(100%, 640px);
}

.event-selector {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: nowrap;
  overflow: hidden;
}

.event-overflow {
  width: 180px;
  flex-shrink: 0;
}

.event-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.72rem 0.95rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.event-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.event-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.type-toggle {
  display: flex;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.type-btn {
  padding: 0.72rem 1rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.type-btn.active {
  background: var(--color-text);
  color: var(--color-bg);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  color: var(--color-text-tertiary);
}

.top-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.top-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  text-align: center;
  position: relative;
}

.top-card.rank-1 {
  border-color: var(--color-gold);
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%);
}

.top-card.rank-2 {
  border-color: var(--color-silver);
  background: linear-gradient(180deg, rgba(156, 163, 175, 0.1) 0%, transparent 100%);
}

.top-card.rank-3 {
  border-color: var(--color-bronze);
  background: linear-gradient(180deg, rgba(205, 127, 50, 0.1) 0%, transparent 100%);
}

.medal {
  position: absolute;
  top: -12px;
  font-size: 1.5rem;
}

.user-link,
.player-link {
  font-weight: 600;
  color: var(--color-text);
}

.top-time {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
}

.top-date {
  color: var(--color-text-tertiary);
}

.rank-table {
  overflow: hidden;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.rank-table table {
  width: 100%;
  border-collapse: collapse;
}

.rank-table th,
.rank-table td {
  padding: 0.9rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
}

.rank-table th {
  background: var(--color-bg-tertiary);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.rank-table tr:last-child td {
  border-bottom: none;
}

.rank-num {
  font-weight: 600;
}

@media (max-width: 900px) {
  .top-three {
    grid-template-columns: 1fr;
  }

  .event-selector-wrap {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .event-selector {
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }

  .event-overflow {
    width: 100%;
  }
}
</style>
