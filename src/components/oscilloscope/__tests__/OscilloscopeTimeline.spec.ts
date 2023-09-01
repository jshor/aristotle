import { mount, VueWrapper } from '@vue/test-utils'
import { ComponentPublicInstance } from 'vue'
import OscilloscopeTimeline from '../OscilloscopeTimeline.vue'
import { createItem, createPort } from '@/store/document/actions/__tests__/__helpers__'
import ItemType from '@/types/enums/ItemType'
import PortType from '@/types/enums/PortType'

describe('Oscilloscope Timeline', () => {
  const port = createPort('port', 'item', PortType.Output, { name: 'Input Port' })
  const item = createItem('item', ItemType.InputNode, {
    portIds: ['port'],
    name: 'Inpit 1'
  })
  const oscillogram: Oscillogram = {
    [port.id]: {
      points: '0,0 10,0 10,1 20,1 20,0 30,0',
      hue: 340,
      width: 30
    }
  }

  afterEach(() => jest.resetAllMocks())

  let wrapper: VueWrapper<ComponentPublicInstance<typeof OscilloscopeTimeline>>

  beforeEach(() => {
    wrapper = mount(OscilloscopeTimeline, {
      props: {
        oscillogram,
        items: { item },
        ports: { port }
      },
      attachTo: document.body
    })
  })

  describe('scrollToNextInterval()', () => {
    it('should scroll the timeline to its maximum scrollable position', () => {
      const timeline = wrapper.get({ ref: 'timeline' })

      wrapper.vm.scrollToNextInterval()

      expect(timeline.attributes('scrollLeft')).toEqual(timeline.attributes('scrollWidth'))
    })
  })

  describe('onTimelineScroll()', () => {
    it('should match the y-scroll values of both the list and the timeline elements', () => {
      const timeline = wrapper.get({ ref: 'timeline' })
      const list = wrapper.get({ ref: 'list' })

      wrapper.vm.onTimelineScroll()

      expect(timeline.attributes('scrollTop')).toEqual(list.attributes('scrollTop'))
      expect(list.attributes('scrollTop')).toEqual(timeline.attributes('scrollTop'))
    })

    it('should no longer scroll when the component is unmounted', () => {
      const timeline = wrapper.get({ ref: 'timeline' })
      const originalScroll = timeline.attributes('scrollTop')

      wrapper.unmount()
      wrapper.vm.onTimelineScroll()

      expect(timeline.attributes('scrollTop')).toEqual(originalScroll)
    })
  })

  describe('when the oscillogram changes', () => {
    it('should invoke scrollToNextInterval()', async() => {
      jest
        .spyOn(wrapper.vm, 'scrollToNextInterval')
        .mockImplementation(jest.fn())

      await wrapper.setProps({
        oscillogram: {
          wave: {
            points: '0,0 10,0 10,1 20,1 20,0 30,0 40,0',
            hue: 340,
            width: 40
          }
        }
      })

      expect(wrapper.vm.scrollToNextInterval).toHaveBeenCalledTimes(1)
    })
  })
})
