import { mount, VueWrapper } from '@vue/test-utils'
import Modal from '../Modal.vue'

describe('Item Properties', () => {
  let wrapper: VueWrapper<typeof Modal>

  beforeEach(() => {
    wrapper = mount(Modal, {
      props: {
        modelValue: false
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should match the snapshot', async () => {
    expect(mount(Modal, {
      props: {
        title: 'Modal Title',
        modelValue: true
      },
      slots: {
        buttons: '<button>Close</button>',
        default: '<strong>Content</strong>'
      }
    }).html()).toMatchSnapshot()
  })

  it('should open the modal when the model value is true', async () => {
    await wrapper.setProps({ modelValue: true })
    await wrapper.vm.$nextTick()

    expect(wrapper.get({ ref: 'modalRef' })).toBeTruthy()
  })

  it('should close the modal when the escape key is hit', async () => {
    await wrapper.setProps({ modelValue: true })
    await wrapper.vm.$nextTick()
    await wrapper
      .find({ ref: 'modalRef' })
      .trigger('keydown', { key: 'Escape' })

    await wrapper.vm.$nextTick()

    expect(wrapper.emitted()).toHaveProperty('update:modelValue')
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual([false])
  })

  it('should close the modal when the X button is clicked', async () => {
    await wrapper.setProps({ modelValue: true })
    await wrapper.vm.$nextTick()
    await wrapper
      .find('.modal__close')
      .trigger('click')

    await wrapper.vm.$nextTick()

    expect(wrapper.emitted()).toHaveProperty('update:modelValue')
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual([false])
  })

  it('should apply the focus back into the dialog when the focus-end element is focused into', async () => {
    await wrapper.setProps({ modelValue: true })
    await wrapper.vm.$nextTick()

    const focusEndElement = wrapper.find('[data-test="focus-end"]')

    await focusEndElement.trigger('focus')
    await wrapper.vm.$nextTick()

    expect(document.activeElement).not.toBe(focusEndElement)
  })
})
