// The landing page's mark, as a matte stone: the real paths become
// distance fields (big stone in r, small in g) and a shader lights them.
// It draws once, and again on resize or a theme change; without WebGL2 the
// <img> under it stays.
(() => {
  const cv = document.querySelector(".hero-m canvas");
  if (!cv) return;
  const BIG = "M33 9.2C35 9.2 36.6 9.5 37.6 10.3C38.4 11 38.5 12 38.2 13.2L27.6 52.6C27.2 54.1 26 54.9 24.4 54.8C14 54 7.8 45 7.2 33C6.6 19.5 18 9.3 33 9.2Z";
  const SMALL = "M44 14.6C44.4 13.2 45.4 12.6 46.8 12.9C53.6 14.4 58.4 21 58.4 30.5C58.4 41 51.6 49.6 40.6 50.6C36.4 51 34.2 50.2 34.6 48.4Z";
  const N = 512;
  const VS = "#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}";
  const FS = `#version 300 es
  precision highp float;
  uniform sampler2D uT;
  uniform vec2 uRes;
  uniform float uDpr, uS, uDark;
  uniform vec3 uInk;
  out vec4 o;
  
  // The mark, from distance fields of the real paths: x the big stone, y the small one.
  float D(vec2 p) { vec2 r = texture(uT, (p + 1.0) / 66.0).rg; return min(r.x, r.y); }
  
  void main() {
    vec2 px = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
    vec2 p = px / uS - 1.0;
    float aa = 1.0 / uS;
    float d = D(p);
    float e = 0.6;
    vec2 g = vec2(D(p + vec2(e, 0.0)) - D(p - vec2(e, 0.0)), D(p + vec2(0.0, e)) - D(p - vec2(0.0, e)));
    vec2 n = g / max(length(g), 1e-4);
    float a = clamp(0.5 - d / aa, 0.0, 1.0);
  
    // Matte stone: a soft dome over the distance field, lit from the upper left.
    float sl = exp(min(d, 0.0) / 1.6);
    vec3 N3 = normalize(vec3(n * sl * 1.15 + (p - vec2(33.0, 32.0)) / 34.0 * 0.55, 1.0));
    vec3 L = normalize(vec3(vec2(-0.6, -0.8) * 0.75, 0.66));
    float dif = clamp((dot(N3, L) + 0.3) / 1.3, 0.0, 1.0);
    vec3 col = mix(uInk * vec3(0.80, 0.60, 0.72), mix(uInk, vec3(1.0), 0.32), smoothstep(0.0, 1.0, dif));
  
    float ds = D(p - vec2(0.7, 1.7));
    float sa = (1.0 - smoothstep(-2.0, 3.6, ds)) * mix(0.16, 0.5, uDark);
    vec3 sc = mix(vec3(0.42, 0.12, 0.28), vec3(0.0), uDark);
    o = vec4(col, 1.0) * a + vec4(sc * sa, sa) * (1.0 - a);
  }`;

  // Felzenszwalb and Huttenlocher's distance transform, one line at a time.
  function edt1(f, n, d, v, z) {
    let k = 0;
    v[0] = 0; z[0] = -1e20; z[1] = 1e20;
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
  }
  function edt(grid, n) {
    const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) f[y] = grid[y * n + x];
      edt1(f, n, d, v, z);
      for (let y = 0; y < n; y++) grid[y * n + x] = d[y];
    }
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) f[x] = grid[y * n + x];
      edt1(f, n, d, v, z);
      for (let x = 0; x < n; x++) grid[y * n + x] = d[x];
    }
  }
  // Signed distance in mark units; negative inside.
  function sdf(cover, n) {
    const inG = new Float64Array(n * n), outG = new Float64Array(n * n), r = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) { const on = cover[i] >= 0.5; inG[i] = on ? 1e20 : 0; outG[i] = on ? 0 : 1e20; }
    edt(inG, n); edt(outG, n);
    const u = 66 / n;
    for (let i = 0; i < n * n; i++) {
      const c = cover[i];
      // Edge pixels know better from their coverage.
      r[i] = (c > 0 && c < 1 ? 0.5 - c : c >= 0.5 ? -(Math.sqrt(inG[i]) - 0.5) : Math.sqrt(outG[i]) - 0.5) * u;
    }
    return r;
  }

  // Coverage of each stone, drawn from the real paths.
  const field = () => {
    const c = document.createElement("canvas");
    c.width = c.height = N;
    const x = c.getContext("2d", { willReadFrequently: true });
    const k = N / 66;
    const cover = (draw) => {
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.clearRect(0, 0, N, N);
      x.setTransform(k, 0, 0, k, k, k);
      x.translate(1.5, 0);
      draw();
      const px = x.getImageData(0, 0, N, N).data, m = new Float32Array(N * N);
      for (let i = 0; i < N * N; i++) m[i] = px[i * 4 + 3] / 255;
      return m;
    };
    const big = sdf(cover(() => x.fill(new Path2D(BIG))), N);
    const small = sdf(cover(() => { x.translate(46, 26.5); x.scale(0.82, 0.82); x.translate(-46, -31); x.fill(new Path2D(SMALL)); }), N);
    const rg = new Float32Array(N * N * 2);
    for (let i = 0; i < N * N; i++) { rg[i * 2] = big[i]; rg[i * 2 + 1] = small[i]; }
    return rg;
  };

  const gl = cv.getContext("webgl2", { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return;
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  const pg = gl.createProgram();
  gl.attachShader(pg, vs);
  gl.attachShader(pg, fs);
  gl.linkProgram(pg);
  if (!gl.getProgramParameter(pg, gl.LINK_STATUS)) return;
  gl.useProgram(pg);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pg, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = {};
  for (const k of ["uT", "uRes", "uDpr", "uS", "uDark", "uInk"]) u[k] = gl.getUniformLocation(pg, k);

  const html = document.documentElement;
  const draw = () => {
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uDpr, dpr);
    gl.uniform1f(u.uS, w / 66);
    gl.uniform1f(u.uDark, html.classList.contains("dk") ? 1 : 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  // The fields take a moment; the page paints first.
  const later = window.requestIdleCallback || ((f) => setTimeout(f, 1));
  later(() => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, N, N, 0, gl.RG, gl.FLOAT, field());
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.uniform1i(u.uT, 0);
    gl.uniform3f(u.uInk, 249 / 255, 168 / 255, 212 / 255);
    draw();
    cv.parentNode.classList.add("lit");
    new ResizeObserver(draw).observe(cv);
    new MutationObserver(draw).observe(html, { attributes: true, attributeFilter: ["class"] });
  });
})();
