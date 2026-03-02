<template>
  <router-link
    :to="`/user/${userId}`"
    class="user-card"
    :class="{ 'compact': compact }"
  >
    <div class="avatar" :style="{ background: avatarBg }">
      <img v-if="avatarUrl" :src="avatarUrl" :alt="username" />
      <span v-else class="avatar-text">{{ initial }}</span>
    </div>
    <div v-if="!compact" class="user-info">
      <span class="username">{{ nickname || username }}</span>
      <span v-if="showUsername && nickname" class="raw-username">@{{ username }}</span>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  userId: {
    type: [Number, String],
    required: true
  },
  username: {
    type: String,
    default: ''
  },
  nickname: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  },
  showUsername: {
    type: Boolean,
    default: false
  }
})

const initial = computed(() => {
  const name = props.nickname || props.username || '?'
  return name[0]?.toUpperCase() || '?'
})

const avatarBg = computed(() => {
  // 生成固定的渐变背景
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'
  ]
  const index = Math.abs((props.userId || 0) % colors.length)
  return colors[index]
})
</script>

<style scoped>
.user-card {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--color-text);
  border-radius: var(--radius-md);
  transition: opacity var(--transition-fast);
}

.user-card:hover {
  opacity: 0.8;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.compact .avatar {
  width: 24px;
  height: 24px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.compact .avatar-text {
  font-size: 0.75rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 500;
  font-size: 0.9375rem;
  line-height: 1.3;
}

.raw-username {
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
}
</style>