<template>
  <div class="players">
    <!-- Header -->
    <div class="page-header">
      <h2>选手总览</h2>
      <p class="page-subtitle">所有注册用户及其最好成绩</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="loading-icon">⏳</span>
      <p>加载中...</p>
    </div>

    <!-- Players Summary Table -->
    <div v-else-if="playerSummary.length > 0" class="player-table">
      <table>
        <thead>
          <tr>
            <th class="col-rank">排名</th>
            <th class="col-player">选手</th>
            <th class="col-email">邮箱</th>
            <th class="col-records">记录数</th>
            <th class="col-events">参与项目</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(player, index) in playerSummary" :key="player.userId">
            <td class="col-rank">
              <span class="rank-num" :class="['rank-' + (index + 1)]">
                {{ index + 1 }}
              </span>
            </td>
            <td class="col-player">
              <router-link :to="`/user/${player.userId}`" class="player-link">
                {{ player.nickname }}
              </router-link>
            </td>
            <td class="col-email">
              <span class="email">{{ player.email }}</span>
            </td>
            <td class="col-records">
              <span class="record-count">{{ player.recordCount }}</span>
            </td>
            <td class="col-events">
              <div class="event-tags">
                <span v-for="event in player.events.slice(0, 5)" :key="event" class="event-tag">
                  {{ event }}
                </span>
                <span v-if="player.events.length > 5" class="event-more">
                  +{{ player.events.length - 5 }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <span class="empty-icon">👥</span>
      <p>暂无选手数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { userAPI } from '@/api'
import { useRecordsStore } from '../stores/records'

const recordsStore = useRecordsStore()
const users = ref([])
const loading = ref(false)

// Group records by user and calculate summary
const playerSummary = computed(() => {
  const allRecords = recordsStore.records
  
  // Create user map with their data
  const userMap = new Map()
  
  // First, add all users
  users.value.forEach(user => {
    userMap.set(user.id || user._id, {
      userId: user.id || user._id,
      nickname: user.nickname,
      email: user.email,
      recordCount: 0,
      events: []
    })
  })
  
  // Then, count records and events for each user
  allRecords.forEach(record => {
    const userId = record.userId
    if (userMap.has(userId)) {
      const user = userMap.get(userId)
      user.recordCount++
      
      if (!user.events.includes(record.event)) {
        user.events.push(record.event)
      }
    }
  })
  
  // Convert to array and sort by record count
  return Array.from(userMap.values())
    .sort((a, b) => b.recordCount - a.recordCount)
})

async function loadData() {
  loading.value = true
  try {
    // Fetch all users
    const usersResult = await userAPI.getAll({ pageSize: 100 })
    if (usersResult.code === 200) {
      users.value = usersResult.data || []
    }
    
    // Fetch all records
    await recordsStore.fetchRecords({ pageSize: 2000 })
  } catch (err) {
    console.error('Failed to load data:', err)
    users.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.players {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Header */
.page-header {
  margin-bottom: var(--space-md);
}

.page-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.page-subtitle {
  color: var(--color-text-tertiary);
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

/* Player Table */
.player-table {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  width: 100%;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: var(--space-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
}

th {
  background: var(--color-bg-tertiary);
  font-weight: 600;
  font-size: 0.8775rem;
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

.col-email {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

.col-records {
  width: 100px;
}

.col-events {
  width: 300px;
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

.rank-num.rank-1 {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: white;
}

.rank-num.rank-2 {
  background: linear-gradient(135deg, #C0C0C0 0%, #808080 100%);
  color: white;
}

.rank-num.rank-3 {
  background: linear-gradient(135deg, #CD7F32 0%, #8B4513 100%);
  color: white;
}

.player-link {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
}

.player-link:hover {
  color: var(--color-primary);
}

.record-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 var(--space-sm);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.875rem;
}

.event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.event-tag {
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.event-more {
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-primary-light);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  color: var(--color-primary);
}

/* Responsive */
@media (max-width: 1024px) {
  .col-email {
    display: none;
  }
  
  .col-events {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .player-table {
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

  .col-events {
    display: none;
  }
  
  .col-records {
    width: 80px;
    text-align: right;
    padding-right: var(--space-md);
  }
}
</style>
