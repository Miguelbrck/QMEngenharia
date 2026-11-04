/* =====================================================================
   PLANTA 3D · visualizador (WebGL puro, sem bibliotecas externas)
   ---------------------------------------------------------------------
   • Os dados de cada empreendimento ficam em planta-ipe.js (window.QM_PLANS).
   • Girar: arrastar · Zoom: roda do mouse / pinça · Mover: botão direito,
     Shift+arrastar ou 2 dedos · Clique num cômodo: a câmera vai até ele
     e a foto aparece.
   ===================================================================== */
(function(){
'use strict';

const overlay = document.getElementById('planOverlay');
if(!overlay) return;
const $ = id => document.getElementById(id);
const els = {
  title:$('planTitle'), stage:$('planStage'), labels:$('planLabels'), loading:$('planLoading'), loadingTxt:$('planLoadingTxt'),
  hint:$('planHint'), photo:$('planPhoto'), photoBtn:$('planPhotoBtn'), photoImg:$('planPhotoImg'), photoName:$('planPhotoName'),
  photoNote:$('planPhotoNote'), photoClose:$('planPhotoClose'), photoNav:$('planPhotoNav'), photoPrev:$('planPhotoPrev'),
  photoNext:$('planPhotoNext'), photoCount:$('planPhotoCount'), rooms:$('planRooms'), close:$('planClose'),
  reset:$('planReset'), walls:$('planWalls'), lightbox:$('planLightbox'), lightImg:$('planLightImg')
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOV = 38 * Math.PI / 180;
const MIN_R = 4.5, MAX_R = 30, MAX_PHI = 1.38;

let W = null;                    // mundo 3D atual
let openId = null, raf = 0;
let selected = null, hovered = null, photoIdx = 0;
let wallMode = 'auto', wallK = 1, anim = null;
const WALL_LABEL = { auto:'Paredes: automático', high:'Paredes: altas', low:'Paredes: baixas' };

/* ---------------- matemática mínima ---------------- */
function persp(fovy, asp, n, f){
  const t = 1 / Math.tan(fovy / 2);
  return [t / asp,0,0,0,  0,t,0,0,  0,0,(f + n) / (n - f),-1,  0,0,2 * f * n / (n - f),0];
}
function look(e, c){
  let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
  let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
  let xx = zz, xz = -zx, xy = 0;                              // up × z  (up = 0,1,0)
  l = Math.hypot(xx, xy, xz); xx /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return [xx,yx,zx,0,  xy,yy,zy,0,  xz,yz,zz,0,
          -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
}
function mul(a, b){
  const o = new Array(16);
  for(let c = 0; c < 4; c++) for(let r = 0; r < 4; r++)
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
}
function rayBox(o, d, b){
  let t0 = 0, t1 = Infinity;
  for(let i = 0; i < 3; i++){
    if(Math.abs(d[i]) < 1e-9){ if(o[i] < b[i] || o[i] > b[i + 3]) return Infinity; continue; }
    let a = (b[i] - o[i]) / d[i], c = (b[i + 3] - o[i]) / d[i];
    if(a > c){ const t = a; a = c; c = t; }
    if(a > t0) t0 = a;
    if(c < t1) t1 = c;
    if(t0 > t1) return Infinity;
  }
  return t0;
}
function inPoly(x, y, poly){
  let ins = false;
  for(let i = 0, j = poly.length - 1; i < poly.length; j = i++){
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
function triangulate(poly){                                    // ear clipping (polígonos simples)
  const n = poly.length, idx = poly.map((_, i) => i);
  let area = 0;
  for(let i = 0; i < n; i++){ const a = poly[i], b = poly[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  if(area < 0) idx.reverse();
  const out = [];
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  let guard = 0;
  while(idx.length > 3 && guard++ < 500){
    let cut = false;
    for(let i = 0; i < idx.length; i++){
      const ia = idx[(i + idx.length - 1) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length];
      const a = poly[ia], b = poly[ib], c = poly[ic];
      if(cross(a, b, c) <= 1e-9) continue;
      let ok = true;
      for(const k of idx){
        if(k === ia || k === ib || k === ic) continue;
        const p = poly[k];
        if(cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0){ ok = false; break; }
      }
      if(!ok) continue;
      out.push(ia, ib, ic); idx.splice(i, 1); cut = true; break;
    }
    if(!cut) break;
  }
  if(idx.length === 3) out.push(idx[0], idx[1], idx[2]);
  return out;
}

/* ---------------- shaders ---------------- */
const VS = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUV; attribute vec4 aCol;
uniform mat4 uVP; uniform float uSY;
varying vec3 vN; varying vec2 vUV; varying vec4 vC; varying float vY0;
void main(){
  vec3 p = aPos; p.y *= uSY;
  vN = aNrm; vUV = aUV; vC = aCol; vY0 = aPos.y;
  gl_Position = uVP * vec4(p, 1.0);
}`;
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex; uniform float uUseTex, uLit, uAO, uCut; uniform vec4 uMul; uniform vec3 uL;
varying vec3 vN; varying vec2 vUV; varying vec4 vC; varying float vY0;
void main(){
  vec4 c = vC;
  if(uUseTex > 0.5){ c = texture2D(uTex, vUV); if(c.a < uCut) discard; }
  if(uLit > 0.5){
    float d = max(dot(normalize(vN), uL), 0.0);
    float k = 0.60 + 0.34 * d + 0.06 * vN.y;
    if(uAO > 0.5) k *= 0.76 + 0.24 * smoothstep(0.0, 0.9, vY0);
    c.rgb *= k;
  }
  gl_FragColor = c * uMul;
}`;

/* ---------------- geometria ---------------- */
const hex = h => { h = h.replace('#', ''); return [parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255, 1]; };
function Batch(){ return { v:[], i:[] }; }
function vert(b, p, n, uv, c){ b.v.push(p[0], p[1], p[2], n[0], n[1], n[2], uv[0], uv[1], c[0], c[1], c[2], c[3]); return b.v.length / 12 - 1; }
function quad(b, p0, p1, p2, p3, n, c, uvf){
  const a = vert(b, p0, n, uvf ? uvf(p0) : [0,0], c), s = vert(b, p1, n, uvf ? uvf(p1) : [0,0], c),
        d = vert(b, p2, n, uvf ? uvf(p2) : [0,0], c), e = vert(b, p3, n, uvf ? uvf(p3) : [0,0], c);
  b.i.push(a, s, d, a, d, e);
}
/* caixa: topo e laterais em lotes/cores diferentes */
function addBox(bSide, bTop, x0, y0, z0, x1, y1, z1, cSide, cTop, uvf){
  const T = bTop || bSide, ct = cTop || cSide;
  quad(T,    [x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1], [0,1,0],  ct, uvf);
  quad(bSide,[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0], [1,0,0],  cSide);
  quad(bSide,[x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1], [-1,0,0], cSide);
  quad(bSide,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1], [0,0,1],  cSide);
  quad(bSide,[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0], [0,0,-1], cSide);
}
function addCyl(bSide, bTop, cx, cz, r, y0, y1, cSide, cTop, uvf){
  const N = 32;
  const c0 = vert(bTop, [cx, y1, cz], [0,1,0], uvf([cx, y1, cz]), cTop);
  const ring = [];
  for(let k = 0; k < N; k++){
    const a = k / N * Math.PI * 2, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    ring.push(vert(bTop, [x, y1, z], [0,1,0], uvf([x, y1, z]), cTop));
  }
  for(let k = 0; k < N; k++) bTop.i.push(c0, ring[k], ring[(k + 1) % N]);
  for(let k = 0; k < N; k++){
    const a0 = k / N * Math.PI * 2, a1 = (k + 1) / N * Math.PI * 2;
    const x0 = cx + Math.cos(a0) * r, z0 = cz + Math.sin(a0) * r, x1 = cx + Math.cos(a1) * r, z1 = cz + Math.sin(a1) * r;
    const am = (a0 + a1) / 2, n = [Math.cos(am), 0, Math.sin(am)];
    quad(bSide, [x0,y0,z0],[x1,y0,z1],[x1,y1,z1],[x0,y1,z0], n, cSide);
  }
}

/* ---------------- abrir / fechar ---------------- */
function loadImage(url){
  return new Promise((res, rej)=>{
    const im = new Image();
    im.onload = ()=>res(im);
    im.onerror = ()=>rej(new Error('Imagem não encontrada: ' + url));
    im.src = url;
  });
}
function setLoading(on, text, error){
  els.loading.hidden = !on;
  els.loading.classList.toggle('error', !!error);
  if(text) els.loadingTxt.textContent = text;
}
async function openPlan(id){
  const cfg = window.QM_PLANS && window.QM_PLANS[id];
  if(!cfg) return;
  els.title.textContent = cfg.title;
  overlay.classList.add('open');
  setLoading(true, 'Carregando planta 3D…');
  try{
    if(W && W.id !== id) disposeWorld();
    if(!W) W = await build(id, cfg);
    if(!overlay.classList.contains('open')) return;           // fechou enquanto carregava
    openId = id;
    select(null, false);
    resize();
    resetView(false);
    els.hint.classList.remove('gone');
    setLoading(false);
    startLoop();
  }catch(err){
    console.error(err);
    setLoading(true, 'Não foi possível abrir a planta 3D neste navegador.', true);
  }
}
function closePlan(){
  overlay.classList.remove('open');
  els.lightbox.classList.remove('show');
  stopLoop();
}
const isOpen = () => overlay.classList.contains('open');

/* ---------------- construção da cena ---------------- */
async function build(id, cfg){
  const S = cfg.scale, [ox, oy] = cfg.origin, [IW, IH] = cfg.imageSize, H = cfg.wallHeight;
  const X = v => (v - ox) * S, Z = v => (v - oy) * S;
  const uvPlan = p => [(p[0] / S + ox) / IW, (p[2] / S + oy) / IH];     // posição no mundo → pixel da planta

  const canvas = document.createElement('canvas');
  canvas.className = 'plan-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Planta 3D: arraste para girar, role para dar zoom');
  els.stage.prepend(canvas);
  const gl = canvas.getContext('webgl', { antialias:true, alpha:true, premultipliedAlpha:false }) ||
             canvas.getContext('experimental-webgl');
  if(!gl){ canvas.remove(); throw new Error('WebGL indisponível'); }

  /* programa */
  const sh = (type, src)=>{ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const U = {}; ['uVP','uSY','uTex','uUseTex','uLit','uAO','uCut','uMul','uL'].forEach(n=>U[n] = gl.getUniformLocation(prog, n));
  const A = { aPos:gl.getAttribLocation(prog, 'aPos'), aNrm:gl.getAttribLocation(prog, 'aNrm'),
              aUV:gl.getAttribLocation(prog, 'aUV'), aCol:gl.getAttribLocation(prog, 'aCol') };
  gl.uniform1i(U.uTex, 0);
  const Lv = [-0.45, 0.75, 0.5], ll = Math.hypot(...Lv);
  gl.uniform3f(U.uL, Lv[0] / ll, Lv[1] / ll, Lv[2] / ll);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  /* texturas: a planta (piso e topo dos móveis) e uma sombra suave sob a casa */
  const img = await loadImage(cfg.image);
  const c2 = document.createElement('canvas'); c2.width = 2048; c2.height = 1024;
  c2.getContext('2d').drawImage(img, 0, 0, 2048, 1024);
  const texPlan = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texPlan);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c2);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  if(aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

  const MARGIN = 90, SH_K = 0.5;                                        // margem (px da planta) e escala da textura de sombra
  let texShadow = null;
  {
    const sc = document.createElement('canvas');
    sc.width = Math.round((IW + MARGIN * 2) * SH_K); sc.height = Math.round((IH + MARGIN * 2) * SH_K);
    const sx = sc.getContext('2d');
    if('filter' in sx){
      const tmp = document.createElement('canvas'); tmp.width = sc.width; tmp.height = sc.height;
      const tx = tmp.getContext('2d');
      tx.drawImage(img, MARGIN * SH_K, MARGIN * SH_K, IW * SH_K, IH * SH_K);
      tx.globalCompositeOperation = 'source-in'; tx.fillStyle = '#000'; tx.fillRect(0, 0, tmp.width, tmp.height);
      sx.filter = 'blur(12px)'; sx.drawImage(tmp, 0, 0);
      texShadow = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texShadow);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sc);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
  }

  /* lotes de geometria */
  const bFloor = Batch(), bShadow = Batch(), bWalls = Batch(), bGlass = Batch(), bFurn = Batch(), bFurnTop = Batch();
  const WHITE = [1,1,1,1];
  quad(bFloor, [X(0),0,Z(0)],[X(IW),0,Z(0)],[X(IW),0,Z(IH)],[X(0),0,Z(IH)], [0,1,0], WHITE, uvPlan);
  { const m = MARGIN, dx = 0.12, dz = 0.18;                              // sombra levemente deslocada
    quad(bShadow, [X(-m)+dx,-0.012,Z(-m)+dz],[X(IW+m)+dx,-0.012,Z(-m)+dz],[X(IW+m)+dx,-0.012,Z(IH+m)+dz],[X(-m)+dx,-0.012,Z(IH+m)+dz], [0,1,0], WHITE,
         p => [((p[0] - dx) / S + ox + MARGIN) / (IW + MARGIN * 2), ((p[2] - dz) / S + oy + MARGIN) / (IH + MARGIN * 2)]); }

  const cWallSide = hex('#e6d9c5'), cWallTop = hex('#2b2825'), cGlass = [0.66, 0.82, 0.93, 0.34], cMetal = hex('#2b2825');
  const pickBoxes = [];                                                  // {b:[x0,y0,z0,x1,y1,z1], room, scaleY}
  const wbox = (r, y0, y1, side, top, batch, room, pick)=>{
    const [a, b, c, d] = r;
    addBox(batch, batch, X(a), y0, Z(b), X(c), y1, Z(d), side, top);
    if(pick) pickBoxes.push({ b:[X(a), y0, Z(b), X(c), y1, Z(d)], room:room || null, scaleY:true });
  };
  cfg.walls.forEach(r => wbox(r, 0, H, cWallSide, cWallTop, bWalls, null, true));
  const SILL = 0.9, HEAD = 2.15;
  (cfg.windows || []).forEach(r=>{
    const [a, b, c, d] = r, horiz = (c - a) > (d - b);
    wbox(r, 0, SILL, cWallSide, cWallTop, bWalls, null, true);
    if(H > HEAD) wbox(r, HEAD, H, cWallSide, cWallTop, bWalls, null, true);
    const g = horiz ? [a, (b + d) / 2 - 2, c, (b + d) / 2 + 2] : [(a + c) / 2 - 2, b, (a + c) / 2 + 2, d];
    wbox(g, SILL, HEAD, cGlass, cGlass, bGlass, null, false);
  });
  (cfg.railings || []).forEach(r=>{
    wbox(r, 0, 1.05, cGlass, cGlass, bGlass, null, false);
    wbox([r[0], r[1] - 1, r[2], r[3] + 1], 1.03, 1.09, cMetal, cMetal, bWalls, null, false);
  });

  (cfg.furniture || []).forEach(f=>{
    const y0 = f.y || 0, y1 = y0 + f.h, cs = hex(f.side || '#cccccc');
    const textured = !f.flat, ct = f.flat ? hex(f.flat) : WHITE, topBatch = textured ? bFurnTop : bFurn;
    if(f.kind === 'cyl'){
      const cx = X(f.c[0]), cz = Z(f.c[1]), r = f.r * S;
      addCyl(bFurn, topBatch, cx, cz, r, y0, y1, cs, ct, uvPlan);
      pickBoxes.push({ b:[cx - r, y0, cz - r, cx + r, y1, cz + r], room:f.room, scaleY:false });
    }else{
      const [a, b, c, d] = f.rect;
      addBox(bFurn, topBatch, X(a), y0, Z(b), X(c), y1, Z(d), cs, ct, textured ? uvPlan : null);
      pickBoxes.push({ b:[X(a), y0, Z(b), X(c), y1, Z(d)], room:f.room, scaleY:false });
    }
  });

  /* GPU */
  const upload = batch => {
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(batch.v), gl.STATIC_DRAW);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(batch.i), gl.STATIC_DRAW);
    return { vb, ib, n:batch.i.length };
  };
  const G = { floor:upload(bFloor), shadow:upload(bShadow), walls:upload(bWalls), glass:upload(bGlass), furn:upload(bFurn), furnTop:upload(bFurnTop) };

  /* cômodos: área de destaque, contorno, etiqueta e atalho */
  const cHi = [0.78, 0.38, 0.2, 1], cLine = hex('#f2b84b');
  const rooms = cfg.rooms.map(r=>{
    const b1 = Batch(), pts = r.poly.map(p => [X(p[0]), Z(p[1])]);
    pts.forEach(p => vert(b1, [p[0], 0.02, p[1]], [0,1,0], [0,0], cHi));
    triangulate(pts).forEach(i => b1.i.push(i));
    const b2 = Batch(), w = 0.04, n = pts.length;
    for(let k = 0; k < n; k++){
      const a = pts[k], b = pts[(k + 1) % n];
      const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l, px = -uz * w, pz = ux * w;
      const ax = a[0] - ux * w, az = a[1] - uz * w, bx = b[0] + ux * w, bz = b[1] + uz * w, y = 0.03;
      quad(b2, [ax + px, y, az + pz],[bx + px, y, bz + pz],[bx - px, y, bz - pz],[ax - px, y, az - pz], [0,1,0], cLine);
    }
    const xs = r.poly.map(p => p[0]), ys = r.poly.map(p => p[1]);
    const bb = { x0:Math.min(...xs), x1:Math.max(...xs), y0:Math.min(...ys), y1:Math.max(...ys) };
    const hasPhoto = !!(r.photos && r.photos.length);

    const el = document.createElement('button');
    el.type = 'button'; el.className = 'plan-label';
    el.innerHTML = (hasPhoto ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.4"/></svg>' : '') + '<span></span>';
    el.lastChild.textContent = r.name;
    el.addEventListener('click', ()=>select(r.id, true));
    els.labels.appendChild(el);

    const chip = document.createElement('button');
    chip.type = 'button'; chip.className = 'plan-chip'; chip.textContent = r.name;
    chip.addEventListener('click', ()=>select(r.id, true));
    els.rooms.appendChild(chip);

    return { ...r, area:upload(b1), line:upload(b2), el, chip, hasPhoto, alpha:0,
      center:[X((bb.x0 + bb.x1) / 2), 0, Z((bb.y0 + bb.y1) / 2)],
      size:Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) * S,
      anchor:[X(r.label[0]), 1.0, Z(r.label[1])] };
  });

  const world = { id, cfg, S, ox, oy, X, Z, gl, canvas, prog, U, A, G, texPlan, texShadow, rooms, pickBoxes, H,
    cam:{ target:[0,0,0], r:16, theta:-0.2, phi:0.62 }, vel:{ theta:0, phi:0, t:0 }, VP:null, eye:[0,0,0] };
  bindControls(world);
  return world;
}

function disposeWorld(){
  if(!W) return;
  stopLoop();
  const ext = W.gl.getExtension('WEBGL_lose_context');
  if(ext) ext.loseContext();
  W.canvas.remove();
  els.labels.innerHTML = ''; els.rooms.innerHTML = '';
  W = null; selected = hovered = null;
}

/* ---------------- desenho ---------------- */
function drawBatch(g, o){
  const { gl, U, A } = W;
  gl.bindBuffer(gl.ARRAY_BUFFER, g.vb);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ib);
  const st = 48;
  gl.enableVertexAttribArray(A.aPos); gl.vertexAttribPointer(A.aPos, 3, gl.FLOAT, false, st, 0);
  gl.enableVertexAttribArray(A.aNrm); gl.vertexAttribPointer(A.aNrm, 3, gl.FLOAT, false, st, 12);
  gl.enableVertexAttribArray(A.aUV);  gl.vertexAttribPointer(A.aUV, 2, gl.FLOAT, false, st, 24);
  gl.enableVertexAttribArray(A.aCol); gl.vertexAttribPointer(A.aCol, 4, gl.FLOAT, false, st, 32);
  gl.uniform1f(U.uSY, o.sy === undefined ? 1 : o.sy);
  gl.uniform1f(U.uLit, o.lit ? 1 : 0);
  gl.uniform1f(U.uAO, o.ao ? 1 : 0);
  gl.uniform1f(U.uCut, o.cut === undefined ? 0.5 : o.cut);
  gl.uniform1f(U.uUseTex, o.tex ? 1 : 0);
  if(o.tex){ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, o.tex); }
  const m = o.mul || [1,1,1,1];
  gl.uniform4f(U.uMul, m[0], m[1], m[2], m[3]);
  gl.depthMask(!o.noDepth);
  gl.drawElements(gl.TRIANGLES, g.n, gl.UNSIGNED_SHORT, 0);
}
function eyePos(c){
  const sp = Math.sin(c.phi);
  return [c.target[0] + c.r * sp * Math.sin(c.theta), c.target[1] + c.r * Math.cos(c.phi), c.target[2] + c.r * sp * Math.cos(c.theta)];
}
function render(){
  const { gl, canvas, U, G, cam } = W;
  const aspect = canvas.width / Math.max(1, canvas.height);
  const eye = eyePos(cam);
  W.eye = eye;
  W.VP = mul(persp(FOV, aspect, 0.3, 120), look(eye, cam.target));
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(U.uVP, false, new Float32Array(W.VP));

  if(W.texShadow) drawBatch(G.shadow, { tex:W.texShadow, cut:0, noDepth:true, mul:[1,1,1,0.55] });
  drawBatch(G.floor, { tex:W.texPlan });
  drawBatch(G.furnTop, { tex:W.texPlan });
  drawBatch(G.furn, { lit:true, ao:true });
  drawBatch(G.walls, { lit:true, ao:true, sy:wallK });
  for(const r of W.rooms){
    if(r.alpha < 0.01) continue;
    drawBatch(r.area, { noDepth:true, mul:[1,1,1,r.alpha] });
    if(r.id === selected) drawBatch(r.line, { noDepth:true, mul:[1,1,1,0.95] });
  }
  drawBatch(G.glass, { sy:wallK, noDepth:true });
}

/* ---------------- câmera ---------------- */
function fitRadius(){
  const w = els.stage.clientWidth || 1, h = els.stage.clientHeight || 1;
  const t = Math.tan(FOV / 2);
  return clamp(Math.max(5.9 / t, 8.4 / (t * (w / h))) * 1.04, 8, MAX_R - 1);
}
function flyTo(target, radius, phi, theta, dur){
  const c = W.cam;
  let dth = theta === undefined ? 0 : theta - c.theta;
  dth = Math.atan2(Math.sin(dth), Math.cos(dth));                 // caminho mais curto
  const to = { t:target.slice(), r:radius, phi, th:c.theta + dth };
  if(reduceMotion || dur === 0){ c.target = to.t.slice(); c.r = to.r; c.phi = to.phi; c.theta = to.th; anim = null; return; }
  anim = { t0:performance.now(), dur:dur || 950, from:{ t:c.target.slice(), r:c.r, phi:c.phi, th:c.theta }, to };
}
function stepAnim(now){
  if(!anim) return;
  const k = clamp((now - anim.t0) / anim.dur, 0, 1), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const { from, to } = anim, c = W.cam, l = (a, b) => a + (b - a) * e;
  c.target = [l(from.t[0], to.t[0]), l(from.t[1], to.t[1]), l(from.t[2], to.t[2])];
  c.r = l(from.r, to.r); c.phi = l(from.phi, to.phi); c.theta = l(from.th, to.th);
  if(k >= 1) anim = null;
}
function resetView(animate){
  if(!W) return;
  flyTo([0, 0, 0], fitRadius(), 0.62, -0.2, animate === false ? 0 : 1000);
}

/* ---------------- seleção de cômodos + foto ---------------- */
const roomById = id => W && W.rooms.find(r => r.id === id);
function select(id, focus){
  selected = id;
  if(!W) return;
  W.rooms.forEach(r=>{
    const on = r.id === id;
    r.el.classList.toggle('active', on); r.chip.classList.toggle('active', on);
  });
  const room = roomById(id);
  if(!room){ els.photo.hidden = true; return; }
  photoIdx = 0;
  showPhoto(room);
  if(focus){
    flyTo(room.center, clamp(room.size * 1.2 + 4.2, 7, 12.5), clamp(W.cam.phi, 0.5, 0.95), undefined, 900);
  }
  if(room.chip.scrollIntoView) room.chip.scrollIntoView({ block:'nearest', inline:'center', behavior:'smooth' });
}
function showPhoto(room){
  els.photoName.textContent = room.name;
  const list = room.photos || [];
  els.photo.classList.toggle('nophoto', !list.length);
  if(list.length){
    els.photoImg.src = list[photoIdx];
    els.photoImg.alt = room.name;
    els.photoNote.textContent = room.note || '';
    els.photoNote.hidden = !room.note;
  }else{
    els.photoImg.removeAttribute('src');
    els.photoNote.textContent = 'Este ambiente ainda não tem foto cadastrada.';
    els.photoNote.hidden = false;
  }
  els.photoNav.hidden = list.length < 2;
  els.photoCount.textContent = (photoIdx + 1) + ' / ' + list.length;
  els.photo.hidden = false;
  els.photo.classList.remove('pop'); void els.photo.offsetWidth; els.photo.classList.add('pop');
}
function stepPhoto(d){
  const room = roomById(selected);
  if(!room || !room.photos || room.photos.length < 2) return;
  photoIdx = (photoIdx + d + room.photos.length) % room.photos.length;
  showPhoto(room);
}

/* ---------------- clique / hover (raio contra as caixas e o piso) ---------------- */
function pick(ev){
  const r = W.canvas.getBoundingClientRect(), c = W.cam;
  const nx = ((ev.clientX - r.left) / r.width) * 2 - 1, ny = -(((ev.clientY - r.top) / r.height) * 2 - 1);
  const e = eyePos(c);
  let fx = c.target[0] - e[0], fy = c.target[1] - e[1], fz = c.target[2] - e[2];
  let l = Math.hypot(fx, fy, fz); fx /= l; fy /= l; fz /= l;
  let rx = -fz, rz = fx; l = Math.hypot(rx, rz); rx /= l; rz /= l;               // direita = f × up
  const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;                   // cima = direita × f
  const t = Math.tan(FOV / 2), asp = r.width / r.height;
  const d = [fx + rx * nx * t * asp, fy, fz + rz * nx * t * asp];
  d[0] += ux * ny * t; d[1] += uy * ny * t; d[2] += uz * ny * t;
  l = Math.hypot(d[0], d[1], d[2]); d[0] /= l; d[1] /= l; d[2] /= l;

  let best = Infinity, room = null;
  for(const p of W.pickBoxes){
    const b = p.scaleY ? [p.b[0], p.b[1] * wallK, p.b[2], p.b[3], p.b[4] * wallK, p.b[5]] : p.b;
    const tt = rayBox(e, d, b);
    if(tt < best){ best = tt; room = p.room; }
  }
  if(d[1] < -1e-6){
    const tf = (0.02 - e[1]) / d[1];
    if(tf > 0 && tf < best){
      const px = (e[0] + d[0] * tf) / W.S + W.ox, py = (e[2] + d[2] * tf) / W.S + W.oy;
      const hit = W.rooms.find(rm => inPoly(px, py, rm.poly));
      room = hit ? hit.id : null; best = tf;
    }
  }
  return room;
}

/* ---------------- controles (mouse, toque, teclado) ---------------- */
function bindControls(w){
  const cv = w.canvas, ptrs = new Map();
  let mode = null, down = null, pinch = null;
  const hideHint = () => els.hint.classList.add('gone');
  const info = ()=>{ const a = [...ptrs.values()]; return { d:Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1, cx:(a[0].x + a[1].x) / 2, cy:(a[0].y + a[1].y) / 2 }; };
  const rotate = (dx, dy)=>{
    const c = w.cam, dt = -dx * 0.0065, dp = -dy * 0.0055;
    c.theta += dt; c.phi = clamp(c.phi + dp, 0.02, MAX_PHI);
    w.vel.theta = dt; w.vel.phi = dp; w.vel.t = performance.now();
  };
  const zoom = f => { w.cam.r = clamp(w.cam.r * f, MIN_R, MAX_R); };
  const pan = (dx, dy)=>{
    const c = w.cam, k = 2 * c.r * Math.tan(FOV / 2) / Math.max(1, cv.clientHeight), s = Math.sin(c.theta), co = Math.cos(c.theta);
    c.target[0] += (-co * dx - s * dy) * k;
    c.target[2] += ( s * dx - co * dy) * k;
  };

  cv.addEventListener('pointerdown', e=>{
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    ptrs.set(e.pointerId, { x:e.clientX, y:e.clientY });
    anim = null; hideHint();
    if(ptrs.size === 1){
      mode = (e.button === 2 || e.button === 1 || e.shiftKey || e.ctrlKey || e.metaKey) ? 'pan' : 'rot';
      down = { x:e.clientX, y:e.clientY, t:performance.now(), btn:e.button };
      w.vel.theta = w.vel.phi = 0;
    }else if(ptrs.size === 2){ mode = 'pinch'; pinch = info(); down = null; }
  });
  cv.addEventListener('pointermove', e=>{
    const p = ptrs.get(e.pointerId);
    if(!p){
      if(e.pointerType === 'mouse' && !e.buttons){
        const id = pick(e) || null;
        if(id !== hovered){ hovered = id; cv.style.cursor = id ? 'pointer' : ''; }
      }
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if(mode === 'rot') rotate(dx, dy);
    else if(mode === 'pan') pan(dx, dy);
    else if(mode === 'pinch' && ptrs.size === 2){
      const n = info(); zoom(pinch.d / n.d); pan(n.cx - pinch.cx, n.cy - pinch.cy); pinch = n;
    }
  });
  const end = e=>{
    if(!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if(down && mode === 'rot' && e.type === 'pointerup' && down.btn === 0){
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
      if(moved <= 6 && dt <= 700){ const id = pick(e); if(id) select(id, true); }
    }
    if(ptrs.size === 0){ mode = null; down = null; }
    else if(ptrs.size === 1){ mode = 'rot'; down = null; w.vel.theta = w.vel.phi = 0; }
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', ()=>{ if(hovered){ hovered = null; cv.style.cursor = ''; } });
  cv.addEventListener('wheel', e=>{
    e.preventDefault(); anim = null; hideHint();
    zoom(Math.exp(clamp(e.deltaY, -120, 120) * (e.ctrlKey ? 0.01 : 0.0013)));
  }, { passive:false });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('keydown', e=>{
    const c = w.cam; let used = true;
    if(e.key === 'ArrowLeft') c.theta -= 0.12;
    else if(e.key === 'ArrowRight') c.theta += 0.12;
    else if(e.key === 'ArrowUp') c.phi = clamp(c.phi - 0.08, 0.02, MAX_PHI);
    else if(e.key === 'ArrowDown') c.phi = clamp(c.phi + 0.08, 0.02, MAX_PHI);
    else if(e.key === '+' || e.key === '=') zoom(0.88);
    else if(e.key === '-') zoom(1.14);
    else used = false;
    if(used){ e.preventDefault(); anim = null; hideHint(); }
  });
}

/* ---------------- loop ---------------- */
function startLoop(){
  if(raf || !W) return;
  const loop = now=>{
    raf = requestAnimationFrame(loop);
    if(!W) return;
    const c = W.cam, v = W.vel;
    stepAnim(now);
    /* inércia depois de soltar o mouse/dedo */
    if(!anim && (v.theta || v.phi)){
      if(performance.now() - v.t > 90){ v.theta = v.phi = 0; }
      else{
        c.theta += v.theta; c.phi = clamp(c.phi + v.phi, 0.02, MAX_PHI);
        v.theta *= 0.92; v.phi *= 0.92;
        if(Math.abs(v.theta) < 1e-4 && Math.abs(v.phi) < 1e-4) v.theta = v.phi = 0;
      }
    }
    c.target[0] = clamp(c.target[0], -8, 8); c.target[2] = clamp(c.target[2], -5.5, 5.5);
    /* paredes baixam quando a câmera se inclina, para enxergar dentro dos cômodos */
    let target = 1;
    if(wallMode === 'low') target = 0.16;
    else if(wallMode === 'auto'){ const s = clamp((c.phi - 0.3) / 0.65, 0, 1); target = 1 - 0.84 * s * s * (3 - 2 * s); }
    wallK += (target - wallK) * 0.18;
    wallK = Math.max(wallK, 0.02);
    /* realce suave dos cômodos */
    for(const r of W.rooms){
      const goal = r.id === selected ? 0.32 : (r.id === hovered ? 0.2 : 0);
      r.alpha += (goal - r.alpha) * 0.25;
    }
    render();
    /* etiquetas HTML seguindo os cômodos */
    const w = els.stage.clientWidth, h = els.stage.clientHeight, M = W.VP;
    for(const r of W.rooms){
      const [x, y, z] = r.anchor;
      const cw = M[3] * x + M[7] * y + M[11] * z + M[15];
      if(cw <= 0.01){ r.el.style.visibility = 'hidden'; continue; }
      const nx = (M[0] * x + M[4] * y + M[8] * z + M[12]) / cw, ny = (M[1] * x + M[5] * y + M[9] * z + M[13]) / cw;
      r.el.style.transform = 'translate(' + ((nx * 0.5 + 0.5) * w).toFixed(1) + 'px,' + ((-ny * 0.5 + 0.5) * h).toFixed(1) + 'px) translate(-50%,-50%)';
      r.el.style.visibility = '';
    }
  };
  raf = requestAnimationFrame(loop);
}
function stopLoop(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } }

function resize(){
  if(!W) return;
  const w = els.stage.clientWidth, h = els.stage.clientHeight;
  if(!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W.canvas.width = Math.round(w * dpr); W.canvas.height = Math.round(h * dpr);
}
if('ResizeObserver' in window) new ResizeObserver(resize).observe(els.stage);
window.addEventListener('resize', resize);

/* ---------------- botões e atalhos ---------------- */
els.close.addEventListener('click', closePlan);
overlay.addEventListener('click', e=>{ if(e.target === overlay) closePlan(); });
els.reset.addEventListener('click', ()=>{ select(null, false); resetView(true); });
els.walls.addEventListener('click', ()=>{
  wallMode = wallMode === 'auto' ? 'high' : wallMode === 'high' ? 'low' : 'auto';
  els.walls.querySelector('span').textContent = WALL_LABEL[wallMode];
});
els.photoClose.addEventListener('click', ()=>select(null, false));
els.photoPrev.addEventListener('click', ()=>stepPhoto(-1));
els.photoNext.addEventListener('click', ()=>stepPhoto(1));
els.photoBtn.addEventListener('click', ()=>{
  if(!els.photoImg.getAttribute('src')) return;
  els.lightImg.src = els.photoImg.src; els.lightImg.alt = els.photoImg.alt;
  els.lightbox.classList.add('show');
});
els.lightbox.addEventListener('click', ()=>els.lightbox.classList.remove('show'));

/* Esc fecha primeiro a foto ampliada, depois a planta (sem fechar o popup de trás) */
window.addEventListener('keydown', e=>{
  if(e.key !== 'Escape' || !isOpen()) return;
  e.stopImmediatePropagation();
  if(els.lightbox.classList.contains('show')) els.lightbox.classList.remove('show');
  else closePlan();
}, true);

window.openPlan = openPlan;
window.closePlan = closePlan;
})();
