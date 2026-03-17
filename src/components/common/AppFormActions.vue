<template>
  <div class="form-actions" :class="[`align-${align}`]">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  align: {
    type: String,
    default: 'end'
  }
})
</script>

<style scoped>
.form-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 0.35rem 0.35rem 0.1rem;
}

.align-end {
  justify-content: flex-end;
}

.align-between {
  justify-content: space-between;
}

.align-start {
  justify-content: flex-start;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
    align-items: stretch;
    padding: 0;
  }
}
</style>
