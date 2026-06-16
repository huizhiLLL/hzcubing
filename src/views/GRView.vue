<template>
  <div class="gr-page">
    <AppPageHeader title="GR 纪录" />

    <AppStatusBlock v-if="loading" variant="loading" message="加载中..." />

    <template v-else>
      <div class="category-tabs" role="tablist" aria-label="项目类型">
        <button
          v-for="category in categoryTabs"
          :key="category.value"
          type="button"
          class="category-tab"
          :class="{ active: activeCategory === category.value }"
          role="tab"
          :aria-selected="activeCategory === category.value"
          @click="activeCategory = category.value"
        >
          {{ category.label }}
        </button>
      </div>

      <AppStatusBlock v-if="rows.length === 0" variant="empty" :message="`暂无${activeCategoryLabel}纪录数据`" />

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
                  </div>
                </td>
                <td>
                  <router-link v-if="row.bestSingleUserNo" :to="`/user/${row.bestSingleUserNo}`" class="user-link">
                    {{ row.bestSingleNickname || '—' }}
                  </router-link>
                  <span v-else class="muted">—</span>
                </td>
                <td>{{ formatTime(row.bestSingleSeconds) }}</td>
                <td>{{ formatTime(row.bestAverageSeconds) }}</td>
                <td>
                  <router-link v-if="row.bestAverageUserNo" :to="`/user/${row.bestAverageUserNo}`" class="user-link">
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
              <router-link v-if="row.bestSingleUserNo" :to="`/user/${row.bestSingleUserNo}`" class="user-link">
                {{ row.bestSingleNickname || '—' }}
              </router-link>
              <span class="record-time">{{ formatTime(row.bestSingleSeconds) }}</span>
            </div>

            <div class="record-block compact">
              <span class="record-label">最佳平均</span>
              <router-link v-if="row.bestAverageUserNo" :to="`/user/${row.bestAverageUserNo}`" class="user-link">
                {{ row.bestAverageNickname || '—' }}
              </router-link>
              <span class="record-time">{{ formatTime(row.bestAverageSeconds) }}</span>
            </div>
          </article>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppStatusBlock from '@/components/common/AppStatusBlock.vue'
import { useRecordsStore } from '../stores/records'
import { useEventsStore } from '../stores/events'

const recordsStore = useRecordsStore()
const eventsStore = useEventsStore()
const loading = ref(false)
const bestRecords = ref([])
const activeCategory = ref('official')

const categoryTabs = [
  { label: '官方', value: 'official' },
  { label: '趣味', value: 'fun' },
  { label: '整活', value: 'meme' }
]

const eventOrder = computed(() => eventsStore.allEvents.map(event => event.id))
const eventCategoryMap = computed(() => Object.fromEntries(eventsStore.allEvents.map(event => [event.id, event.category])))
const activeCategoryLabel = computed(() => categoryTabs.find(category => category.value === activeCategory.value)?.label || '')

const rows = computed(() => {
  return [...bestRecords.value]
    .filter(item => eventCategoryMap.value[item.event] === activeCategory.value)
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
    await eventsStore.ensureMemeEventsLoaded()
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

.category-tabs {
  display: inline-flex;
  align-self: flex-start;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-secondary);
}

.category-tab {
  min-width: 72px;
  padding: 0.65rem 0.95rem;
  border-radius: calc(var(--radius-lg) - 4px);
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 0.92rem;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.category-tab.active {
  background: var(--color-text);
  color: var(--color-bg);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
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
  .category-tabs {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .category-tab {
    min-width: 0;
  }

  .desktop-table {
    display: none;
  }

  .mobile-cards {
    display: grid;
    gap: 0.75rem;
  }
}
</style>
