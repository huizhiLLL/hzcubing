<template>
  <div class="submit-record">
    <AppPageHeader title="提交成绩" subtitle="录入一条新的成绩" />

    <form class="submit-form" @submit.prevent="handleSubmit">
      <AppSectionCard title="项目">
        <div class="form-group">
          <label class="form-label"></label>
          <AppSelect v-model="form.event" :options="submitEventOptions" />
        </div>
      </AppSectionCard>

      <AppSectionCard title="成绩">
        <div class="form-group">
          <label class="form-label">单次 <span class="optional">(可选)</span></label>
          <input
            v-model="form.singleTime"
            type="text"
            class="time-input"
            placeholder="输入单次成绩，如 12.34 或 1:23.45"
            :class="{ 'has-error': singleTimeError }"
            @input="handleSingleTimeInput"
            @blur="validateSingleTime"
          />
          <span v-if="singleTimeError" class="form-error">{{ singleTimeError }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">成绩 <span class="optional">(可选)</span></label>
          <input
            v-model="form.averageTime"
            type="text"
            class="time-input"
            placeholder="输入平均成绩，如 10.56 或 58.90"
            :class="{ 'has-error': averageTimeError }"
            @input="handleAverageTimeInput"
            @blur="validateAverageTime"
          />
          <span v-if="averageTimeError" class="form-error">{{ averageTimeError }}</span>
          <span class="form-hint">单次或平均至少填写一项。</span>
        </div>
      </AppSectionCard>

      <AppSectionCard title="补充信息 (可选)">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">使用魔方 </label>
            <input
              v-model="form.cube"
              type="text"
              class="form-input"
              placeholder="如：RS3M V5"
            />
          </div>

          <div class="form-group">
            <label class="form-label">解法 </label>
            <input
              v-model="form.method"
              type="text"
              class="form-input"
              placeholder="如：CFOP, Roux, ZZ"
            />
          </div>
        </div>
      </AppSectionCard>

      <AppSectionCard v-if="hasPreview || submitError || submitSuccess" title="成绩预览">
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

        <AppStatusBlock v-if="submitError" variant="error" layout="banner" :message="submitError" />

        <AppStatusBlock v-if="submitSuccess" variant="success" layout="banner" message="成绩提交成功！" />
      </AppSectionCard>

      <AppFormActions>
        <button type="submit" class="submit-btn" :disabled="isSubmitting || !hasValidData">
          {{ isSubmitting ? '提交中...' : '提交成绩' }}
        </button>
      </AppFormActions>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppFormActions from '@/components/common/AppFormActions.vue'
import AppPageHeader from '@/components/common/AppPageHeader.vue'
import AppSectionCard from '@/components/common/AppSectionCard.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppStatusBlock from '@/components/common/AppStatusBlock.vue'
import { useRecordsStore } from '../stores/records'
import { useEventsStore } from '../stores/events'

const router = useRouter()
const recordsStore = useRecordsStore()
const eventsStore = useEventsStore()

const form = ref({
  event: '',
  singleTime: '',
  averageTime: '',
  cube: '',
  method: ''
})

const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)
const singleTimeError = ref('')
const averageTimeError = ref('')
const previewSingle = ref(null)
const previewAverage = ref(null)

const submitEventOptions = computed(() => [
  { label: '请选择项目', value: '', disabled: true },
  ...eventsStore.allEvents.map(event => ({
    label: event.name,
    value: event.id
  }))
])

function parseTime(timeStr) {
  if (!timeStr || timeStr.trim() === '') return null

  try {
    const raw = timeStr.trim()
    const parts = raw.split(':')
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      const sec = parseFloat(parts[2])
      return h * 3600 + m * 60 + sec
    }
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10)
      const sec = parseFloat(parts[1])
      return m * 60 + sec
    }
    return parseFloat(raw)
  } catch {
    return null
  }
}

function handleSingleTimeInput() {
  previewSingle.value = parseTime(form.value.singleTime)
}

function handleAverageTimeInput() {
  previewAverage.value = parseTime(form.value.averageTime)
}

function validateSingleTime() {
  if (!form.value.singleTime) {
    singleTimeError.value = ''
    return
  }

  const seconds = parseTime(form.value.singleTime)
  if (seconds === null || Number.isNaN(seconds)) {
    singleTimeError.value = '无效的时间格式'
  } else if (seconds < 0) {
    singleTimeError.value = '时间不能为负数'
  } else {
    singleTimeError.value = ''
    previewSingle.value = seconds
  }
}

function validateAverageTime() {
  if (!form.value.averageTime) {
    averageTimeError.value = ''
    return
  }

  const seconds = parseTime(form.value.averageTime)
  if (seconds === null || Number.isNaN(seconds)) {
    averageTimeError.value = '无效的时间格式'
  } else if (seconds < 0) {
    averageTimeError.value = '时间不能为负数'
  } else {
    averageTimeError.value = ''
    previewAverage.value = seconds
  }
}

const hasValidData = computed(() => {
  return form.value.event && (form.value.singleTime || form.value.averageTime)
})

const hasPreview = computed(() => previewSingle.value !== null || previewAverage.value !== null)

function formatPreview(seconds) {
  if (seconds === null || seconds === undefined) return '--'
  return recordsStore.formatTime(seconds)
}

async function handleSubmit() {
  submitError.value = ''
  submitSuccess.value = false

  if (!form.value.event) {
    submitError.value = '请选择项目'
    return
  }

  const singleSeconds = parseTime(form.value.singleTime)
  const averageSeconds = parseTime(form.value.averageTime)

  if ((singleSeconds === null || Number.isNaN(singleSeconds)) && (averageSeconds === null || Number.isNaN(averageSeconds))) {
    submitError.value = '单次或平均至少填写一项'
    return
  }

  isSubmitting.value = true

  try {
    await recordsStore.createRecord({
      event: form.value.event,
      singleSeconds: singleSeconds !== null && !Number.isNaN(singleSeconds) ? singleSeconds : null,
      averageSeconds: averageSeconds !== null && !Number.isNaN(averageSeconds) ? averageSeconds : null,
      cube: form.value.cube || null,
      method: form.value.method || null
    })

    submitSuccess.value = true

    setTimeout(() => {
      router.push('/players')
    }, 1500)
  } catch (err) {
    submitError.value = err.message || '提交失败，请重试'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  try {
    await eventsStore.fetchMemeEvents()
  } catch (error) {
    console.error('Failed to load meme events:', error)
  }
})
</script>

<style scoped>
.submit-record {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  max-width: 880px;
  margin: 0 auto;
}

.submit-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 1.1rem;
  background: color-mix(in srgb, var(--color-bg-secondary) 78%, transparent);
  border-radius: 28px;
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, transparent);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.05);
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

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 768px) {
  .submit-record {
    gap: var(--space-lg);
  }

  .submit-form {
    padding: 0.9rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .submit-btn {
    width: 100%;
  }
}
</style>
