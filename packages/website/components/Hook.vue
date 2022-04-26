<template>
  <div class="hook" :class="`hook--${type}`">
    <svg width="16" height="70" class="hook__svg">
      <line x1="8" x2="8" y1="2" y2="70" class="hook__wire" />
      <circle cx="8" cy="8" r="8" class="hook__needle" />
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Hook',
  props: {
    type: {
      type: String,
      default: 'light'
    }
  }
})
</script>

<style lang="scss">
$accentColor: #3eaf7c;
$textColor: #2c3e50;
$borderColor: #eaecef;
$codeBgColor: #1B1B23;
$shadowColor: #000000;

.hook {
  position: absolute;
  width: 100%;
  display: flex;
  justify-content: center;

  &--light {
    bottom: 0;

    .hook__wire {
      stroke: $borderColor;
    }
  }

  &--dark {
    bottom: -70px;

    .hook__wire {
      stroke: $codeBgColor;
    }

    .hook__needle {
      fill: $codeBgColor;
      stroke: $borderColor;
      cy: 62px;
    }
  }

  &__wire {
    stroke-width: 2px;
    stroke-dasharray: 6;
    animation: marching-ants 30s infinite linear;
  }

  &__needle {
    fill: $borderColor;
    stroke: $codeBgColor;
    stroke-width: 2px;
  }
}

@keyframes marching-ants {
  to {
    stroke-dashoffset: -1000;
  }
}
</style>
