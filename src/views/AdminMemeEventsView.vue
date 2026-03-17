<template>
  <div class="meme-events-admin">
    <AppPageHeader title="整活项目管理" subtitle="管理当前数据库中的全部整活项目">
      <template #aside>
        <span class="stats-pill">共 {{ memeEvents.length }} 个项目</span>
      </template>
    </AppPageHeader>

    <AppStatusBlock
      v-if="!canManage"
      variant="error"
      message="这个页面只给管理员喵"
      title="没有权限"
    />

    <template v-else>
      <AppSectionCard :title="editingCode ? '编辑项目' : '新增项目'">
        <template v-if="editingCode" #aside>
          <button class="ghost-btn" @click="resetForm">取消编辑</button>
        </template>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">项目名称</label>
            <input v-model="form.eventName" type="text" class="form-input" placeholder="输入项目名称" />
          </div>

          <div class="form-group">
            <label class="form-label">项目代号</label>
            <input v-model="form.eventCode" type="text" class="form-input code-input" placeholder="如 blind-foot-relay" :disabled="!!editingCode" />
            <span class="form-hint">新增时可填写，编辑时暂时锁定，避免误改已有成绩关联</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">项目描述 <span class="optional">(可选)</span></label>
          <textarea v-model="form.description" class="form-textarea" rows="3" placeholder="输入项目说明"></textarea>
        </div>

        <label class="toggle-row">
          <input v-model="form.isActive" type="checkbox" />
          <span>{{ form.isActive ? '启用中' : '停用中' }}</span>
        </label>

        <AppStatusBlock v-if="formError" variant="error" layout="banner" :message="formError" />
        <AppStatusBlock v-if="formSuccess" variant="success" layout="banner" :message="formSuccess" />

        <AppFormActions>
          <button class="primary-btn" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? '保存中...' : (editingCode ? '保存修改' : '创建项目') }}
          </button>
        </AppFormActions>
      </AppSectionCard>

      <AppSectionCard title="项目列表">
        <template #aside>
          <button class="ghost-btn" :disabled="eventsStore.isLoading" @click="loadEvents">刷新</button>
        </template>
        <div class="list-wrap">
          <article v-for="event in memeEvents" :key="event.id" class="event-card">
            <div class="event-main">
              <div class="event-top">
                <div>
                  <h3>{{ event.name }}</h3>
                  <p class="event-code">{{ event.id }}</p>
                </div>
                <span class="status-pill" :class="event.isActive ? 'is-active' : 'is-inactive'">
                  {{ event.isActive ? '启用中' : '已停用' }}
                </span>
              </div>

              <p v-if="event.description" class="event-desc">{{ event.description }}</p>

              <div class="event-meta">
                <span>创建者：{{ event.createdByName || 'system' }}</span>
                <span>更新于：{{ formatDate(event.updatedAt || event.createdAt) }}</span>
              </div>
            </div>

            <div class="event-actions">
              <button class="ghost-btn" @click="startEdit(event)">编辑</button>
              <button class="ghost-btn" :disabled="submitting && editingCode === event.id" @click="toggleStatus(event)">
                {{ event.isActive ? '停用' : '启用' }}
              </button>
              <button class="danger-btn" :disabled="deletingCode === event.id" @click="handleDelete(event)">
                {{ deletingCode === event.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </article>

          <AppStatusBlock v-if="memeEvents.length === 0" variant="empty" layout="banner" message="当前还没有整活项目" />
        </div>
      </AppSectionCard>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import AppFormActions from '@/components/common/AppFormActions.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppSectionCard from '@/components/common/AppSectionCard.vue'
import AppStatusBlock from '@/components/common/AppStatusBlock.vue'
import { useEventsStore } from '@/stores/events'
import { useUserStore } from '@/stores/user'

const eventsStore = useEventsStore()
const userStore = useUserStore()

const form = reactive({
  eventName: '',
  eventCode: '',
  description: '',
  isActive: true
})

const editingCode = ref('')
const submitting = ref(false)
const deletingCode = ref('')
const formError = ref('')
const formSuccess = ref('')

const canManage = computed(() => ['admin', 'super_admin'].includes(userStore.user?.role))
const memeEvents = computed(() => [...(eventsStore.memeEvents || [])].sort((a, b) => {
  const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime()
  const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime()
  return timeB - timeA
}))

function resetForm() {
  form.eventName = ''
  form.eventCode = ''
  form.description = ''
  form.isActive = true
  editingCode.value = ''
  formError.value = ''
  formSuccess.value = ''
}

async function startEdit(event) {
  form.eventName = event.name || ''
  form.eventCode = event.id || ''
  form.description = event.description || ''
  form.isActive = Boolean(event.isActive)
  editingCode.value = event.id
  formError.value = ''
  formSuccess.value = ''

  await nextTick()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function formatDate(value) {
  if (!value) return '--'
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

async function loadEvents() {
  if (!canManage.value) return
  try {
    await eventsStore.fetchMemeEvents(true)
  } catch (err) {
    formError.value = err.message || '加载项目失败'
  }
}

async function handleSubmit() {
  formError.value = ''
  formSuccess.value = ''
  submitting.value = true

  try {
    if (editingCode.value) {
      await eventsStore.updateMemeEvent(editingCode.value, {
        eventName: form.eventName,
        description: form.description,
        isActive: form.isActive
      })
      formSuccess.value = '项目已更新'
    } else {
      await eventsStore.createMemeEvent({
        eventName: form.eventName,
        eventCode: form.eventCode,
        description: form.description
      })
      formSuccess.value = '项目已创建'
    }

    await loadEvents()
    resetForm()
  } catch (err) {
    formError.value = err.message || '保存失败'
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(event) {
  formError.value = ''
  formSuccess.value = ''

  try {
    await eventsStore.updateMemeEvent(event.id, {
      eventName: event.name,
      description: event.description || '',
      isActive: !event.isActive
    })
    formSuccess.value = `项目已${event.isActive ? '停用' : '启用'}`
  } catch (err) {
    formError.value = err.message || '更新状态失败'
  }
}

async function handleDelete(event) {
  const confirmed = window.confirm(`确定删除项目「${event.name}」吗？`)
  if (!confirmed) return

  formError.value = ''
  formSuccess.value = ''
  deletingCode.value = event.id

  try {
    await eventsStore.deleteMemeEvent(event.id)
    if (editingCode.value === event.id) resetForm()
    formSuccess.value = '项目已删除'
  } catch (err) {
    formError.value = err.message || '删除失败'
  } finally {
    deletingCode.value = ''
  }
}

onMounted(loadEvents)
</script>

<style scoped>
.meme-events-admin {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  max-width: 980px;
  margin: 0 auto;
}

.event-top,
.event-actions,
.event-meta {
  display: flex;
  align-items: center;
}

.event-top {
  justify-content: space-between;
  gap: var(--space-md);
}

.form-hint,
.event-code,
.event-desc,
.event-meta {
  color: var(--color-text-secondary);
}

.event-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
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
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.95rem;
}

.code-input {
  font-family: var(--font-mono);
}

.form-textarea {
  resize: vertical;
}

.toggle-row {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 600;
}

.primary-btn,
.ghost-btn,
.danger-btn,
.stats-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-weight: 700;
}

.primary-btn,
.ghost-btn,
.danger-btn {
  min-height: 44px;
  padding: 0.75rem 1rem;
}

.primary-btn {
  background: var(--color-text);
  color: var(--color-bg);
}

.ghost-btn {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.danger-btn {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  border: 1px solid rgba(239, 68, 68, 0.24);
}

.stats-pill,
.status-pill {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.stats-pill {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
}

.status-pill {
  border-radius: 999px;
}

.status-pill.is-active {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}

.status-pill.is-inactive {
  background: var(--color-bg);
  color: var(--color-text-secondary);
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.event-card {
  padding: var(--space-lg);
}

.event-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.event-top h3 {
  font-size: 1.1rem;
  font-weight: 700;
}

.event-code {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  margin-top: 4px;
}

.event-desc {
  line-height: 1.7;
}

.event-meta {
  gap: var(--space-md);
  flex-wrap: wrap;
  font-size: 0.875rem;
}

.event-actions {
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-top: var(--space-md);
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .event-top,
  .event-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-pill,
  .primary-btn,
  .ghost-btn,
  .danger-btn {
    width: 100%;
  }
}
</style>
