<template>
  <div class="leaderboard">
    <!-- 筛选控制台 -->
    <div class="filter-panel">
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

      <div class="type-toggle">
        <button
          class="type-btn"
          :class="{ active: type === 'single' }"
          @click="type = 'single'"
        >
          单次
        </button>
        <button
          class="type-btn"
          :class="{ active: type === 'average' }"
          @click="type = 'average'"
        >
          平均
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="loading-icon">⏳</span>
      <p>加载中...</p>
    </div>

    <!-- Top 3 卡片 -->
    <div v-else-if="topThree.length > 0" class="top-three">
      <div
        v-for="(player, index) in topThree"
        :key="player._id || index"
        class="top-card"
        :class="['rank-' + (index + 1)]"
      >
        <div class="medal">{{ medals[index] }}</div>
        <router-link :to="`/user/${player.userId}`" class="user-link">
          {{ player.nickname }}
        </router-link>
        <div class="top-time">
          {{ formatTime(getTimeValue(player)) }}
        </div>
        <span class="top-date">{{ formatDate(player.timestamp) }}</span>
      </div>
    </div>

    <!-- 排名表格 -->
    <div v-else-if="sortedRecords.length === 0" class="empty-state">
      <span class="empty-icon">📊</span>
      <p>暂无{{ currentEventName }}数据</p>
    </div>

    <div v-else class="rank-table">
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
            <td class="col-rank">
              <span class="rank-num">{{ index + 1 }}</span>
            </td>
            <td class="col-player">
              <router-link :to="`/user/${player.userId}`" class="player-link">
                {{ player.nickname }}
              </router-link>
            </td>
            <td class="col-time">
              {{ formatTime(getTimeValue(player)) }}
            </td>
            <td class="col-date">{{ formatDate(player.timestamp) }}</td>
          </tr>
        </tbody>
      </table>
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
const type = ref('single')
const loading = ref(false)
const medals = ['🥇', '🥈', '🥉']

const currentEventName = computed(() => {
  const event = events.find(e => e.id === currentEvent.value)
  return event?.name || currentEvent.value
})

// Get all records for current event
const eventRecords = computed(() => {
  return recordsStore.records.filter(r => {
    // Map event IDs (e.g., '3x3' -> '333')
    const eventMapping = {
      '3x3': '333', '2x2': '222', '4x4': '444', '5x5': '555',
      '3x3OH': '333oh', '3x3BLD': '333bf', '3x3FM': '333fm',
      'Pyraminx': 'py', 'Megaminx': 'meg', 'Skewb': 'sk',
      'Clock': 'clock', 'Sq1': 'sq1'
    }
    const mappedEvent = eventMapping[currentEvent.value] || currentEvent.value
    return r.event === mappedEvent
  })
})

// Sort records based on type
const sortedRecords = computed(() => {
  const timeField = type.value === 'single' ? 'singleSeconds' : 'averageSeconds'
  
  return [...eventRecords.value]
    .filter(r => r[timeField] !== null && r[timeField] !== undefined)
    .sort((a, b) => a[timeField] - b[timeField])
    .slice(0, 50) // Limit to top 50
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
  // Update URL
  route.query.event = eventId
}

watch(() => route.query.event, (newEvent) => {
  if (newEvent && events.find(e => e.id === newEvent)) {
    currentEvent.value = newEvent
  }
})

onMounted(async () => {
  // Check URL for event parameter
  if (route.query.event && events.find(e => e.id === route.query.event)) {
    currentEvent.value = route.query.event
  }

  loading.value = true
  try {
    await recordsStore.fetchRecords({ pageSize: 500 })
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

/* Filter Panel */
.filter-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
}

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

.type-toggle {
  display: flex;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.type-btn {
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.type-btn.active {
  background: var(--color-text);
  color: var(--color-bg);
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

/* Top Three */
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
  top: var(--space-sm);
  right: var(--space-sm);
  font-size: 1.5rem;
}

.user-link {
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
}

.user-link:hover {
  color: var(--color-primary);
}

.top-time {
  margin-top: var(--space-sm);
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
}

.top-date {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

/* Table */
.rank-table {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  width: 100%;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th, td {
  padding: var(--space-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
}

th {
  background: var(--color-bg-tertiary);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

tr:last-child td {
  border-bottom: none;
}

tr:hover td {
  background: var(--color-bg-tertiary);
}

.col-rank {
  width: 80px;
}

.col-time {
  width: 150px;
}

.col-date {
  width: 100px;
  color: var(--color-text-tertiary);
}

.rank-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  font-weight: 600;
  font-size: 0.9375rem;
}

.player-link {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
}

.player-link:hover {
  color: var(--color-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .top-three {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }

  .top-card {
    flex-direction: row;
    padding: var(--space-sm) var(--space-md);
    gap: var(--space-md);
    text-align: left;
    align-items: center;
  }

  .top-card .medal {
    position: static;
    font-size: 1.25rem;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
  }

  .top-card .top-time {
    margin-top: 0;
    margin-left: auto;
    flex-shrink: 0;
    font-size: 1.25rem;
  }

  .top-card .top-date {
    display: none;
  }

  .filter-panel {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

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

  .type-toggle {
    align-self: flex-start;
    width: 100%;
  }
  
  .type-btn {
    flex: 1;
    text-align: center;
  }

  .rank-table {
    border-radius: var(--radius-md);
  }

  th, td {
    padding: var(--space-sm) var(--space-xs);
  }

  .col-rank {
    width: 40px;
  }

  .rank-num {
    width: 24px;
    height: 24px;
    font-size: 0.8125rem;
  }

  .col-date {
    display: none;
  }
  
  .col-time {
    width: 90px;
    text-align: right;
    padding-right: var(--space-md);
  }
}
</style>
