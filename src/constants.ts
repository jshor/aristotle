/** Minimum zoom percentage. */
export const MIN_ZOOM = 0.1

/** Maximum zoom percentage. */
export const MAX_ZOOM = 2

/** The incremental percentage amount per zoom operation. */
export const ZOOM_STEP = 0.1

/** The frictional coefficient for animated panning movements. */
export const PANNING_FRICTION = 4

/** The speed scalar for animated panning movements using momentum. */
export const PANNING_SPEED = 15

/** The amount of padding, in pixels, for an exported image. */
export const IMAGE_PADDING = 20

/** The amount of momentum to build with each key press while moving an object using arrow keys. */
export const ARROW_KEY_MOMENTUM_MULTIPLIER = 1.05

/** The amount of time, in milliseconds, that the user must be touching something before emitting a `touchhold` event. */
export const TOUCH_HOLD_TIMEOUT = 100

/**
 * The minimum CSS z-index value to apply to all items.
 * This high number is to ensure that all items visually overlap all wires.
 */
export const ITEM_BASE_Z_INDEX = 1000

/** The easing function for each animation frame to ease out after panning. */
export const PANNING_EASING_FUNCTION = (x: number) => 1 - Math.pow(1 - x, 3)
