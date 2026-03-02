<template>
  <div class="leaderboard">
    <!-- 筛选控制台 -->
    <div class="filter-panel">
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

      <div class="type-toggle">
        <button
          class="type-btn"
          :class="{ active: type === 'single' }"
          @click="type = 'single'"
        >
          单次
        </button>
        <button
          class="type-btn"
          :class="{ active: type === 'average' }"
          @click="type = 'average'"
        >
          平均
        </button>
      </div>
    </div>

    <!-- Top 3 卡片 -->
    <div v-if="topThree.length > 0" class="top-three">
      <div
        v-for="(player, index) in topThree"
        :key="player.rank"
        class="top-card"
        :class="['rank-' + player.rank, 'medal-' + index]"
      >
        <div class="medal">{{ medals[index] }}</div>
        <UserCard
          :user-id="player.userId"
          :username="player.username"
          :nickname="player.nickname"
          :avatar-url="player.avatar"
        />
        <div class="top-time">
          <TimeDisplay :time="player.time" :large="true" />
        </div>
        <span class="top-date">{{ formatDate(player.date) }}</span>
      </div>
    </div>

    <!-- 排名表格 -->
    <div class="rank-table">
      <table>
        <thead>
          <tr>
            <th class="col-rank">排名</th>
            <th class="col-player">选手</th>
            <th class="col-time">成绩</th>
            <th class="col-date">日期</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in restPlayers" :key="player.rank">
            <td class="col-rank">
              <span class="rank-num">{{ player.rank }}</span>
            </td>
            <td class="col-player">
              <UserCard
                :user-id="player.userId"
                :username="player.username"
                :nickname="player.nickname"
                :avatar-url="player.avatar"
              />
            </td>
            <td class="col-time">
              <TimeDisplay :time="player.time" />
            </td>
            <td class="col-date">{{ formatDate(player.date) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 空状态 -->
      <div v-if="allPlayers.length === 0" class="empty-state">
        <span class="empty-icon">📊</span>
        <p>暂无数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import UserCard from '../components/common/UserCard.vue'
import TimeDisplay from '../components/common/TimeDisplay.vue'
import { events, getEventIconId } from '../config/events'

const currentEvent = ref('3x3')
const type = ref('single')
const medals = ['🥇', '🥈', '🥉']

// 模拟数据
const allPlayers = ref([
  { rank: 1, userId: 1, username: 'speedcuber', nickname: '小明', time: 6.54, date: '2024-01-15', avatar: '' },
  { rank: 2, userId: 2, username: 'cubemaster', nickname: '大神', time: 7.12, date: '2024-01-14', avatar: '' },
  { rank: 3, userId: 3, username: 'onehand', nickname: '单手王', time: 7.45, date: '2024-01-13', avatar: '' },
  { rank: 4, userId: 4, username: 'pocket', nickname: '小口袋', time: 8.23, date: '2024-01-12', avatar: '' },
  { rank: 5, userId: 5, username: 'blind', nickname: '盲拧侠', time: 8.56, date: '2024-01-11', avatar: '' },
  { rank: 6, userId: 6, username: 'fast', nickname: '快手', time: 9.01, date: '2024-01-10', avatar: '' },
  { rank: 7, userId: 7, username: 'cube', nickname: '魔方少年', time: 9.34, date: '2024-01-09', avatar: '' },
  { rank: 8, userId: 8, username: 'twisty', nickname: '扭转者', time: 9.67, date: '2024-01-08', avatar: '' },
  { rank: 9, userId: 9, username: 'speeder', nickname: '极速者', time: 10.12, date: '2024-01-07', avatar: '' },
  { rank: 10, userId: 10, username: 'solver', nickname: '解法大师', time: 10.45, date: '2024-01-06', avatar: '' }
])

const topThree = computed(() => allPlayers.value.slice(0, 3))
const restPlayers = computed(() => allPlayers.value.slice(3))

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.leaderboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Filter Panel */
.filter-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
}

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

.type-toggle {
  display: flex;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.type-btn {
  padding: var(--space-sm) var(--space-md);
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.type-btn.active {
  background: var(--color-text);
  color: var(--color-bg);
}

/* Top Three */
.top-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.top-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  text-align: center;
  position: relative;
}

.top-card.rank-1 {
  border-color: var(--color-gold);
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%);
}

.top-card.rank-2 {
  border-color: var(--color-silver);
  background: linear-gradient(180deg, rgba(156, 163, 175, 0.1) 0%, transparent 100%);
}

.top-card.rank-3 {
  border-color: var(--color-bronze);
  background: linear-gradient(180deg, rgba(205, 127, 50, 0.1) 0%, transparent 100%);
}

.medal {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  font-size: 1.5rem;
}

.top-time {
  margin-top: var(--space-sm);
}

.top-date {
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

/* Table */
.rank-table {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  width: 100%;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th, td {
  padding: var(--space-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
}

th {
  background: var(--color-bg-tertiary);
  font-weight: 600;
  font-size: 0.875rem;
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

.col-time {
  width: 150px;
}

.col-date {
  width: 100px;
  color: var(--color-text-tertiary);
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

/* Responsive */
@media (max-width: 768px) {
  .leaderboard {
    gap: var(--space-md);
  }

  .top-three {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }

  .top-card {
    flex-direction: row;
    padding: var(--space-sm) var(--space-md);
    gap: var(--space-md);
    text-align: left;
    align-items: center;
  }

  .top-card .medal {
    position: static;
    font-size: 1.25rem;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
  }

  .top-card .top-time {
    margin-top: 0;
    margin-left: auto;
    flex-shrink: 0;
  }

  /* Override TimeDisplay large size on mobile */
  .top-card :deep(.time-display.large) {
    font-size: 1.25rem;
  }
  
  /* Handle long usernames in Top 3 */
  .top-card :deep(.user-card) {
    flex: 1;
    min-width: 0;
  }
  
  .top-card :deep(.user-info) {
    min-width: 0;
    overflow: hidden;
  }
  
  .top-card :deep(.username) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .top-card .top-date {
    display: none;
  }

  .filter-panel {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .event-selector {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 2px; /* Prevent scrollbar overlap */
    -webkit-overflow-scrolling: touch;
  }

  /* Hide scrollbar for event selector */
  .event-selector::-webkit-scrollbar {
    display: none;
  }

  .event-tab {
    flex-shrink: 0;
    padding: var(--space-sm);
  }

  .type-toggle {
    align-self: flex-start;
    width: 100%;
  }
  
  .type-btn {
    flex: 1;
    text-align: center;
  }

  /* Table optimizations */
  .rank-table {
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

  .col-date {
    display: none;
  }
  
  .col-time {
    width: 90px;
    text-align: right;
    padding-right: var(--space-md);
  }

  .col-player :deep(.user-card) {
    max-width: 100%;
  }

  .col-player :deep(.user-info) {
    min-width: 0;
    overflow: hidden;
  }

  .col-player :deep(.username) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
}
</style>