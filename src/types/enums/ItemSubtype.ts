enum ItemSubtype {
  None = 'None',

  CustomCircuit = 'CustomCircuit',

  /* input nodes */
  Switch = 'Switch',
  PushButton = 'PushButton',
  Clock = 'Clock',

  /* output nodes */
  Lightbulb = 'Lightbulb',
  DigitDisplay = 'DigitDisplay',

  /* buffers */
  Buffer = 'Buffer',
  Not = 'Not',

  /* tri-state */
  Tristate = 'Tristate',

  /* logic gates */
  And = 'And',
  Or = 'Or',
  Nand = 'Nand',
  Nor = 'Nor',
  Xnor = 'Xnor',
  Xor = 'Xor'
}

export default ItemSubtype
