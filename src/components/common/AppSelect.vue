<template>
  <div class="app-select" :class="{ disabled }">
    <select
      :value="modelValue"
      class="app-select-native"
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>
    <span class="app-select-arrow" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </span>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.app-select {
  position: relative;
  width: 100%;
}

.app-select-native {
  width: 100%;
  padding: 1rem 3rem 1rem 1.05rem;
  border: 1px solid color-mix(in srgb, var(--color-border) 90%, transparent);
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-bg) 70%, var(--color-bg-secondary));
  color: var(--color-text);
  font-size: 0.9375rem;
  line-height: 1.3;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.app-select-native:hover {
  border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
}

.app-select-native:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.app-select-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  transition: color var(--transition-fast), transform var(--transition-fast);
}

.app-select:focus-within .app-select-arrow {
  color: var(--color-primary);
  transform: translateY(-50%) rotate(180deg);
}

.disabled .app-select-native {
  cursor: not-allowed;
  opacity: 0.6;
  background: color-mix(in srgb, var(--color-bg-tertiary) 72%, transparent);
}
</style>
