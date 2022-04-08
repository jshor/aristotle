import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createDocumentStore } from '../../store/document'
import Item from '../Item.vue'

describe('Item.vue', () => {
  it('renders props.msg when passed', () => {
    const store = createDocumentStore('document')
    const wrapper = mount(Item, {
      global: {
        plugins: [createTestingPinia()],
      },
      props: {
        store
      }
    })

    expect(wrapper).toMatchSnapshot()
  })
})
