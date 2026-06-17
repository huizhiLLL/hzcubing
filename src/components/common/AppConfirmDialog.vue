<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="open" class="confirm-mask" @click.self="$emit('cancel')">
        <div class="confirm-dialog" role="dialog" aria-modal="true" :aria-label="title">
          <h3 class="confirm-title">{{ title }}</h3>
          <p v-if="message" class="confirm-message">{{ message }}</p>
          <div class="confirm-actions">
            <button type="button" class="confirm-btn ghost" @click="$emit('cancel')">
              {{ cancelText }}
            </button>
            <button type="button" class="confirm-btn" :class="variant" @click="$emit('confirm')">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '确认操作' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  variant: { type: String, default: 'primary' } // primary | danger
})

const emit = defineEmits(['confirm', 'cancel'])

// 打开时按 Esc 关闭
function onKey(e) {
  if (e.key === 'Escape') emit('cancel')
}
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    window.addEventListener('keydown', onKey)
  } else {
    window.removeEventListener('keydown', onKey)
  }
})
</script>

<style scoped>
.confirm-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  background: rgba(15, 23, 42, 0.34);
  backdrop-filter: blur(6px);
}

.confirm-dialog {
  width: min(100%, 400px);
  padding: 1.5rem;
  border-radius: var(--radius-2xl);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.confirm-title {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.confirm-message {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 1.4rem;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
}

.confirm-btn {
  min-height: 42px;
  padding: 0.6rem 1.1rem;
  border-radius: var(--radius-lg);
  font-family: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.confirm-btn.ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border-color: color-mix(in srgb, var(--color-border) 92%, transparent);
}
.confirm-btn.ghost:hover { color: var(--color-text); }

.confirm-btn.primary { background: var(--color-text); color: var(--color-bg); }
.confirm-btn.danger { background: var(--color-error); color: #fff; }
.confirm-btn.primary:hover, .confirm-btn.danger:hover { transform: translateY(-1px); }

.confirm-fade-enter-active,
.confirm-fade-leave-active { transition: opacity var(--motion-panel); }
.confirm-fade-enter-from,
.confirm-fade-leave-to { opacity: 0; }
</style>
