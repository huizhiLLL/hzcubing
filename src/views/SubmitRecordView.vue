<template>
  <div class="submit-record">
    <AppPageHeader :title="isManagePage ? '管理成绩' : '提交成绩'">
      <template #aside>
        <button type="button" class="page-manage-btn" :class="{ active: isManagePage }" @click="handleHeaderAction">
          {{ isManagePage ? '返回' : '管理成绩' }}
        </button>
      </template>
    </AppPageHeader>

    <div class="submit-record-body">
      <section
        v-if="isManagePage"
        class="manage-records-section"
      >
        <div class="plain-section-header">
          <div class="category-tabs" role="tablist" aria-label="项目类型">
            <span class="category-indicator" :style="{ transform: `translateX(${activeManageCategoryIndex * 100}%)` }"></span>
            <button
              v-for="category in manageCategoryTabs"
              :key="category.value"
              type="button"
              class="category-tab"
              :class="{ active: activeManageCategory === category.value }"
              role="tab"
              :aria-selected="activeManageCategory === category.value"
              @click="activeManageCategory = category.value"
            >
              {{ category.label }}
            </button>
          </div>

          <div class="manage-header-actions">
            <AppIconButton
              icon="refresh"
              :label="manageLoading ? '刷新中' : '刷新列表'"
              :loading="manageLoading"
              @click="loadManagedRecords"
            />
          </div>
        </div>

        <AppStatusBlock
          v-if="manageLoading"
          variant="loading"
          title="正在加载成绩"
        />

        <template v-else>
          <AppStatusBlock
            v-if="!manageError && managedRecords.length === 0"
            variant="empty"
            title="还没有可管理的成绩"
          />

          <AppStatusBlock
            v-else-if="filteredManagedRecords.length === 0"
            variant="empty"
            :title="`暂无${activeManageCategoryLabel}成绩`"
          />

          <div v-else class="manage-record-list">
            <article
              v-for="record in filteredManagedRecords"
              :key="record._id"
              class="manage-record-item"
              :class="{ 'is-editing': editingRecordId === record._id }"
            >
              <div class="manage-record-head">
                <div class="manage-record-copy">
                  <h3 class="manage-record-title">{{ getEventName(record.event) }}</h3>
                  <p class="manage-record-subtitle">{{ formatDate(record.timestamp) }}</p>
                </div>

                <div class="manage-record-actions">
                  <AppIconButton
                    :icon="editingRecordId === record._id ? 'x' : 'edit'"
                    :label="editingRecordId === record._id ? '取消修改' : '修改成绩'"
                    :disabled="deletingRecordId === record._id || isSavingEdit"
                    @click="startEditingRecord(record)"
                  />
                  <AppIconButton
                    icon="trash"
                    :label="deletingRecordId === record._id ? '删除中' : '删除成绩'"
                    variant="danger"
                    :disabled="deletingRecordId === record._id || isSavingEdit"
                    :loading="deletingRecordId === record._id"
                    @click="handleDeleteRecord(record)"
                  />
                </div>
              </div>

              <div class="manage-record-times">
                <span v-if="record.singleSeconds !== null" class="manage-time-chip">
                  单次 {{ formatPreview(record.singleSeconds) }}
                </span>
                <span v-if="record.averageSeconds !== null" class="manage-time-chip muted">
                  平均 {{ formatPreview(record.averageSeconds) }}
                </span>
              </div>

              <div v-if="record.cube || record.method" class="manage-meta-tags">
                <span v-if="record.cube" class="manage-meta-tag">{{ record.cube }}</span>
                <span v-if="record.method" class="manage-meta-tag">{{ record.method }}</span>
              </div>

              <form v-if="editingRecordId === record._id" class="edit-record-form" @submit.prevent="handleUpdateRecord">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">项目分类</label>
                    <AppSelect
                      :model-value="editForm.eventCategory"
                      :options="eventCategoryOptions"
                      @update:model-value="handleEditCategoryChange"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">具体项目</label>
                    <AppSelect
                      v-model="editForm.event"
                      :options="editEventOptions"
                      :disabled="!editForm.eventCategory"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">单次 <span class="optional">(可选)</span></label>
                    <input
                      v-model="editForm.singleTime"
                      type="text"
                      class="time-input"
                      placeholder="输入单次成绩，如 12.34 或 1:23.45"
                      :class="{ 'has-error': editSingleTimeError }"
                      @input="handleEditSingleTimeInput"
                      @blur="validateEditSingleTime"
                    />
                    <span v-if="editSingleTimeError" class="form-error">{{ editSingleTimeError }}</span>
                  </div>

                  <div class="form-group">
                    <label class="form-label">平均 <span class="optional">(可选)</span></label>
                    <input
                      v-model="editForm.averageTime"
                      type="text"
                      class="time-input"
                      placeholder="输入平均成绩，如 10.56 或 58.90"
                      :class="{ 'has-error': editAverageTimeError }"
                      @input="handleEditAverageTimeInput"
                      @blur="validateEditAverageTime"
                    />
                    <span v-if="editAverageTimeError" class="form-error">{{ editAverageTimeError }}</span>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">魔方 <span class="optional">(可选)</span></label>
                    <input
                      v-model="editForm.cube"
                      type="text"
                      class="form-input"
                      placeholder="如：RS3M V5"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">解法 <span class="optional">(可选)</span></label>
                    <input
                      v-model="editForm.method"
                      type="text"
                      class="form-input"
                      placeholder="如：CFOP, Roux, ZZ"
                    />
                  </div>
                </div>

                <div v-if="editHasPreview" class="preview-section compact">
                  <div class="preview-grid">
                    <div v-if="editPreviewSingle !== null" class="preview-item">
                      <span class="preview-label">单次预览</span>
                      <span class="preview-value">{{ formatPreview(editPreviewSingle) }}</span>
                    </div>
                    <div v-if="editPreviewAverage !== null" class="preview-item">
                      <span class="preview-label">平均预览</span>
                      <span class="preview-value">{{ formatPreview(editPreviewAverage) }}</span>
                    </div>
                  </div>
                </div>

                <div class="edit-form-actions">
                  <button type="submit" class="submit-btn secondary" :disabled="isSavingEdit || !editHasValidData">
                    {{ isSavingEdit ? '保存中...' : '保存修改' }}
                  </button>
                  <button type="button" class="ghost-btn" :disabled="isSavingEdit" @click="resetEditState">
                    取消
                  </button>
                </div>
              </form>
            </article>
          </div>
        </template>
      </section>

      <form v-else class="submit-form" @submit.prevent="handleSubmit">
        <section class="plain-section">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">项目类别</label>
              <AppSelect
                :model-value="form.eventCategory"
                :options="eventCategoryOptions"
                @update:model-value="handleCategoryChange"
              />
            </div>

            <div class="form-group">
              <label class="form-label">具体项目</label>
              <AppSelect
                v-model="form.event"
                :options="submitEventOptions"
                :disabled="!form.eventCategory"
              />
            </div>
          </div>
        </section>

        <section class="plain-section">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">单次 <span class="optional"></span></label>
              <input
                v-model="form.singleTime"
                type="text"
                class="time-input"
                placeholder="如 12.34 或 1:23.45"
                :class="{ 'has-error': singleTimeError }"
                @input="handleSingleTimeInput"
                @blur="validateSingleTime"
              />
              <span v-if="singleTimeError" class="form-error">{{ singleTimeError }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">平均 <span class="optional"></span></label>
              <input
                v-model="form.averageTime"
                type="text"
                class="time-input"
                placeholder="如 10.56 或 58.90"
                :class="{ 'has-error': averageTimeError }"
                @input="handleAverageTimeInput"
                @blur="validateAverageTime"
              />
              <span v-if="averageTimeError" class="form-error">{{ averageTimeError }}</span>
              <span class="form-hint">单次或平均至少填写一项。</span>
            </div>
          </div>
        </section>

        <section class="plain-section">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">魔方</label>
              <input
                v-model="form.cube"
                type="text"
                class="form-input"
                placeholder="如：RS3M V5 （可选）"
              />
            </div>

            <div class="form-group">
              <label class="form-label">解法</label>
              <input
                v-model="form.method"
                type="text"
                class="form-input"
                placeholder="如：CFOP, Roux, ZZ （可选）"
              />
            </div>
          </div>
        </section>

        <section v-if="hasPreview" class="plain-section">
          <div v-if="hasPreview" class="preview-section">
            <div class="preview-grid">
              <div v-if="previewSingle !== null" class="preview-item">
                <span class="preview-label">单次预览</span>
                <span class="preview-value">{{ formatPreview(previewSingle) }}</span>
              </div>
              <div v-if="previewAverage !== null" class="preview-item">
                <span class="preview-label">平均预览</span>
                <span class="preview-value">{{ formatPreview(previewAverage) }}</span>
              </div>
            </div>
          </div>
        </section>

        <AppFormActions>
          <button type="submit" class="submit-btn" :disabled="isSubmitting || !hasValidData">
            {{ isSubmitting ? '提交中...' : '提交成绩' }}
          </button>
        </AppFormActions>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppFormActions from '@/components/common/AppFormActions.vue'
import AppIconButton from '@/components/common/AppIconButton.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppStatusBlock from '@/components/common/AppStatusBlock.vue'
import { useEventsStore } from '../stores/events'
import { useRecordsStore } from '../stores/records'
import { useToastStore } from '../stores/toast'
import { useUserStore } from '../stores/user'

const recordsStore = useRecordsStore()
const eventsStore = useEventsStore()
const userStore = useUserStore()
const toastStore = useToastStore()
const route = useRoute()
const router = useRouter()

function createEmptyForm() {
  return {
    eventCategory: '',
    event: '',
    singleTime: '',
    averageTime: '',
    cube: '',
    method: ''
  }
}

const form = ref(createEmptyForm())
const editForm = ref(createEmptyForm())

const isSubmitting = ref(false)
const submitError = ref('')
const singleTimeError = ref('')
const averageTimeError = ref('')
const previewSingle = ref(null)
const previewAverage = ref(null)

const manageLoading = ref(false)
const manageError = ref('')
const managedRecords = ref([])
const editingRecordId = ref('')
const isSavingEdit = ref(false)
const deletingRecordId = ref('')
const editError = ref('')
const editSingleTimeError = ref('')
const editAverageTimeError = ref('')
const editPreviewSingle = ref(null)
const editPreviewAverage = ref(null)
const activeManageCategory = ref('official')

const manageCategoryTabs = [
  { label: '官方', value: 'official' },
  { label: '趣味', value: 'fun' },
  { label: '整活', value: 'meme' }
]

const eventMap = computed(() => Object.fromEntries(eventsStore.allEvents.map((event) => [event.id, event])))
const categoryLabelMap = computed(() => Object.fromEntries(eventsStore.categories.map((category) => [category.value, category.label])))
const eventCategoryOptions = computed(() => [
  { label: '请选择分类', value: '', disabled: true },
  ...eventsStore.categories
])
const submitEventOptions = computed(() => createEventOptions(form.value.eventCategory))
const editEventOptions = computed(() => createEventOptions(editForm.value.eventCategory))

const hasValidData = computed(() => isFormReady(form.value))
const hasPreview = computed(() => previewSingle.value !== null || previewAverage.value !== null)
const editHasValidData = computed(() => isFormReady(editForm.value))
const editHasPreview = computed(() => editPreviewSingle.value !== null || editPreviewAverage.value !== null)
const isManagePage = computed(() => route.name === 'SubmitRecordManage')
const submitSuccessMessage = computed(() => '成绩提交成功，可继续提交下一条，或在右上角管理已提交成绩。')
const activeManageCategoryLabel = computed(() => manageCategoryTabs.find(category => category.value === activeManageCategory.value)?.label || '')
const activeManageCategoryIndex = computed(() => Math.max(manageCategoryTabs.findIndex(category => category.value === activeManageCategory.value), 0))
const filteredManagedRecords = computed(() => (
  managedRecords.value.filter(record => getEventCategory(record.event) === activeManageCategory.value)
))

function truncateToTwoDecimals(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  return Math.trunc(Number(value) * 100) / 100
}

function parseTime(timeStr) {
  if (!timeStr || timeStr.trim() === '') return null

  try {
    const raw = timeStr.trim()
    const parts = raw.split(':')
    let seconds = null

    if (parts.length === 3) {
      const h = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      const sec = parseFloat(parts[2])
      seconds = h * 3600 + m * 60 + sec
    } else if (parts.length === 2) {
      const m = parseInt(parts[0], 10)
      const sec = parseFloat(parts[1])
      seconds = m * 60 + sec
    } else {
      seconds = parseFloat(raw)
    }

    return Number.isFinite(seconds) ? truncateToTwoDecimals(seconds) : null
  } catch {
    return null
  }
}

function validateTimeValue(timeStr) {
  if (!timeStr || timeStr.trim() === '') {
    return {
      seconds: null,
      error: ''
    }
  }

  const seconds = parseTime(timeStr)

  if (seconds === null || Number.isNaN(seconds)) {
    return {
      seconds: null,
      error: '无效的时间格式'
    }
  }

  if (seconds < 0) {
    return {
      seconds: null,
      error: '时间不能为负数'
    }
  }

  return {
    seconds,
    error: ''
  }
}

function syncTimeField(formValue, fieldName, errorRef, previewRef) {
  const { seconds, error } = validateTimeValue(formValue[fieldName])
  errorRef.value = error
  previewRef.value = error ? null : seconds
  return { seconds, error }
}

function isFormReady(currentForm) {
  return Boolean(currentForm.eventCategory && currentForm.event && (currentForm.singleTime || currentForm.averageTime))
}

function buildRecordPayload(currentForm) {
  const singleResult = validateTimeValue(currentForm.singleTime)
  const averageResult = validateTimeValue(currentForm.averageTime)

  if (!currentForm.eventCategory) {
    return {
      error: '请选择项目分类'
    }
  }

  if (!currentForm.event) {
    return {
      error: '请选择项目'
    }
  }

  if (singleResult.error || averageResult.error) {
    return {
      error: singleResult.error || averageResult.error
    }
  }

  if (singleResult.seconds === null && averageResult.seconds === null) {
    return {
      error: '单次或平均至少填写一项'
    }
  }

  return {
    payload: {
      event: currentForm.event,
      singleSeconds: singleResult.seconds,
      averageSeconds: averageResult.seconds,
      cube: normalizeOptionalText(currentForm.cube),
      method: normalizeOptionalText(currentForm.method)
    }
  }
}

function normalizeOptionalText(value) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function formatPreview(seconds) {
  if (seconds === null || seconds === undefined) return '--'
  return recordsStore.formatTime(seconds)
}

function formatEditableTime(seconds) {
  return seconds === null || seconds === undefined ? '' : (recordsStore.formatTime(seconds) || '')
}

function formatDate(value) {
  if (!value) return '未知时间'

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function getEventName(eventId) {
  return eventsStore.getEventName(eventId)
}

function getCategoryLabel(category) {
  return categoryLabelMap.value[category] || category || '项目'
}

function getEventCategory(eventId) {
  return eventMap.value[eventId]?.category || ''
}

function createEventOptions(category) {
  const events = eventsStore.getEventsByCategory(category)

  return [
    { label: category ? '请选择项目' : '请先选择分类', value: '', disabled: true },
    ...events.map((event) => ({
      label: event.name,
      value: event.id
    }))
  ]
}

function handleCategoryChange(category) {
  form.value.eventCategory = category
  form.value.event = ''
}

function handleEditCategoryChange(category) {
  editForm.value.eventCategory = category
  editForm.value.event = ''
}

function resetSubmitForm() {
  form.value = createEmptyForm()
  singleTimeError.value = ''
  averageTimeError.value = ''
  previewSingle.value = null
  previewAverage.value = null
}

function resetEditState() {
  editingRecordId.value = ''
  editForm.value = createEmptyForm()
  editError.value = ''
  editSingleTimeError.value = ''
  editAverageTimeError.value = ''
  editPreviewSingle.value = null
  editPreviewAverage.value = null
}

function handleSingleTimeInput() {
  syncTimeField(form.value, 'singleTime', singleTimeError, previewSingle)
}

function handleAverageTimeInput() {
  syncTimeField(form.value, 'averageTime', averageTimeError, previewAverage)
}

function validateSingleTime() {
  syncTimeField(form.value, 'singleTime', singleTimeError, previewSingle)
}

function validateAverageTime() {
  syncTimeField(form.value, 'averageTime', averageTimeError, previewAverage)
}

function handleEditSingleTimeInput() {
  syncTimeField(editForm.value, 'singleTime', editSingleTimeError, editPreviewSingle)
}

function handleEditAverageTimeInput() {
  syncTimeField(editForm.value, 'averageTime', editAverageTimeError, editPreviewAverage)
}

function validateEditSingleTime() {
  syncTimeField(editForm.value, 'singleTime', editSingleTimeError, editPreviewSingle)
}

function validateEditAverageTime() {
  syncTimeField(editForm.value, 'averageTime', editAverageTimeError, editPreviewAverage)
}

async function loadManagedRecords(options = {}) {
  manageError.value = ''
  manageLoading.value = true

  try {
    if (!userStore.user?.id) {
      throw new Error('未找到当前登录用户，暂时无法加载已提交成绩')
    }

    const result = await recordsStore.fetchUserHistory(userStore.user.id, { pageSize: 50 })
    managedRecords.value = result.data || []
  } catch (error) {
    managedRecords.value = []
    manageError.value = error.message || '加载已提交成绩失败，请重试'
    toastStore.error(manageError.value)
  } finally {
    manageLoading.value = false
  }
}

function handleHeaderAction() {
  if (isManagePage.value) {
    router.push({ name: 'SubmitRecord' })
    return
  }

  router.push({ name: 'SubmitRecordManage' })
}

function startEditingRecord(record) {
  if (editingRecordId.value === record._id) {
    resetEditState()
    return
  }

  manageError.value = ''
  editError.value = ''
  editingRecordId.value = record._id
  editForm.value = {
    eventCategory: getEventCategory(record.event),
    event: record.event || '',
    singleTime: formatEditableTime(record.singleSeconds),
    averageTime: formatEditableTime(record.averageSeconds),
    cube: record.cube || '',
    method: record.method || ''
  }
  editSingleTimeError.value = ''
  editAverageTimeError.value = ''
  editPreviewSingle.value = record.singleSeconds ?? null
  editPreviewAverage.value = record.averageSeconds ?? null
}

async function handleSubmit() {
  submitError.value = ''
  validateSingleTime()
  validateAverageTime()

  const { payload, error } = buildRecordPayload(form.value)

  if (error) {
    submitError.value = error
    toastStore.error(error)
    return
  }

  isSubmitting.value = true

  try {
    await recordsStore.createRecord(payload)
    toastStore.success(submitSuccessMessage.value)
    resetSubmitForm()
  } catch (err) {
    submitError.value = err.message || '提交失败，请重试'
    toastStore.error(submitError.value)
  } finally {
    isSubmitting.value = false
  }
}

async function handleUpdateRecord() {
  editError.value = ''
  validateEditSingleTime()
  validateEditAverageTime()

  if (!editingRecordId.value) return

  const { payload, error } = buildRecordPayload(editForm.value)

  if (error) {
    editError.value = error
    toastStore.error(error)
    return
  }

  isSavingEdit.value = true

  try {
    await recordsStore.updateRecord(editingRecordId.value, payload)
    toastStore.success('成绩已更新')
    resetEditState()
    await loadManagedRecords({ preserveMessage: true })
  } catch (err) {
    editError.value = err.message || '修改失败，请重试'
    toastStore.error(editError.value)
  } finally {
    isSavingEdit.value = false
  }
}

async function handleDeleteRecord(record) {
  manageError.value = ''

  const confirmed = window.confirm(`确定删除「${getEventName(record.event)}」这条成绩吗？删除后不可恢复。`)
  if (!confirmed) return

  deletingRecordId.value = record._id

  try {
    await recordsStore.deleteRecord(record._id)
    toastStore.success('成绩已删除')

    if (editingRecordId.value === record._id) {
      resetEditState()
    }

    await loadManagedRecords({ preserveMessage: true })
  } catch (err) {
    manageError.value = err.message || '删除失败，请重试'
    toastStore.error(manageError.value)
  } finally {
    deletingRecordId.value = ''
  }
}

onMounted(async () => {
  try {
    await eventsStore.ensureMemeEventsLoaded()

    if (isManagePage.value) {
      await loadManagedRecords()
    }
  } catch (error) {
    console.error('Failed to load meme events:', error)
  }
})

watch(isManagePage, async (nextIsManagePage) => {
  if (nextIsManagePage) {
    await loadManagedRecords()
    return
  }

  manageError.value = ''
  resetEditState()
})
</script>

<style scoped>
.submit-record {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.submit-record-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.manage-records-section,
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

.manage-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.page-manage-btn,
.ghost-btn {
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, transparent);
  border-radius: 16px;
  background: color-mix(in srgb, var(--color-bg-secondary) 90%, transparent);
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background-color var(--transition-fast),
    color var(--transition-fast),
    opacity var(--transition-fast);
}

.page-manage-btn,
.ghost-btn {
  padding: 0.82rem 1rem;
}

.page-manage-btn:hover:not(:disabled),
.ghost-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-primary) 36%, var(--color-border));
}

.page-manage-btn.active {
  background: color-mix(in srgb, var(--color-primary) 14%, var(--color-bg-secondary));
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 32%, transparent);
}

.page-manage-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.manage-record-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.manage-record-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.1rem;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  background: color-mix(in srgb, var(--color-bg) 62%, var(--color-bg-secondary));
}

.manage-record-item.is-editing {
  grid-column: 1 / -1;
}

.manage-record-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.manage-record-copy {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.manage-record-title {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0;
}

.manage-record-subtitle {
  color: var(--color-text-tertiary);
  font-size: 0.88rem;
  line-height: 1.5;
}

.manage-record-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
}

.manage-record-times {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.manage-time-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.58rem 0.8rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 10%, var(--color-bg-secondary));
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 0.86rem;
  font-weight: 600;
}

.manage-time-chip.muted {
  background: color-mix(in srgb, var(--color-bg) 72%, var(--color-bg-secondary));
  color: var(--color-text-secondary);
}

.manage-meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.manage-meta-tag {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 0.45rem 0.68rem;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-bg-secondary) 94%, transparent);
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.edit-record-form,
.submit-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.edit-record-form {
  padding-top: 0.4rem;
  border-top: 1px dashed color-mix(in srgb, var(--color-border) 72%, transparent);
}

.submit-form {
  width: min(100%, 760px);
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
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
.time-input {
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

.time-input {
  font-family: var(--font-mono);
}

.form-input:focus,
.time-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.has-error {
  border-color: var(--color-error);
}

.form-error {
  color: var(--color-error);
  font-size: 0.875rem;
  line-height: 1.5;
}

.form-hint {
  color: var(--color-text-tertiary);
  font-size: 0.8125rem;
  line-height: 1.5;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.preview-section.compact {
  gap: 0.85rem;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-md);
}

.preview-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
  padding: 1rem 1.05rem;
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-bg) 68%, var(--color-bg-secondary));
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
}

.preview-label {
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  line-height: 1.5;
}

.preview-value {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-primary);
  font-size: 1.2rem;
  letter-spacing: -0.03em;
}

.edit-form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.submit-btn {
  min-width: 176px;
  padding: 1rem 1.4rem;
  border: none;
  border-radius: 18px;
  background: var(--color-text);
  color: var(--color-bg);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
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

.submit-btn.secondary {
  background: var(--color-primary);
  color: #fff;
}

.submit-btn.secondary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-primary) 82%, black);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.category-tabs {
  position: relative;
  display: inline-flex;
  align-self: flex-start;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-secondary);
}

.category-indicator {
  position: absolute;
  left: 4px;
  top: 4px;
  bottom: 4px;
  width: calc((100% - 8px) / 3);
  border-radius: calc(var(--radius-lg) - 4px);
  background: var(--color-text);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
  transition: transform var(--motion-panel);
  pointer-events: none;
}

.category-tab {
  position: relative;
  z-index: 1;
  min-width: 72px;
  padding: 0.65rem 0.95rem;
  border-radius: calc(var(--radius-lg) - 4px);
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 0.92rem;
  transition:
    transform var(--transition-fast),
    color var(--transition-fast),
    text-shadow var(--transition-fast);
}

.category-tab:hover:not(.active) {
  color: var(--color-primary);
  transform: translateY(-1px);
}

.category-tab.active {
  color: var(--color-bg);
}

.category-tab:active {
  transform: translateY(0) scale(0.98);
}

@media (max-width: 1120px) {
  .manage-record-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .manage-record-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .submit-record {
    gap: var(--space-lg);
  }

  .submit-form {
    width: 100%;
  }

  .submit-record-body {
    gap: var(--space-lg);
  }

  .plain-section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .manage-header-actions {
    justify-content: flex-start;
  }

  .category-tabs {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .category-tab {
    min-width: 0;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .edit-form-actions {
    width: 100%;
  }

  .manage-record-actions {
    flex: 0 0 auto;
    justify-content: flex-end;
  }

  .page-manage-btn,
  .ghost-btn,
  .submit-btn {
    width: 100%;
  }
}
</style>
