<template>
  <div class="home">
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

    <section class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ animatedStats.totalRecords }}</span>
        <span class="stat-label">总成绩数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ animatedStats.totalUsers }}</span>
        <span class="stat-label">活跃用户</span>
      </div>
    </section>

    <section class="quick-nav">
      <div class="section-heading">
        <h2 class="section-title">探索项目</h2>
        <p class="section-subtitle">官方、趣味、整活项目都在这里</p>
      </div>

      <div class="event-salon">
        <article
          v-for="group in groupedEventCards"
          :key="group.value"
          class="event-group"
          :class="`group-${group.value}`"
        >
        <div class="group-header">
            <div>
              <p class="group-kicker">{{ group.kicker }}</p>
              <h3>{{ group.label }}</h3>
            </div>
            <span>{{ group.events.length }} 项</span>
        </div>

          <div class="group-stage">
            <router-link
              v-if="group.featured"
              :to="`/leaderboard?event=${encodeURIComponent(group.featured.id)}`"
              class="event-card featured-card"
            >
              <span class="event-name featured-name">{{ group.featured.name }}</span>
            </router-link>

            <div class="support-grid">
              <router-link
                v-for="event in group.supporting"
                :key="event.id"
                :to="`/leaderboard?event=${encodeURIComponent(event.id)}`"
                class="event-card support-card"
              >
                <span class="event-name">{{ event.name }}</span>
              </router-link>
            </div>

            <div v-if="group.trailing.length" class="tag-cloud">
              <router-link
                v-for="event in group.trailing"
                :key="event.id"
                :to="`/leaderboard?event=${encodeURIComponent(event.id)}`"
                class="event-pill"
              >
                {{ event.name }}
              </router-link>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import { useRecordsStore } from '../stores/records'
import { useEventsStore } from '../stores/events'

const recordsStore = useRecordsStore()
const eventsStore = useEventsStore()
const animatedStats = reactive({
  totalRecords: 0,
  totalUsers: 0
})
const animationFrameIds = {
  totalRecords: null,
  totalUsers: null
}

const stats = computed(() => ({
  totalRecords: recordsStore.records.length,
  totalUsers: uniqueUsers.value
}))

const uniqueUsers = computed(() => {
  const userIds = new Set(recordsStore.records.map(r => r.userId))
  return userIds.size
})

const groupedEventCards = computed(() => [
  {
    label: '官方项目',
    kicker: 'Classic',
    value: 'official',
    events: eventsStore.getEventsByCategory('official')
  },
  {
    label: '趣味项目',
    kicker: 'Playground',
    value: 'fun',
    events: eventsStore.getEventsByCategory('fun')
  },
  {
    label: '整活项目',
    kicker: 'Offbeat',
    value: 'meme',
    events: eventsStore.getEventsByCategory('meme')
  }
].filter(group => group.events.length > 0).map(group => ({
  ...group,
  featured: group.events[0] || null,
  supporting: group.events.slice(1, 5),
  trailing: group.events.slice(5)
})))

function animateValue(key, target) {
  if (animationFrameIds[key]) {
    cancelAnimationFrame(animationFrameIds[key])
  }

  const start = animatedStats[key]
  const duration = 900
  const startTime = performance.now()

  const step = (currentTime) => {
    const progress = Math.min((currentTime - startTime) / duration, 1)
    const easedProgress = 1 - Math.pow(1 - progress, 3)

    animatedStats[key] = Math.round(start + (target - start) * easedProgress)

    if (progress < 1) {
      animationFrameIds[key] = requestAnimationFrame(step)
    } else {
      animatedStats[key] = target
      animationFrameIds[key] = null
    }
  }

  animationFrameIds[key] = requestAnimationFrame(step)
}

watch(
  stats,
  (nextStats) => {
    animateValue('totalRecords', nextStats.totalRecords)
    animateValue('totalUsers', nextStats.totalUsers)
  },
  { immediate: true }
)

onMounted(async () => {
  try {
    await Promise.all([
      recordsStore.fetchRecords({ pageSize: 2000 }),
      eventsStore.fetchMemeEvents()
    ])
  } catch (err) {
    console.error('Failed to load home data:', err)
  }
})

onBeforeUnmount(() => {
  Object.values(animationFrameIds).forEach((id) => {
    if (id) cancelAnimationFrame(id)
  })
})
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

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

.quick-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.section-heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.section-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-text);
}

.section-subtitle {
  color: var(--color-text-tertiary);
}

.event-salon {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-lg);
}

.event-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100%;
  padding: 1.15rem;
  border: 1px solid var(--color-border);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--group-accent) 13%, transparent) 0, transparent 36%),
    color-mix(in srgb, var(--color-bg-secondary) 94%, transparent);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
  position: relative;
  overflow: hidden;
}

.group-official {
  --group-accent: #14B8A6;
}

.group-fun {
  --group-accent: #F59E0B;
}

.group-meme {
  --group-accent: #EF4444;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
}

.group-kicker {
  margin-bottom: 0.25rem;
  color: var(--group-accent);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.group-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.group-header span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  min-height: 32px;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-bg) 72%, var(--color-bg-secondary));
  border: 1px solid color-mix(in srgb, var(--group-accent) 16%, var(--color-border));
  color: var(--color-text-tertiary);
  font-size: 0.8rem;
}

.group-stage {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.event-card {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-bg-secondary) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, transparent);
  transition:
    transform var(--transition-normal),
    border-color var(--transition-normal),
    color var(--transition-normal),
    box-shadow var(--transition-normal);
  text-align: center;
  color: var(--color-text);
}

.event-card:hover {
  border-color: color-mix(in srgb, var(--group-accent) 34%, var(--color-border));
  color: var(--group-accent);
  transform: translateY(-3px);
  box-shadow: 0 16px 28px color-mix(in srgb, var(--group-accent) 10%, transparent);
}

.featured-card {
  min-height: 178px;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 1.25rem;
  border-radius: 24px;
  background:
    linear-gradient(180deg, color-mix(in srgb, white 28%, transparent), transparent 52%),
    linear-gradient(135deg, color-mix(in srgb, var(--group-accent) 16%, transparent), color-mix(in srgb, var(--color-bg-secondary) 94%, transparent));
  position: relative;
  overflow: hidden;
}

.featured-card::after {
  content: '';
  position: absolute;
  width: 128px;
  height: 128px;
  top: -24px;
  right: -30px;
  border-radius: 32px;
  transform: rotate(18deg);
  background: color-mix(in srgb, var(--group-accent) 14%, transparent);
}

.card-label {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--group-accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.featured-name {
  position: relative;
  z-index: 1;
  text-align: left;
  font-size: 1.45rem;
  line-height: 1.15;
  max-width: 80%;
}

.support-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.support-card {
  min-height: 96px;
  padding: 0.95rem 0.85rem;
  border-radius: 20px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.event-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-bg) 74%, var(--color-bg-secondary));
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, transparent);
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.event-pill:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--group-accent) 30%, var(--color-border));
  color: var(--group-accent);
  background: color-mix(in srgb, var(--group-accent) 8%, var(--color-bg-secondary));
}

.event-name {
  font-size: 0.95rem;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.75rem;
  }

  .hero-subtitle {
    display: block;
    margin-left: 0;
    margin-top: var(--space-sm);
    font-size: 1.2rem;
  }

  .hero-actions,
  .stats-bar {
    flex-direction: column;
  }

  .event-salon {
    grid-template-columns: 1fr;
  }

  .stat-divider {
    width: 60px;
    height: 1px;
  }

  .support-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 980px) {
  .event-salon {
    grid-template-columns: 1fr;
  }
}
</style>
