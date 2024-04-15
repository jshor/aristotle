import { mount, VueWrapper } from '@vue/test-utils'
import Properties from '../Properties.vue'
import ItemProperties from '@/types/interfaces/ItemProperties'
import BoundingBox from '@/types/types/BoundingBox'
import Point from '@/types/interfaces/Point'

describe('Item Properties', () => {
  let wrapper: VueWrapper<typeof Properties>
  let model: ItemProperties

  const viewport = new DOMRect(0, 0, 100, 100)
  const boundingBox: BoundingBox = {
    left: 0,
    top: 0,
    right: 100,
    bottom: 100
  }

  beforeEach(() => {
    model = {
      name: {
        label: 'Name',
        type: 'text',
        value: 'My Property',
        description: 'A basic text input.'
      }
    }

    wrapper = mount(Properties, {
      props: {
        modelValue: model,
        viewport,
        boundingBox,
        zoom: 1
      },
      global: {
        stubs: {
          teleport: true
        }
      }
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should render the properties dialog and overlay when the button is clicked', async () => {
    await wrapper
      .findComponent({ name: 'Icon' })
      .trigger('click')

    expect(wrapper.find('.properties__overlay').exists()).toBe(true)
    expect(wrapper.find('.properties__dialog').exists()).toBe(true)
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should render the properties dialog and overlay when the button is touched', async () => {
    await wrapper
      .findComponent({ name: 'Icon' })
      .trigger('touchend')

    expect(wrapper.find('.properties__overlay').exists()).toBe(true)
    expect(wrapper.find('.properties__dialog').exists()).toBe(true)
    expect(wrapper.html()).toMatchSnapshot()
  })

  describe('when the dialog is open', () => {
    beforeEach(async () => {
      wrapper
        .findComponent({ name: 'Icon' })
        .trigger('click')
    })

    it('should apply the focus back into the dialog when the focus-end element is focused into', async () => {
      const focusEndElement = wrapper.find('[data-test="focus-end"]')

      await focusEndElement.trigger('focus')
      await wrapper.vm.$nextTick()

      expect(document.activeElement).not.toBe(focusEndElement)
    })

    it('should close the dialog when the close button is clicked', async () => {
      await wrapper
        .find('.properties__close')
        .trigger('click')

      expect(wrapper.find('.properties__overlay').exists()).toBe(false)
      expect(wrapper.find('.properties__dialog').exists()).toBe(false)
    })
  })

  describe('when the dialog is open outside of the viewport bounds', () => {
    /** Asserts overflow in the given direction. */
    function testOverflow (direction: string, viewport: BoundingBox, expectation: Point) {
      it(`should animate panning the viewport to accommodate the ${direction} overflow`, async () => {
        await wrapper.setProps({
          modelValue: model,
          viewport: viewport as DOMRect,
          zoom: 1,
          boundingBox
        })
        await wrapper
         .findComponent({ name: 'Icon' })
         .trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted()).toHaveProperty('pan')
        expect(wrapper.emitted().pan[0]).toEqual([expectation, true])
      })
    }

    testOverflow('left', {
      left: -500,
      top: 500,
      right: -300,
      bottom: 600
    }, { x: -300, y: -0 })

    testOverflow('top', {
      left: 0,
      top: -500,
      right: 0,
      bottom: -600
    }, { x: -0, y: -600 })

    testOverflow('bottom', {
      left: 0,
      top: 500,
      right: 0,
      bottom: 600
    }, { x: -0, y: 500 })

    testOverflow('right', {
      left: 500,
      top: 0,
      right: 600,
      bottom: 0
    }, { x: 500, y: -0 })
  })
})
