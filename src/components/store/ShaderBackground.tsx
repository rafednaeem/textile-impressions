"use client"

import { useEffect, useRef } from "react"

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0) )
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 a0 = x - floor(x + 0.5);
  vec3 m0 = 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m * g, m0);
}

float fbm(vec2 uv) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
        total += amplitude * snoise(uv);
        uv *= 2.0;
        amplitude *= 0.5;
    }
    return total;
}

void main() {
    vec2 uv = v_texCoord;
    vec2 p = uv * 2.5;

    float t = u_time * 0.12;

    vec2 q = vec2(0.0);
    q.x = fbm(p + vec2(t, t * 0.4));
    q.y = fbm(p + vec2(1.0));

    vec2 r = vec2(0.0);
    r.x = fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * t);
    r.y = fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.126 * t);

    float f = fbm(p + 4.0 * r);

    vec3 pink = vec3(0.925, 0.282, 0.6);
    vec3 cyan = vec3(0.024, 0.714, 0.831);
    vec3 gold = vec3(0.851, 0.467, 0.024);
    vec3 bg = vec3(0.988, 0.973, 0.992);

    float tr = smoothstep(0.4, 0.8, 1.0 - distance(uv, vec2(0.8, 0.8)));
    float bl = smoothstep(0.4, 0.8, 1.0 - distance(uv, vec2(0.2, 0.2)));

    float cloud = f * f * f + 0.6 * f * f + 0.5 * f;
    cloud = clamp(cloud, 0.0, 1.0);

    float mask = smoothstep(0.1, 0.5, tr + bl * 0.8);
    cloud *= mask;

    vec3 color = bg;
    color = mix(color, pink, cloud * tr);
    color = mix(color, cyan, cloud * bl);
    color = mix(color, gold, cloud * f * 0.4);
    color = mix(bg, color, 0.85);

    gl_FragColor = vec4(color, 1.0);
}
`

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const canvasEl = canvas

    const gl =
      canvasEl.getContext("webgl") || canvasEl.getContext("experimental-webgl")
    if (!gl || !(gl instanceof WebGLRenderingContext)) return

    const glContext = gl

    function compileShader(type: number, source: string) {
      const shader = glContext.createShader(type)
      if (!shader) return null
      glContext.shaderSource(shader, source)
      glContext.compileShader(shader)
      if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
        console.error("Shader compile error:", glContext.getShaderInfoLog(shader))
        glContext.deleteShader(shader)
        return null
      }
      return shader
    }

    const vs = compileShader(glContext.VERTEX_SHADER, VERTEX_SHADER)
    const fs = compileShader(glContext.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vs || !fs) return

    const program = glContext.createProgram()
    if (!program) return
    glContext.attachShader(program, vs)
    glContext.attachShader(program, fs)
    glContext.linkProgram(program)
    if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
      console.error("Program link error:", glContext.getProgramInfoLog(program))
      return
    }
    glContext.useProgram(program)

    const buffer = glContext.createBuffer()
    glContext.bindBuffer(glContext.ARRAY_BUFFER, buffer)
    glContext.bufferData(
      glContext.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      glContext.STATIC_DRAW
    )

    const positionLocation = glContext.getAttribLocation(program, "a_position")
    glContext.enableVertexAttribArray(positionLocation)
    glContext.vertexAttribPointer(positionLocation, 2, glContext.FLOAT, false, 0, 0)

    const uTime = glContext.getUniformLocation(program, "u_time")
    const uRes = glContext.getUniformLocation(program, "u_resolution")
    const uMouse = glContext.getUniformLocation(program, "u_mouse")

    function syncSize() {
      const w = canvasEl.clientWidth || 1280
      const h = canvasEl.clientHeight || 720
      if (canvasEl.width !== w || canvasEl.height !== h) {
        canvasEl.width = w
        canvasEl.height = h
      }
    }

    syncSize()
    const resizeObserver = new ResizeObserver(syncSize)
    resizeObserver.observe(canvasEl)

    const mouse = { x: canvasEl.width / 2, y: canvasEl.height / 2 }
    function handleMouseMove(event: MouseEvent) {
      const rect = canvasEl.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width
        const ny = 1 - (event.clientY - rect.top) / rect.height
        mouse.x = nx * canvasEl.width
        mouse.y = ny * canvasEl.height
      }
    }
    window.addEventListener("mousemove", handleMouseMove)

    let animationId = 0
    function render(time: number) {
      syncSize()
      glContext.viewport(0, 0, canvasEl.width, canvasEl.height)
      if (uTime) glContext.uniform1f(uTime, time * 0.001)
      if (uRes) glContext.uniform2f(uRes, canvasEl.width, canvasEl.height)
      if (uMouse) glContext.uniform2f(uMouse, mouse.x, mouse.y)
      glContext.drawArrays(glContext.TRIANGLE_STRIP, 0, 4)
      animationId = requestAnimationFrame(render)
    }
    animationId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      window.removeEventListener("mousemove", handleMouseMove)
      glContext.deleteProgram(program)
      glContext.deleteShader(vs)
      glContext.deleteShader(fs)
      glContext.deleteBuffer(buffer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{ display: "block" }}
    />
  )
}
