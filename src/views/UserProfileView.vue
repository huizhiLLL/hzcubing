<template>
  <div class="user-profile">
    <div v-if="loading" class="loading-state">
      <span class="loading-icon">⏳</span>
      <p>加载中...</p>
    </div>

    <template v-else-if="userData">
      <section class="profile-header">
        <div class="profile-avatar" :style="{ background: avatarBg }">
          <img v-if="userData.avatar" :src="userData.avatar" :alt="userData.nickname" class="avatar-image" />
          <span v-else class="avatar-text">{{ avatarInitial }}</span>
        </div>

        <div class="profile-info">
          <div class="profile-topline">
            <div>
              <h1 class="profile-name">{{ userData.nickname }}</h1>
              <p v-if="userData.bio" class="profile-bio">{{ userData.bio }}</p>
            </div>

            <router-link
              v-if="isCurrentUser"
              to="/settings"
              class="settings-link"
            >
              编辑资料
            </router-link>
          </div>

          <div class="profile-meta">
            <span v-if="userData.wcaId" class="meta-pill">WCA ID: {{ userData.wcaId }}</span>
            <span v-if="userData.email && isCurrentUser" class="meta-pill subtle">{{ userData.email }}</span>
            <span v-if="memberSince" class="meta-pill subtle">加入于 {{ memberSince }}</span>
          </div>
        </div>
      </section>

      <section v-if="personalBests.length > 0" class="pb-section">
        <div class="section-heading">
          <h2 class="section-title">个人最佳</h2>
          <span class="section-subtitle">按项目汇总最佳单次和平均</span>
        </div>

        <div class="pb-grid">
          <article v-for="pb in sortedPersonalBests" :key="pb.event" class="pb-card">
            <div class="pb-header">
              <span class="event-name">{{ getEventName(pb.event) }}</span>
              <span class="event-code">{{ pb.event }}</span>
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
          </article>
        </div>
      </section>

      <section v-if="recentRecords.length > 0" class="activity-section">
        <div class="section-heading">
          <h2 class="section-title">最近提交</h2>
          <span class="section-subtitle">最近 10 条成绩记录</span>
        </div>

        <div class="activity-list">
          <article v-for="record in recentRecords" :key="record._id" class="activity-item">
            <div class="activity-left">
              <span class="event-badge">{{ getEventName(record.event) }}</span>
              <div class="activity-times">
                <span v-if="record.singleSeconds !== null" class="activity-time">单次 {{ formatTime(record.singleSeconds) }}</span>
                <span v-if="record.averageSeconds !== null" class="activity-time muted">平均 {{ formatTime(record.averageSeconds) }}</span>
              </div>
            </div>
            <span class="activity-date">{{ formatDate(record.timestamp) }}</span>
          </article>
        </div>
      </section>

      <div v-if="personalBests.length === 0 && recentRecords.length === 0" class="empty-state">
        <span class="empty-icon">📊</span>
        <p>暂无成绩记录</p>
      </div>
    </template>

    <div v-else class="empty-state">
      <span class="empty-icon">❌</span>
      <p>用户不存在</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useRecordsStore } from '../stores/records'
import { userAPI } from '@/api'
import { events, getEventName } from '@/config/events'
import { getAvatarGradient, getInitial } from '@/utils/avatar'

const route = useRoute()
const userStore = useUserStore()
const recordsStore = useRecordsStore()

const loading = ref(true)
const userData = ref(null)
const personalBests = ref([])
const recentRecords = ref([])

const isCurrentUser = computed(() => {
  const currentId = userStore.user?.id || userStore.user?._id
  const viewedId = userData.value?.id || userData.value?._id
  return !!currentId && !!viewedId && String(currentId) === String(viewedId)
})

const avatarInitial = computed(() => getInitial(userData.value?.nickname || userData.value?.email))
const avatarBg = computed(() => getAvatarGradient(userData.value?.nickname || userData.value?.email))

const memberSince = computed(() => {
  if (!userData.value?.createdAt) return ''
  const date = new Date(userData.value.createdAt)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
})

const eventOrder = computed(() => events.map(event => event.id))

const sortedPersonalBests = computed(() => {
  return [...personalBests.value].sort((a, b) => {
    const indexA = eventOrder.value.indexOf(a.event)
    const indexB = eventOrder.value.indexOf(b.event)
    if (indexA === -1 && indexB === -1) return a.event.localeCompare(b.event)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
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
  return `${date.getMonth() + 1}/${date.getDate()}`
}

async function loadProfile() {
  loading.value = true
  userData.value = null
  personalBests.value = []
  recentRecords.value = []

  try {
    const userId = route.params.id || userStore.user?.id || userStore.user?._id
    if (!userId) {
      userData.value = null
      return
    }

    const userResult = await userAPI.getById(userId)
    if (userResult.code !== 200 || !userResult.data) {
      userData.value = null
      return
    }

    userData.value = userResult.data

    const [bestResult, historyResult] = await Promise.all([
      recordsStore.fetchUserBest(userId),
      recordsStore.fetchUserHistory(userId, { pageSize: 10 })
    ])

    personalBests.value = bestResult || []
    recentRecords.value = historyResult.data || []
  } catch (err) {
    console.error('Failed to load user profile:', err)
    userData.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, loadProfile)
onMounted(loadProfile)
</script>

<style scoped>
.user-profile {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  color: var(--color-text-tertiary);
}

.loading-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
}

.profile-header {
  display: flex;
  gap: var(--space-xl);
  align-items: flex-start;
  padding: var(--space-xl);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}

.profile-avatar {
  width: 108px;
  height: 108px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-lg);
}

.profile-name {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--space-sm);
}

.profile-bio {
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.settings-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--color-text);
  color: var(--color-bg);
  font-weight: 600;
  white-space: nowrap;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xs) var(--space-md);
  border-radius: 999px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-size: 0.875rem;
}

.meta-pill.subtle {
  color: var(--color-text-secondary);
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
}

.section-subtitle {
  color: var(--color-text-tertiary);
  font-size: 0.9rem;
}

.pb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-md);
}

.pb-card,
.activity-item {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.pb-card {
  padding: var(--space-lg);
}

.pb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.event-name {
  font-weight: 700;
}

.event-code {
  color: var(--color-text-tertiary);
  font-size: 0.8rem;
  text-transform: uppercase;
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
  font-weight: 700;
  color: var(--color-primary);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
}

.activity-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}

.activity-times {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.event-badge {
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.activity-time {
  font-family: var(--font-mono);
  font-weight: 600;
}

.activity-time.muted,
.activity-date {
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-topline {
    flex-direction: column;
    align-items: center;
  }

  .profile-meta,
  .section-heading {
    justify-content: center;
  }

  .pb-grid {
    grid-template-columns: 1fr;
  }

  .activity-item,
  .activity-left {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
