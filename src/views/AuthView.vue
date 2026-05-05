<template>
  <div class="auth-page">
    <div class="auth-shell">
      <AppPageHeader
        class="auth-intro"
        :eyebrow="isLogin ? '欢迎回来' : '创建账号'"
        :title="isLogin ? '登录账号' : '注册账号'"
        title-tag="h1"
      />

      <AppSectionCard
        class="auth-card"
      >
        <form class="auth-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input
              v-model="form.email"
              type="email"
              class="form-input"
              placeholder="输入邮箱"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label">密码</label>
            <input
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="输入密码"
              required
            />
          </div>

          <div v-if="!isLogin" class="form-group">
            <label class="form-label">昵称</label>
            <input
              v-model="form.nickname"
              type="text"
              class="form-input"
              placeholder="输入昵称"
              required
            />
          </div>

          <div v-if="!isLogin" class="form-group">
            <label class="form-label">QQ号 <span class="optional-tag">(选填)</span></label>
            <input
              v-model="form.qqId"
              type="text"
              class="form-input"
              placeholder="输入QQ号（可选）"
            />
          </div>

          <div v-if="!isLogin" class="form-group">
            <label class="form-label">确认密码</label>
            <input
              v-model="form.confirmPassword"
              type="password"
              class="form-input"
              placeholder="再次输入密码"
              required
            />
          </div>

          <AppStatusBlock v-if="error" variant="error" layout="banner" :message="error" />

          <AppFormActions align="between" class="auth-actions">
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              {{ isSubmitting ? '处理中...' : (isLogin ? '登录' : '注册') }}
            </button>
          </AppFormActions>
        </form>

        <div class="auth-footer">
          <button class="toggle-btn" @click="toggleMode">
            {{ isLogin ? '没有账号？点击注册' : '已有账号？点击登录' }}
          </button>
        </div>
      </AppSectionCard>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppFormActions from '@/components/common/AppFormActions.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppSectionCard from '@/components/common/AppSectionCard.vue'
import AppStatusBlock from '@/components/common/AppStatusBlock.vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isLogin = ref(true)
const isSubmitting = ref(false)
const error = ref('')

const form = ref({
  email: '',
  password: '',
  nickname: '',
  qqId: '',
  confirmPassword: ''
})

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
}

const handleSubmit = async () => {
  error.value = ''

  if (!isLogin.value && form.value.password !== form.value.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }

  if (!isLogin.value && !form.value.nickname) {
    error.value = '请输入昵称'
    return
  }

  isSubmitting.value = true

  try {
    if (isLogin.value) {
      await userStore.login(form.value.email, form.value.password)
    } else {
      await userStore.register({
        email: form.value.email,
        password: form.value.password,
        nickname: form.value.nickname,
        qqId: form.value.qqId || undefined
      })
    }

    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    console.error('Auth error:', e)
    error.value = e.message || '操作失败，请重试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 160px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: clamp(1rem, 5vh, 3rem);
}

.auth-shell {
  width: min(100%, 520px);
  display: grid;
  gap: 18px;
}

.auth-intro {
  margin-bottom: 0;
  text-align: center;
}

.auth-intro :deep(.page-header-copy) {
  max-width: none;
}

.auth-card {
  padding: 1.55rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.form-label {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.9375rem;
}

.optional-tag {
  font-weight: 400;
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 1rem 1.05rem;
  border: 1px solid color-mix(in srgb, var(--color-border) 90%, transparent);
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-bg) 70%, var(--color-bg-secondary));
  color: var(--color-text);
  font-size: 0.9375rem;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.auth-actions {
  margin-top: 0.35rem;
}

.submit-btn {
  min-width: 148px;
  padding: 1rem 1.4rem;
  border-radius: 18px;
  background: var(--color-text);
  color: var(--color-bg);
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
  transition:
    transform var(--transition-fast),
    opacity var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--color-primary);
  box-shadow: 0 18px 34px color-mix(in srgb, var(--color-primary) 28%, transparent);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.auth-footer {
  padding-top: 0.4rem;
  border-top: 1px solid color-mix(in srgb, var(--color-border) 72%, transparent);
}

.toggle-btn {
  color: var(--color-primary);
  font-size: 0.9375rem;
  font-weight: 600;
  transition: opacity var(--transition-fast);
}

.toggle-btn:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .auth-page {
    min-height: auto;
    padding-top: 0;
  }

  .auth-card {
    padding: 1.25rem;
  }

  .submit-btn {
    max-width: none;
    width: 100%;
  }
}
</style>
