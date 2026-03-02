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
            {{ event.icon }} {{ event.name }}
          </option>
        </select>
      </div>

      <!-- 时间输入 -->
      <div class="form-group">
        <label class="form-label">成绩</label>
        <div class="time-input-wrapper">
          <input
            v-model="form.time"
            type="text"
            class="time-input"
            placeholder="输入成绩，如 12.34 或 1:23.45"
            :class="{ 'has-error': timeError }"
            @input="handleTimeInput"
            @blur="validateTime"
          />
          <div class="time-presets">
            <button type="button" class="preset-btn" :class="{ active: form.isDNF }" @click="toggleDNF">
              DNF
            </button>
            <button type="button" class="preset-btn" :class="{ active: form.isDNS }" @click="toggleDNS">
              DNS
            </button>
          </div>
        </div>
        <span v-if="timeError" class="form-error">{{ timeError }}</span>
        <span class="form-hint">支持输入纯秒数 (12.34) 或分秒格式 (1:23.45)</span>
      </div>

      <!-- 附加信息 -->
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

      <!-- 预览 -->
      <div v-if="previewTime" class="preview-section">
        <span class="preview-label">成绩预览：</span>
        <TimeDisplay :time="previewTime" :large="true" />
      </div>

      <!-- 提交按钮 -->
      <button type="submit" class="submit-btn" :disabled="isSubmitting">
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
import TimeDisplay from '../components/common/TimeDisplay.vue'
import { events } from '../config/events'

const router = useRouter()

const form = ref({
  event: '',
  time: '',
  isDNF: false,
  isDNS: false,
  cube: '',
  method: ''
})

const timeError = ref('')
const isSubmitting = ref(false)
const submitSuccess = ref(false)

// 解析时间输入
const parseTime = (input) => {
  if (!input) return null

  // 处理 DNF/DNS
  if (input.toUpperCase() === 'DNF') return -1
  if (input.toUpperCase() === 'DNS') return -2

  // 尝试解析数字格式
  const num = parseFloat(input)
  if (!isNaN(num)) return num

  // 尝试解析分秒格式 (m:ss.xx 或 m:ss)
  const parts = input.split(':')
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10)
    const secs = parseFloat(parts[1])
    if (!isNaN(mins) && !isNaN(secs)) {
      return mins * 60 + secs
    }
  }

  return null
}

// 预览时间
const previewTime = computed(() => {
  if (form.value.isDNF) return 'DNF'
  if (form.value.isDNS) return 'DNS'
  return parseTime(form.value.time)
})

const handleTimeInput = () => {
  timeError.value = ''
  // 自动清除 DNF/DNS 状态如果用户开始输入数字
  if (form.value.isDNF || form.value.isDNS) {
    if (/^\d/.test(form.value.time) || /^\d/.test(form.value.time.replace(/:/, ''))) {
      form.value.isDNF = false
      form.value.isDNS = false
    }
  }
}

const validateTime = () => {
  if (!form.value.time && !form.value.isDNF && !form.value.isDNS) {
    timeError.value = ''
    return
  }

  if (form.value.isDNF || form.value.isDNS) {
    timeError.value = ''
    return
  }

  const parsed = parseTime(form.value.time)
  if (parsed === null) {
    timeError.value = '请输入有效的成绩格式'
  } else if (parsed <= 0) {
    timeError.value = '成绩必须大于 0'
  } else {
    timeError.value = ''
  }
}

const toggleDNF = () => {
  form.value.isDNF = !form.value.isDNF
  if (form.value.isDNF) {
    form.value.isDNS = false
    form.value.time = 'DNF'
  } else {
    form.value.time = ''
  }
  timeError.value = ''
}

const toggleDNS = () => {
  form.value.isDNS = !form.value.isDNS
  if (form.value.isDNS) {
    form.value.isDNF = false
    form.value.time = 'DNS'
  } else {
    form.value.time = ''
  }
  timeError.value = ''
}

const handleSubmit = async () => {
  // 验证
  if (!form.value.event) {
    alert('请选择项目')
    return
  }

  if (!form.value.time && !form.value.isDNF && !form.value.isDNS) {
    timeError.value = '请输入成绩'
    return
  }

  validateTime()
  if (timeError.value) return

  isSubmitting.value = true

  // 模拟提交
  await new Promise(resolve => setTimeout(resolve, 1000))

  isSubmitting.value = false
  submitSuccess.value = true

  // 重置表单
  form.value = {
    event: '',
    time: '',
    isDNF: false,
    isDNS: false,
    cube: '',
    method: ''
  }

  // 提示后跳转
  setTimeout(() => {
    submitSuccess.value = false
    router.push('/')
  }, 1500)
}
</script>

<style scoped>
.submit-record {
  max-width: 600px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
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

/* Form */
.submit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
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

.optional {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.form-input,
.form-select {
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 1rem;
  transition: border-color var(--transition-fast);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-select {
  cursor: pointer;
}

/* Time Input */
.time-input-wrapper {
  display: flex;
  gap: var(--space-sm);
}

.time-input {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 1.125rem;
}

.time-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.time-input.has-error {
  border-color: var(--color-error);
}

.time-presets {
  display: flex;
  gap: var(--space-xs);
}

.preset-btn {
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.preset-btn.active {
  background: var(--color-error);
  border-color: var(--color-error);
  color: white;
}

.form-error {
  color: var(--color-error);
  font-size: 0.875rem;
}

.form-hint {
  color: var(--color-text-tertiary);
  font-size: 0.8125rem;
}

/* Preview */
.preview-section {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
}

.preview-label {
  color: var(--color-text-secondary);
}

/* Submit Button */
.submit-btn {
  padding: var(--space-md) var(--space-lg);
  background: var(--color-text);
  color: var(--color-bg);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 1rem;
  transition: all var(--transition-fast);
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  padding: var(--space-md);
  background: var(--color-success);
  color: white;
  border-radius: var(--radius-md);
  text-align: center;
  font-weight: 500;
}

@media (max-width: 768px) {
  .time-input-wrapper {
    flex-direction: column;
  }

  .time-presets {
    justify-content: stretch;
  }

  .preset-btn {
    flex: 1;
  }
}
</style>