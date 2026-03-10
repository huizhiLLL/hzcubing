<template>
  <div class="submit-record">
    <div class="page-header">
      <h1>提交成绩</h1>
      <p class="page-desc">记录你的每一次练习与比赛</p>
    </div>

    <form class="submit-form" @submit.prevent="handleSubmit">
      <!-- 项目选择 -->
      <div class="form-group">
        <label class="form-label">项目</label>
        <select v-model="form.event" class="form-select" required>
          <option value="" disabled>请选择项目</option>
          <option v-for="event in events" :key="event.id" :value="event.id">
            {{ event.name }}
          </option>
        </select>
      </div>

      <!-- 单次成绩 -->
      <div class="form-group">
        <label class="form-label">单次成绩 <span class="optional">(可选)</span></label>
        <div class="time-input-wrapper">
          <input
            v-model="form.singleTime"
            type="text"
            class="time-input"
            placeholder="输入单次成绩，如 12.34 或 1:23.45"
            :class="{ 'has-error': singleTimeError }"
            @input="handleSingleTimeInput"
            @blur="validateSingleTime"
          />
          <div class="time-presets">
            <button type="button" class="preset-btn" :class="{ active: form.singleIsDNF }" @click="toggleSingleDNF">
              DNF
            </button>
            <button type="button" class="preset-btn" :class="{ active: form.singleIsDNS }" @click="toggleSingleDNS">
              DNS
            </button>
          </div>
        </div>
        <span v-if="singleTimeError" class="form-error">{{ singleTimeError }}</span>
        <span class="form-hint">支持输入纯秒数 (12.34) 或分秒格式 (1:23.45)</span>
      </div>

      <!-- 平均成绩 -->
      <div class="form-group">
        <label class="form-label">平均成绩 <span class="optional">(可选)</span></label>
        <div class="time-input-wrapper">
          <input
            v-model="form.averageTime"
            type="text"
            class="time-input"
            placeholder="输入平均成绩，如 10.56 或 58.90"
            :class="{ 'has-error': averageTimeError }"
            @input="handleAverageTimeInput"
            @blur="validateAverageTime"
          />
          <div class="time-presets">
            <button type="button" class="preset-btn" :class="{ active: form.averageIsDNF }" @click="toggleAverageDNF">
              DNF
            </button>
            <button type="button" class="preset-btn" :class="{ active: form.averageIsDNS }" @click="toggleAverageDNS">
              DNS
            </button>
          </div>
        </div>
        <span v-if="averageTimeError" class="form-error">{{ averageTimeError }}</span>
        <span class="form-hint">单次或平均至少填写一项</span>
      </div>

      <!-- 附加信息 -->
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

      <div class="form-group">
        <label class="form-label">打乱公式 <span class="optional">(可选)</span></label>
        <textarea
          v-model="form.scramble"
          class="form-textarea"
          placeholder="如：R U R' U' L' L F F'"
          rows="3"
        ></textarea>
      </div>

      <!-- 预览 -->
      <div v-if="hasPreview" class="preview-section">
        <div v-if="previewSingle !== null" class="preview-item">
          <span class="preview-label">单次预览：</span>
          <span class="preview-value">{{ formatPreview(previewSingle, '单次') }}</span>
        </div>
        <div v-if="previewAverage !== null" class="preview-item">
          <span class="preview-label">平均预览：</span>
          <span class="preview-value">{{ formatPreview(previewAverage, '平均') }}</span>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="submitError" class="error-message">
        {{ submitError }}
      </div>

      <!-- 提交按钮 -->
      <button type="submit" class="submit-btn" :disabled="isSubmitting || !hasValidData">
        {{ isSubmitting ? '提交中...' : '提交成绩' }}
      </button>

      <!-- 成功提示 -->
      <div v-if="submitSuccess" class="success-message">
        成绩提交成功！
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useRecordsStore } from '../stores/records'
import { events } from '../config/events'

const router = useRouter()
const userStore = useUserStore()
const recordsStore = useRecordsStore()

// 表单数据
const form = ref({
  event: '',
  singleTime: '',
  averageTime: '',
  singleIsDNF: false,
  singleIsDNS: false,
  averageIsDNF: false,
  averageIsDNS: false,
  cube: '',
  method: '',
  scramble: ''
})

// 状态
const isSubmitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)
const singleTimeError = ref('')
const averageTimeError = ref('')
const previewSingle = ref(null)
const previewAverage = ref(null)

// 事件映射
const eventMapping = {
  '3x3': '333', '2x2': '222', '4x4': '444', '5x5': '555',
  '3x3OH': '333oh', '3x3BLD': '333bf', '3x3FM': '333fm', '3x3SB': '333ft',
  'Pyraminx': 'py', 'Megaminx': 'meg', 'Skewb': 'sk',
  'Clock': 'clock', 'Sq1': 'sq1'
}

// 验证时间格式
function parseTime(timeStr) {
  if (!timeStr || timeStr.trim() === '') return null
  
  const raw = timeStr.trim().toUpperCase()
  if (raw === 'DNF' || raw === 'DNS') return null
  
  try {
    const parts = raw.split(':')
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      const sec = parseFloat(parts[2])
      return h * 3600 + m * 60 + sec
    } else if (parts.length === 2) {
      const m = parseInt(parts[0], 10)
      const sec = parseFloat(parts[1])
      return m * 60 + sec
    } else {
      return parseFloat(raw)
    }
  } catch {
    return null
  }
}

// 单次成绩处理
function handleSingleTimeInput() {
  form.value.singleIsDNF = false
  form.value.singleIsDNS = false
  const seconds = parseTime(form.value.singleTime)
  previewSingle.value = seconds
}

function validateSingleTime() {
  if (!form.value.singleTime) {
    singleTimeError.value = ''
    return
  }
  
  if (form.value.singleIsDNF || form.value.singleIsDNS) {
    singleTimeError.value = ''
    previewSingle.value = null
    return
  }
  
  const seconds = parseTime(form.value.singleTime)
  if (seconds === null || isNaN(seconds)) {
    singleTimeError.value = '无效的时间格式'
  } else if (seconds < 0) {
    singleTimeError.value = '时间不能为负数'
  } else {
    singleTimeError.value = ''
    previewSingle.value = seconds
  }
}

function toggleSingleDNF() {
  form.value.singleIsDNF = !form.value.singleIsDNF
  form.value.singleIsDNS = false
  form.value.singleTime = form.value.singleIsDNF ? 'DNF' : ''
  previewSingle.value = null
}

function toggleSingleDNS() {
  form.value.singleIsDNS = !form.value.singleIsDNS
  form.value.singleIsDNF = false
  form.value.singleTime = form.value.singleIsDNS ? 'DNS' : ''
  previewSingle.value = null
}

// 平均成绩处理
function handleAverageTimeInput() {
  form.value.averageIsDNF = false
  form.value.averageIsDNS = false
  const seconds = parseTime(form.value.averageTime)
  previewAverage.value = seconds
}

function validateAverageTime() {
  if (!form.value.averageTime) {
    averageTimeError.value = ''
    return
  }
  
  if (form.value.averageIsDNF || form.value.averageIsDNS) {
    averageTimeError.value = ''
    previewAverage.value = null
    return
  }
  
  const seconds = parseTime(form.value.averageTime)
  if (seconds === null || isNaN(seconds)) {
    averageTimeError.value = '无效的时间格式'
  } else if (seconds < 0) {
    averageTimeError.value = '时间不能为负数'
  } else {
    averageTimeError.value = ''
    previewAverage.value = seconds
  }
}

function toggleAverageDNF() {
  form.value.averageIsDNF = !form.value.averageIsDNF
  form.value.averageIsDNS = false
  form.value.averageTime = form.value.averageIsDNF ? 'DNF' : ''
  previewAverage.value = null
}

function toggleAverageDNS() {
  form.value.averageIsDNS = !form.value.averageIsDNS
  form.value.averageIsDNF = false
  form.value.averageTime = form.value.averageIsDNS ? 'DNS' : ''
  previewAverage.value = null
}

// 检查是否有有效数据
const hasValidData = computed(() => {
  return form.value.event && (
    form.value.singleTime || form.value.averageTime ||
    form.value.singleIsDNF || form.value.singleIsDNS ||
    form.value.averageIsDNF || form.value.averageIsDNS
  )
})

const hasPreview = computed(() => {
  return previewSingle.value !== null || previewAverage.value !== null
})

// 格式化预览
function formatPreview(seconds, type = '') {
  if (seconds === null || seconds === undefined) return '--'
  return recordsStore.formatTime(seconds)
}

// 提交处理
async function handleSubmit() {
  submitError.value = ''
  submitSuccess.value = false
  
  if (!form.value.event) {
    submitError.value = '请选择项目'
    return
  }
  
  const singleSeconds = form.value.singleIsDNF || form.value.singleIsDNS ? null : parseTime(form.value.singleTime)
  const averageSeconds = form.value.averageIsDNF || form.value.averageIsDNS ? null : parseTime(form.value.averageTime)
  
  if ((singleSeconds === null || isNaN(singleSeconds)) && (averageSeconds === null || isNaN(averageSeconds))) {
    submitError.value = '单次或平均至少填写一项'
    return
  }
  
  isSubmitting.value = true
  
  try {
    const recordData = {
      event: eventMapping[form.value.event] || form.value.event.toLowerCase(),
      singleSeconds: singleSeconds !== null && !isNaN(singleSeconds) ? singleSeconds : null,
      averageSeconds: averageSeconds !== null && !isNaN(averageSeconds) ? averageSeconds : null,
      cube: form.value.cube || null,
      method: form.value.method || null,
      scramble: form.value.scramble || null
    }
    
    await recordsStore.createRecord(recordData)
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
</script>

<style scoped>
.submit-record {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  max-width: 800px;
  margin: 0 auto;
}

/* Header */
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

/* Form */
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

.form-select,
.form-input,
.form-textarea {
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.9375rem;
  transition: all var(--transition-fast);
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-textarea {
  resize: vertical;
  font-family: var(--font-mono);
}

.form-select.has-error,
.form-input.has-error {
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

/* Time Input */
.time-input-wrapper {
  display: flex;
  gap: var(--space-sm);
}

.time-input {
  flex: 1;
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.9375rem;
  font-family: var(--font-mono);
}

.time-presets {
  display: flex;
  gap: var(--space-xs);
}

.preset-btn {
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preset-btn:hover {
  border-color: var(--color-primary);
}

.preset-btn.active {
  background: var(--color-error);
  border-color: var(--color-error);
  color: white;
}

/* Preview */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-label {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.preview-value {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-primary);
  font-size: 1.125rem;
}

/* Submit Button */
.submit-btn {
  padding: var(--space-md) var(--space-xl);
  background: var(--color-text);
  color: var(--color-bg);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Messages */
.error-message {
  padding: var(--space-md);
  background: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  color: var(--color-error);
  text-align: center;
}

.success-message {
  padding: var(--space-md);
  background: var(--color-success-light);
  border: 1px solid var(--color-success);
  border-radius: var(--radius-md);
  color: var(--color-success);
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .time-input-wrapper {
    flex-direction: column;
  }
  
  .time-presets {
    justify-content: flex-end;
  }
}
</style>
