declare global {
  enum PropertyType {
    number = 'number',
    text = 'text',
    boolean = 'boolean'
  }

  interface Property {
    label: string
    type: 'number' | 'text' | 'boolean' | 'color'
    value: number | string | boolean
    min?: number
    max?: number
    description?: string
    options?: {
      [text: string]: number | string | boolean
    }
    mobileOnly?: boolean
    desktopOnly?: boolean
    disabled?: boolean
    excludes?: string[]
  }
}

export default Property
