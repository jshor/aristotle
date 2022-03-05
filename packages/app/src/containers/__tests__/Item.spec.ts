import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import Item from '../Item.vue'

describe('HelloWorld.vue', () => {
  test('renders props.msg when passed', () => {
    const wrapper = shallowMount(Item, {
      global: {
        plugins: [
          createStore({
            getters: {
              zoom: () => 1
            }
          })
        ]
      }
    })
    expect(wrapper).toMatchSnapshot()
  })


  describe('portList', () => {

  })
})
