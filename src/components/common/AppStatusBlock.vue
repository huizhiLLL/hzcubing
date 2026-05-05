<template>
  <div
    class="status-block"
    :class="[`variant-${variant}`, `layout-${layout}`]"
    :role="variant === 'error' ? 'alert' : 'status'"
    :aria-live="variant === 'error' ? 'assertive' : 'polite'"
  >
    <div v-if="variant === 'loading'" class="status-visual" aria-hidden="true">
      <span class="spinner-ring spinner-ring-outer"></span>
      <span class="spinner-ring spinner-ring-inner"></span>
      <span class="spinner-core"></span>
    </div>

    <div v-else-if="showDot" class="status-dot" aria-hidden="true"></div>

    <div class="status-copy">
      <p v-if="title" class="status-title">{{ title }}</p>
      <p v-if="message" class="status-message">{{ message }}</p>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'empty'
  },
  layout: {
    type: String,
    default: 'card'
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  }
})

const showDot = computed(() => props.variant !== 'loading')
</script>

<style scoped>
.status-block {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  border-radius: 20px;
  border: 1px solid transparent;
}

.layout-card {
  justify-content: center;
  min-height: 220px;
  padding: 1.4rem;
  background: color-mix(in srgb, var(--color-bg-secondary) 94%, transparent);
  text-align: center;
}

.layout-banner {
  min-height: 60px;
  padding: 1rem 1.05rem;
  text-align: left;
}

.variant-loading.layout-card,
.variant-empty.layout-card {
  color: var(--color-text-tertiary);
  border-color: color-mix(in srgb, var(--color-border) 82%, transparent);
}

.variant-error {
  background: color-mix(in srgb, var(--color-error) 9%, transparent);
  color: var(--color-error);
  border-color: color-mix(in srgb, var(--color-error) 16%, transparent);
}

.variant-success {
  background: color-mix(in srgb, var(--color-success) 10%, transparent);
  color: var(--color-success);
  border-color: color-mix(in srgb, var(--color-success) 18%, transparent);
}

.variant-empty.layout-banner {
  background: color-mix(in srgb, var(--color-bg) 76%, var(--color-bg-secondary));
  color: var(--color-text-secondary);
  border-color: color-mix(in srgb, var(--color-border) 82%, transparent);
}

.status-visual {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.spinner-ring,
.spinner-core,
.status-dot {
  display: inline-flex;
  border-radius: 999px;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
}

.spinner-ring-outer {
  border-top-color: var(--color-primary);
  border-right-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  animation: spin 1s linear infinite;
}

.spinner-ring-inner {
  inset: 8px;
  border-bottom-color: color-mix(in srgb, var(--color-primary) 70%, transparent);
  border-left-color: color-mix(in srgb, var(--color-primary) 24%, transparent);
  animation: spinReverse 1.4s linear infinite;
}

.spinner-core {
  position: absolute;
  inset: 20px;
  background: color-mix(in srgb, var(--color-primary) 16%, transparent);
  animation: pulse 1.2s ease-in-out infinite;
}

.status-dot {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  margin-top: 0.2rem;
  background: currentColor;
  opacity: 0.7;
}

.layout-card .status-copy {
  max-width: 420px;
}

.status-title {
  font-family: var(--font-heading);
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.status-message {
  line-height: 1.65;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes spinReverse {
  to {
    transform: rotate(-360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(0.85);
    opacity: 0.55;
  }

  50% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
