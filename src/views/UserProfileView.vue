<template>
  <div class="user-profile">
    <AppStatusBlock v-if="loading" variant="loading" message="加载中..." />

    <template v-else-if="userData">
      <AppSectionCard class="profile-hero" variant="subtle">
        <div class="profile-identity">
          <div class="profile-avatar" :style="{ background: avatarBg }">
            <img v-if="userData.avatar" :src="userData.avatar" :alt="userData.nickname" class="avatar-image" />
            <span v-else class="avatar-text">{{ avatarInitial }}</span>
          </div>

          <div class="identity-copy">
            <div class="identity-topline">
              <div>
                <p class="profile-kicker">个人主页</p>
                <h1 class="profile-name">{{ userData.nickname }}</h1>
              </div>

              <router-link
                v-if="isCurrentUser"
                to="/settings"
                class="settings-link"
              >
                编辑资料
              </router-link>
            </div>

            <p v-if="userData.bio" class="profile-bio">{{ userData.bio }}</p>

            <div class="profile-meta">
              <span v-if="userData.wcaId" class="meta-pill">WCA ID: {{ userData.wcaId }}</span>
              <span v-if="userData.email && isCurrentUser" class="meta-pill subtle">{{ userData.email }}</span>
              <span v-if="memberSince" class="meta-pill subtle">加入于 {{ memberSince }}</span>
            </div>
          </div>
        </div>
      </AppSectionCard>

      <AppSectionCard v-if="personalBests.length > 0" class="pb-stage" title="个人最佳">
        <template #aside>
          <span class="summary-chip">{{ rankedPersonalBests.length }} 项</span>
        </template>
        <div class="pb-grid">
          <article
            v-for="pb in rankedPersonalBests"
            :key="pb.event"
            class="pb-card"
            :class="pb.bestRank && pb.bestRank <= 3 ? `podium-${pb.bestRank}` : ''"
          >
            <div class="pb-header">
              <div>
                <span class="event-name">{{ getEventName(pb.event) }}</span>
                <span class="event-code">{{ pb.event }}</span>
              </div>
              <span v-if="pb.bestRank" class="rank-chip">#{{ pb.bestRank }}</span>
            </div>

            <div class="pb-times">
              <div class="pb-item">
                <span class="pb-label">单次</span>
                <span class="pb-value" :class="{ muted: pb.bestSingleSeconds === null }">
                  {{ pb.bestSingleSeconds !== null ? formatTime(pb.bestSingleSeconds) : '—' }}
                </span>
              </div>
              <div class="pb-item">
                <span class="pb-label">平均</span>
                <span class="pb-value" :class="{ muted: pb.bestAverageSeconds === null }">
                  {{ pb.bestAverageSeconds !== null ? formatTime(pb.bestAverageSeconds) : '—' }}
                </span>
              </div>
            </div>
          </article>
        </div>
      </AppSectionCard>

      <AppSectionCard v-else class="empty-panel" variant="subtle">
        <p>还没有形成个人最佳记录。</p>
      </AppSectionCard>

      <section
        v-if="createdMemeEvents.length > 0 || recentRecords.length > 0"
        class="activity-layout"
        :class="{ 'single-column': createdMemeEvents.length === 0 || recentRecords.length === 0 }"
      >
        <AppSectionCard v-if="recentRecords.length > 0" class="activity-panel" title="最近提交">
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
        </AppSectionCard>

        <AppSectionCard v-if="createdMemeEvents.length > 0" class="activity-panel" title="创建的整活项目">
          <div class="activity-list">
            <article v-for="event in createdMemeEvents" :key="event.id" class="activity-item">
              <div class="activity-left event-item-left">
                <span class="event-badge">{{ event.name }}</span>
                <div class="activity-times">
                  <span class="activity-time muted code-text">{{ event.id }}</span>
                  <span v-if="event.description" class="activity-time muted">{{ event.description }}</span>
                </div>
              </div>
              <span class="activity-date">{{ event.isActive ? '启用中' : '已停用' }}</span>
            </article>
          </div>
        </AppSectionCard>
      </section>

      <AppStatusBlock
        v-if="personalBests.length === 0 && recentRecords.length === 0 && createdMemeEvents.length === 0"
        variant="empty"
        message="暂无成绩记录"
      />
    </template>

    <AppStatusBlock v-else variant="empty" message="用户不存在" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSectionCard from '@/components/common/AppSectionCard.vue'
import AppStatusBlock from '@/components/common/AppStatusBlock.vue'
import { useUserStore } from '../stores/user'
import { useRecordsStore } from '../stores/records'
import { useEventsStore } from '../stores/events'
import { userAPI } from '@/api'
import { rankPersonalBests } from '@/utils/recordRanking'
import { getAvatarGradient, getInitial } from '@/utils/avatar'

const route = useRoute()
const userStore = useUserStore()
const recordsStore = useRecordsStore()
const eventsStore = useEventsStore()

const loading = ref(true)
const userData = ref(null)
const personalBests = ref([])
const recentRecords = ref([])
const createdMemeEvents = ref([])
const hasGlobalRankData = ref(false)

const isCurrentUser = computed(() => {
  const currentId = userStore.user?.userNo || userStore.user?.id
  const viewedId = userData.value?.userNo || userData.value?.id
  return !!currentId && !!viewedId && String(currentId) === String(viewedId)
})

const avatarInitial = computed(() => getInitial(userData.value?.nickname || userData.value?.email))
const avatarBg = computed(() => getAvatarGradient(userData.value?.nickname || userData.value?.email))

const memberSince = computed(() => {
  if (!userData.value?.createdAt) return ''
  const date = new Date(userData.value.createdAt)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
})

const eventOrder = computed(() => eventsStore.allEvents.map(event => event.id))

const rankedPersonalBests = computed(() => {
  if (!hasGlobalRankData.value) return [...personalBests.value]

  const viewedUserId = userData.value?.id || userData.value?._id || ''
  return rankPersonalBests(personalBests.value, viewedUserId, eventOrder.value, recordsStore.records)
})

function getEventName(eventId) {
  return eventsStore.getEventName(eventId)
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

async function loadProfile() {
  loading.value = true
  userData.value = null
  personalBests.value = []
  recentRecords.value = []
  createdMemeEvents.value = []
  hasGlobalRankData.value = false

  try {
    const userId = route.params.id || userStore.user?.userNo || userStore.user?.id
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

    const [bestResult, historyResult, recordsResult] = await Promise.allSettled([
      recordsStore.fetchUserBest(userId),
      recordsStore.fetchUserHistory(userId, { pageSize: 10 }),
      recordsStore.ensureRecordsLoaded({ pageSize: 2000 })
    ])

    if (bestResult.status === 'fulfilled') {
      personalBests.value = bestResult.value || []
    } else {
      throw bestResult.reason
    }

    if (historyResult.status === 'fulfilled') {
      recentRecords.value = historyResult.value.data || []
    } else {
      throw historyResult.reason
    }

    if (recordsResult.status === 'fulfilled') {
      hasGlobalRankData.value = true
    } else {
      console.warn('Failed to load global rank data for profile PB ordering:', recordsResult.reason)
    }

    createdMemeEvents.value = (eventsStore.memeEvents || []).filter(event => {
      return String(event.createdBy) === String(userId) || String(event.createdBy) === String(userData.value?._id)
    })
  } catch (err) {
    console.error('Failed to load user profile:', err)
    userData.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, loadProfile)
onMounted(async () => {
  try {
    await eventsStore.ensureMemeEventsLoaded()
  } catch (error) {
    console.error('Failed to load meme events for profile:', error)
  }
  loadProfile()
})
</script>

<style scoped>
.user-profile {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.profile-identity {
  display: flex;
  gap: var(--space-xl);
  align-items: flex-start;
}

.profile-avatar {
  width: 104px;
  height: 104px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.12);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  color: white;
  font-size: 2.35rem;
  font-weight: 700;
}

.identity-copy {
  flex: 1;
  min-width: 0;
}

.identity-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-lg);
}

.profile-kicker {
  margin-bottom: 0.35rem;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.profile-name {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.05;
}

.profile-bio {
  margin-top: 0.8rem;
  max-width: 760px;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.settings-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0.85rem 1.05rem;
  border-radius: 16px;
  background: var(--color-text);
  color: var(--color-bg);
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
  transition: transform var(--transition-fast), background var(--transition-fast);
}

.settings-link:hover {
  transform: translateY(-1px);
  background: var(--color-primary);
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

.meta-pill,
.summary-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-bg) 72%, var(--color-bg-secondary));
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, transparent);
  font-size: 0.84rem;
}

.meta-pill.subtle {
  color: var(--color-text-secondary);
}

.pb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-md);
}

.pb-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 178px;
  padding: 1rem 1.05rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-primary-light) 18%, transparent), transparent 48%),
    color-mix(in srgb, var(--color-bg-secondary) 96%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, transparent);
  border-radius: 20px;
  transition:
    transform var(--transition-normal),
    border-color var(--transition-normal),
    box-shadow var(--transition-normal);
}

.pb-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
  box-shadow: 0 16px 28px color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.pb-card.podium-1 {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(212, 175, 55, 0.18)),
    color-mix(in srgb, var(--color-bg-secondary) 98%, transparent);
  border-color: color-mix(in srgb, var(--color-gold) 46%, var(--color-border));
}

.pb-card.podium-2 {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(156, 163, 175, 0.2)),
    color-mix(in srgb, var(--color-bg-secondary) 98%, transparent);
  border-color: color-mix(in srgb, var(--color-silver) 54%, var(--color-border));
}

.pb-card.podium-3 {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(205, 127, 50, 0.2)),
    color-mix(in srgb, var(--color-bg-secondary) 98%, transparent);
  border-color: color-mix(in srgb, var(--color-bronze) 52%, var(--color-border));
}

.pb-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-sm);
}

.rank-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, transparent);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  font-weight: 700;
}

.event-name {
  display: block;
  font-weight: 700;
  font-size: 1rem;
}

.event-code {
  display: block;
  margin-top: 0.2rem;
  color: var(--color-text-tertiary);
  font-size: 0.78rem;
  text-transform: uppercase;
}

.pb-times {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-top: auto;
}

.pb-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-sm);
}

.pb-label {
  color: var(--color-text-tertiary);
  font-size: 0.84rem;
}

.pb-value {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--color-primary);
  font-size: 1.08rem;
  letter-spacing: -0.03em;
}

.pb-value.muted {
  color: var(--color-text-tertiary);
}

.activity-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: var(--space-lg);
}

.activity-layout.single-column {
  grid-template-columns: 1fr;
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
  padding: 0.95rem 1rem;
  background: color-mix(in srgb, var(--color-bg-secondary) 96%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, transparent);
  border-radius: 18px;
}

.activity-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}

.event-item-left {
  align-items: flex-start;
}

.activity-times {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.event-badge {
  padding: 0.35rem 0.65rem;
  background: color-mix(in srgb, var(--color-bg) 74%, var(--color-bg-secondary));
  border-radius: 12px;
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

.code-text {
  font-family: var(--font-mono);
}

.empty-panel {
  padding: 1.2rem 1.3rem;
  color: var(--color-text-tertiary);
}

@media (max-width: 900px) {
  .activity-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .profile-identity {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .identity-topline {
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
