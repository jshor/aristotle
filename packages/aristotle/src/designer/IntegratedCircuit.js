import draw2d from 'draw2d'
import { ic } from '@aristotle/logic-gates'

class IntegratedCircuit extends draw2d.shape.basic.Image {
    constructor () {
        super({
            path: ic,
            resizeable: false,
            width: 200,
            height: 200,
        })

        this.assignInputPort(13)
        this.assignInputPort(38)
        this.assignOutputPort()
        this.on('click', this.click)
    }

    assignInputPort = (yValue) => {
        this.createPort('input', new draw2d.layout.locator.XYAbsPortLocator(0, yValue))
    }

    assignOutputPort = () => {
        this.createPort('output', new draw2d.layout.locator.RightLocator({}))
    }

    setOutputConnectionColor = (color) => {
        this
            .getConnections()
            .data
            .filter((connection) => connection.getSource().parent === this)
            .forEach((connection) => connection.setColor(color))
    }

    click = () => {
        this.setOutputConnectionColor('#0000ff')
    }
}

export default IntegratedCircuit