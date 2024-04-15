import { mount, VueWrapper } from '@vue/test-utils'
import PropertyForm from '../PropertyForm.vue'
import Property from '@/types/interfaces/Property'

describe('Properties Form', () => {
  let wrapper: VueWrapper
  let model: Record<string, Property<string | boolean | number>>

  beforeEach(() => {
    model = {
      name: {
        label: 'Name',
        type: 'text',
        value: 'My Property',
        description: 'A basic text input.'
      },
      count: {
        label: 'Count',
        type: 'number',
        value: 10,
        description: 'A basic numeric input.',
        min: 1,
        max: 50
      },
      switch1: {
        label: 'Switch 1',
        type: 'boolean',
        value: false,
        description: 'A basic switch.',
        excludes: ['switch2']
      },
      switch2: {
        label: 'Switch 2',
        type: 'boolean',
        value: true
      },
      options: {
        label: 'Select an option',
        type: 'text',
        value: 'option1',
        description: 'An option applies.',
        options: {
          'Option 1': 'option1',
          'Option 2': 'option2'
        }
      }
    }

    wrapper = mount(PropertyForm, {
      props: {
        modelValue: model
      }
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should match the snapshot', () => {
    expect(wrapper.element).toMatchSnapshot()
  })

  it('should render when no properties are provided', async () => {
    await wrapper.setProps({
      modelValue: undefined
    })

    expect(wrapper.html()).toMatchSnapshot()
  })

  it('should prefix property IDs with the prop ID', async () => {
    await wrapper.setProps({
      modelValue: model,
      id: 'prop'
    })

    expect(wrapper.find('input').attributes('id')).toBe('prop_name')
  })

  it('should show the label as disabled when the property is disabled', async () => {
    await wrapper.setProps({
      modelValue: Object
        .keys(model)
        .reduce((m, key) => ({
          ...m,
          [key]: {
            ...model[key],
            disabled: true
          }
        }), {})
    })

    wrapper.findAll('[data-test="label"]').forEach(label => {
      expect(label.classes()).toContain('property-form__label--disabled')
    })
  })

  describe('when the text input is changed', () => {
    it('should update the model with the valid input', async () => {
      await wrapper
        .find('input[type="text"]')
        .setValue('some value')

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([expect.objectContaining({
        name: expect.objectContaining({
          value: 'some value'
        })
      })])
    })

    it('should reset the value of the text when it is entered as blank', async () => {
      await wrapper
        .find('input[type="text"]')
        .setValue('')

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([expect.objectContaining({
        name: expect.objectContaining({
          value: 'My Property'
        })
      })])
    })

    it('should reset the value of a number that exceeds the max', async () => {
      await wrapper
        .find('input[type="number"]')
        .setValue(60)

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([expect.objectContaining({
        count: expect.objectContaining({
          value: 10
        })
      })])
    })
  })

  describe('when the number input is updated', () => {
    it('should update the valid value of the input number', async () => {
      await wrapper
        .find('input[type="number"]')
        .setValue(20)

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([expect.objectContaining({
        count: expect.objectContaining({
          value: 20
        })
      })])
    })

    it('should reset the value of a number that is less than the min', async () => {
      await wrapper
        .find('input[type="number"]')
        .setValue(-20)

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([expect.objectContaining({
        count: expect.objectContaining({
          value: 10
        })
      })])
    })

    it('should reset the value of a number that exceeds the max', async () => {
      await wrapper
        .find('input[type="number"]')
        .setValue(60)

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([expect.objectContaining({
        count: expect.objectContaining({
          value: 10
        })
      })])
    })
  })

  describe('when a switch is toggled', () => {
    it('should update the value', async () => {
      await wrapper
        .findComponent({ name: 'PropertySwitch' })
        .vm
        .$emit('update:modelValue', true)

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([expect.objectContaining({
        switch1: expect.objectContaining({
          value: true
        })
      })])
    })

    it('should turn off an excluded switch', async () => {
      await wrapper
        .findComponent({ name: 'PropertySwitch' })
        .vm
        .$emit('update:modelValue', true)

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([expect.objectContaining({
        switch1: expect.objectContaining({
          value: true
        }),
        switch2: expect.objectContaining({
          value: false
        })
      })])
    })

    it('should never turn on an excluded switch', async () => {
      await wrapper.setProps({
        switch1: {
          ...model.switch1,
          value: true
        }
      })
      await wrapper
        .findComponent({ name: 'PropertySwitch' })
        .vm
        .$emit('update:modelValue', true)

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([expect.objectContaining({
        switch2: expect.objectContaining({
          value: false
        })
      })])
    })
  })

  describe('when a selection option is changed', () => {
    it('should update the value', async () => {
      await wrapper
        .find('select')
        .setValue('option2')

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted()['update:modelValue'][0]).toEqual([expect.objectContaining({
        options: expect.objectContaining({
          value: 'option2'
        })
      })])
    })
  })

  describe('when in desktop mode', () => {
    it('should not show a property that is mobile-only', async () => {
      await wrapper.setProps({
        modelValue: {
          name: {
            ...model.name,
            mobileOnly: true
          }
        }
      })

      expect(wrapper.find('input').exists()).toBe(false)
    })
  })
})
