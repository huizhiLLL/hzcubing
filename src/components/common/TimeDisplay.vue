<template>
  <span class="time-display" :class="{ large }">
    <span class="time-main">{{ formattedTime }}</span>
    <span v-if="showMs && !isWholeSecond" class="time-ms">.{{ ms }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  time: {
    type: [Number, String],
    required: true
  },
  showMs: {
    type: Boolean,
    default: true
  },
  large: {
    type: Boolean,
    default: false
  }
})

const numericTime = computed(() => {
  const value = Number(props.time)
  return Number.isFinite(value) ? Math.max(0, value) : 0
})

const seconds = computed(() => Math.floor(numericTime.value))

const ms = computed(() => {
  const msVal = Math.round((numericTime.value - Math.floor(numericTime.value)) * 100)
  return msVal.toString().padStart(2, '0')
})

const isWholeSecond = computed(() => (numericTime.value * 100) % 100 === 0)

const formattedTime = computed(() => {
  const total = numericTime.value
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = Math.floor(total % 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return seconds.value.toString()
})
</script>

<style scoped>
.time-display {
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--color-text);
}

.time-display.large {
  font-size: 2rem;
  font-weight: 600;
}

.time-main {
  color: var(--color-text);
}

.time-ms {
  color: var(--color-text-tertiary);
  font-size: 0.75em;
}
</style>
