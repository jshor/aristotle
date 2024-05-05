import { createPinia, setActivePinia } from 'pinia'
import { createDocumentStore } from '@/store/document'
import { buildMenu } from '@/menus/__tests__/utils.helper'
import { createEditSubmenu } from '../../submenus/edit'
import { createEditorContextMenu } from '../editor'

setActivePinia(createPinia())

vi.mock('@/menus/submenus/edit', () => ({
  createEditSubmenu: () => [{ label: 'Edit submenu stub' }]
}))

describe('Oscilloscope context menu', () => {
  it('should join the edit and grid submenus, separated by a separator', () => {
    const useDocumentStore = createDocumentStore('test-document')
    const menu = buildMenu(createEditorContextMenu(useDocumentStore))
    const editSubmenu = buildMenu(createEditSubmenu(useDocumentStore))

    expect(menu).toEqual(expect.arrayContaining(editSubmenu))
  })
})
