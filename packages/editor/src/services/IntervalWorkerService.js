
export default class IntervalWorkerService {
  constructor () {
    this.callbacks = []
    this.registerServiceWorker()
  }

  registerServiceWorker = () => {
    const script = `
      let interval, i = 0

      function clear () {
        if (interval) clearInterval(interval)
      }

      self.onmessage = ({ data }) => {
        switch (data) {
          case 'START':
            clear()
            interval = setInterval(function(e) {
              self.postMessage(++i);
            })
            break
          case 'STOP':
          default:
            clear()
            break
        }
      }
    `
    const blob = new Blob([script], {
      type: 'text/javascript'
    })

    this.worker = new Worker(window.URL.createObjectURL(blob))
    this.worker.onmessage = this.onMessage.bind(this)
  }

  start = () => {
    this.worker.postMessage('START')
  }

  stop = () => {
    this.worker.postMessage('STOP')
  }

  onMessage = () => {
    this.callbacks.forEach((callback) => callback())
  }

  onTick = (callback) => {
    this.callbacks.push(callback)
  }
}