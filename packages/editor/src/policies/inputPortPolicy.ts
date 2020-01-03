import draw2d from 'draw2d'

const inputPortPolicy = new draw2d.policy.port.PortFeedbackPolicy();

inputPortPolicy.onDragStart = function(canvas, figure, mouseX, mouseY, shiftKey, ctrlKey) {
  if (figure.connections.data.length) {
    return false
  }
  return draw2d.policy.port.PortFeedbackPolicy.prototype.onDragStart.call(this, canvas, figure, mouseX, mouseY, shiftKey, ctrlKey);
};

export default inputPortPolicy