<script setup lang="ts">
withDefaults(defineProps<{ label: string; type?: 'button' | 'submit' }>(), {
  type: 'button',
})
</script>

<template>
  <button class="icon-action" :type="type" :aria-label="label" :title="label">
    <span class="icon-glyph" aria-hidden="true"><slot /></span>
  </button>
</template>
