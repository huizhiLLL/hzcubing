<template>
  <component
    :is="tag"
    :class="['app-btn', `app-btn--${variant}`, { 'app-btn--block': block }]"
    :type="tag === 'button' ? type : undefined"
    :to="tag === 'router-link' ? to : undefined"
    :disabled="tag === 'button' ? disabled : undefined"
  >
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost
  to: { type: [String, Object], default: '' },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false }
})

// 有 to 就渲染成路由链接，否则是普通按钮
const tag = computed(() => (props.to ? 'router-link' : 'button'))
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0.85rem 1.4rem;
  border-radius: var(--radius-xl);
  font-family: inherit;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid transparent;
  transition:
    transform var(--transition-fast),
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.app-btn--block { width: 100%; }

.app-btn--primary {
  background: var(--color-text);
  color: var(--color-bg);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}
.app-btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--color-primary);
  box-shadow: 0 16px 30px color-mix(in srgb, var(--color-primary) 26%, transparent);
}

.app-btn--secondary {
  background: color-mix(in srgb, var(--color-bg-secondary) 92%, transparent);
  color: var(--color-text);
  border-color: color-mix(in srgb, var(--color-border) 82%, transparent);
}
.app-btn--secondary:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-primary) 36%, var(--color-border));
  color: var(--color-primary);
}

.app-btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border-color: color-mix(in srgb, var(--color-border) 92%, transparent);
}
.app-btn--ghost:hover:not(:disabled) {
  transform: translateY(-1px);
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 32%, var(--color-border));
}

.app-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
