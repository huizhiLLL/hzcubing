<template>
  <header class="page-header" :class="{ 'has-aside': hasAside }">
    <div class="page-header-copy">
      <span v-if="eyebrow" class="page-eyebrow">{{ eyebrow }}</span>
      <component :is="titleTag" class="page-title">{{ title }}</component>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="hasAside" class="page-header-aside">
      <slot name="aside" />
    </div>
  </header>
</template>

<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  eyebrow: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  titleTag: {
    type: String,
    default: 'h2'
  }
})

const slots = useSlots()
const hasAside = computed(() => Boolean(slots.aside))
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.page-header-copy {
  max-width: 680px;
}

.page-eyebrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.9rem;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-primary-light) 68%, transparent);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.page-title {
  font-size: clamp(1.5rem, 3vw, 2.6rem);
  font-weight: 700;
  margin-bottom: var(--space-xs);
  letter-spacing: -0.03em;
}

.page-subtitle {
  color: var(--color-text-tertiary);
  line-height: 1.65;
}

.page-header-aside {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header-aside {
    justify-content: stretch;
  }
}
</style>
