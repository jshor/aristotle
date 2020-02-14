<template>
  <modal title="Create Integrated Circuit">
    <div class="padded">
      <div class="info-caption">Drag the connectors to arrange them. Click on labels to edit their text.</div>
      <div class="border">
        <div class="builder">
          <div class="grid">
            <Builder v-model="dialog.data" />
          </div>
        </div>
      </div>

      <div class="buttons">
        <span class="button" @click="cancel">Cancel</span>
        <span class="button" @click="createCircuit">Create Circuit</span>
      </div>
    </div>
  </modal>
</template>

<script>
import { mapState } from 'vuex'
import Builder from '../components/Builder'
import Modal from '../components/Modal'

export default {
  name: 'CircuitExportContainer',
  components: {
    Builder,
    Modal
  },
  methods: {
    cancel () {
      this.$store.commit('SET_DIALOG', { type: 'NONE' })
    },
    createCircuit () {
      console.log('wires: ', this.dialog.data)
    }
  },
  computed: {
    ...mapState(['dialog'])
  }
}
</script>

<style lang="scss">
.padded {
  flex-direction: column;
  height: 70vh;
  display: flex;
}

.info-caption {
  padding: 0.5rem 0;
  color: $color-secondary;
}

.border {
  flex: 1;
  padding: 3px;
  background-color: $color-bg-secondary;
}

.builder {
  background-color: $color-bg-primary;
  height: 100%;
}

.grid {
  height: 100%;
  max-height: 100%;
  overflow: scroll;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: 20px 20px;
  background-image: linear-gradient(to right, $color-bg-secondary 1px, transparent 1px),
        linear-gradient(to bottom, $color-bg-secondary 1px, transparent 1px);
}

.buttons {
  padding-top: 1rem;
  box-sizing: border-box;
  display: inline-flex;
  justify-content: flex-end;
}

.button {
  background-color: $color-bg-primary;
  border: 1px solid $color-secondary;
  color: $color-secondary;
  padding: 0.5rem;
  border-radius: 2px;
  box-sizing: border-box;
  margin-left: 0.5rem;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background-color: $color-bg-quaternary;
    color: $color-primary;
  }

  &:active {
    background-color: $color-bg-secondary;
  }
}
</style>
