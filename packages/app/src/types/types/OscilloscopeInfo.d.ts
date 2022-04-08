declare global {
  type OscilloscopeInfo = {
    waves: WaveList
    secondsElapsed: number
    secondsOffset: number
  }
}

export default OscilloscopeInfo
