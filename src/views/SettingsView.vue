<template>
  <div class="settings">
    <div class="page-header">
      <div>
        <h1>个人设置</h1>
        <p class="page-desc">管理你的昵称、WCA ID 和个人简介</p>
      </div>
      <router-link v-if="profileLink" :to="profileLink" class="profile-link">
        返回个人主页
      </router-link>
    </div>

    <div class="settings-sections">
      <section class="settings-section">
        <h2 class="section-title">基本信息</h2>
        <div class="settings-card">
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input :value="userStore.user?.email" type="email" class="form-input" disabled />
            <span class="form-hint">邮箱不可修改</span>
          </div>

          <div class="form-group">
            <label class="form-label">昵称</label>
            <input v-model="form.nickname" type="text" class="form-input" placeholder="输入昵称" />
          </div>

          <div class="form-group">
            <label class="form-label">WCA ID <span class="optional">(可选)</span></label>
            <input v-model="form.wcaId" type="text" class="form-input" placeholder="如：2024ZHAN01" />
          </div>

          <div class="form-group">
            <label class="form-label">个人简介 <span class="optional">(可选)</span></label>
            <textarea v-model="form.bio" class="form-textarea" placeholder="介绍一下自己..." rows="4"></textarea>
          </div>
        </div>
      </section>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">保存成功！</div>

      <div class="settings-actions">
        <button class="save-btn" :disabled="isSaving" @click="handleSave">
          {{ isSaving ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
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

const profileLink = computed(() => {
  const id = userStore.user?.id || userStore.user?._id
  return id ? `/profile/${id}` : ''
})

function syncForm() {
  form.nickname = userStore.user?.nickname || ''
  form.wcaId = userStore.user?.wcaId || ''
  form.bio = userStore.user?.bio || ''
}

watch(() => userStore.user, syncForm, { deep: true })
onMounted(syncForm)

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
  max-width: 760px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
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

.profile-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  font-weight: 600;
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
  font-weight: 700;
}

.settings-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-xl);
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
  font-weight: 600;
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
}

.form-textarea {
  resize: vertical;
  min-height: 96px;
}

.form-hint {
  color: var(--color-text-tertiary);
  font-size: 0.8125rem;
}

.error-message,
.success-message {
  padding: var(--space-md);
  border-radius: var(--radius-md);
  text-align: center;
  font-weight: 600;
}

.error-message {
  background: rgba(239, 68, 68, 0.12);
  color: var(--color-error);
}

.success-message {
  background: rgba(34, 197, 94, 0.16);
  color: #15803d;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  padding: var(--space-sm) var(--space-xl);
  background: var(--color-text);
  color: var(--color-bg);
  border-radius: var(--radius-md);
  font-weight: 700;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .settings-actions {
    justify-content: stretch;
  }

  .save-btn,
  .profile-link {
    width: 100%;
  }
}
</style>
