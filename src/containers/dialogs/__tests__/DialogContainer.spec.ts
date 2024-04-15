import { shallowMount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DialogContainer from '../DialogContainer.vue'
import { useRootStore } from '@/store/root'
import { ViewType } from '@/types/enums/ViewType'

setActivePinia(createPinia())

describe('Dialog Container', () => {
  let wrapper: VueWrapper<typeof DialogContainer>
  let store: ReturnType<typeof useRootStore>

  const title = 'Dialog Test'
  const dialogType = ViewType.Preferences

  beforeEach(() => {
    store = useRootStore()
    wrapper = shallowMount(DialogContainer, {
      props: {
        title,
        dialogType
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    store.$reset()
  })

  it('should match the snapshot', () => {
    expect(wrapper.html()).toMatchSnapshot()
  })

  describe('when the dialog is opened', () => {
    beforeEach(() => {
      store.$patch({
        dialogType
      })
    })

    it('should open the modal', () => {
      expect(wrapper.findComponent({ name: 'Modal' }).props()).toEqual(expect.objectContaining({
        modelValue: true
      }))
    })

    it('should close the modal when the dialog type changes', async () => {
      store.$patch({
        dialogType: ViewType.None
      })
      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent({ name: 'Modal' }).props()).toEqual(expect.objectContaining({
        modelValue: false
      }))

      store.$patch({
        dialogType: ViewType.Preferences
      })
      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent({ name: 'Modal' }).props()).toEqual(expect.objectContaining({
        modelValue: true
      }))
    })

    it('should close the modal when the modal itself requests it', async () => {
      const modal = wrapper.findComponent({ name: 'Modal' })

      await modal.vm.$emit('update:modelValue', false)
      await wrapper.vm.$nextTick()

      expect(modal.props()).toEqual(expect.objectContaining({
        modelValue: false
      }))
    })

    it('should kill the modal element when the root store closes it', async () => {
      store.closeDialog!()

      await wrapper.vm.$nextTick()

      expect(wrapper.findComponent({ name: 'Modal' }).exists()).toBe(false)
    })
  })

  describe('when the dialog is closing', () => {
    it('should invoke onBeforeClose() before closing the dialog', async () => {
      store.$patch({
        dialogType: ViewType.Preferences
      })

      const onBeforeClose = jest.fn()
      await wrapper.setProps({
        title,
        dialogType,
        onBeforeClose
      })
      const modal = wrapper.findComponent({ name: 'Modal' })
      await modal.vm.$emit('update:modelValue', false)

      expect(onBeforeClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the dialog is closed', () => {
    it('should not open the dialog even if the modal itself requests it', async () => {
      store.$patch({
        dialogType: ViewType.None
      })

      const modal = wrapper.findComponent({ name: 'Modal' })

      await modal.vm.$emit('update:modelValue', true)
      await wrapper.vm.$nextTick()

      expect(modal.props()).toEqual(expect.objectContaining({
        modelValue: false
      }))
    })
  })
})
