<template>
  <span class="time-display" :class="{ 'is-dnf': isDNF, 'is-dns': isDNS, 'large': large }">
    <template v-if="isDNF">DNF</template>
    <template v-else-if="isDNS">DNS</template>
    <template v-else>
      <span class="time-main">{{ formattedTime }}</span>
      <span v-if="showMs && !isWholeSecond" class="time-ms">.{{ ms }}</span>
    </template>
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

const isDNF = computed(() => props.time === 'DNF' || props.time === -1)
const isDNS = computed(() => props.time === 'DNS' || props.time === -2)

const seconds = computed(() => {
  if (isDNF.value || isDNS.value) return 0
  const t = Number(props.time)
  return Math.floor(t)
})

const ms = computed(() => {
  if (isDNF.value || isDNS.value) return 0
  const t = Number(props.time)
  const msVal = Math.round((t - Math.floor(t)) * 100)
  return msVal.toString().padStart(2, '0')
})

const isWholeSecond = computed(() => {
  if (isDNF.value || isDNS.value) return false
  const t = Number(props.time)
  return (t * 100) % 100 === 0
})

const formattedTime = computed(() => {
  if (isDNF.value || isDNS.value) return ''
  const t = Number(props.time)
  const mins = Math.floor(t / 60)
  const secs = Math.floor(t % 60)

  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  return secs.toString()
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

.time-display.is-dnf,
.time-display.is-dns {
  color: var(--color-error);
  font-weight: 600;
}
</style>