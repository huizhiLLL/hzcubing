<template>
  <div class="user-profile">
    <!-- 用户信息头部 -->
    <div class="profile-header">
      <div class="profile-avatar" :style="{ background: avatarBg }">
        <img v-if="user.avatar" :src="user.avatar" :alt="user.nickname" />
        <span v-else class="avatar-text">{{ user.nickname?.[0]?.toUpperCase() }}</span>
      </div>
      <div class="profile-info">
        <h1 class="profile-name">{{ user.nickname }}</h1>
        <span class="profile-username">@{{ user.username }}</span>
        <p v-if="user.bio" class="profile-bio">{{ user.bio }}</p>
      </div>
    </div>

    <!-- PB 墙 -->
    <section class="pb-section">
      <h2 class="section-title">个人最佳 (PB)</h2>
      <div class="pb-grid">
        <div v-for="pb in personalBests" :key="pb.event" class="pb-card">
          <div class="pb-header">
            <EventBadge :event="pb.event" show-label />
          </div>
          <div class="pb-times">
            <div class="pb-item">
              <span class="pb-label">单次</span>
              <TimeDisplay :time="pb.bestSingle" />
            </div>
            <div class="pb-item">
              <span class="pb-label">平均</span>
              <TimeDisplay :time="pb.bestAverage" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 最近活动 -->
    <section class="activity-section">
      <h2 class="section-title">最近提交</h2>
      <div class="activity-list">
        <div v-for="record in recentRecords" :key="record.id" class="activity-item">
          <div class="activity-left">
            <EventBadge :event="record.event" />
            <span class="activity-time">
              <TimeDisplay :time="record.time" />
            </span>
          </div>
          <div class="activity-right">
            <span class="activity-date">{{ formatDate(record.date) }}</span>
            <span v-if="record.isPB" class="pb-badge">PB</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import EventBadge from '../components/common/EventBadge.vue'
import TimeDisplay from '../components/common/TimeDisplay.vue'

const route = useRoute()

// 模拟用户数据
const user = ref({
  id: route.params.id,
  username: 'speedcuber',
  nickname: '小明',
  avatar: '',
  bio: '热爱魔方，享受每一次突破'
})

// 固定背景色
const avatarBg = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

// 模拟 PB 数据
const personalBests = ref([
  { event: '3x3', bestSingle: 6.54, bestAverage: 7.82 },
  { event: '4x4', bestSingle: 28.32, bestAverage: 32.45 },
  { event: '2x2', bestSingle: 1.89, bestAverage: 2.34 },
  { event: '3x3OH', bestSingle: 12.45, bestAverage: 14.56 },
  { event: '3x3BLD', bestSingle: 45.67, bestAverage: 58.23 },
  { event: 'Pyraminx', bestSingle: 4.56, bestAverage: 5.67 }
])

// 模拟最近记录
const recentRecords = ref([
  { id: 1, event: '3x3', time: 6.78, date: '2024-01-15', isPB: false },
  { id: 2, event: '3x3', time: 6.54, date: '2024-01-15', isPB: true },
  { id: 3, event: '4x4', time: 29.12, date: '2024-01-14', isPB: false },
  { id: 4, event: '2x2', time: 1.95, date: '2024-01-14', isPB: false },
  { id: 5, event: '3x3OH', time: 12.45, date: '2024-01-13', isPB: true }
])

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.user-profile {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
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

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.profile-username {
  color: var(--color-text-tertiary);
  font-size: 1rem;
}

.profile-bio {
  margin-top: var(--space-md);
  color: var(--color-text-secondary);
  line-height: 1.6;
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

.activity-time {
  font-weight: 600;
  font-size: 1.125rem;
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

.pb-badge {
  padding: 2px 8px;
  background: var(--color-success);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>