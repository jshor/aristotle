import Point from './Point'

interface Pulse {
  id: string
  update: (elapsed: number) => void
  reset: (elapsed: number) => void
  segments?: Point[]
  width?: number
  hue?: number
}

export default Pulse
