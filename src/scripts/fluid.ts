// A small GPU fluid simulation (stable fluids, after Jos Stam / Pavel Dobryakov),
// re-tuned for a light, paper-coloured page: the mouse stirs pastel pigment into
// the paper and bends a faint dot grid, like looking through moving water.

export type FluidMode = "full" | "soft" | "subtle";

const MODES: Record<FluidMode, { dye: number; grid: number; warp: number; force: number }> = {
  full: { dye: 0.95, grid: 1, warp: 1, force: 1 },
  soft: { dye: 0.65, grid: 0.8, warp: 0.85, force: 0.8 },
  subtle: { dye: 0.38, grid: 0.55, warp: 0.6, force: 0.6 },
};

// Iridescent pastel pigments: lilac, peach, aqua, rose, butter.
const PALETTE: [number, number, number][] = [
  [0.62, 0.52, 1.0],
  [1.0, 0.66, 0.5],
  [0.42, 0.85, 0.82],
  [0.98, 0.56, 0.74],
  [1.0, 0.85, 0.48],
];

const cfg = {
  SIM_RES: 128,
  DYE_RES: 768,
  DENSITY_DISSIPATION: 0.9,
  VELOCITY_DISSIPATION: 0.45,
  PRESSURE: 0.8,
  PRESSURE_ITERATIONS: 20,
  CURL: 18,
  SPLAT_RADIUS: 0.22,
  SPLAT_FORCE: 5200,
};

type GL = WebGLRenderingContext | WebGL2RenderingContext;
type FBO = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number; tx: number; ty: number; attach(id: number): number };
type DoubleFBO = { w: number; h: number; tx: number; ty: number; read: FBO; write: FBO; swap(): void };

const baseVS = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv, vL, vR, vT, vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FS = {
  clear: `precision mediump float; varying highp vec2 vUv; uniform sampler2D uTexture; uniform float value;
    void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`,
  splat: `precision highp float; varying vec2 vUv; uniform sampler2D uTarget; uniform float aspectRatio;
    uniform vec3 color; uniform vec2 point; uniform float radius;
    void main () { vec2 p = vUv - point.xy; p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0); }`,
  advection: `precision highp float; varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource;
    uniform vec2 texelSize; uniform float dt; uniform float dissipation;
    void main () { vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      gl_FragColor = texture2D(uSource, coord) / (1.0 + dissipation * dt); }`,
  divergence: `precision mediump float; varying highp vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uVelocity, vL).x; float R = texture2D(uVelocity, vR).x;
      float T = texture2D(uVelocity, vT).y; float B = texture2D(uVelocity, vB).y;
      vec2 C = texture2D(uVelocity, vUv).xy;
      if (vL.x < 0.0) { L = -C.x; } if (vR.x > 1.0) { R = -C.x; }
      if (vT.y > 1.0) { T = -C.y; } if (vB.y < 0.0) { B = -C.y; }
      gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0); }`,
  curl: `precision mediump float; varying highp vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uVelocity, vL).y; float R = texture2D(uVelocity, vR).y;
      float T = texture2D(uVelocity, vT).x; float B = texture2D(uVelocity, vB).x;
      gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0); }`,
  vorticity: `precision highp float; varying vec2 vUv, vL, vR, vT, vB; uniform sampler2D uVelocity; uniform sampler2D uCurl;
    uniform float curl; uniform float dt;
    void main () {
      float L = texture2D(uCurl, vL).x; float R = texture2D(uCurl, vR).x;
      float T = texture2D(uCurl, vT).x; float B = texture2D(uCurl, vB).x; float C = texture2D(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001; force *= curl * C; force.y *= -1.0;
      vec2 v = texture2D(uVelocity, vUv).xy + force * dt;
      gl_FragColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0); }`,
  pressure: `precision mediump float; varying highp vec2 vUv, vL, vR, vT, vB; uniform sampler2D uPressure; uniform sampler2D uDivergence;
    void main () {
      float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;
      float div = texture2D(uDivergence, vUv).x;
      gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0); }`,
  gradient: `precision mediump float; varying highp vec2 vUv, vL, vR, vT, vB; uniform sampler2D uPressure; uniform sampler2D uVelocity;
    void main () {
      float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;
      vec2 v = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
      gl_FragColor = vec4(v, 0.0, 1.0); }`,
  // Light-page compositing: pigment over paper, a warped dot grid, a soft sheen.
  display: `precision highp float; varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uTexture; uniform sampler2D uVelocity;
    uniform vec3 uPaper; uniform vec3 uInk;
    uniform float uDye; uniform float uGrid; uniform float uWarp; uniform float uDpr;
    void main () {
      vec3 dye = texture2D(uTexture, vUv).rgb;
      float amt = max(dye.r, max(dye.g, dye.b));
      vec3 pigment = dye / max(amt, 0.0001);
      float a = (1.0 - exp(-amt * 2.2)) * uDye;

      // lighting from the dye's height field gives the "liquid" sheen
      float hL = length(texture2D(uTexture, vL).rgb), hR = length(texture2D(uTexture, vR).rgb);
      float hT = length(texture2D(uTexture, vT).rgb), hB = length(texture2D(uTexture, vB).rgb);
      vec3 n = normalize(vec3(hL - hR, hB - hT, 0.35));
      vec3 lightDir = normalize(vec3(-0.4, 0.6, 1.0));
      float spec = pow(max(dot(reflect(-lightDir, n), vec3(0.0, 0.0, 1.0)), 0.0), 24.0);
      float shade = dot(n, lightDir);

      // dot grid displaced by the velocity field (refraction-ish)
      vec2 vel = texture2D(uVelocity, vUv).xy;
      vec2 disp = vel * 0.012 * uWarp;
      float dl = length(disp); if (dl > 28.0) disp *= 28.0 / dl;
      vec2 px = gl_FragCoord.xy / uDpr + disp;
      float spacing = 26.0;
      vec2 cell = fract(px / spacing) - 0.5;
      float d = length(cell) * spacing;
      float dotMask = 1.0 - smoothstep(0.55, 1.35, d);
      float gridA = 0.11 * uGrid * (1.0 + min(dl / 10.0, 1.6));

      vec3 col = uPaper;
      col = mix(col, uInk, dotMask * gridA);
      col = mix(col, pigment * 0.92 + 0.08, a);
      col *= mix(1.0, 0.9 + 0.12 * shade, clamp(a * 1.6, 0.0, 1.0));
      col += spec * a * 0.35;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function startFluid(canvas: HTMLCanvasElement, initialMode: FluidMode = "full") {
  const params = { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
  let gl = canvas.getContext("webgl2", params) as GL | null;
  const isGL2 = !!gl;
  if (!gl) gl = (canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params)) as GL | null;
  if (!gl) return null;

  let halfFloat: number;
  let supportLinear: boolean;
  if (isGL2) {
    (gl as WebGL2RenderingContext).getExtension("EXT_color_buffer_float");
    supportLinear = true; // half-float linear filtering is core in WebGL2
    halfFloat = (gl as WebGL2RenderingContext).HALF_FLOAT;
  } else {
    const ext = gl.getExtension("OES_texture_half_float");
    if (!ext) return null;
    halfFloat = ext.HALF_FLOAT_OES;
    supportLinear = !!gl.getExtension("OES_texture_half_float_linear");
  }
  const g = gl;
  const internal = isGL2 ? (g as WebGL2RenderingContext).RGBA16F : g.RGBA;
  const filtering = supportLinear ? g.LINEAR : g.NEAREST;

  // check the format is renderable
  {
    const t = g.createTexture()!;
    g.bindTexture(g.TEXTURE_2D, t);
    g.texImage2D(g.TEXTURE_2D, 0, internal, 4, 4, 0, g.RGBA, halfFloat, null);
    const f = g.createFramebuffer()!;
    g.bindFramebuffer(g.FRAMEBUFFER, f);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, t, 0);
    const ok = g.checkFramebufferStatus(g.FRAMEBUFFER) === g.FRAMEBUFFER_COMPLETE;
    g.deleteTexture(t); g.deleteFramebuffer(f);
    if (!ok) return null;
  }

  function compile(type: number, src: string) {
    const s = g.createShader(type)!;
    g.shaderSource(s, src);
    g.compileShader(s);
    if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) || "shader");
    return s;
  }
  const vs = compile(g.VERTEX_SHADER, baseVS);
  function program(fs: string) {
    const p = g.createProgram()!;
    g.attachShader(p, vs);
    g.attachShader(p, compile(g.FRAGMENT_SHADER, fs));
    g.bindAttribLocation(p, 0, "aPosition");
    g.linkProgram(p);
    if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p) || "link");
    const u: Record<string, WebGLUniformLocation> = {};
    const n = g.getProgramParameter(p, g.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = g.getActiveUniform(p, i)!.name;
      u[name] = g.getUniformLocation(p, name)!;
    }
    return { p, u };
  }
  let P: Record<keyof typeof FS, ReturnType<typeof program>>;
  try {
    P = Object.fromEntries(Object.entries(FS).map(([k, v]) => [k, program(v)])) as typeof P;
  } catch {
    return null;
  }

  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), g.STATIC_DRAW);
  g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, g.createBuffer());
  g.bufferData(g.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), g.STATIC_DRAW);
  g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
  g.enableVertexAttribArray(0);

  function blit(target: FBO | null) {
    if (target) { g.viewport(0, 0, target.w, target.h); g.bindFramebuffer(g.FRAMEBUFFER, target.fbo); }
    else { g.viewport(0, 0, g.drawingBufferWidth, g.drawingBufferHeight); g.bindFramebuffer(g.FRAMEBUFFER, null); }
    g.drawElements(g.TRIANGLES, 6, g.UNSIGNED_SHORT, 0);
  }

  function fbo(w: number, h: number): FBO {
    g.activeTexture(g.TEXTURE0);
    const tex = g.createTexture()!;
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, filtering);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, filtering);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texImage2D(g.TEXTURE_2D, 0, internal, w, h, 0, g.RGBA, halfFloat, null);
    const fb = g.createFramebuffer()!;
    g.bindFramebuffer(g.FRAMEBUFFER, fb);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tex, 0);
    g.viewport(0, 0, w, h);
    g.clear(g.COLOR_BUFFER_BIT);
    return { tex, fbo: fb, w, h, tx: 1 / w, ty: 1 / h, attach(id) { g.activeTexture(g.TEXTURE0 + id); g.bindTexture(g.TEXTURE_2D, tex); return id; } };
  }
  function dfbo(w: number, h: number): DoubleFBO {
    let a = fbo(w, h), b = fbo(w, h);
    return { w, h, tx: 1 / w, ty: 1 / h, get read() { return a; }, get write() { return b; }, swap() { [a, b] = [b, a]; } } as DoubleFBO;
  }
  function res(r: number) {
    let ar = g.drawingBufferWidth / g.drawingBufferHeight;
    if (ar < 1) ar = 1 / ar;
    const min = Math.round(r), max = Math.round(r * ar);
    return g.drawingBufferWidth > g.drawingBufferHeight ? { w: max, h: min } : { w: min, h: max };
  }

  let dye: DoubleFBO, velocity: DoubleFBO, divergence: FBO, curl: FBO, pressure: DoubleFBO;
  let dpr = 1;
  const mobile = matchMedia("(pointer: coarse)").matches;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    const w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width === w && canvas.height === h && dye) return;
    canvas.width = w; canvas.height = h;
    const s = res(cfg.SIM_RES), d = res(mobile ? 384 : cfg.DYE_RES);
    dye = dfbo(d.w, d.h); velocity = dfbo(s.w, s.h);
    divergence = fbo(s.w, s.h); curl = fbo(s.w, s.h); pressure = dfbo(s.w, s.h);
  }
  resize();

  let mode = MODES[initialMode];
  let colorIdx = Math.floor(Math.random() * PALETTE.length);
  let hueT = 0;
  function pigment(k: number): [number, number, number] {
    hueT += 0.004;
    const i = Math.floor(colorIdx + hueT) % PALETTE.length, j = (i + 1) % PALETTE.length, f = (colorIdx + hueT) % 1;
    const a = PALETTE[i], b = PALETTE[j];
    return [(a[0] + (b[0] - a[0]) * f) * k, (a[1] + (b[1] - a[1]) * f) * k, (a[2] + (b[2] - a[2]) * f) * k];
  }

  function splat(x: number, y: number, dx: number, dy: number, color: [number, number, number]) {
    const ar = canvas.width / canvas.height;
    g.useProgram(P.splat.p);
    g.uniform1i(P.splat.u.uTarget, velocity.read.attach(0));
    g.uniform1f(P.splat.u.aspectRatio, ar);
    g.uniform2f(P.splat.u.point, x, y);
    g.uniform3f(P.splat.u.color, dx, dy, 0);
    let r = cfg.SPLAT_RADIUS / 100;
    if (ar > 1) r *= ar;
    g.uniform1f(P.splat.u.radius, r);
    blit(velocity.write); velocity.swap();
    g.uniform1i(P.splat.u.uTarget, dye.read.attach(0));
    g.uniform3f(P.splat.u.color, color[0], color[1], color[2]);
    blit(dye.write); dye.swap();
  }

  function step(dt: number) {
    g.disable(g.BLEND);
    const s = (prog: ReturnType<typeof program>, t: { tx: number; ty: number }) => {
      g.useProgram(prog.p);
      if (prog.u.texelSize) g.uniform2f(prog.u.texelSize, t.tx, t.ty);
      return prog.u;
    };
    let u = s(P.curl, velocity);
    g.uniform1i(u.uVelocity, velocity.read.attach(0)); blit(curl);

    u = s(P.vorticity, velocity);
    g.uniform1i(u.uVelocity, velocity.read.attach(0)); g.uniform1i(u.uCurl, curl.attach(1));
    g.uniform1f(u.curl, cfg.CURL); g.uniform1f(u.dt, dt);
    blit(velocity.write); velocity.swap();

    u = s(P.divergence, velocity);
    g.uniform1i(u.uVelocity, velocity.read.attach(0)); blit(divergence);

    u = s(P.clear, velocity);
    g.uniform1i(u.uTexture, pressure.read.attach(0)); g.uniform1f(u.value, cfg.PRESSURE);
    blit(pressure.write); pressure.swap();

    u = s(P.pressure, velocity);
    g.uniform1i(u.uDivergence, divergence.attach(0));
    for (let i = 0; i < cfg.PRESSURE_ITERATIONS; i++) {
      g.uniform1i(u.uPressure, pressure.read.attach(1)); blit(pressure.write); pressure.swap();
    }

    u = s(P.gradient, velocity);
    g.uniform1i(u.uPressure, pressure.read.attach(0)); g.uniform1i(u.uVelocity, velocity.read.attach(1));
    blit(velocity.write); velocity.swap();

    u = s(P.advection, velocity);
    g.uniform1i(u.uVelocity, velocity.read.attach(0)); g.uniform1i(u.uSource, velocity.read.attach(0));
    g.uniform1f(u.dt, dt); g.uniform1f(u.dissipation, cfg.VELOCITY_DISSIPATION);
    blit(velocity.write); velocity.swap();

    g.uniform1i(u.uVelocity, velocity.read.attach(0)); g.uniform1i(u.uSource, dye.read.attach(1));
    g.uniform1f(u.dissipation, cfg.DENSITY_DISSIPATION);
    blit(dye.write); dye.swap();
  }

  const paper = [0.969, 0.961, 0.941], ink = [0.09, 0.086, 0.11];
  function render() {
    const u = P.display.u;
    g.useProgram(P.display.p);
    g.uniform2f(u.texelSize, dye.tx, dye.ty);
    g.uniform1i(u.uTexture, dye.read.attach(0));
    g.uniform1i(u.uVelocity, velocity.read.attach(1));
    g.uniform3f(u.uPaper, paper[0], paper[1], paper[2]);
    g.uniform3f(u.uInk, ink[0], ink[1], ink[2]);
    g.uniform1f(u.uDye, mode.dye);
    g.uniform1f(u.uGrid, mode.grid);
    g.uniform1f(u.uWarp, mode.warp);
    g.uniform1f(u.uDpr, dpr);
    blit(null);
  }

  // ── input ────────────────────────────────────────────────────────────────
  const pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false, init: false };
  function onMove(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width, y = 1 - (clientY - rect.top) / rect.height;
    if (!pointer.init) { pointer.x = x; pointer.y = y; pointer.init = true; return; }
    const ar = rect.width / rect.height;
    pointer.dx = (x - pointer.x) * (ar < 1 ? ar : 1);
    pointer.dy = (y - pointer.y) / (ar > 1 ? ar : 1);
    pointer.x = x; pointer.y = y;
    pointer.moved = Math.abs(pointer.dx) + Math.abs(pointer.dy) > 0;
  }
  const mm = (e: PointerEvent) => onMove(e.clientX, e.clientY);
  const tm = (e: TouchEvent) => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); };
  const leave = () => { pointer.init = false; };
  window.addEventListener("pointermove", mm, { passive: true });
  window.addEventListener("touchmove", tm, { passive: true });
  document.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);

  // a few gentle opening strokes so the page is alive before anyone moves
  function intro() {
    const n = 3;
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const x = 0.2 + Math.random() * 0.6, y = 0.25 + Math.random() * 0.5;
        const a = Math.random() * Math.PI * 2, f = 600 + Math.random() * 500;
        splat(x, y, Math.cos(a) * f * mode.force, Math.sin(a) * f * mode.force, pigment(0.55));
      }, 250 + i * 420);
    }
  }

  // ── loop ─────────────────────────────────────────────────────────────────
  let last = performance.now(), raf = 0, running = true;
  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 1 / 60);
    last = now;
    resize();
    if (pointer.moved) {
      pointer.moved = false;
      const f = cfg.SPLAT_FORCE * mode.force;
      const speed = Math.min(Math.hypot(pointer.dx, pointer.dy) * 40, 1);
      splat(pointer.x, pointer.y, pointer.dx * f, pointer.dy * f, pigment(0.18 + 0.32 * speed));
    }
    step(dt);
    render();
    raf = requestAnimationFrame(frame);
  }
  const onVis = () => {
    if (document.hidden) { cancelAnimationFrame(raf); running = false; }
    else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  };
  document.addEventListener("visibilitychange", onVis);
  raf = requestAnimationFrame(frame);
  intro();

  return {
    setMode(m: FluidMode) { mode = MODES[m] ?? MODES.soft; },
    burst: intro,
  };
}
