export default interface IElementProperties {
  [key: string]: {
    type: 'number' | 'text' | 'select' | 'checkbox',
    step?: number,
    min?: number,
    max?: number,
    value: number | string,
    options?: {
      [key: string]: any
    },
    onUpdate?: () => void
  }
}
