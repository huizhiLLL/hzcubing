<template>
  <div class="profile-home">
    <div v-if="!userStore.user" class="empty-state">
      <p>请先登录后查看个人主页</p>
      <router-link to="/auth" class="primary-link">去登录</router-link>
    </div>

    <UserProfileView v-else :key="profileRouteKey" />
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import UserProfileView from './UserProfileView.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const profileRouteKey = computed(() => userStore.user?.id || userStore.user?._id || 'guest')

watchEffect(() => {
  const userId = userStore.user?.id || userStore.user?._id
  if (userId && route.params.id !== userId) {
    router.replace({ name: 'Profile', params: { id: userId } })
  }
})
</script>

<style scoped>
.profile-home {
  min-height: 100%;
}

.empty-state {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--space-md);
  color: var(--color-text-secondary);
}

/* empty-icon removed */

.primary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--color-text);
  color: var(--color-bg);
  font-weight: 600;
}
</style>
