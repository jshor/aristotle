<template>
  <div class="digit">
    <svg width="58" height="98">
      <g>
        <path
          v-for="(segment, key) in segments"
          :key="key"
          :style="segment.style"
          :d="segment.path"
        />
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import { LogicValue } from '@/circuit'
import Direction from '@/types/enums/Direction'
import { defineComponent, PropType, computed, CSSProperties } from 'vue'

/**
 * Mapping of characters to numeric digit line.
 * The line index follows clockwise starting at the top left,
 * with the middle line having index 6.
 *
 *     (1)
 *      _
 * (0) |_| (2)
 * (5) |_| (3)
 *
 *     (4)
 *
 * @type {object<string, number[]>}
 */
const charMap: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0],
  0: [1, 1, 1, 1, 1, 1, 0],
  1: [0, 0, 1, 1, 0, 0, 0],
  2: [0, 1, 1, 0, 1, 1, 1],
  3: [0, 1, 1, 1, 1, 0, 1],
  4: [1, 0, 1, 1, 0, 0, 1],
  5: [1, 1, 0, 1, 1, 0, 1],
  6: [1, 1, 0, 1, 1, 1, 1],
  7: [0, 1, 1, 1, 0, 0, 0],
  8: [1, 1, 1, 1, 1, 1, 1],
  9: [1, 1, 1, 1, 0, 0, 1],
  a: [1, 1, 1, 1, 0, 1, 1],
  b: [1, 0, 0, 1, 1, 1, 1],
  c: [1, 1, 0, 0, 1, 1, 0],
  d: [0, 0, 1, 1, 1, 1, 1],
  e: [1, 1, 0, 0, 1, 1, 1],
  f: [1, 1, 0, 0, 0, 1, 1]
}

const paths = [
  'M 8,10 L 12,14 L 12,42 L 8,46 L 4,42 L 4,14 L 8,10 z',
  'M 10,8 L 14,4 L 42,4 L 46,8 L 42,12 L 14,12 L 10,8 z',
  'M 48,10 L 52,14 L 52,42 L 48,46 L 44,42 L 44,14 L 48,10 z',
  'M 48,50 L 52,54 L 52,82 L 48,86 L 44,82 L 44,54 L 48,50 z',
  'M 10,88 L 14,84 L 42,84 L 46,88 L 42,92 L 14,92 L 10,88 z',
  'M 8,50 L 12,54 L 12,82 L 8,86 L 4,82 L 4,54 L 8,50 z',
  'M 10,48 L 14,44 L 42,44 L 46,48 L 42,52 L 14,52 L 10,48 z',
]

export default defineComponent({
  name: 'DigitDisplay',
  props: {
    ports: {
      type: Object as PropType<Record<Direction, Port[]>>,
      default: () => {}
    }
  },
  setup (props) {
    const segments = computed(() => {
      console.log('SEGMENT: ', props.ports)
      const binaryString = props
        .ports
        ?.[Direction.Left]
        ?.map(node => node.value === LogicValue.TRUE ? 1 : 0)
        .join('')
      const hexString = parseInt(binaryString, 2)
        .toString(16)
        .toLowerCase()

      return charMap[hexString].map((value, index) => {
        const suffix = value ? 'on' : 'bg-tertiary'

        return {
          path: paths[index],
          style: {
            fill: `var(--color-${suffix})`
          } as CSSProperties
        }
      })
    })

    return { segments }
  }
})
</script>

<style lang="scss">
.digit {
  background-color: var(--color-bg-secondary);
  border: 2px solid var(--color-secondary);
  pointer-events: all;
  width: 70px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
