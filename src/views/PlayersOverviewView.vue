<template>
  <div class="players">
    <div class="page-header">
      <h2>选手总览</h2>
      <p class="page-subtitle">按加入时间排序</p>
    </div>

    <AppStatusBlock v-if="loading" variant="loading" message="加载中..." />

    <template v-else-if="playerSummary.length > 0">
      <div class="player-grid">
        <article v-for="player in playerSummary" :key="player.profileUserNo" class="player-card">
          <div class="player-head">
            <div>
              <router-link :to="`/user/${player.profileUserNo}`" class="player-link">
                {{ player.nickname }}
              </router-link>
              <p class="join-date">加入于 {{ formatJoinDate(player.createdAt) }}</p>
            </div>
            <span class="record-count">{{ player.recordCount }} 条</span>
          </div>

          <div class="meta-row">
            <span class="meta-label">参与项目</span>
            <span class="meta-value">{{ player.events.length }} 项</span>
          </div>

          <div class="event-tags">
            <span v-for="event in player.events.slice(0, 8)" :key="event" class="event-tag">
              {{ event }}
            </span>
            <span v-if="player.events.length > 8" class="event-more">+{{ player.events.length - 8 }}</span>
          </div>
        </article>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="currentPage === 1 || loading" @click="goToPage(currentPage - 1)">上一页</button>
        <button
          v-for="page in pageNumbers"
          :key="page"
          class="page-btn"
          :class="{ active: page === currentPage }"
          :disabled="loading"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button class="page-btn" :disabled="currentPage === totalPages || loading" @click="goToPage(currentPage + 1)">下一页</button>
      </div>
    </template>

    <AppStatusBlock v-else class="page-status" variant="empty" message="暂无选手数据" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppStatusBlock from '@/components/common/AppStatusBlock.vue'
import { userAPI } from '@/api'
import { useRecordsStore } from '../stores/records'

const PAGE_SIZE = 12
const recordsStore = useRecordsStore()

const users = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)

const playerSummary = computed(() => {
  return [...users.value].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
})

const pageNumbers = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)

  for (let page = start; page <= end; page++) {
    pages.push(page)
  }

  return pages
})

function formatJoinDate(dateStr) {
  if (!dateStr) return '未知时间'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

async function loadData(page = 1) {
  loading.value = true
  try {
    const usersResult = await userAPI.getOverview({ page, pageSize: PAGE_SIZE })
    if (usersResult.code === 200) {
      users.value = usersResult.data || []
      currentPage.value = usersResult.page || page
      totalPages.value = usersResult.totalPages || 1
    }
    await recordsStore.ensureRecordsLoaded({ pageSize: 2000 })
  } catch (err) {
    console.error('Failed to load data:', err)
    users.value = []
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  loadData(page)
}

onMounted(() => loadData(1))
</script>

<style scoped>
.players {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.page-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.page-subtitle {
  color: var(--color-text-tertiary);
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-md);
}

.player-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-bg-secondary);
}

.player-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  align-items: flex-start;
}

.player-link {
  color: var(--color-text);
  font-weight: 600;
  font-size: 1rem;
}

.player-link:hover {
  color: var(--color-primary);
}

.join-date,
.email,
.meta-label {
  color: var(--color-text-tertiary);
  font-size: 0.82rem;
}

.record-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-size: 0.82rem;
  font-weight: 600;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-value {
  font-size: 0.88rem;
  font-weight: 600;
}

.event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.event-tag,
.event-more {
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 2.5rem;
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn.active {
  background: var(--color-text);
  border-color: var(--color-text);
  color: var(--color-bg);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
