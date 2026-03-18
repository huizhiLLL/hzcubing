<template>
  <div class="settings">
    <AppPageHeader eyebrow="个人资料" title="个人设置" title-tag="h1">
      <template #aside>
        <router-link v-if="profileLink" :to="profileLink" class="profile-link">
          返回个人主页
        </router-link>
      </template>
    </AppPageHeader>

    <div class="settings-sections">
      <AppSectionCard title="基本信息">
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
      </AppSectionCard>

      <AppStatusBlock v-if="error" variant="error" layout="banner" :message="error" />
      <AppStatusBlock v-if="success" variant="success" layout="banner" message="保存成功！" />

      <AppFormActions>
        <button class="save-btn" :disabled="isSaving" @click="handleSave">
          {{ isSaving ? '保存中...' : '保存修改' }}
        </button>
      </AppFormActions>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppFormActions from '@/components/common/AppFormActions.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppSectionCard from '@/components/common/AppSectionCard.vue'
import AppStatusBlock from '@/components/common/AppStatusBlock.vue'
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
  const id = userStore.user?.userNo || userStore.user?.id
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
  max-width: 880px;
  margin: 0 auto;
}

.profile-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0.85rem 1.1rem;
  border-radius: 16px;
  background: color-mix(in srgb, var(--color-bg-secondary) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, transparent);
  color: var(--color-text);
  font-weight: 600;
  white-space: nowrap;
  transition: border-color var(--transition-fast), transform var(--transition-fast), color var(--transition-fast);
}

.profile-link:hover {
  border-color: color-mix(in srgb, var(--color-primary) 32%, var(--color-border));
  color: var(--color-primary);
  transform: translateY(-1px);
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 18px;
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

.optional {
  color: var(--color-text-tertiary);
  font-weight: 400;
  font-size: 0.875rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 1rem 1.05rem;
  border: 1px solid color-mix(in srgb, var(--color-border) 90%, transparent);
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-bg) 70%, var(--color-bg-secondary));
  color: var(--color-text);
  font-size: 0.9375rem;
  font-family: inherit;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.form-input:disabled {
  background: color-mix(in srgb, var(--color-bg-tertiary) 72%, transparent);
  color: var(--color-text-tertiary);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.form-hint {
  color: var(--color-text-tertiary);
  font-size: 0.8125rem;
  line-height: 1.5;
}

.save-btn {
  min-width: 168px;
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

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--color-primary);
  box-shadow: 0 18px 34px color-mix(in srgb, var(--color-primary) 28%, transparent);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 768px) {
  .profile-link,
  .save-btn {
    width: 100%;
  }
}
</style>
