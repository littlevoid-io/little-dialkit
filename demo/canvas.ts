const BAR = 40;

function draw(gl: WebGL2RenderingContext, time: number): void {
  const { width, height } = gl.canvas;
  gl.disable(gl.SCISSOR_TEST);
  gl.clearColor(0.05, 0.05, 0.08, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor((time / 5) % width, 0, BAR, height);
  gl.clearColor(1, 0.53, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  requestAnimationFrame((next) => draw(gl, next));
}

/** Draws a bar crossing a WebGL canvas, every frame, without `preserveDrawingBuffer`: the case the capture buttons have to cover. */
export function animate(canvas: HTMLCanvasElement): void {
  const gl = canvas.getContext('webgl2');
  if (!gl) throw new Error('The demo canvas needs WebGL 2');
  requestAnimationFrame((time) => draw(gl, time));
}
