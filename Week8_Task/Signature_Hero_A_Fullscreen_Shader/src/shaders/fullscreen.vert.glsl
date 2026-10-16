// One big triangle that covers the whole screen (cheaper than two
// triangles: no seam down the diagonal). All the real work is in the
// fragment shader; this just tells the GPU "run it for every pixel".
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
