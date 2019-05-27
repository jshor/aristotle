<template>
  <div class="hook" :class="`hook--${type}`">
    <svg width="16" height="70" class="hook__svg">
      <line x1="8" x2="8" y1="2" y2="70" class="hook__wire" />
      <circle cx="8" cy="8" r="8" class="hook__needle" />
    </svg>
  </div>
</template>
  
<script>
export default {
  name: 'Hook',
  props: {
    type: String,
    default: 'light'
  }
}
</script>

<style lang="scss">
.hook {
  position: absolute;
  width: 100%;
  display: flex;
  justify-content: center;

  &--light {
    bottom: 0;
  }

  &--dark {
    bottom: -70px;
  }

  &__wire {
    stroke-width: 2px;
    stroke-dasharray: 6;
    animation: marching-ants 30s infinite linear;
  }

  &__needle {
    fill: #fff;
    stroke: #1C1D24;
    stroke-width: 2px;
  }
}

.hook--light {
  .hook__wire {
    stroke: #fff;
  }
}

.hook--dark {
  .hook__wire {
    stroke: #1C1D24;
  }

  .hook__needle {
    fill: #1C1D24;
    stroke: #fff;
    cy: 62px;
  }
}

@keyframes marching-ants {
  to {
    stroke-dashoffset: -1000;
  }
}
</style>