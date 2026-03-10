<template>
  <div class="gr-page">
    <div class="page-header">
      <div>
        <h1>GR 纪录墙</h1>
        <p class="page-desc">全站各项目的最佳单次与最佳平均</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <span class="loading-icon">⏳</span>
      <p>加载中...</p>
    </div>

    <div v-else-if="rows.length === 0" class="empty-state">
      <span class="empty-icon">📊</span>
      <p>暂无纪录数据</p>
    </div>

    <template v-else>
      <div class="desktop-table">
        <table>
          <thead>
            <tr>
              <th>项目</th>
              <th>最佳单次</th>
              <th>选手</th>
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
              <td>{{ formatTime(row.bestSingleSeconds) }}</td>
              <td>
                <router-link
                  v-if="row.bestSingleUserId"
                  :to="`/user/${row.bestSingleUserId}`"
                  class="user-link"
                >
                  {{ row.bestSingleNickname || '—' }}
                </router-link>
                <span v-else class="muted">—</span>
              </td>
              <td>{{ formatTime(row.bestAverageSeconds) }}</td>
              <td>
                <router-link
                  v-if="row.bestAverageUserId"
                  :to="`/user/${row.bestAverageUserId}`"
                  class="user-link"
                >
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

          <div class="record-block">
            <span class="record-label">最佳单次</span>
            <span class="record-time">{{ formatTime(row.bestSingleSeconds) }}</span>
            <router-link
              v-if="row.bestSingleUserId"
              :to="`/user/${row.bestSingleUserId}`"
              class="user-link"
            >
              {{ row.bestSingleNickname || '—' }}
            </router-link>
          </div>

          <div class="record-block">
            <span class="record-label">最佳平均</span>
            <span class="record-time">{{ formatTime(row.bestAverageSeconds) }}</span>
            <router-link
              v-if="row.bestAverageUserId"
              :to="`/user/${row.bestAverageUserId}`"
              class="user-link"
            >
              {{ row.bestAverageNickname || '—' }}
            </router-link>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRecordsStore } from '../stores/records'
import { events, getEventName } from '../config/events'

const recordsStore = useRecordsStore()
const loading = ref(false)
const bestRecords = ref([])

const eventOrder = events.map(event => event.id)

const rows = computed(() => {
  return [...bestRecords.value]
    .map(item => ({
      ...item,
      eventName: getEventName(item.event)
    }))
    .sort((a, b) => {
      const indexA = eventOrder.indexOf(a.event)
      const indexB = eventOrder.indexOf(b.event)
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
  gap: var(--space-xl);
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
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.loading-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
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
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border-light);
  text-align: left;
}

.desktop-table th {
  background: var(--color-bg-tertiary);
  font-size: 0.875rem;
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
  gap: 2px;
}

.event-name {
  font-weight: 700;
}

.event-code,
.muted {
  color: var(--color-text-tertiary);
  font-size: 0.8125rem;
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
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.record-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border-light);
}

.record-block:first-of-type {
  border-top: none;
  padding-top: 0;
}

.record-label {
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
}

.record-time {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  font-weight: 700;
}

@media (max-width: 768px) {
  .desktop-table {
    display: none;
  }

  .mobile-cards {
    display: grid;
    gap: var(--space-md);
  }
}
</style>
