import { mount, VueWrapper } from '@vue/test-utils'
import { ComponentPublicInstance } from 'vue'
import Selector from '../Selector.vue'

describe('Selector component', () => {
  let wrapper: VueWrapper<ComponentPublicInstance<typeof Selector>>

  beforeEach(() => {
    wrapper = mount(Selector, {
      props: {
        zoom: 1
      }
    })
  })

  afterEach(() => jest.resetAllMocks())

  describe('when the mouse pans the canvas', () => {
    const x = 13
    const y = 21
    const deltaX = 5
    const deltaY = 10

    beforeEach(async () => {
      await wrapper.trigger('mousedown', { x, y })
    })

    it('should emit `selectionStart`', () => {
      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: x + deltaX,
        clientY: y + deltaY
      }))

      expect(wrapper.emitted()).toHaveProperty('selectionStart')
    })

    describe('when the mouse is released', () => {
      it('should emit `selectionEnd` when a drag operation is in progress', () => {
        window.dispatchEvent(new MouseEvent('mousemove'))
        window.dispatchEvent(new MouseEvent('mouseup'))

        expect(wrapper.emitted()).toHaveProperty('selectionEnd')
      })
    })
  })

  it('should not emit `selectionEnd` if no drag operation is in progress', () => {
    window.dispatchEvent(new MouseEvent('mouseup'))

    expect(wrapper.emitted()).not.toHaveProperty('selectionEnd')
  })
})
