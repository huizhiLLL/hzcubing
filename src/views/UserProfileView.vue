<template>
  <div class="user-profile">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="loading-icon">⏳</span>
      <p>加载中...</p>
    </div>

    <!-- User Info Header -->
    <div v-else-if="userData" class="profile-header">
      <div class="profile-avatar" :style="{ background: avatarBg }">
        <span class="avatar-text">{{ userData.nickname?.[0]?.toUpperCase() }}</span>
      </div>
      <div class="profile-info">
        <h1 class="profile-name">{{ userData.nickname }}</h1>
        <p v-if="userData.bio" class="profile-bio">{{ userData.bio }}</p>
        <p v-if="userData.wcaId" class="profile-wca">WCA ID: {{ userData.wcaId }}</p>
      </div>
    </div>

    <!-- PB Wall -->
    <section v-if="!loading && personalBests.length > 0" class="pb-section">
      <h2 class="section-title">个人最佳 (PB)</h2>
      <div class="pb-grid">
        <div v-for="pb in personalBests" :key="pb.event" class="pb-card">
          <div class="pb-header">
            <span class="event-name">{{ getEventName(pb.event) }}</span>
          </div>
          <div class="pb-times">
            <div v-if="pb.bestSingleSeconds !== null" class="pb-item">
              <span class="pb-label">单次</span>
              <span class="pb-value">{{ formatTime(pb.bestSingleSeconds) }}</span>
            </div>
            <div v-if="pb.bestAverageSeconds !== null" class="pb-item">
              <span class="pb-label">平均</span>
              <span class="pb-value">{{ formatTime(pb.bestAverageSeconds) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Activity -->
    <section v-if="!loading && recentRecords.length > 0" class="activity-section">
      <h2 class="section-title">最近提交</h2>
      <div class="activity-list">
        <div v-for="record in recentRecords" :key="record._id" class="activity-item">
          <div class="activity-left">
            <span class="event-badge">{{ getEventName(record.event) }}</span>
            <span class="activity-time">
              {{ formatTime(record.singleSeconds || record.averageSeconds) }}
            </span>
          </div>
          <div class="activity-right">
            <span class="activity-date">{{ formatDate(record.timestamp) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Empty State -->
    <div v-if="!loading && !userData" class="empty-state">
      <span class="empty-icon">❌</span>
      <p>用户不存在</p>
    </div>

    <div v-if="!loading && userData && personalBests.length === 0" class="empty-state">
      <span class="empty-icon">📊</span>
      <p>暂无成绩记录</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useRecordsStore } from '../stores/records'
import { userAPI } from '@/api'

const route = useRoute()
const userStore = useUserStore()
const recordsStore = useRecordsStore()

const loading = ref(true)
const userData = ref(null)
const personalBests = ref([])
const recentRecords = ref([])

// Fixed background color
const avatarBg = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

// Event name mapping
const eventNames = {
  '333': '三阶', '222': '二阶', '444': '四阶', '555': '五阶',
  '333oh': '三单', '333bf': '三盲', '333fm': '最少步',
  'py': '金字塔', 'meg': '五魔', 'sk': '斜转',
  'clock': '魔表', 'sq1': 'SQ1'
}

function getEventName(eventCode) {
  return eventNames[eventCode] || eventCode
}

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
  return `${date.getMonth() + 1}/${date.getDate()}`
}

onMounted(async () => {
  loading.value = true
  const userId = route.params.id

  try {
    // Fetch user data
    const userResult = await userAPI.getById(userId)
    if (userResult.code === 200 && userResult.data) {
      userData.value = userResult.data
    }

    // Fetch user's best records
    const bestResult = await recordsStore.fetchUserBest(userId)
    personalBests.value = bestResult || []

    // Fetch recent records
    const historyResult = await recordsStore.fetchUserHistory(userId, { pageSize: 10 })
    recentRecords.value = historyResult.data || []
  } catch (err) {
    console.error('Failed to load user profile:', err)
    userData.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.user-profile {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
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

/* Profile Header */
.profile-header {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
  padding: var(--space-xl);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}

.profile-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-text {
  color: white;
  font-size: 2.5rem;
  font-weight: 600;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: var(--space-xs);
}

.profile-bio {
  margin-top: var(--space-md);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.profile-wca {
  margin-top: var(--space-sm);
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

/* Section */
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--space-lg);
}

/* PB Grid */
.pb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-md);
}

.pb-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: all var(--transition-fast);
}

.pb-card:hover {
  border-color: var(--color-primary);
}

.pb-header {
  margin-bottom: var(--space-md);
}

.event-name {
  font-weight: 600;
  color: var(--color-text);
}

.pb-times {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.pb-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pb-label {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

.pb-value {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-primary);
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.activity-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.event-badge {
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
}

.activity-time {
  font-weight: 600;
  font-size: 1.125rem;
  font-family: var(--font-mono);
}

.activity-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.activity-date {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .pb-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
