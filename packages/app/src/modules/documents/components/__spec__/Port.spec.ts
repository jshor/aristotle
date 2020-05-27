import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import Port from '../Port.vue'

const localVue = createLocalVue()

localVue.use(Vuex)

describe('Document Container', () => {
  const documentId = 'test123'
  let wrapper, state

  const createWrapper = () => {
    state = {
      documents: {
        activePort: null
      }
    }

    return shallowMount(Port, {
      propsData: {
        document: {
          id: 'testPort'
        }
      },
      localVue,
      store: new Vuex.Store({
        state,
        getters: {
          zoom: () => 1
        },
        actions: {
        }
      })
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

})
