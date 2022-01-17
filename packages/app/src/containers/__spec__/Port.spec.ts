import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import Port from '../Port.vue'
import PortHelper from '../../components/PortHelper.vue'

describe('Port Container', () => {
  let wrapper, state

  const createWrapper = (props = {}) => {
    state = {
      documents: {
        activePort: null
      }
    }

    return mount(Port, {
      props: {
        siblings: {
          left: [],
          top: [],
          bottom: [],
          right: []
        },
        ...props
      },
      global: {
        plugins: [
          createStore({
            state,
            getters: {
              zoom: () => 1
            },
            actions: {
              connect: jest.fn(),
              disconnect: jest.fn(),
              setActivePort: jest.fn(),
              hidePortSnapHelpers: jest.fn(),
              showPortSnapHelpers: jest.fn(),
              updatePortPositions: jest.fn()
            }
          })
        ]
      }
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => jest.resetAllMocks())

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should show the snap helpers when the `showHelper` is true', () => {
    wrapper = createWrapper({ showHelper: true })

    const helpers = wrapper.findAllComponents(PortHelper)

    expect(helpers).toHaveLength(2)
    expect(helpers.at(0).props().orientation).toEqual('horizontal')
    expect(helpers.at(1).props().orientation).toEqual('vertical')
  })

  it('should hide the snap helpers when the `showHelper` is false', () => {
    wrapper = createWrapper({ showHelper: false })

    expect(wrapper.findAllComponents(PortHelper)).toHaveLength(0)
  })

  describe('setAbsolutePosition()', () => {
    it('should define `absolutePosition` to be the editor coordinates of the element\'s location', () => {
      expect(wrapper.vm.absolutePosition).toEqual({ x: 0, y: 0 })
      wrapper.vm.setAbsolutePosition()
      expect(wrapper.vm.absolutePosition).toEqual({ x: 10, y: 20 })
    })
  })

  describe('mousedown()', () => {
    describe('when the port is a Freeport', () => {
      it('should dispatch showPortSnapHelpers with the ids of its sibling ports', () => {
        const id = 'test-1234'

        wrapper = createWrapper({
          id,
          siblings: {
            left: [],
            top: [{ id }],
            bottom: [],
            right: []
          },
          type: 2
        })

        const spy = jest.spyOn(wrapper.vm.$store, 'dispatch')

        wrapper.vm.mousedown()

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith('showPortSnapHelpers', [id])
      })
    })

    describe('when the port is not a Freeport', () => {
      it('should not dispatch showPortSnapHelpers', () => {
        wrapper = createWrapper({ type: 1 })

        const spy = jest.spyOn(wrapper.vm.$store, 'dispatch')

        wrapper.vm.mousedown()

        expect(spy).not.toHaveBeenCalled()
      })
    })
  })


  describe('mousedown()', () => {
    let spy

    beforeEach(() => {
      spy = jest.spyOn(wrapper.vm.$store, 'dispatch')
      wrapper.vm.mouseup()
    })

    it('should tell the store to set the active port to null', () => {
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith('setActivePort', null)
    })

    it('should tell the store to disable the port helpers', () => {
      expect(spy).toHaveBeenCalledWith('hidePortSnapHelpers')
    })
  })

  describe('dragStart()', () => {
    const id = 'test-1234'
    const type = 1
    const orientation = 3
    const position = {
      x: 34,
      y: 56
    }

    beforeEach(() => {
      wrapper = createWrapper({
        id,
        type,
        orientation
      })
    })

    it('should set the absolute position of the element', () => {
      const spy = jest.spyOn(wrapper.vm, 'setAbsolutePosition')

      wrapper.vm.dragStart({ position })

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should create a new active port with the data of the actively-dragged one', () => {
      const spy = jest.spyOn(wrapper.vm, 'setActivePort')

      wrapper.vm.dragStart({ position })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        id: wrapper.vm.cloneId,
        position: {
          x: 0,
          y: 0
        },
        type,
        orientation
      })
    })

    it('should set the coordinates of the dragged port to `NaN`', () => {
      wrapper.vm.dragStart({ position })

      expect(wrapper.vm.draggablePosition).toEqual({ x: NaN, y: NaN })
    })

    it('should invoke `onDrag()` with the given position', () => {
      const spy = jest.spyOn(wrapper.vm, 'onDrag').mockImplementation(jest.fn())

      wrapper.vm.dragStart({ position })

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith(position)
    })

    it('should establish a connection between the static port and the dragged (i.e., cloned) one', () => {
      const spy = jest.spyOn(wrapper.vm.$store, 'dispatch')

      wrapper.vm.dragStart({ position })

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith('connect', {
        source: id,
        target: wrapper.vm.cloneId
      })
    })
  })

  describe('onDrag()', () => {
    const id = 'test-1234'
    const type = 1
    const orientation = 3
    const position = {
      x: 34,
      y: 56
    }

    beforeEach(() => {
      wrapper = createWrapper({
        id,
        type,
        orientation
      })
    })

    describe('when the position is not defined in the payload', () => {
      it('should not make any calls to the store', () => {
        const spy = jest.spyOn(wrapper.vm.$store, 'dispatch')

        wrapper.vm.onDrag({})

        expect(spy).not.toHaveBeenCalled()
      })
    })

    describe('when the position is defined in the payload', () => {
      it('should update the store record of the port\'s position', () => {
        const spy = jest.spyOn(wrapper.vm.$store, 'dispatch')
        const { cloneId, absolutePosition } = wrapper.vm

        wrapper.vm.onDrag({ position })

        expect(spy).toHaveBeenCalledWith('updatePortPositions', {
          [cloneId]: {
            position: {
              x: position.x + absolutePosition.x,
              y: position.y + absolutePosition.y
            },
            id: cloneId,
            type,
            orientation,
            rotation: 0
          }
        })
      })
    })
  })

  describe('dragEnd()', () => {
    const snappedId = 'snapped-el-id'
    const id = 'test-port-id-1234'
    const position = {
      x: 34,
      y: 56
    }
    let spy

    beforeEach(() => {
      wrapper = createWrapper({ id })
      spy = jest.spyOn(wrapper.vm.$store, 'dispatch')

      wrapper.vm.dragEnd({ position, snappedId })
    })

    it('should reset the `draggablePosition`', () => {
      expect(wrapper.vm.draggablePosition).toEqual({ x: 0, y: 0 })
    })

    it('should disconnect the temporary-dragged port from the current one', () => {
      expect(spy).toHaveBeenCalledWith('disconnect', {
        source: id,
        target: wrapper.vm.cloneId
      })
    })

    it('should connect the port to the one that it was snapped to', () => {
      expect(spy).toHaveBeenCalledWith('connect', {
        source: id,
        target: snappedId
      })
    })

    it('should reset the active port to null', () => {
      expect(spy).toHaveBeenCalledWith('setActivePort', null)
    })
  })
})
