// import draw2d from 'draw2d'

// // gate svg imports
// import svgAnd from '@/assets/logical-and.svg'
// import svgNand from '@/assets/logical-nand.svg'
// import svgXnor from '@/assets/logical-xnor.svg'
// import svgOr from '@/assets/logical-or.svg'

// const Gates = {
//     AND: 'AND',
//     NAND: 'NAND',
//     OR: 'OR',
//     NOR: 'NOR',
//     XOR: 'XOR',
//     XNOR: 'XNOR'
// }

// const logicGates = {
//     [Gates.AND]: {
//         width: 97,
//         height: 52,
//         svg: svgAnd
//     },
//     [Gates.NAND]: {
//         width: 105,
//         height: 52,
//         svg: svgNand
//     },
//     [Gates.XNOR]: {
//         width: 116,
//         height: 52,
//         svg: svgXnor
//     },
//     [Gates.OR]: {
//         width: 108,
//         height: 52,
//         svg: svgOr
//     }
// }

// class Gate extends draw2d.shape.basic.Image {
//     constructor (gateType) {
//         super({
//             path: logicGates[Gates[gateType]].svg,
//             resizeable: false,
//             width: logicGates[Gates[gateType]].width,
//             height: logicGates[Gates[gateType]].height,
//         })

//         this.assignInputPort(13)
//         this.assignInputPort(38)
//         this.assignOutputPort()
//         this.on('click', this.click)
//     }

//     assignInputPort = (yValue) => {
//         this.createPort('input', new draw2d.layout.locator.XYAbsPortLocator(0, yValue))
//     }

//     assignOutputPort = () => {
//         this.createPort('output', new draw2d.layout.locator.RightLocator({}))
//     }

//     setOutputConnectionColor = (color) => {
//         this
//             .getConnections()
//             .data
//             .filter((connection) => connection.getSource().parent === this)
//             .forEach((connection) => connection.setColor(color))
//     }

//     click = () => {
//         this.setOutputConnectionColor('#0000ff')
//     }
// }

// export default Gate
