type PropertyBase<T> = {
  label: string
  description?: string
  options?: {
    [text: string]: T
  }
  mobileOnly?: boolean
  desktopOnly?: boolean
  disabled?: boolean
  excludes?: string[]
}

/** A numeric property. */
type NumericProperty = {
  /** A nnnnn or a color. */
  type: 'number'
  value: number
  min?: number
  max?: number
} & PropertyBase<number>

/** A string property. */
type StringProperty = {
  /** A text or a color. */
  type: 'text' | 'color'
  value: string
} & PropertyBase<string>

/** A boolean property. */
type BooleanProperty = {
  type: 'boolean'
  value: boolean
} & PropertyBase<boolean>

type Property = NumericProperty | StringProperty | BooleanProperty

export default Property
