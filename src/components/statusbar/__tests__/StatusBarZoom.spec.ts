import { shallowMount, VueWrapper } from '@vue/test-utils'
import { ComponentPublicInstance } from 'vue'
import StatusBarZoom from '../StatusBarZoom.vue'

describe('Oscilloscope Title Bar', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = shallowMount(StatusBarZoom, {
      props: {
        zoom: 1
      }
    })
  })

  it('should match the snapshot', async () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should emit `zoom` as a decimal zoom factor', async () => {
    await wrapper.setProps({ clearable: true })
    const slider = wrapper.findAll('input')[0]

    slider.element.value = '110'
    slider.trigger('input')

    expect(wrapper.emitted()).toHaveProperty('zoom')
    expect(wrapper.emitted().zoom[0]).toEqual([1.1])
  })
})
