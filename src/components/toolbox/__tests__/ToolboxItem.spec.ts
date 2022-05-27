import { shallowMount, VueWrapper } from '@vue/test-utils'
import { ComponentPublicInstance, nextTick } from 'vue'
import ToolboxItem from '../ToolboxItem.vue'

describe.skip('Toolbox Item', () => {
  let wrapper: VueWrapper<ComponentPublicInstance<typeof ToolboxItem>>
  const zoom = 1.2

  beforeEach(() => {
    wrapper = shallowMount(ToolboxItem, {
      props: {
        zoom
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    document.body.innerHTML = ''
  })

  it('should not add any additional cloned versions of the element when the mouse moves without dragging anything', async () => {
    window.dispatchEvent(new MouseEvent('mousemove', {
      clientX: 1,
      clientY: 2
    }))

    expect(document.body.querySelectorAll('.toolbox-item__inner')).toHaveLength(0)
  })

  describe('when the element is dragged', () => {
    it('should not add any additional cloned versions of the element when not moved by a significant distance', async () => {
      await wrapper
        .find('.toolbox-item')
        .trigger('mousedown', { x: 1, y: 1 })

      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 1,
        clientY: 2
      }))

      expect(document.body.querySelectorAll('.toolbox-item__inner')).toHaveLength(0)
    })

    it('should attach its cloned element to the document body when moved 4 or more pixels', async () => {
      await wrapper
        .find('.toolbox-item')
        .trigger('mousedown', { x: 10, y: 10 })

      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: 15,
        clientY: 15
      }))

      const nodes = document.body.querySelectorAll('.toolbox-item__inner')
      const element = nodes[0] as HTMLElement

      expect(nodes[0]).toBeInstanceOf(HTMLElement)
      expect(element.style['zoom']).toEqual(zoom.toString())
      expect(element.style.position).toEqual('absolute')
      expect(element.style.width).toBeDefined()
      expect(element.style.height).toBeDefined()
    })
  })

  describe('when the mouse button is released', () => {
    it('should not emit `drop` when nothing was dragged', () => {
      window.dispatchEvent(new MouseEvent('mouseup', {
        clientX: 1,
        clientY: 1
      }))

      expect(wrapper.emitted()).not.toHaveProperty('drop')
    })

    describe('when the mouse was down on the element', () => {
      it('should remove the cloned element from the DOM', async () => {
        await wrapper
          .find('.toolbox-item')
          .trigger('mousedown', { x: 1, y: 1 })

        window.dispatchEvent(new MouseEvent('mouseup', {
          clientX: 1,
          clientY: 1
        }))

        expect(document.body.querySelectorAll('.toolbox-item__inner')).toHaveLength(0)
      })

      it('should emit drop without a specified coordinates when no dragging was performed', async () => {
        await wrapper
          .find('.toolbox-item')
          .trigger('mousedown', { x: 1, y: 1 })

        window.dispatchEvent(new MouseEvent('mouseup', {
          clientX: 1,
          clientY: 1
        }))

        expect(wrapper.emitted()).toHaveProperty('drop')
        expect(wrapper.emitted().drop[0]).toHaveLength(0)
      })

      it('should emit drop with the scaled release coordinates when the element was dragged', async () => {
        await wrapper
          .find('.toolbox-item')
          .trigger('mousedown', { x: 10, y: 10 })

        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: 5,
          clientY: 6
        }))
        window.dispatchEvent(new MouseEvent('mouseup', {
          clientX: 5,
          clientY: 6
        }))

        expect(wrapper.emitted()).toHaveProperty('drop')
        expect(wrapper.emitted().drop[0]).toEqual([{
          x: expect.any(Number),
          y: expect.any(Number)
        }])
      })
    })
  })

  describe('when the item is resized', () => {
    it('should update the zoom in ratio to the size changed', async () => {
      const parent = wrapper.find('.toolbox-item__preview').element as HTMLElement
      const child = wrapper.find('.toolbox-item__inner').element as HTMLElement

      jest
        .spyOn(parent, 'getBoundingClientRect')
        .mockReturnValueOnce(new DOMRect(0, 0, 100, 100)) // initialize parent at 100px
        .mockReturnValueOnce(new DOMRect(0, 0, 150, 150)) // resize to 150px
      jest
        .spyOn(child, 'getBoundingClientRect')
        .mockReturnValue(new DOMRect(0, 0, 170, 170))

      wrapper.vm.onSizeChanged()

      expect(child.style['zoom']).toEqual(1)
    })
  })
})
