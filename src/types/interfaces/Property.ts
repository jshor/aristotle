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
type NumericProperty<T> = {
  /** A nnnnn or a color. */
  type: 'number'
  value: T
  min?: number
  max?: number
} & PropertyBase<T>

/** A string property. */
type StringProperty<T> = {
  /** A text or a color. */
  type: 'text' | 'color'
  value: T
} & PropertyBase<T>

/** A boolean property. */
type BooleanProperty<T> = {
  type: 'boolean'
  value: T
} & PropertyBase<T>

type Property<T> = NumericProperty<T> | StringProperty<T> | BooleanProperty<T>

export default Property
