import { mount } from '@vue/test-utils'
import Resizable from '../Resizable.vue'

describe('Resizable component', () => {
  afterEach(() => jest.resetAllMocks())

  it('should emit `resize` with the element size', async () => {
    const target = document.createElement('div')
    const wrapper = mount(Resizable)

    target.style.display = 'block'
    target.style.width = '40px'
    target.style.height = '40px'

    wrapper.vm.onSizeChanged([ { target } ])

    expect(wrapper.emitted()).toHaveProperty('resize')
  })

  it('should not emit `resize` when there are no children elements', async () => {
    const wrapper = mount(Resizable)

    expect(wrapper.emitted()).not.toHaveProperty('resize')
  })
})
