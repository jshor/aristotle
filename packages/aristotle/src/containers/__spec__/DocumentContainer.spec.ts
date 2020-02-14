import { createLocalVue, shallowMount } from '@vue/test-utils'
import { ICommand } from '@aristotle/editor'
import Vuex from 'vuex'
import DocumentContainer from '../DocumentContainer.vue'
import data from '../../mocks/document.json'

const localVue = createLocalVue()

localVue.use(Vuex)

jest.mock('@aristotle/editor', () => {
  class Editor {
    load = jest.fn()
    on = jest.fn()
    getEditorModel = jest.fn()
    applyCommand = jest.fn()
  }

  return { Editor }
})

describe('Document Container', () => {
  const documentId = 'test123'
  let wrapper, state

  const createWrapper = () => {
    state = {
      activeDocumentId: documentId
    }

    return shallowMount(DocumentContainer, {
      propsData: {
        document: {
          id: documentId,
          data,
          editorModel: {}
        }
      },
      localVue,
      store: new Vuex.Store({
        state,
        actions: {
          relayCommand: jest.fn()
        }
      })
    })
  }

  beforeEach(() => {
    wrapper = createWrapper()
  })

  // it('should match the snapshot', () => {
  //   expect(wrapper.html()).toMatchSnapshot()
  // })

  describe('applyCommand()', () => {
    const command: ICommand = {
      type: 'TestCommand',
      payload: null
    }

    // it('should call `applyCommand()` when the `relayedCommand` property changes', () => {
    //   jest.spyOn(wrapper.vm.editor, 'applyCommand')

    //   state.relayedCommand = null
    //   state.relayedCommand = {
    //     ...command,
    //     documentId
    //   }

    //   expect.assertions(1)
    //   Vue.nextTick(() => {
    //     expect(wrapper.vm.editor.applyCommand).toHaveBeenCalledTimes(1)
    //   })
    // })

    it('should send the command to the editor if the document is active', () => {
      jest.spyOn(wrapper.vm.editor, 'applyCommand')

      wrapper.vm.applyCommand(command)

      expect(wrapper.vm.editor.applyCommand).toHaveBeenCalledTimes(1)
      expect(wrapper.vm.editor.applyCommand).toHaveBeenCalledWith(command)
    })

    it('should not send the command to the editor if the document is inactive', () => {
      state.activeDocumentId = 'unknown-id'

      jest.spyOn(wrapper.vm.editor, 'applyCommand')

      wrapper.vm.applyCommand(command)

      expect(wrapper.vm.editor.applyCommand).not.toHaveBeenCalled()
    })
  })

  describe('setActivity()', () => {
    describe('when the document is active', () => {
      beforeEach(() => {
        jest.spyOn(wrapper.vm, 'relayCommand')
      })

      it('should pass the SET_ACTIVITY command with true if the document is focused', () => {
        jest
          .spyOn(document, 'hasFocus')
          .mockReturnValue(true)

        wrapper.vm.setActivity()

        expect(wrapper.vm.relayCommand).toHaveBeenCalledTimes(1)
      })

      it('should pass the SET_ACTIVITY command with true if the document is focused', () => {
        jest
          .spyOn(document, 'hasFocus')
          .mockReturnValue(false)

        wrapper.vm.setActivity()

        expect(wrapper.vm.relayCommand).toHaveBeenCalledTimes(1)
      })
    })

    describe('when the document is inactive', () => {
      it('should pass the SetActivity command with false', () => {
        state.activeDocumentId = 'unknown-id'

        jest
          .spyOn(document, 'hasFocus')
          .mockReturnValue(true)
        jest
          .spyOn(wrapper.vm, 'relayCommand')

        wrapper.vm.setActivity()

        expect(wrapper.vm.relayCommand).toHaveBeenCalledTimes(1)
        expect(wrapper.vm.relayCommand).toHaveBeenCalledWith({
          type: 'SetActivity',
          payload: false,
          documentId: wrapper.vm.document.id
        })
      })
    })
  })
})
