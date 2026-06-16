<template>
  <button
    type="button"
    class="app-icon-btn"
    :class="[`variant-${variant}`, { 'is-loading': loading }]"
    :aria-label="label"
    :title="label"
    :disabled="disabled || loading"
  >
    <svg
      v-if="icon === 'refresh'"
      class="app-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 0 1-15.2 6.5" />
      <path d="M3 12A9 9 0 0 1 18.2 5.5" />
      <path d="M18 2v4h-4" />
      <path d="M6 22v-4h4" />
    </svg>
    <svg
      v-else-if="icon === 'edit'"
      class="app-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
    <svg
      v-else-if="icon === 'trash'"
      class="app-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
    <svg
      v-else-if="icon === 'x'"
      class="app-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
    <svg
      v-else-if="icon === 'pause'"
      class="app-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M10 5v14" />
      <path d="M14 5v14" />
    </svg>
    <svg
      v-else-if="icon === 'play'"
      class="app-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
    <svg
      v-else
      class="app-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  </button>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'default'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.app-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--color-border) 86%, transparent);
  background: color-mix(in srgb, var(--color-bg-secondary) 88%, transparent);
  color: var(--color-text);
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background-color var(--transition-fast),
    color var(--transition-fast),
    opacity var(--transition-fast);
}

.app-icon {
  width: 15px;
  height: 15px;
}

.app-icon-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-primary) 34%, var(--color-border));
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-bg-secondary));
}

.variant-danger {
  color: var(--color-error);
  border-color: color-mix(in srgb, var(--color-error) 28%, transparent);
  background: color-mix(in srgb, var(--color-error) 8%, transparent);
}

.variant-danger:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--color-error) 44%, transparent);
  color: var(--color-error);
  background: color-mix(in srgb, var(--color-error) 12%, transparent);
}

.variant-success {
  color: var(--color-success);
  border-color: color-mix(in srgb, var(--color-success) 28%, transparent);
  background: color-mix(in srgb, var(--color-success) 8%, transparent);
}

.variant-muted {
  color: var(--color-text-secondary);
}

.app-icon-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.is-loading .app-icon {
  animation: icon-spin 0.9s linear infinite;
}

@keyframes icon-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
