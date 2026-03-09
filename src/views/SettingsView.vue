<template>
  <div class="settings">
    <div class="page-header">
      <h1>个人设置</h1>
      <p class="page-desc">管理你的账号信息</p>
    </div>

    <div class="settings-sections">
      <!-- Basic Info -->
      <section class="settings-section">
        <h2 class="section-title">基本信息</h2>
        <div class="settings-card">
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input
              :value="userStore.user?.email"
              type="email"
              class="form-input"
              disabled
            />
            <span class="form-hint">邮箱不可修改</span>
          </div>

          <div class="form-group">
            <label class="form-label">昵称</label>
            <input
              v-model="form.nickname"
              type="text"
              class="form-input"
              placeholder="输入昵称"
            />
          </div>

          <div class="form-group">
            <label class="form-label">WCA ID <span class="optional">(可选)</span></label>
            <input
              v-model="form.wcaId"
              type="text"
              class="form-input"
              placeholder="如：2024ZHAN01"
            />
          </div>

          <div class="form-group">
            <label class="form-label">个人简介 <span class="optional">(可选)</span></label>
            <textarea
              v-model="form.bio"
              class="form-textarea"
              placeholder="介绍一下自己..."
              rows="3"
            ></textarea>
          </div>
        </div>
      </section>

      <!-- Error & Success Messages -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        保存成功！
      </div>

      <!-- Submit Button -->
      <div class="settings-actions">
        <button class="save-btn" :disabled="isSaving" @click="handleSave">
          {{ isSaving ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const isSaving = ref(false)
const error = ref('')
const success = ref(false)

const form = reactive({
  nickname: '',
  wcaId: '',
  bio: ''
})

onMounted(() => {
  if (userStore.user) {
    form.nickname = userStore.user.nickname || ''
    form.wcaId = userStore.user.wcaId || ''
    form.bio = userStore.user.bio || ''
  }
})

const handleSave = async () => {
  error.value = ''
  success.value = false
  isSaving.value = true

  try {
    await userStore.updateProfile({
      nickname: form.nickname,
      wcaId: form.wcaId,
      bio: form.bio
    })
    success.value = true
    
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    console.error('Save error:', err)
    error.value = err.message || '保存失败，请重试'
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.settings {
  max-width: 600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--space-xs);
}

.page-desc {
  color: var(--color-text-secondary);
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.settings-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
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

.optional {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.form-input,
.form-textarea {
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 1rem;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-input:disabled {
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-hint {
  color: var(--color-text-tertiary);
  font-size: 0.8125rem;
}

/* Messages */
.error-message {
  padding: var(--space-md);
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-error);
  text-align: center;
}

.success-message {
  padding: var(--space-md);
  background: var(--color-success);
  color: white;
  border-radius: var(--radius-md);
  text-align: center;
  font-weight: 500;
}

/* Actions */
.settings-actions {
  padding-top: var(--space-md);
}

.save-btn {
  padding: var(--space-sm) var(--space-xl);
  background: var(--color-text);
  color: var(--color-bg);
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: opacity var(--transition-fast);
}

.save-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
