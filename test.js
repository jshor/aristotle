let items = [
  {
      "id": "a",
      "zIndex": 0,
      "selected": false
  },
  {
      "id": "b",
      "zIndex": 1,
      "selected": false
  },
  {
      "id": "c",
      "zIndex": 2,
      "selected": false
  },
  {
      "id": "d",
      "zIndex": 3,
      "selected": false
  },
  {
      "id": "e",
      "zIndex": 4,
      "selected": false
  },
  {
      "id": "f",
      "zIndex": 5,
      "selected": false
  },
  {
      "id": "g",
      "zIndex": 6,
      "selected": false
  },
  {
      "id": "h",
      "zIndex": 7,
      "selected": false
  }
]

function log (text, state) {
  console.log(text, state.map(({ id, zIndex }) => `${id} (${zIndex})`))
}

function sort (a, b) {
  if (a.zIndex > b.zIndex) return 1
  else if (a.zIndex < b.zIndex) return -1
  return 0
}

function setZIndex (state, direction, selectedIds) {
  state.sort(sort)
  state.forEach(item => {
    if (selectedIds.includes(item.id)) {
      item.zIndex += (direction * 0.5)
    }
  })
  state.sort(sort)
  // state.forEach((item, index) => {
  //   item.zIndex = index
  // })

  return state
}

log('before', items)

items = setZIndex(items, -1, ['f', 'c'])

log('after', items)

items = setZIndex(items, -1, ['f', 'c'])

log('after 2', items)
