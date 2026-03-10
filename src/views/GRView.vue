<template>
  <div class="gr-page">
    <div class="page-header">
      <div>
        <h1>GR 纪录墙</h1>
        <p class="page-desc">全站各项目的最佳单次与最佳平均</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="rows.length === 0" class="empty-state">
      <p>暂无纪录数据</p>
    </div>

    <template v-else>
      <div class="desktop-table">
        <table>
          <thead>
            <tr>
              <th>项目</th>
              <th>选手</th>
              <th>最佳单次</th>
              <th>最佳平均</th>
              <th>选手</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.event">
              <td>
                <div class="event-cell">
                  <span class="event-name">{{ row.eventName }}</span>
                  <span class="event-code">{{ row.event }}</span>
                </div>
              </td>
              <td>
                <router-link v-if="row.bestSingleUserId" :to="`/user/${row.bestSingleUserId}`" class="user-link">
                  {{ row.bestSingleNickname || '—' }}
                </router-link>
                <span v-else class="muted">—</span>
              </td>
              <td>{{ formatTime(row.bestSingleSeconds) }}</td>
              <td>{{ formatTime(row.bestAverageSeconds) }}</td>
              <td>
                <router-link v-if="row.bestAverageUserId" :to="`/user/${row.bestAverageUserId}`" class="user-link">
                  {{ row.bestAverageNickname || '—' }}
                </router-link>
                <span v-else class="muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-cards">
        <article v-for="row in rows" :key="row.event" class="gr-card">
          <div class="card-head">
            <span class="event-name">{{ row.eventName }}</span>
            <span class="event-code">{{ row.event }}</span>
          </div>

          <div class="record-block compact">
            <span class="record-label">最佳单次</span>
            <router-link v-if="row.bestSingleUserId" :to="`/user/${row.bestSingleUserId}`" class="user-link">
              {{ row.bestSingleNickname || '—' }}
            </router-link>
            <span class="record-time">{{ formatTime(row.bestSingleSeconds) }}</span>
          </div>

          <div class="record-block compact">
            <span class="record-label">最佳平均</span>
            <router-link v-if="row.bestAverageUserId" :to="`/user/${row.bestAverageUserId}`" class="user-link">
              {{ row.bestAverageNickname || '—' }}
            </router-link>
            <span class="record-time">{{ formatTime(row.bestAverageSeconds) }}</span>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRecordsStore } from '../stores/records'
import { useEventsStore } from '../stores/events'

const recordsStore = useRecordsStore()
const eventsStore = useEventsStore()
const loading = ref(false)
const bestRecords = ref([])

const eventOrder = computed(() => eventsStore.allEvents.map(event => event.id))

const rows = computed(() => {
  return [...bestRecords.value]
    .map(item => ({
      ...item,
      eventName: eventsStore.getEventName(item.event)
    }))
    .sort((a, b) => {
      const indexA = eventOrder.value.indexOf(a.event)
      const indexB = eventOrder.value.indexOf(b.event)
      if (indexA === -1 && indexB === -1) return a.event.localeCompare(b.event)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
})

function formatTime(seconds) {
  return recordsStore.formatTime(seconds) || '—'
}

async function loadGR() {
  loading.value = true
  try {
    await eventsStore.fetchMemeEvents()
    bestRecords.value = await recordsStore.fetchBestRecords()
  } catch (error) {
    console.error('Failed to load GR data:', error)
    bestRecords.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadGR)
</script>

<style scoped>
.gr-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--space-xs);
}

.page-desc {
  color: var(--color-text-secondary);
}

.loading-state,
.empty-state {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.desktop-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.desktop-table table {
  width: 100%;
  border-collapse: collapse;
}

.desktop-table th,
.desktop-table td {
  padding: 0.7rem 0.9rem;
  border-bottom: 1px solid var(--color-border-light);
  text-align: left;
  line-height: 1.35;
}

.desktop-table th {
  background: var(--color-bg-tertiary);
  font-size: 0.84rem;
  color: var(--color-text-secondary);
}

.desktop-table tr:last-child td {
  border-bottom: none;
}

.desktop-table tr:hover td {
  background: var(--color-bg-tertiary);
}

.event-cell,
.card-head {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.event-name {
  font-weight: 700;
}

.event-code,
.muted {
  color: var(--color-text-tertiary);
  font-size: 0.78rem;
}

.user-link {
  color: var(--color-primary);
  font-weight: 600;
}

.mobile-cards {
  display: none;
}

.gr-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.record-block.compact {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.45rem;
  align-items: center;
  padding-top: 0.55rem;
  border-top: 1px solid var(--color-border-light);
}

.record-block.compact:first-of-type {
  border-top: none;
  padding-top: 0;
}

.record-label {
  font-size: 0.78rem;
  color: var(--color-text-tertiary);
}

.record-time {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 700;
  justify-self: end;
}

@media (max-width: 768px) {
  .desktop-table {
    display: none;
  }

  .mobile-cards {
    display: grid;
    gap: 0.75rem;
  }
}
</style>
