<template>
  <div class="profile-home">
    <AppStatusBlock v-if="!userStore.user" variant="empty" message="请先登录后查看个人主页">
      <AppButton variant="primary" to="/auth">去登录</AppButton>
    </AppStatusBlock>

    <UserProfileView v-else :key="profileRouteKey" />
  </div>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppStatusBlock from '@/components/common/AppStatusBlock.vue'
import { useUserStore } from '../stores/user'
import UserProfileView from './UserProfileView.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const profileRouteKey = computed(() => userStore.user?.userNo || userStore.user?.id || 'guest')

watchEffect(() => {
  const userId = userStore.user?.userNo || userStore.user?.id
  if (userId && String(route.params.id) !== String(userId)) {
    router.replace({ name: 'Profile', params: { id: userId } })
  }
})
</script>

<style scoped>
.profile-home {
  min-height: 100%;
}

</style>
