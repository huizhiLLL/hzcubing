<template>
  <section class="section-card" :class="[`variant-${variant}`]">
    <div v-if="title || hasHeaderAside" class="section-card-header" :class="{ 'has-aside': hasHeaderAside }">
      <div v-if="title" class="section-heading">
        <component v-if="title" :is="titleTag" class="section-title">{{ title }}</component>
      </div>
      <div v-if="hasHeaderAside" class="section-card-aside">
        <slot name="aside" />
      </div>
    </div>
    <slot />
  </section>
</template>

<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  titleTag: {
    type: String,
    default: 'h2'
  },
  variant: {
    type: String,
    default: 'default'
  }
})

const slots = useSlots()
const hasHeaderAside = computed(() => Boolean(slots.aside))
</script>

<style scoped>
.section-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: 1.35rem 1.4rem;
  border-radius: 22px;
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  background: color-mix(in srgb, var(--color-bg-secondary) 92%, transparent);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.05);
}

.variant-subtle {
  background: color-mix(in srgb, var(--color-bg-secondary) 96%, transparent);
}

.section-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
}

.section-heading {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 1.06rem;
  font-weight: 700;
  letter-spacing: 0;
}

.section-card-aside {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .section-card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .section-card-aside {
    justify-content: stretch;
  }
}
</style>
