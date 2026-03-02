<template>
  <span class="event-badge" :class="[eventId, { clickable }]">
    <span class="cubing-icon" :class="'event-' + iconId"></span>
    <span v-if="showLabel" class="event-label">{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  event: {
    type: String,
    required: true
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

// 映射事件 ID 到 cubing.net 图标 ID
const eventIdMap = {
  '3x3': '333',
  '4x4': '444',
  '5x5': '555',
  '6x6': '666',
  '7x7': '777',
  '2x2': '222',
  '3x3OH': '333oh',
  '3x3BLD': '333bf',
  '3x3FM': '333fm',
  '3x3SB': '333fs',
  'Pyraminx': 'pyram',
  'Megaminx': 'mega',
  'Skewb': 'skewb',
  'Clock': 'clock',
  'Sq1': 'sq1'
}

const labelMap = {
  '3x3': '三阶',
  '4x4': '四阶',
  '5x5': '五阶',
  '6x6': '六阶',
  '7x7': '七阶',
  '2x2': '二阶',
  '3x3OH': '单手',
  '3x3BLD': '盲拧',
  '3x3FM': '最少步',
  '3x3SB': '脚拧',
  'Pyraminx': '金字塔',
  'Megaminx': '五魔方',
  'Skewb': '斜转',
  'Clock': '魔表',
  'Sq1': 'SQ1'
}

const eventId = computed(() => eventIdMap[props.event] || props.event)
const iconId = computed(() => eventIdMap[props.event] || props.event)
const label = computed(() => labelMap[props.event] || props.event)
</script>

<style scoped>
.event-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
}

.event-badge.clickable {
  cursor: pointer;
  transition: all var(--transition-fast);
}

.event-badge.clickable:hover {
  background: var(--color-primary-light);
}

.event-label {
  color: var(--color-text-secondary);
}
</style>