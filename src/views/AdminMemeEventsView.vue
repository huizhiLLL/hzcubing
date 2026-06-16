<template>
  <div class="meme-events-admin">
    <AppPageHeader title="项目管理" :meta="`(${memeEvents.length} 个项目)`" />

    <AppStatusBlock
      v-if="!canManage"
      variant="error"
      message="这个页面只给管理员喵"
      title="没有权限"
    />

    <div v-if="canManage" class="meme-events-body">
      <section class="plain-section">
        <div class="plain-section-header">
          <div class="section-actions">
            <button type="button" class="icon-btn" aria-label="新增项目" title="新增项目" @click="openCreateModal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button class="ghost-btn" :disabled="eventsStore.isLoading" @click="loadEvents">刷新</button>
          </div>
        </div>
        <AppStatusBlock v-if="formSuccess" variant="success" layout="banner" :message="formSuccess" />
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
      </section>
    </div>

    <Teleport to="body">
      <div v-if="isEditorOpen" class="modal-backdrop" @click.self="closeEditor">
        <section class="event-modal" role="dialog" aria-modal="true" :aria-labelledby="editorTitleId">
          <div class="modal-header">
            <h2 :id="editorTitleId" class="modal-title">{{ editingCode ? '编辑项目' : '新增项目' }}</h2>
            <button type="button" class="icon-btn modal-close" aria-label="关闭窗口" title="关闭" @click="closeEditor">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">名称</label>
              <input v-model="form.eventName" type="text" class="form-input" placeholder="输入项目名称" />
            </div>

            <div class="form-group">
              <label class="form-label">代号</label>
              <input v-model="form.eventCode" type="text" class="form-input code-input" placeholder="如 blind-foot-relay" :disabled="!!editingCode" />
              <span class="form-hint">新增时可填写，编辑时暂时锁定，避免误改已有成绩关联</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">描述 <span class="optional">(可选)</span></label>
            <textarea v-model="form.description" class="form-textarea" rows="3" placeholder="输入项目说明"></textarea>
          </div>

          <label class="toggle-row">
            <input v-model="form.isActive" type="checkbox" />
            <span>{{ form.isActive ? '启用中' : '停用中' }}</span>
          </label>

          <AppStatusBlock v-if="formError" variant="error" layout="banner" :message="formError" />

          <AppFormActions>
            <button type="button" class="ghost-btn" :disabled="submitting" @click="closeEditor">取消</button>
            <button class="primary-btn" :disabled="submitting" @click="handleSubmit">
              {{ submitting ? '保存中...' : (editingCode ? '保存修改' : '创建项目') }}
            </button>
          </AppFormActions>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AppFormActions from '@/components/common/AppFormActions.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
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
const isEditorOpen = ref(false)
const submitting = ref(false)
const deletingCode = ref('')
const formError = ref('')
const formSuccess = ref('')
const editorTitleId = 'meme-event-editor-title'

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

function openCreateModal() {
  resetForm()
  isEditorOpen.value = true
}

function closeEditor() {
  if (submitting.value) return
  isEditorOpen.value = false
  resetForm()
}

async function startEdit(event) {
  form.eventName = event.name || ''
  form.eventCode = event.id || ''
  form.description = event.description || ''
  form.isActive = Boolean(event.isActive)
  editingCode.value = event.id
  formError.value = ''
  formSuccess.value = ''
  isEditorOpen.value = true
}

function formatDate(value) {
  if (!value) return '--'
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

async function loadEvents() {
  if (!canManage.value) return
  try {
    await eventsStore.ensureMemeEventsLoaded({ force: true })
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
    isEditorOpen.value = false
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
}

.meme-events-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.plain-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.plain-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.plain-section-title {
  font-family: var(--font-heading);
  font-size: 1.06rem;
  font-weight: 700;
  letter-spacing: 0;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.icon-btn:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-primary) 32%, var(--color-border));
  color: var(--color-primary);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(8px);
}

.event-modal {
  width: min(100%, 680px);
  max-height: min(720px, calc(100vh - 48px));
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: 1.35rem;
  border-radius: 22px;
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  background: var(--color-bg-secondary);
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0;
}

.modal-close {
  flex-shrink: 0;
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
.danger-btn {
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

.status-pill {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
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
  font-family: var(--font-heading);
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

  .plain-section-header {
    align-items: stretch;
    flex-direction: column;
  }

  .section-actions {
    width: 100%;
    align-items: stretch;
  }

  .icon-btn {
    width: 44px;
    flex-shrink: 0;
  }

  .modal-backdrop {
    align-items: flex-end;
    padding: 12px;
  }

  .event-modal {
    width: 100%;
    max-height: calc(100vh - 24px);
    padding: 1.1rem;
    border-radius: 20px;
  }

  .primary-btn,
  .ghost-btn,
  .danger-btn {
    width: 100%;
  }
}
</style>
