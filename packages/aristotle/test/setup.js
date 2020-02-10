// https://github.com/kutlugsahin/smooth-dnd/issues/36
Object.defineProperty(global, 'Node', {
  value: {
    firstElementChild: 'firstElementChild'
  }
})
