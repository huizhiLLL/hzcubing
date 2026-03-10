<template>
  <div class="players">
    <div class="page-header">
      <h2>选手总览</h2>
      <p class="page-subtitle">按加入时间从新到老排列</p>
    </div>

    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="playerSummary.length > 0" class="player-grid">
      <article v-for="player in playerSummary" :key="player.userId" class="player-card">
        <div class="player-head">
          <div>
            <router-link :to="`/user/${player.userId}`" class="player-link">
              {{ player.nickname }}
            </router-link>
            <p class="join-date">加入于 {{ formatJoinDate(player.createdAt) }}</p>
          </div>
          <span class="record-count">{{ player.recordCount }} 条</span>
        </div>

        <p class="email">{{ player.email || '未公开邮箱' }}</p>

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

    <div v-else class="empty-state">
      <p>暂无选手数据</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { userAPI } from '@/api'
import { useRecordsStore } from '../stores/records'

const recordsStore = useRecordsStore()
const users = ref([])
const loading = ref(false)

const playerSummary = computed(() => {
  const userMap = new Map()

  users.value.forEach(user => {
    userMap.set(user.id || user._id, {
      userId: user.id || user._id,
      nickname: user.nickname,
      email: user.email,
      createdAt: user.createdAt,
      recordCount: 0,
      events: []
    })
  })

  recordsStore.records.forEach(record => {
    const userId = String(record.userId)
    if (!userMap.has(userId)) return
    const user = userMap.get(userId)
    user.recordCount++
    if (!user.events.includes(record.event)) {
      user.events.push(record.event)
    }
  })

  return Array.from(userMap.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
})

function formatJoinDate(dateStr) {
  if (!dateStr) return '未知时间'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

async function loadData() {
  loading.value = true
  try {
    const usersResult = await userAPI.getAll({ pageSize: 100 })
    if (usersResult.code === 200) {
      users.value = usersResult.data || []
    }

    await recordsStore.fetchRecords({ pageSize: 2000 })
  } catch (err) {
    console.error('Failed to load data:', err)
    users.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
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

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
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
</style>
