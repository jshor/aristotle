<template>
  <!-- <div class="input-node">
    <button
      type="button"
      class="input-node__flipper"
      :tabindex="0"
      :class="{
        'input-node__flipper--on': model === 1,
        'input-node__flipper--off': model === -1,
        'input-node__flipper--high-z': model === 0
      }"
      @mousedown.stop="onInput"
      @touchstart.stop="onInput"
    >
      <span v-if="model === 1">ON</span>
      <span v-else-if="model === -1">OFF</span>
      <span v-else>?</span>
    </button>
  </div> -->
  <div class="switch"
      :class="{
        'switch--on': model === 1,
        'switch--off': model === -1,
        'switch--hi-z': model === 0
      }">
    <div
      class="switch__inner"
      :tabindex="0"
      aria-role="switch"
    >
      <div class="switch__trigger"
      @mousedown.stop="onInput"
      @touchstart.stop="onInput">
        <div class="switch__light"></div>
        <div class="switch__characters"></div>
      </div>
    </div>
  </div>

</template>

<script lang="ts">
import LogicValue from '@/types/enums/LogicValue'
import Direction from '@/types/enums/Direction'
import { defineComponent, PropType, ref, watchEffect } from 'vue'
import Port from '@/types/interfaces/Port'

export default defineComponent({
  name: 'InputNode',
  props: {
    ports: {
      type: Object as PropType<Record<Direction, Port[]>>,
      default: () => {}
    },
    // subtype: {
    //   type: String as PropType<ItemSubtype>,
    //   required: true
    // }
  },
  emits: {
    signal: (data: { id: string, value: number }) => true
  },
  setup (props, { emit }) {
    const model = ref(0)
    const port = props.ports[Direction.Right]?.[0]

    watchEffect(() => {
      model.value = port?.value || LogicValue.UNKNOWN
    })

    function onInput ($event: Event) {
      $event.preventDefault()
      $event.stopPropagation()

      model.value = model.value === LogicValue.TRUE
        ? LogicValue.FALSE
        : LogicValue.TRUE

      emit('signal', {
        id: port.id,
        value: model.value
      })
    }

    return {
      model,
      onInput
    }
  }
})
</script>

<style lang="scss">
$color: #18ffa0; // Try other colors, like #18ffa0
$rotation: 20deg;
$pivot-distance: 20px;
$width: 120px;
$height: 1.5 * $width;

.switch {
  pointer-events: all;
  touch-action: all;
  cursor: move;
  padding: 15px;
  box-sizing: border-box;
  background-color: var(--color-bg-secondary);
  border: 2px solid var(--color-secondary);
  border-radius: 3px;

  &--on .switch__trigger {
    transform: translateZ($pivot-distance) rotateX($rotation);
    box-shadow: 0 -10px 20px $color;
    --the-color: var(--color-on);
  }

  &--off {
    --the-color: var(--color-off);
  }
  &--hi-z {
    --the-color: var(--color-hi-z);
  }

  &__inner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: $width;
    height: $height;
    box-shadow:
      0 0 5px 2px var(--color-secondary), // The surrounding shadow (second layer)
      inset 0 0 2px 15px var(--color-bg-secondary), // The light gray frame
      inset 0 0 2px 22px black; // The internal black shadow
    border-radius: 5px;
    background-color: var(--color-bg-secondary);
    perspective: 700px;
    zoom: 0.25;

  }

    &__trigger{
      cursor: pointer;
      transition: all 0.15s cubic-bezier(1, 0, 1, 1);
      transform-origin: center center -#{$pivot-distance};
      transform: translateZ($pivot-distance) rotateX(-$rotation);
      transform-style: preserve-3d;
      width: 100%;
      height: 100%;
      position: relative;
      background: var(--the-color);
      background-repeat: no-repeat;


      &::before {
        content: "";
        transition: all 0.25s cubic-bezier(1, 0, 1, 1);
        background: var(--the-color);
        background-repeat: no-repeat;
        width: 100%;
        height: 50px;
        transform-origin: top;
        transform: rotateX(-90deg);
        position: absolute;
        top: 0;
      }

      &::after {
        content: "";
        transition: all 0.25s cubic-bezier(1, 0, 1, 1);
        background: var(--the-color);
        width: 100%;
        height: 50px;
        transform-origin: top;
        transform: translateY(50px) rotateX(-90deg);
        position: absolute;
        bottom: 0;
        box-shadow: 0 50px 8px 0px black, 0 80px 20px 0px rgba(black, 0.5);
      }
    }

    &__light {
      opacity: 0;
      animation:  light-off 1s;
      position: absolute;
      width: 100%;
      height: 100%;
    }

    &__characters {
      position: absolute;
      width: 100%;
      height: 100%;

      // Drawing with gradients!
      // Read more about it here: https://css-tricks.com/drawing-images-with-css-gradients/
      // And check this collection out: https://a.singlediv.com/
      background:
      linear-gradient(white, white) 50% 20%/5% 20%, radial-gradient(circle, transparent 50%, white 10%, white 70%, transparent 72%) 50% 80%/35% 25%;
      background-repeat: no-repeat;
    }
}

@keyframes light-off {
  0% {opacity: 1}
  80% {opacity: 0}
}
</style>
