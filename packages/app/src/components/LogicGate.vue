<template>
  <div class="gate">
    <div class="gate__wires">
      <div class="gate__wires-divider">
        <div class="gate__wire">
        </div>
        <div class="gate__wire">
        </div>
      </div>
      <div class="gate__wires-divider">
        <div class="gate__wire">
        </div>
      </div>
    </div>
    <span class="tag-wrap">
      <span class="gate__element--or">
        <span class="gate__element--or--inner">
        </span>
      </span>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'LogicGate',
  data () {
    return {
      rotation: 0,
      width: 100,
      isEventAllowed: false
    }
  },
  methods: {
    resize ($event: MouseEvent) {
      this.width = this.width === 100 ? 130 : 100
      $event.preventDefault()
      $event.stopPropagation()
    }
  }
})
</script>

<style lang="scss">
.gate {
  width: 120px;
  border: 1px solid red;
  position: relative;
  pointer-events: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &__wire {
    height: 3px;
    background-color: black;
  }

  &__wires {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
  }

  &__wires-divider {
    height: 100%;
    width: 50%;
    display: flex;
    justify-content: space-around;
    flex-direction: column;
  }

  &__element--or {
    background: black;
    width: 68px;
    height: 50px;
  }

  &__element--or--inner {
    background: #fff0dc;
    width: 100%;
    height: 100%;
    transform: scale(0.93);
    margin-top: -1px;
  }

  &__element--or, &__element--or--inner {
    clip-path: path('m 1,1 v 0 C 5,8.108523499999999 7.35042,16.268423499999997 7.35042,25.0037235 c 0,8.736 -2.35213993,16.895200000000003 -6.42438993,23.961 v 0.1155 H 25.87123 c 17.7996,0 33.3375,-9.7034 41.6717,-24.0772 -8.334200000000001,-14.3738 -23.8721,-24.07719979 -41.6717,-24.07719979 h -18.520599999999998 z');
    display: block;
    pointer-events: all;
  }

}


.tag-wrap {
/*   filter: drop-shadow(-1px 6px 3px rgba(50, 50, 0, 0.5)); */
/*   transform: scaleY(1.5); */
}


</style>
