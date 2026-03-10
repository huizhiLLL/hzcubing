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
              rows="4"
            ></textarea>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h2 class="section-title">整活项目</h2>
        <div class="settings-card">
          <div class="form-group">
            <label class="form-label">项目名称</label>
            <input
              v-model="memeEventForm.eventName"
              type="text"
              class="form-input"
              placeholder="如：盲拧脚拧接力" 
            />
          </div>

          <div class="form-group">
            <label class="form-label">项目代号 <span class="optional">(可选)</span></label>
            <input
              v-model="memeEventForm.eventCode"
              type="text"
              class="form-input"
              placeholder="留空则根据名称自动生成，如 blind-foot-relay"
            />
            <span class="form-hint">只支持字母、数字、下划线和连字符</span>
          </div>

          <div class="form-group">
            <label class="form-label">项目描述 <span class="optional">(可选)</span></label>
            <textarea
              v-model="memeEventForm.description"
              class="form-textarea"
              placeholder="写点规则、梗来源或者说明..."
              rows="3"
            ></textarea>
          </div>

          <div class="settings-actions inline-actions">
            <button class="save-btn" :disabled="isCreatingEvent" @click="handleCreateMemeEvent">
              {{ isCreatingEvent ? '创建中...' : '创建整活项目' }}
            </button>
          </div>

          <div v-if="eventError" class="error-message">
            {{ eventError }}
          </div>

          <div v-if="eventSuccess" class="success-message">
            整活项目已更新！
          </div>

          <div v-if="myMemeEvents.length > 0" class="meme-event-list">
            <article v-for="event in myMemeEvents" :key="event.id" class="meme-event-item">
              <div class="meme-event-main">
                <div class="meme-event-title-row">
                  <h3>{{ event.name }}</h3>
                  <span class="status-pill" :class="event.isActive ? 'is-active' : 'is-inactive'">
                    {{ event.isActive ? '启用中' : '已停用' }}
                  </span>
                </div>
                <p class="meme-event-code">{{ event.id }}</p>
                <p v-if="event.description" class="meme-event-desc">{{ event.description }}</p>
              </div>
              <button
                class="toggle-btn"
                :disabled="updatingEventCode === event.id"
                @click="handleToggleEvent(event)"
              >
                {{ updatingEventCode === event.id ? '处理中...' : (event.isActive ? '停用' : '启用') }}
              </button>
            </article>
          </div>

          <div v-else class="form-hint">
            你还没有创建整活项目
          </div>
        </div>
      </section>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        保存成功！
      </div>

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
import { useEventsStore } from '../stores/events'

const userStore = useUserStore()
const eventsStore = useEventsStore()

const isSaving = ref(false)
const error = ref('')
const success = ref(false)
const eventError = ref('')
const eventSuccess = ref(false)
const isCreatingEvent = ref(false)
const updatingEventCode = ref('')

const form = reactive({
  nickname: '',
  wcaId: '',
  bio: ''
})

const memeEventForm = reactive({
  eventName: '',
  eventCode: '',
  description: ''
})

const profileLink = computed(() => {
  const id = userStore.user?.id || userStore.user?._id
  return id ? `/profile/${id}` : ''
})

const myMemeEvents = computed(() => eventsStore.myMemeEvents || [])

function syncForm() {
  form.nickname = userStore.user?.nickname || ''
  form.wcaId = userStore.user?.wcaId || ''
  form.bio = userStore.user?.bio || ''
}

onMounted(syncForm)
watch(() => userStore.user, syncForm, { deep: true })

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

const handleCreateMemeEvent = async () => {
  eventError.value = ''
  eventSuccess.value = false
  isCreatingEvent.value = true

  try {
    await eventsStore.createMemeEvent({
      eventName: memeEventForm.eventName,
      eventCode: memeEventForm.eventCode,
      description: memeEventForm.description
    })

    memeEventForm.eventName = ''
    memeEventForm.eventCode = ''
    memeEventForm.description = ''
    eventSuccess.value = true
    setTimeout(() => {
      eventSuccess.value = false
    }, 3000)
  } catch (err) {
    console.error('Create meme event error:', err)
    eventError.value = err.message || '创建失败，请重试'
  } finally {
    isCreatingEvent.value = false
  }
}

const handleToggleEvent = async (event) => {
  eventError.value = ''
  eventSuccess.value = false
  updatingEventCode.value = event.id

  try {
    await eventsStore.updateMemeEvent(event.id, {
      isActive: !event.isActive,
      eventName: event.name,
      description: event.description || ''
    })
    eventSuccess.value = true
    setTimeout(() => {
      eventSuccess.value = false
    }, 3000)
  } catch (err) {
    console.error('Update meme event error:', err)
    eventError.value = err.message || '更新失败，请重试'
  } finally {
    updatingEventCode.value = ''
  }
}

onMounted(async () => {
  syncForm()
  try {
    await eventsStore.fetchMyMemeEvents()
  } catch (err) {
    console.error('Failed to fetch my meme events:', err)
  }
})
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

.inline-actions {
  justify-content: flex-start;
}

.save-btn,
.toggle-btn {
  padding: var(--space-sm) var(--space-xl);
  background: var(--color-text);
  color: var(--color-bg);
  border-radius: var(--radius-md);
  font-weight: 700;
}

.toggle-btn {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding-inline: var(--space-lg);
}

.save-btn:disabled,
.toggle-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.meme-event-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.meme-event-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.meme-event-main {
  flex: 1;
  min-width: 0;
}

.meme-event-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.meme-event-title-row h3 {
  font-size: 1rem;
  font-weight: 700;
}

.meme-event-code,
.meme-event-desc {
  color: var(--color-text-secondary);
}

.meme-event-code {
  font-family: var(--font-mono);
  font-size: 0.875rem;
}

.meme-event-desc {
  margin-top: 4px;
  line-height: 1.6;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-pill.is-active {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}

.status-pill.is-inactive {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .settings-actions {
    justify-content: stretch;
  }

  .meme-event-item {
    flex-direction: column;
  }

  .save-btn,
  .toggle-btn,
  .profile-link {
    width: 100%;
  }
}
</style>
