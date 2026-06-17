<template>
  <div class="segmented" role="tablist" :aria-label="ariaLabel">
    <span
      class="segmented-indicator"
      :style="{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${activeIndex * 100}%)` }"
    ></span>
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="segmented-btn"
      :class="{ active: option.value === modelValue }"
      role="tab"
      :aria-selected="option.value === modelValue"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true }, // [{ label, value }]
  ariaLabel: { type: String, default: '' }
})

defineEmits(['update:modelValue'])

const activeIndex = computed(() => {
  const i = props.options.findIndex(o => o.value === props.modelValue)
  return Math.max(i, 0)
})
</script>

<style scoped>
.segmented {
  position: relative;
  display: inline-flex;
  align-self: flex-start;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-secondary);
}

.segmented-indicator {
  position: absolute;
  left: 4px;
  top: 4px;
  bottom: 4px;
  border-radius: calc(var(--radius-lg) - 4px);
  background: var(--color-primary);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--color-primary) 22%, transparent);
  transition: transform var(--motion-panel);
  pointer-events: none;
}

.segmented-btn {
  position: relative;
  z-index: 1;
  min-width: 72px;
  padding: 0.65rem 0.95rem;
  border-radius: calc(var(--radius-lg) - 4px);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-weight: 600;
  font-size: 0.92rem;
  transition: color var(--transition-fast), transform var(--transition-fast);
}

.segmented-btn:hover:not(.active) {
  color: var(--color-primary);
}

.segmented-btn.active {
  color: #fff;
}

.segmented-btn:active {
  transform: scale(0.98);
}

@media (max-width: 768px) {
  .segmented {
    width: 100%;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
  }
  .segmented-btn { min-width: 0; }
  /* 移动端用 grid 等分，指示器按比例定位仍然成立 */
}
</style>
