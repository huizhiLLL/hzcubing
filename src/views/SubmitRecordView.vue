<template>
  <div class="submit-record">
    <div class="page-header">
      <h1>提交成绩</h1>
      <p class="page-desc">记录你的每一次练习与比赛</p>
    </div>

    <form class="submit-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">项目</label>
        <AppSelect v-model="form.event" :options="submitEventOptions" />
      </div>

      <div class="form-group">
        <label class="form-label">单次成绩 <span class="optional">(可选)</span></label>
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
        <span class="form-hint">支持输入纯秒数 (12.34) 或分秒格式 (1:23.45)</span>
      </div>

      <div class="form-group">
        <label class="form-label">平均成绩 <span class="optional">(可选)</span></label>
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
        <span class="form-hint">单次或平均至少填写一项</span>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">使用魔方 <span class="optional">(可选)</span></label>
          <input
            v-model="form.cube"
            type="text"
            class="form-input"
            placeholder="如：GAN 11 M Pro"
          />
        </div>

        <div class="form-group">
          <label class="form-label">解法 <span class="optional">(可选)</span></label>
          <input
            v-model="form.method"
            type="text"
            class="form-input"
            placeholder="如：CFOP, Roux, ZZ"
          />
        </div>
      </div>

      <div v-if="hasPreview" class="preview-section">
        <div v-if="previewSingle !== null" class="preview-item">
          <span class="preview-label">单次预览：</span>
          <span class="preview-value">{{ formatPreview(previewSingle) }}</span>
        </div>
        <div v-if="previewAverage !== null" class="preview-item">
          <span class="preview-label">平均预览：</span>
          <span class="preview-value">{{ formatPreview(previewAverage) }}</span>
        </div>
      </div>

      <div v-if="submitError" class="error-message">
        {{ submitError }}
      </div>

      <button type="submit" class="submit-btn" :disabled="isSubmitting || !hasValidData">
        {{ isSubmitting ? '提交中...' : '提交成绩' }}
      </button>

      <div v-if="submitSuccess" class="success-message">
        成绩提交成功！
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppSelect from '@/components/common/AppSelect.vue'
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
  max-width: 760px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.page-desc {
  color: var(--color-text-tertiary);
  font-size: 1rem;
}

.submit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  background: var(--color-bg-secondary);
  padding: var(--space-xl);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.form-label {
  font-weight: 500;
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
  padding: 0.95rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.9375rem;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.time-input {
  font-family: var(--font-mono);
}

.form-input:focus,
.time-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 14%, transparent);
}

.has-error {
  border-color: var(--color-error);
}

.form-error {
  color: var(--color-error);
  font-size: 0.875rem;
}

.form-hint {
  color: var(--color-text-tertiary);
  font-size: 0.8125rem;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}

.preview-label {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.preview-value {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-primary);
  font-size: 1.05rem;
}

.error-message,
.success-message {
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  text-align: center;
  font-size: 0.9375rem;
}

.error-message {
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
  color: var(--color-error);
}

.success-message {
  background: color-mix(in srgb, var(--color-success) 10%, transparent);
  color: var(--color-success);
}

.submit-btn {
  padding: 1rem 1.25rem;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-text);
  color: var(--color-bg);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform var(--transition-fast), opacity var(--transition-fast), background var(--transition-fast);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--color-primary);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .submit-form {
    padding: var(--space-lg);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .preview-item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
