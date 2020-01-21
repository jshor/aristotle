import $ from 'jquery'

export default function addTouchEvents (figure) {
  for (let key in figure.shape) {
    const element = figure.shape[key]
    // if (element !== null && !element.toString().includes('function')) console.log('shape: ', element.toString())

    if (element !== null && element.toString().includes('SVG')) {
      $(element).unbind('touchstart')
      $(element).on('touchstart', () => {
        figure.fireEvent('click')
      })
    }
  }
}
