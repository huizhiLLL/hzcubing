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

      <AppSegmentedControl
        :model-value="type"
        :options="typeOptions"
        aria-label="成绩类型"
        @update:model-value="selectType"
      />
    </div>

    <AppStatusBlock
      v-if="!loading && sortedRecords.length === 0"
      variant="empty"
      :message="hasSearchKeyword ? '没有匹配的选手' : `暂无${currentEventName}数据`"
    />

    <div class="leaderboard-toolbar">
      <input
        v-model="searchKeyword"
        type="search"
        class="search-input"
        placeholder="搜索选手昵称"
        aria-label="搜索选手昵称"
      />
      <AppButton v-if="myUserNo" variant="secondary" @click="scrollToMe">定位到我</AppButton>
    </div>

    <div v-if="!loading && sortedRecords.length > 0">
      <div class="rank-table desktop-only">
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
              <tr
                v-for="(player, index) in displayRecords"
                :key="`${currentEvent}-${player._id || index}-${type}`"
                :class="{ 'is-me': myUserNo && String(player.profileUserNo) === String(myUserNo) }"
                :ref="el => setRowRef(el, player)"
              >
                <td class="col-rank"><span class="rank-num" :class="index < 3 ? `rank-${index + 1}` : ''">{{ index + 1 }}</span></td>
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

      <div class="rank-cards mobile-only">
        <article
          v-for="(player, index) in displayRecords"
          :key="`m-${currentEvent}-${player._id || index}-${type}`"
          class="rank-card"
          :class="{ 'is-me': myUserNo && String(player.profileUserNo) === String(myUserNo) }"
          :ref="el => setRowRef(el, player)"
        >
          <span class="rank-card-num">{{ index + 1 }}</span>
          <router-link :to="`/user/${player.profileUserNo}`" class="rank-card-name">
            {{ player.nickname }}
          </router-link>
          <span class="rank-card-time">{{ formatTime(getTimeValue(player)) }}</span>
        </article>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppSegmentedControl from '@/components/common/AppSegmentedControl.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppStatusBlock from '@/components/common/AppStatusBlock.vue'
import { useRecordsStore } from '../stores/records'
import { useEventsStore } from '../stores/events'
import { useToastStore } from '../stores/toast'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const recordsStore = useRecordsStore()
const eventsStore = useEventsStore()
const toastStore = useToastStore()
const userStore = useUserStore()

const currentEvent = ref('333')
const type = ref('single')
const searchKeyword = ref('')
const leaderboardRecords = ref([])
const myRowEl = ref(null)
const loading = ref(false)
const rankMotionKey = ref(0)
const rankMotionDirection = ref('forward')
const maxVisibleTabs = 8
let isBootstrapping = true
const typeOptions = [
  { label: '单次', value: 'single' },
  { label: '平均', value: 'average' }
]

const allEvents = computed(() => eventsStore.allEvents)
const visibleEvents = computed(() => allEvents.value.slice(0, maxVisibleTabs))
const overflowEventOptions = computed(() => allEvents.value.slice(maxVisibleTabs))
const overflowSelection = computed(() => overflowEventOptions.value.some(event => event.id === currentEvent.value) ? currentEvent.value : '')
const overflowSelectOptions = computed(() => [
  { label: '更多项目', value: '', disabled: true },
  ...overflowEventOptions.value.map(event => ({ label: event.name, value: event.id }))
])
const currentEventName = computed(() => eventsStore.getEventName(currentEvent.value))
const myUserNo = computed(() => userStore.user?.userNo || userStore.user?.id || null)
const hasSearchKeyword = computed(() => searchKeyword.value.trim().length > 0)
let searchTimer = null

const sortedRecords = computed(() => leaderboardRecords.value)
const displayRecords = computed(() => sortedRecords.value)

function getTimeValue(player) {
  return type.value === 'single' ? player.singleSeconds : player.averageSeconds
}

function formatTime(seconds) {
  return recordsStore.formatTime(seconds) || '--'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const md = `${date.getMonth() + 1}/${date.getDate()}`
  return date.getFullYear() === new Date().getFullYear() ? md : `${date.getFullYear()}/${md}`
}

function setRowRef(el, player) {
  if (el && myUserNo.value && String(player.profileUserNo) === String(myUserNo.value)) {
    myRowEl.value = el
  }
}

function scrollToMe() {
  if (myRowEl.value?.scrollIntoView) {
    myRowEl.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else {
    toastStore.show({ message: '你还没有该项目的成绩', variant: 'info' })
  }
}

async function loadLeaderboard() {
  loading.value = true
  myRowEl.value = null

  try {
    leaderboardRecords.value = await recordsStore.fetchLeaderboardRecords({
      event: currentEvent.value,
      type: type.value,
      limit: 100,
      keyword: searchKeyword.value.trim()
    })
  } catch (err) {
    console.error('Failed to load leaderboard:', err)
    leaderboardRecords.value = []
  } finally {
    loading.value = false
  }
}

function selectEvent(eventId) {
  setEventMotionDirection(eventId)
  myRowEl.value = null
  currentEvent.value = eventId
  router.replace({ query: { ...route.query, event: eventId } })
}

function selectType(nextType) {
  if (nextType === type.value) return
  rankMotionDirection.value = nextType === 'average' ? 'forward' : 'backward'
  myRowEl.value = null
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
    myRowEl.value = null
    currentEvent.value = newEvent
  }
})

watch([currentEvent, type], () => {
  rankMotionKey.value += 1
  if (isBootstrapping) return
  loadLeaderboard()
})

watch(searchKeyword, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    loadLeaderboard()
  }, 300)
})

onMounted(async () => {
  loading.value = true
  try {
    await eventsStore.ensureMemeEventsLoaded()

    const initialEvent = route.query.event
    if (initialEvent && allEvents.value.some(event => event.id === initialEvent)) {
      currentEvent.value = initialEvent
    } else {
      currentEvent.value = allEvents.value[0]?.id || '333'
    }

    await loadLeaderboard()
  } catch (err) {
    console.error('Failed to load records:', err)
  } finally {
    isBootstrapping = false
    loading.value = false
  }
})

onBeforeUnmount(() => {
  window.clearTimeout(searchTimer)
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

.desktop-only { display: block; }
.mobile-only { display: none; }

.leaderboard-toolbar {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 0.7rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.92rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent);
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

.rank-table tr.is-me td {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.rank-table tr.is-me td:first-child {
  box-shadow: inset 3px 0 0 var(--color-primary);
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

.rank-num.rank-1,
.rank-num.rank-2,
.rank-num.rank-3 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  color: white;
}

.rank-num.rank-1 { background: var(--color-gold); }
.rank-num.rank-2 { background: var(--color-silver); }
.rank-num.rank-3 { background: var(--color-bronze); }

td.col-time,
td.col-date {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.rank-cards {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.rank-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-md);
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-secondary);
}

.rank-card.is-me {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-bg-secondary));
}

.rank-card-num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  min-width: 1.5rem;
}

.rank-card-name {
  font-weight: 600;
  color: var(--color-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-card-time {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  justify-self: end;
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
  .desktop-only { display: none; }
  .mobile-only { display: block; }

  .filter-panel {
    align-items: stretch;
  }

  .event-tab {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    font-size: 0.9375rem;
  }

  .rank-num {
    min-width: 28px;
    height: 28px;
  }
}
</style>
