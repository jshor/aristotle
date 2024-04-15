import { mount, VueWrapper } from '@vue/test-utils'
import { ComponentPublicInstance } from 'vue'
import ToolboxItem from '../ToolboxItem.vue'
import clockFactory from '@/factories/clockFactory'

describe('Toolbox Item', () => {
  const zoom = 1.2

  afterEach(() => {
    vi.resetAllMocks()
    document.body.innerHTML = ''
  })

  describe('when the element is dragged', () => {
    let wrapper: VueWrapper

    beforeEach(() => {
      wrapper = mount(ToolboxItem, {
        props: {
          factory: clockFactory,
          zoom
        }
      })
    })

    it('should attach its cloned element to the document body', async () => {
      const component = await wrapper.findComponent({ name: 'Draggable' })

      await component.vm.$emit('drag-start')
      await component.vm.$emit('drag', { x: 10, y: 10 })
      await component.vm.$emit('drag', { x: 11, y: 12 })

      const nodes = document.body.querySelectorAll('.toolbox-item__inner')
      const element = nodes[0] as HTMLElement

      expect(element).toBeInstanceOf(HTMLElement)
      expect(element.style.position).toEqual('absolute')
      expect(element.style.width).toBeDefined()
      expect(element.style.height).toBeDefined()
    })

    it('should remove the cloned element from the body when drag finishes', async () => {
      const component = await wrapper.findComponent({ name: 'Draggable' })

      await component.vm.$emit('drag', { x: 10, y: 10 })
      await component.vm.$emit('drag', { x: 10, y: 10 })

      expect(document.body.querySelectorAll('.toolbox-item__inner')[0]).toBeTruthy()

      await component.vm.$emit('drag-end', { x: 11, y: 11 })

      expect(document.body.querySelectorAll('.toolbox-item__inner')[0]).toBeFalsy()
    })

    it('should not attach the cloned element if no drag operation has begun', async () => {
      const component = await wrapper.findComponent({ name: 'Draggable' })

      await component.vm.$emit('drag', { x: 11, y: 11 })

      expect(document.body.querySelectorAll('.toolbox-item__inner')[0]).toBeFalsy()
    })

    it('should not emit a `drop` event when it has not yet been dragged', async () => {
      const component = await wrapper.findComponent({ name: 'Draggable' })

      await component.vm.$emit('drag-end')

      expect(wrapper.emitted()).not.toHaveProperty('drop')
    })

    it.skip('should not emit a `drop` event when the cloned item was not yet attached to the DOM', async () => {
      const component = await wrapper.findComponent({ name: 'Draggable' })

      await component.vm.$emit('drag-start')
      await component.vm.$emit('drag-end', { x: 11, y: 11 })

      expect(wrapper.emitted()).not.toHaveProperty('drop')
    })
  })

  it('should resize the preview according to its parent size and zoom', async () => {
    const wrapper = mount(ToolboxItem, {
      props: {
        factory: clockFactory,
        zoom
      }
    })
    const component = await wrapper.findComponent({ ref: 'preview' })

    await component.vm.$emit('resize', {
      width: 100,
      height: 200
    })

    expect(wrapper.vm.zoom).toEqual(1)
  })
})
