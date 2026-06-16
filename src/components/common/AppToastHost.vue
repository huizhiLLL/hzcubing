<template>
  <Teleport to="body">
    <div class="toast-host" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="toast" tag="div" class="toast-stack">
        <article
          v-for="toast in toastStore.items"
          :key="toast.id"
          class="toast-card"
          :class="`variant-${toast.variant}`"
          :role="toast.variant === 'error' ? 'alert' : 'status'"
        >
          <span class="toast-mark" aria-hidden="true"></span>
          <div class="toast-copy">
            <strong v-if="toast.title" class="toast-title">{{ toast.title }}</strong>
            <p class="toast-message">{{ toast.message }}</p>
          </div>
          <button class="toast-close" type="button" aria-label="关闭提示" @click="toastStore.remove(toast.id)">
            &times;
          </button>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
</script>

<style scoped>
.toast-host {
  position: fixed;
  top: 22px;
  right: 22px;
  z-index: 1000;
  width: min(380px, calc(100vw - 32px));
  pointer-events: none;
}

.toast-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toast-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 14px 14px 14px 15px;
  border: 1px solid color-mix(in srgb, var(--toast-color) 22%, var(--color-border));
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-bg-secondary) 94%, transparent);
  color: var(--color-text);
  box-shadow: 0 20px 46px rgba(15, 23, 42, 0.18);
  pointer-events: auto;
  backdrop-filter: blur(14px);
}

.variant-success {
  --toast-color: var(--color-success);
}

.variant-error {
  --toast-color: var(--color-error);
}

.variant-info {
  --toast-color: var(--color-primary);
}

.toast-mark {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--toast-color);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--toast-color) 12%, transparent);
}

.toast-copy {
  display: flex;
  min-height: 28px;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.toast-title {
  display: block;
  margin-bottom: 2px;
  font-size: 0.9rem;
  line-height: 1.45;
}

.toast-message {
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.toast-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  color: var(--color-text-tertiary);
  font-size: 1.2rem;
  line-height: 1;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast);
}

.toast-close:hover {
  background: color-mix(in srgb, var(--color-border) 52%, transparent);
  color: var(--color-text);
  transform: scale(0.96);
}

.toast-enter-active,
.toast-leave-active,
.toast-move {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.toast-leave-active {
  position: absolute;
  inset-inline: 0;
}

@media (max-width: 768px) {
  .toast-host {
    top: auto;
    right: 12px;
    bottom: 14px;
    left: 12px;
    width: auto;
  }

  .toast-card {
    border-radius: 16px;
  }
}
</style>
