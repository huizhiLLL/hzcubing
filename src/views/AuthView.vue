<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h1>{{ isLogin ? '登录' : '注册' }}</h1>
        <p>{{ isLogin ? '欢迎回来' : '创建你的账号' }}</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="输入用户名"
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
          <label class="form-label">确认密码</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            placeholder="再次输入密码"
            required
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          {{ isSubmitting ? '处理中...' : (isLogin ? '登录' : '注册') }}
        </button>
      </form>

      <div class="auth-footer">
        <button class="toggle-btn" @click="toggleMode">
          {{ isLogin ? '没有账号？点击注册' : '已有账号？点击登录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true)
const isSubmitting = ref(false)
const error = ref('')

const form = ref({
  username: '',
  password: '',
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

  isSubmitting.value = true

  try {
    // 模拟登录/注册
    await userStore.login(form.value.username, form.value.password)
    router.push('/')
  } catch (e) {
    error.value = '操作失败，请重试'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: var(--space-xl);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.auth-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: var(--space-xs);
}

.auth-header p {
  color: var(--color-text-secondary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-label {
  font-weight: 500;
  color: var(--color-text);
}

.form-input {
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.error-message {
  padding: var(--space-sm);
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: 0.875rem;
  text-align: center;
}

.submit-btn {
  padding: var(--space-md);
  background: var(--color-text);
  color: var(--color-bg);
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: opacity var(--transition-fast);
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: var(--space-lg);
  text-align: center;
}

.toggle-btn {
  color: var(--color-primary);
  font-size: 0.9375rem;
}

.toggle-btn:hover {
  text-decoration: underline;
}
</style>