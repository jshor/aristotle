declare global {
  type MenuEntry = {
    label?: string
    sublabel?: string
    accelerator?: string
    checked?: boolean
    enabled?: boolean
    type?: string
    role?: string
    click?: () => void
    submenu?: MenuEntry[]
  }
}

export default MenuEntry
