<template>
  <div class="profile-home">
    <AppStatusBlock v-if="!userStore.user" variant="empty" message="请先登录后查看个人主页">
      <router-link to="/auth" class="primary-link">去登录</router-link>
    </AppStatusBlock>

    <UserProfileView v-else :key="profileRouteKey" />
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppStatusBlock from '@/components/common/AppStatusBlock.vue'
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
