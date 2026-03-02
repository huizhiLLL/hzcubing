<template>
  <div class="settings">
    <div class="page-header">
      <h1>个人设置</h1>
      <p class="page-desc">管理你的账号信息</p>
    </div>

    <div class="settings-sections">
      <!-- 基本信息 -->
      <section class="settings-section">
        <h2 class="section-title">基本信息</h2>
        <div class="settings-card">
          <div class="form-group">
            <label class="form-label">头像</label>
            <div class="avatar-upload">
              <div class="avatar-preview" :style="{ background: avatarBg }">
                <span v-if="!userStore.user?.avatar" class="avatar-text">
                  {{ userStore.user?.username?.[0]?.toUpperCase() }}
                </span>
                <img v-else :src="userStore.user.avatar" alt="avatar" />
              </div>
              <button type="button" class="upload-btn">更换头像</button>
            </div>
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
            <label class="form-label">用户名</label>
            <input
              :value="userStore.user?.username"
              type="text"
              class="form-input"
              disabled
            />
            <span class="form-hint">用户名不可修改</span>
          </div>
        </div>
      </section>

      <!-- 账号绑定 -->
      <section class="settings-section">
        <h2 class="section-title">账号绑定</h2>
        <div class="settings-card">
          <div class="form-group">
            <label class="form-label">QQ 号</label>
            <input
              v-model="form.qq"
              type="text"
              class="form-input"
              placeholder="输入 QQ 号"
            />
            <span class="form-hint">用于 Bot 端群内成绩播报和查询</span>
          </div>
        </div>
      </section>

      <!-- 提交按钮 -->
      <div class="settings-actions">
        <button class="save-btn" :disabled="isSaving" @click="handleSave">
          {{ isSaving ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const isSaving = ref(false)

// 固定背景色
const avatarBg = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

const form = ref({
  nickname: userStore.user?.nickname || '',
  qq: userStore.user?.qq || ''
})

const handleSave = async () => {
  isSaving.value = true
  // 模拟保存
  await new Promise(resolve => setTimeout(resolve, 1000))
  isSaving.value = false
  alert('保存成功')
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

.form-input:disabled {
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.form-hint {
  color: var(--color-text-tertiary);
  font-size: 0.8125rem;
}

/* Avatar Upload */
.avatar-upload {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.avatar-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

.upload-btn {
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 0.875rem;
}

.upload-btn:hover {
  background: var(--color-border);
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