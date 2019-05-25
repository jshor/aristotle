import $ from 'jquery'

export default function addTouchEvents (figure) {
  for (let key in figure.shape) {
    const element = figure.shape[key]


    if (element !== null && element.toString().includes('SVG')) {
      // console.log('FOUND', element.toString(), element)
      $(element).unbind('click touchstart')
      $(element).on('click touchstart', () => {
        console.log('CLIEKED', figure)
        figure.fireEvent('click')
      })
    }
  }
}