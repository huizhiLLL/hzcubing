<template>
  <div class="record-history">
    <!-- Event Selector -->
    <div class="event-selector">
      <button
        v-for="event in events"
        :key="event.id"
        class="event-tab"
        :class="{ active: currentEvent === event.id }"
        @click="selectEvent(event.id)"
      >
        <span class="event-name">{{ event.name }}</span>
      </button>
    </div>

    <!-- Timeline Header -->
    <div class="timeline-header">
      <h2>{{ currentEventName }} 记录历程</h2>
      <p class="timeline-subtitle">见证每一次纪录的诞生</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="loading-icon">⏳</span>
      <p>加载中...</p>
    </div>

    <!-- Timeline -->
    <div v-else-if="records.length > 0" class="timeline">
      <div
        v-for="(record, index) in records"
        :key="record._id"
        class="timeline-item"
        :class="{ 'latest': index === 0 }"
      >
        <div class="timeline-marker">
          <div class="marker-dot"></div>
          <div v-if="index < records.length - 1" class="marker-line"></div>
        </div>
        <div class="timeline-content">
          <div class="record-card">
            <div class="record-header">
              <router-link :to="`/user/${record.userId}`" class="user-link">
                {{ record.nickname }}
              </router-link>
              <span class="record-date">{{ formatDate(record.timestamp) }}</span>
            </div>
            <div class="record-time">
              <span class="time-label">成绩</span>
              <span class="time-value">
                {{ formatTime(record.singleSeconds || record.averageSeconds) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <span class="empty-icon">📜</span>
      <p>暂无{{ currentEventName }}记录</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRecordsStore } from '../stores/records'
import { events } from '../config/events'

const route = useRoute()
const recordsStore = useRecordsStore()

const currentEvent = ref('3x3')
const loading = ref(false)
const records = ref([])

// Event mapping
const eventMapping = {
  '3x3': '333', '2x2': '222', '4x4': '444', '5x5': '555',
  '3x3OH': '333oh', '3x3BLD': '333bf', '3x3FM': '333fm',
  'Pyraminx': 'py', 'Megaminx': 'meg', 'Skewb': 'sk',
  'Clock': 'clock', 'Sq1': 'sq1'
}

const currentEventName = computed(() => {
  return events.find(e => e.id === currentEvent.value)?.name || currentEvent.value
})

function formatTime(seconds) {
  return recordsStore.formatTime(seconds) || '--'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

async function loadRecords() {
  loading.value = true
  try {
    const backendEvent = eventMapping[currentEvent.value] || currentEvent.value
    const allRecords = await recordsStore.fetchUserRecords('all', { pageSize: 500 })
    
    // Filter by event
    records.value = allRecords.filter(r => r.event === backendEvent)
  } catch (err) {
    console.error('Failed to load records:', err)
    records.value = []
  } finally {
    loading.value = false
  }
}

function selectEvent(eventId) {
  currentEvent.value = eventId
}

watch(currentEvent, loadRecords)

onMounted(() => {
  // Check URL for event parameter
  if (route.query.event && events.find(e => e.id === route.query.event)) {
    currentEvent.value = route.query.event
  }
  loadRecords()
})
</script>

<style scoped>
.record-history {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Loading & Empty States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  color: var(--color-text-tertiary);
}

.loading-icon, .empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
}

/* Event Selector */
.event-selector {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.event-tab {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  transition: all var(--transition-fast);
}

.event-tab:hover {
  border-color: var(--color-primary);
}

.event-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* Timeline Header */
.timeline-header {
  margin-bottom: var(--space-md);
}

.timeline-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.timeline-subtitle {
  color: var(--color-text-tertiary);
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: var(--space-xl);
}

.timeline-item {
  position: relative;
}

.timeline-marker {
  position: absolute;
  left: calc(-1 * var(--space-xl) + 6px);
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-border);
  border: 2px solid var(--color-bg);
  z-index: 1;
}

.timeline-item.latest .marker-dot {
  background: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-light);
}

.marker-line {
  width: 2px;
  flex: 1;
  background: var(--color-border);
  margin-top: var(--space-sm);
  min-height: 40px;
}

.timeline-content {
  padding-bottom: var(--space-xl);
}

.record-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.timeline-item.latest .record-card {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg-secondary) 100%);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.user-link {
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
}

.user-link:hover {
  color: var(--color-primary);
}

.record-date {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

.record-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.time-label {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.time-value {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .event-selector {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
  }

  .event-selector::-webkit-scrollbar {
    display: none;
  }

  .event-tab {
    flex-shrink: 0;
    padding: var(--space-sm);
  }
}
</style>
