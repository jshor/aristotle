import SerializationService from './SerializationService'
import draw2d from 'draw2d'

class ClipboardService {
  constructor (canvas) {
    this.canvas = canvas
    this.clipboardData = null
  }

  
  getCurrentState = () => {
    return JSON.stringify(SerializationService.serialize(this.canvas))
  }

  setCurrentState = (data) => {
    console.log('data: ', data)
    // this.canvas.clear()
    this.deleteAll()
    SerializationService.deserialize(this.canvas, JSON.parse(data))
  }

  getSelectedFigures = () => {
    const selection = []

    this
      .canvas
      .getFigures()
      .each((i, figure) => {
        if (figure.isSelected()) {
          selection.push(figure)
        }
      })
    
    return selection
  }

  deleteAll = () => {
    this.canvas.lines.clone().each((i,e) => {
      this.canvas.remove(e);
    });
    
     this.canvas.figures.clone().each((i,e) => {
        this.canvas.remove(e);
    });
    
    this.canvas.selection.clear();
    this.canvas.currentDropTarget = null;

    // internal document with all figures, ports, ....
    //
    this.canvas.figures = new draw2d.util.ArrayList();
    this.canvas.lines = new draw2d.util.ArrayList();
    this.canvas.commonPorts = new draw2d.util.ArrayList();
    this.canvas.dropTargets = new draw2d.util.ArrayList();
   
    // this.commandStack.markSaveLocation();
    
    // INTERSECTION/CROSSING handling for connections and lines
    //
    this.canvas.linesToRepaintAfterDragDrop =  new draw2d.util.ArrayList();
    this.canvas.lineIntersections = new draw2d.util.ArrayList();
  }

  deleteOne = (figure) => {
    figure
      .getConnections()
      .each((i, connection) => this.canvas.remove(connection))
    this.canvas.remove(figure)
  }

  deleteSelection = () => {
    this
      .getSelectedFigures()
      .forEach(this.deleteOne)
  }

  getSerializedSelection = () => {
    const selected = this.getSelectedFigures()
    const elements = SerializationService.serialize(this.canvas, selected)

    return btoa(JSON.stringify(elements))
  }

  setDeserializedSelection = (data) => {
    try {
      const parsedData = JSON.parse(atob(data))

      SerializationService.deserialize(this.canvas, parsedData)
    } catch (error) {
      console.log('Failed to deserialize', error)
    }
  }
}

export default ClipboardService