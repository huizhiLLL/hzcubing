<template>
  <div class="leaderboard">
    <AppPageHeader title="排行榜" />

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
        <span class="type-indicator" :style="{ transform: `translateX(${type === 'average' ? 100 : 0}%)` }"></span>
        <button class="type-btn" :class="{ active: type === 'single' }" @click="selectType('single')">单次</button>
        <button class="type-btn" :class="{ active: type === 'average' }" @click="selectType('average')">平均</button>
      </div>
    </div>

    <AppStatusBlock
      v-if="!loading && sortedRecords.length === 0"
      variant="empty"
      :message="`暂无${currentEventName}数据`"
    />

    <div v-if="!loading && sortedRecords.length > 0" class="rank-table">
      <table>
        <thead>
          <tr>
            <th class="col-rank">排名</th>
            <th class="col-player">选手</th>
            <th class="col-time">成绩</th>
            <th class="col-date">日期</th>
          </tr>
        </thead>
        <Transition :name="`rank-slide-${rankMotionDirection}`" mode="out-in">
          <tbody :key="rankMotionKey" class="rank-table-body">
            <tr v-for="(player, index) in sortedRecords" :key="`${currentEvent}-${player._id || index}-${type}`">
              <td class="col-rank"><span class="rank-num">{{ index + 1 }}</span></td>
              <td class="col-player">
                <router-link :to="`/user/${player.profileUserNo}`" class="player-link">
                  {{ player.nickname }}
                </router-link>
              </td>
              <td class="col-time">{{ formatTime(getTimeValue(player)) }}</td>
              <td class="col-date">{{ formatDate(player.timestamp) }}</td>
            </tr>
          </tbody>
        </Transition>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppStatusBlock from '@/components/common/AppStatusBlock.vue'
import { useRecordsStore } from '../stores/records'
import { useEventsStore } from '../stores/events'

const route = useRoute()
const router = useRouter()
const recordsStore = useRecordsStore()
const eventsStore = useEventsStore()

const currentEvent = ref('333')
const type = ref('single')
const loading = ref(false)
const rankMotionKey = ref(0)
const rankMotionDirection = ref('forward')
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

const sortedRecords = computed(() => {
  return recordsStore.getLeaderboardRecords(currentEvent.value, type.value, 100)
})

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
  setEventMotionDirection(eventId)
  currentEvent.value = eventId
  router.replace({ query: { ...route.query, event: eventId } })
}

function selectType(nextType) {
  if (nextType === type.value) return
  rankMotionDirection.value = nextType === 'average' ? 'forward' : 'backward'
  type.value = nextType
}

function handleOverflowSelect(eventId) {
  if (!eventId) return
  selectEvent(eventId)
}

function getEventIndex(eventId) {
  return allEvents.value.findIndex(event => event.id === eventId)
}

function setEventMotionDirection(nextEventId) {
  if (nextEventId === currentEvent.value) return

  const currentIndex = getEventIndex(currentEvent.value)
  const nextIndex = getEventIndex(nextEventId)

  if (currentIndex === -1 || nextIndex === -1) {
    rankMotionDirection.value = 'forward'
    return
  }

  rankMotionDirection.value = nextIndex > currentIndex ? 'forward' : 'backward'
}

watch(() => route.query.event, (newEvent) => {
  if (newEvent && allEvents.value.some(event => event.id === newEvent)) {
    setEventMotionDirection(newEvent)
    currentEvent.value = newEvent
  }
})

watch([currentEvent, type], () => {
  rankMotionKey.value += 1
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      recordsStore.ensureRecordsLoaded({ pageSize: 2000 }),
      eventsStore.ensureMemeEventsLoaded()
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
  position: relative;
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
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.event-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.event-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 10px 22px color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.event-tab:active {
  transform: translateY(0) scale(0.98);
}

.type-toggle {
  position: relative;
  display: flex;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 4px;
  overflow: hidden;
}

.type-indicator {
  position: absolute;
  left: 4px;
  top: 4px;
  bottom: 4px;
  width: calc((100% - 8px) / 2);
  border-radius: calc(var(--radius-lg) - 4px);
  background: var(--color-primary);
  transition: transform var(--motion-panel);
  pointer-events: none;
}

.type-btn {
  position: relative;
  z-index: 1;
  min-width: 64px;
  padding: 0.72rem 1rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  border-radius: calc(var(--radius-lg) - 4px);
  transition:
    transform var(--transition-fast),
    color var(--transition-fast);
}

.type-btn:hover:not(.active) {
  color: var(--color-primary);
}

.type-btn.active {
  color: var(--color-bg);
}

.type-btn:active {
  transform: scale(0.98);
}

.player-link {
  font-weight: 600;
  color: var(--color-text);
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

.rank-table tr td {
  transition: background-color var(--transition-fast);
}

.rank-table tr:hover td {
  background: var(--color-bg-tertiary);
}

.rank-table-body {
  transform-origin: center;
  will-change: transform, opacity;
}

.rank-slide-forward-enter-active,
.rank-slide-forward-leave-active,
.rank-slide-backward-enter-active,
.rank-slide-backward-leave-active {
  transition:
    opacity 170ms var(--motion-ease),
    transform 170ms var(--motion-ease);
}

.rank-slide-forward-enter-from,
.rank-slide-backward-leave-to {
  opacity: 0;
  transform: translateX(18px);
}

.rank-slide-forward-leave-to,
.rank-slide-backward-enter-from {
  opacity: 0;
  transform: translateX(-18px);
}

.rank-num {
  font-weight: 600;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

td.col-time,
td.col-date {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 900px) {
  .event-selector-wrap {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .event-selector {
    flex-wrap: wrap;
    overflow: visible;
    padding-bottom: 0;
  }

  .event-overflow {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .filter-panel {
    align-items: stretch;
  }

  .event-tab {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    font-size: 0.9375rem;
  }

  .type-toggle {
    align-self: flex-start;
    border-radius: var(--radius-md);
  }

  .type-btn {
    padding: var(--space-sm) var(--space-md);
  }

  .rank-table {
    border-radius: var(--radius-lg);
    overflow-x: auto;
  }

  .rank-table th,
  .rank-table td {
    padding: var(--space-sm) var(--space-xs);
  }

  .rank-num {
    min-width: 28px;
    height: 28px;
  }
}
</style>
