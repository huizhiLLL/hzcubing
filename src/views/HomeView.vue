<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          我来到，
          我看见<br />
          <span class="highlight">我记录</span>
          <span class="hero-subtitle">Veni, Vidi, Vici</span>
        </h1>
        <p class="hero-desc">
          "知识即为力量，记录即是见证"<br />
        </p>
        <div class="hero-actions">
          <router-link to="/leaderboard" class="btn btn-primary">
            查看榜单
          </router-link>
          <router-link to="/submit" class="btn btn-secondary">
            提交成绩
          </router-link>
        </div>
      </div>
    </section>

    <!-- Stats Bar -->
    <section class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalRecords || '0' }}</span>
        <span class="stat-label">总成绩数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalUsers || '0' }}</span>
        <span class="stat-label">活跃用户</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.recordBreaks || '0' }}</span>
        <span class="stat-label">纪录打破</span>
      </div>
    </section>

    <!-- Quick Nav -->
    <section class="quick-nav">
      <h2 class="section-title">探索项目</h2>
      <div class="event-grid">
        <router-link
          v-for="event in events"
          :key="event.id"
          :to="`/leaderboard?event=${event.id}`"
          class="event-card"
        >
          <span class="event-name">{{ event.name }}</span>
        </router-link>
      </div>
    </section>

    <!-- Recent Records -->
    <section class="recent-section">
      <h2 class="section-title">最新破纪录</h2>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="recentBreaks.length === 0" class="empty">暂无破纪录数据</div>
      <div v-else class="records-list">
        <div v-for="record in recentBreaks" :key="record._id" class="record-item">
          <router-link :to="`/user/${record.userId}`" class="user-link">
            {{ record.nickname }}
          </router-link>
          <div class="record-info">
            <span class="event-badge">{{ record.event }}</span>
            <span class="record-time">
              {{ formatTime(record.singleSeconds || record.averageSeconds) }}
            </span>
          </div>
          <span class="record-date">{{ formatDate(record.timestamp) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRecordsStore } from '../stores/records'
import { events } from '../config/events'

const recordsStore = useRecordsStore()
const recentBreaks = ref([])
const loading = ref(false)

const stats = computed(() => ({
  totalRecords: recordsStore.records.length,
  totalUsers: 0, // Would need a users store
  recordBreaks: recentBreaks.value.length
}))

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
  return dateStr.split('T')[0]
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      recordsStore.fetchRecords({ pageSize: 100 }),
      recordsStore.fetchRecentBreaks({ limit: 5 })
    ])
    recentBreaks.value = recordsStore.recentBreaks
  } catch (err) {
    console.error('Failed to load home data:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

/* Hero Section */
.hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 40vh;
  padding: var(--space-lg) 0 var(--space-md);
}

.hero-content {
  max-width: 800px;
}

.hero-title {
  font-family: var(--font-heading);
  font-size: 4rem;
  font-weight: 600;
  line-height: 1.1;
  margin-bottom: var(--space-lg);
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.hero-subtitle {
  display: inline-block;
  font-size: 1.5rem;
  color: var(--color-text-tertiary);
  margin-left: var(--space-md);
  font-weight: 400;
  letter-spacing: 0.05em;
}

.highlight {
  font-style: italic;
  color: var(--color-primary);
  position: relative;
}

.highlight::after {
  content: '';
  position: absolute;
  bottom: 0.1em;
  left: 0;
  right: 0;
  height: 0.15em;
  background: var(--color-primary);
  opacity: 0.3;
  transform: skewX(-5deg);
}

.hero-desc {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xl);
  line-height: 1.7;
  font-weight: 300;
  letter-spacing: 0.01em;
}

.hero-actions {
  display: flex;
  gap: var(--space-md);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  font-weight: 500;
  font-size: 1rem;
  letter-spacing: 0.02em;
  transition: all var(--transition-normal);
  cursor: pointer;
}

.btn-primary {
  background: var(--color-text);
  color: var(--color-bg);
}

.btn-primary:hover {
  background: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Stats Bar */
.stats-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-4xl);
  padding: var(--space-xl);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-border);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.stat-value {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.stat-divider {
  width: 1px;
  height: 60px;
  background: var(--color-border);
}

/* Section Title */
.section-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: var(--space-xl);
  color: var(--color-text);
}

/* Quick Nav */
.event-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-md);
}

.event-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  transition: all var(--transition-normal);
  cursor: pointer;
  text-decoration: none;
  color: var(--color-text);
}

.event-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.event-name {
  font-weight: 500;
  color: var(--color-text);
  font-size: 0.9375rem;
}

/* Recent Records */
.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.record-item {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.record-item:hover {
  border-color: var(--color-primary-light);
  background: var(--color-bg-tertiary);
}

.user-link {
  font-weight: 500;
  color: var(--color-text);
  min-width: 100px;
}

.user-link:hover {
  color: var(--color-primary);
}

.record-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.event-badge {
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
}

.record-time {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 1.125rem;
}

.record-date {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
  min-width: 100px;
  text-align: right;
}

.loading, .empty {
  text-align: center;
  padding: var(--space-xl);
  color: var(--color-text-secondary);
}

/* Responsive */
@media (max-width: 1024px) {
  .hero {
    min-height: auto;
    gap: var(--space-2xl);
  }

  .hero-content {
    max-width: 100%;
  }

  .hero-title {
    font-size: 3rem;
  }

  .hero-desc {
    font-size: 1.125rem;
  }

  .hero-actions {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .stats-bar {
    flex-direction: column;
    gap: var(--space-lg);
  }

  .stat-divider {
    width: 60px;
    height: 1px;
  }

  .stat-value {
    font-size: 2rem;
  }

  .record-item {
    flex-wrap: wrap;
  }

  .record-date {
    width: 100%;
    text-align: left;
    margin-top: var(--space-xs);
  }

  .event-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .event-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
