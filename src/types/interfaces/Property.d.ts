declare global {
  enum PropertyType {
    number = 'number',
    text = 'text',
    boolean = 'boolean'
  }

  interface Property {
    label: string
    type: 'number' | 'text' | 'boolean' | string
    value: number | string | boolean
    min?: number
    max?: number
    options?: {
      [text: string]: number | string | boolean
    }
  }
}

export default Property
