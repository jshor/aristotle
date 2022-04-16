import { shallowMount, VueWrapper } from '@vue/test-utils'
import { ComponentPublicInstance } from 'vue'
import OscilloscopeTitleBar from '../OscilloscopeTitleBar.vue'

describe('Oscilloscope Title Bar', () => {
  let wrapper: VueWrapper<ComponentPublicInstance<typeof OscilloscopeTitleBar>>

  beforeEach(() => {
    wrapper = shallowMount(OscilloscopeTitleBar)
  })

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should emit `close` when the close button is clicked', async () => {
    await wrapper.setProps({ clearable: true })
    await wrapper
      .findAll('button[class="oscilloscope-title-bar__button"]')[1]
      .trigger('click')

    expect(wrapper.emitted()).toHaveProperty('close')
  })

  it('should emit `clear` when the clear button is clicked', async () => {
    await wrapper.setProps({ clearable: true })
    await wrapper
      .findAll('button[class="oscilloscope-title-bar__button"]')[0]
      .trigger('click')

    expect(wrapper.emitted()).toHaveProperty('clear')
  })

  it('should not emit `clear` when the clear button is clicked but the timeline is not clearable', async () => {
    await wrapper.setProps({ clearable: false })
    await wrapper
      .findAll('button[class="oscilloscope-title-bar__button"]')[0]
      .trigger('click')

    expect(wrapper.emitted()).not.toHaveProperty('clear')
  })
})
