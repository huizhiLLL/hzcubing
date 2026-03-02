<template>
  <div class="record-history">
    <!-- 项目选择 -->
    <div class="event-selector">
      <button
        v-for="event in events"
        :key="event.id"
        class="event-tab"
        :class="{ active: currentEvent === event.id }"
        @click="currentEvent = event.id"
      >
        <span class="cubing-icon" :class="'event-' + getEventIconId(event.id)"></span>
        <span class="event-name">{{ event.name }}</span>
      </button>
    </div>

    <!-- 当前项目标题 -->
    <div class="timeline-header">
      <h2>{{ currentEventName }} 记录突破历程</h2>
      <p class="timeline-subtitle">见证每一次纪录的诞生</p>
    </div>

    <!-- 时间轴 -->
    <div class="timeline">
      <div
        v-for="(record, index) in records"
        :key="record.id"
        class="timeline-item"
        :class="{ 'latest': index === 0 }"
      >
        <div class="timeline-marker">
          <div class="marker-dot"></div>
          <div v-if="index < records.length - 1" class="marker-line"></div>
        </div>
        <div class="timeline-content">
          <div class="record-card">
            <div class="record-header">
              <UserCard
                :user-id="record.userId"
                :username="record.username"
                :nickname="record.nickname"
              />
              <span class="record-date">{{ formatDate(record.date) }}</span>
            </div>
            <div class="record-comparison">
              <div class="time-box old">
                <span class="time-label">原纪录</span>
                <TimeDisplay :time="record.oldTime" />
              </div>
              <div class="arrow">→</div>
              <div class="time-box new">
                <span class="time-label">新纪录</span>
                <TimeDisplay :time="record.newTime" :large="true" />
              </div>
            </div>
            <div class="record-improvement">
              进步 {{ (record.oldTime - record.newTime).toFixed(2) }} 秒
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="records.length === 0" class="empty-state">
      <span class="empty-icon">📜</span>
      <p>暂无记录历程</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import UserCard from '../components/common/UserCard.vue'
import TimeDisplay from '../components/common/TimeDisplay.vue'
import { events, getEventIconId } from '../config/events'

const currentEvent = ref('3x3')

const currentEventName = computed(() => {
  return events.find(e => e.id === currentEvent.value)?.name || '三阶'
})

// 模拟数据
const records = ref([
  { id: 1, event: '3x3', userId: 1, username: 'speedcuber', nickname: '小明', oldTime: 7.12, newTime: 6.54, date: '2024-01-15' },
  { id: 2, event: '3x3', userId: 2, username: 'cubemaster', nickname: '大神', oldTime: 7.89, newTime: 7.12, date: '2024-01-10' },
  { id: 3, event: '3x3', userId: 1, username: 'speedcuber', nickname: '小明', oldTime: 8.45, newTime: 7.89, date: '2024-01-05' },
  { id: 4, event: '3x3', userId: 3, username: 'onehand', nickname: '单手王', oldTime: 9.23, newTime: 8.45, date: '2023-12-28' },
  { id: 5, event: '3x3', userId: 4, username: 'pocket', nickname: '小口袋', oldTime: 10.12, newTime: 9.23, date: '2023-12-20' }
])

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}
</script>

<style scoped>
.record-history {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Event Selector */
.event-selector {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.event-tab {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  transition: all var(--transition-fast);
}

.event-tab:hover {
  border-color: var(--color-primary);
}

.event-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* Timeline Header */
.timeline-header {
  margin-bottom: var(--space-md);
}

.timeline-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.timeline-subtitle {
  color: var(--color-text-tertiary);
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: var(--space-xl);
}

.timeline-item {
  position: relative;
}

.timeline-marker {
  position: absolute;
  left: calc(-1 * var(--space-xl) + 6px);
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-border);
  border: 2px solid var(--color-bg);
  z-index: 1;
}

.timeline-item.latest .marker-dot {
  background: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-light);
}

.marker-line {
  width: 2px;
  flex: 1;
  background: var(--color-border);
  margin-top: var(--space-sm);
  min-height: 40px;
}

.timeline-content {
  padding-bottom: var(--space-xl);
}

.record-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.timeline-item.latest .record-card {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg-secondary) 100%);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.record-date {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

.record-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
}

.time-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.time-label {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.time-box.new {
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
}

.arrow {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.record-improvement {
  text-align: center;
  color: var(--color-success);
  font-weight: 500;
  font-size: 0.9375rem;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  color: var(--color-text-tertiary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
}

@media (max-width: 768px) {
  .record-comparison {
    flex-direction: column;
    gap: var(--space-md);
  }

  .arrow {
    transform: rotate(90deg);
  }
}
</style>