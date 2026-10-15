/* Angle Finder: frame a still view from any equirectangular panorama.
   Wide lenses, Panini and fisheye projections, straight verticals with lens shift,
   tilt, framing presets, and a high-resolution capture.
   Usage: AngleFinder.open({ url, vaov:180, voff:0, yaw:0, pitch:0, hfov:90, title:"...",
            canMove(dir, yaw) -> bool, move(dir, yaw) -> { url, vaov, voff, yaw, title } | null })
   dir is relative to the view: 0 forward, -90 left, 90 right, 180 back. canMove / move are optional.
   yaw / pitch / hfov in degrees, yaw positive to the right of the panorama centre. */
(function () {
  const CSS = `
  .af{position:fixed;inset:0;z-index:1000;display:grid;grid-template-columns:1fr 300px;background:#0d0d0d;color:#f2f2f0;
      font:13px/1.4 "Hanken Grotesk","Inter",system-ui,sans-serif}
  .af[hidden]{display:none}
  .af *{box-sizing:border-box}
  .af-stage{position:relative;min-width:0;display:grid;place-items:center;overflow:hidden;background:#0d0d0d;touch-action:none;cursor:grab}
  .af-stage:active{cursor:grabbing}
  .af-stage canvas{display:block;background:#000;box-shadow:0 0 0 1px #3a3a38}
  .af-grid{position:absolute;pointer-events:none}
  .af-side{background:#161615;border-left:1px solid #2c2c2a;display:flex;flex-direction:column;min-height:0;overflow:auto;
      padding:16px max(16px,env(safe-area-inset-right,0px)) 16px 16px;gap:14px}
  .af-h{font-family:"Marcellus","Cormorant Garamond",Georgia,serif;font-size:20px;line-height:1.1}
  .af-sub{font:11px "IBM Plex Mono",ui-monospace,monospace;color:#9a9a95;word-break:break-all}
  .af-sec{display:flex;flex-direction:column;gap:6px}
  .af-lab{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#9a9a95;display:flex;justify-content:space-between}
  .af-lab b{font:500 11px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:0;color:#f2f2f0;text-transform:none}
  .af input[type=range]{width:100%;accent-color:#f2f2f0}
  .af-seg{display:flex;flex-wrap:wrap;gap:4px}
  .af-seg button,.af-btn{font:inherit;font-size:12px;padding:6px 9px;border:1px solid #3a3a38;background:transparent;color:#f2f2f0;cursor:pointer;border-radius:2px}
  .af-seg button[aria-pressed=true]{background:#f2f2f0;color:#111;border-color:#f2f2f0}
  .af-btn.solid{background:#f2f2f0;color:#111;border-color:#f2f2f0;font-weight:600}
  .af-seg button:focus-visible,.af-btn:focus-visible{outline:2px solid #ff5a4f;outline-offset:2px}
  .af-chk{display:flex;gap:8px;align-items:center;cursor:pointer}
  .af-move{display:grid;grid-template-columns:1fr 1fr;grid-template-areas:"f f" "l r" "b b";gap:4px}
  .af-move button{font:inherit;font-size:12px;padding:7px 9px;border:1px solid #3a3a38;background:transparent;color:#f2f2f0;cursor:pointer;border-radius:2px}
  .af-move button:hover:not(:disabled){background:#f2f2f0;color:#111}
  .af-move button:disabled{opacity:.3;cursor:default}
  .af-move button:focus-visible{outline:2px solid #ff5a4f;outline-offset:2px}
  .af-note{font-size:11.5px;color:#9a9a95;line-height:1.45}
  .af-row{display:flex;gap:6px;flex-wrap:wrap}
  .af-shot{position:fixed;inset:0;z-index:1001;background:rgba(10,10,10,.92);display:grid;place-items:center;padding:24px 16px}
  .af-shot figure{margin:0;background:#161615;border:1px solid #2c2c2a;padding:12px;max-width:min(1200px,100%);display:flex;flex-direction:column;gap:10px}
  .af-shot img{max-width:100%;max-height:72vh;width:auto;display:block}
  @media (max-width:760px){.af{grid-template-columns:1fr;grid-template-rows:1fr auto}.af-side{border-left:0;border-top:1px solid #2c2c2a;max-height:48vh}}
  `;
  const VS = `attribute vec2 p;varying vec2 q;void main(){q=p;gl_Position=vec4(p,0.,1.);}`;
  const FS = `precision highp float;varying vec2 q;
  uniform sampler2D tex;uniform float aspect,halfTan,yaw,pitch,roll,shiftY,shiftX,vaov,voff,panD;uniform int proj;uniform bool straight;
  const float PI=3.14159265359;
  void main(){
    vec2 s=vec2(q.x*aspect,q.y);           // screen, x in [-aspect,aspect], y in [-1,1]
    vec3 d;
    if(proj==0){                            // rectilinear with lens shift
      vec2 r=s*halfTan/aspect; r+=vec2(shiftX,shiftY); d=normalize(vec3(r,1.));
    } else if(proj==1){                     // panini
      vec2 r=s*halfTan/aspect; r+=vec2(shiftX,shiftY);
      float D=panD; float k=r.x*r.x/((D+1.)*(D+1.));
      float dscr=k*k*D*D-(k+1.)*(k*D*D-1.);
      float clon=(-k*D+sqrt(max(dscr,0.)))/(k+1.);
      float S=(D+1.)/(D+clon);
      float lon=atan(r.x,S*clon); float lat=atan(r.y,S);
      d=vec3(sin(lon)*cos(lat),sin(lat),cos(lon)*cos(lat));
    } else {                                // stereographic (fisheye)
      vec2 r=s*halfTan/aspect; r+=vec2(shiftX,shiftY);
      float rr=length(r); float th=2.*atan(rr/2.);
      vec2 dir2=rr>0.?r/rr:vec2(0.);
      d=vec3(dir2*sin(th),cos(th));
    }
    // roll
    float cr=cos(roll),sr=sin(roll); d=vec3(cr*d.x-sr*d.y,sr*d.x+cr*d.y,d.z);
    // pitch (skipped when verticals are kept straight)
    if(!straight){float cp=cos(pitch),sp=sin(pitch); d=vec3(d.x,cp*d.y+sp*d.z,-sp*d.y+cp*d.z);}
    // yaw
    float cy=cos(yaw),sy=sin(yaw); d=vec3(cy*d.x+sy*d.z,d.y,-sy*d.x+cy*d.z);
    float lon=atan(d.x,d.z); float lat=asin(clamp(d.y,-1.,1.));
    float u=0.5+lon/(2.*PI);
    float v=0.5-(lat-voff)/vaov;
    if(v<0.||v>1.){gl_FragColor=vec4(.08,.08,.08,1.);return;}
    gl_FragColor=texture2D(tex,vec2(u,v));
  }`;
  const ASPECTS = [["Screen", 0], ["16:9", 16 / 9], ["3:2", 3 / 2], ["4:5", 4 / 5], ["1:1", 1]];
  const PROJ = [["Standard lens", 0], ["Panini (wide interiors)", 1], ["Fisheye", 2]];
  const D2R = Math.PI / 180;
  let root, gl, prog, texObj, st, img, U = {}, styleDone = false;

  function el(tag, attrs, html) { const e = document.createElement(tag); Object.assign(e, attrs || {}); if (html != null) e.innerHTML = html; return e; }

  function build() {
    if (!styleDone) { document.head.appendChild(el("style", {}, CSS)); styleDone = true; }
    root = el("div", { className: "af", role: "dialog" });
    root.setAttribute("aria-label", "Angle finder");
    root.innerHTML = `
      <div class="af-stage" id="afStage"><canvas id="afCanvas"></canvas><svg class="af-grid" id="afGrid"></svg></div>
      <div class="af-side">
        <div><div class="af-h">Angle Finder</div><div class="af-sub" id="afTitle"></div></div>
        <div class="af-sec" id="afMoveWrap"><div class="af-lab">Move to the next spot <b>keeps your angle</b></div>
          <div class="af-move">
            <button type="button" data-dir="0" style="grid-area:f">&#9650; Forward</button>
            <button type="button" data-dir="-90" style="grid-area:l">&#9664; Left</button>
            <button type="button" data-dir="90" style="grid-area:r">Right &#9654;</button>
            <button type="button" data-dir="180" style="grid-area:b">&#9660; Back</button>
          </div></div>
        <div class="af-sec"><div class="af-lab">Lens</div><div class="af-seg" id="afProj"></div></div>
        <div class="af-sec"><div class="af-lab">Field of view <b id="afFovV"></b></div><input type="range" id="afFov" min="20" max="170" step="1"></div>
        <label class="af-chk"><input type="checkbox" id="afStraight" checked> Keep verticals straight</label>
        <div class="af-sec"><div class="af-lab">Look up or down <b id="afPitchV"></b></div><input type="range" id="afPitch" min="-80" max="80" step="0.5"></div>
        <div class="af-sec" id="afShiftWrap"><div class="af-lab">Rise / fall (lens shift) <b id="afShiftV"></b></div><input type="range" id="afShift" min="-1.2" max="1.2" step="0.01"></div>
        <div class="af-sec"><div class="af-lab">Slide left / right <b id="afShiftXV"></b></div><input type="range" id="afShiftX" min="-1" max="1" step="0.01"></div>
        <div class="af-sec"><div class="af-lab">Tilt <b id="afRollV"></b></div><input type="range" id="afRoll" min="-20" max="20" step="0.1"></div>
        <div class="af-sec" id="afPanWrap"><div class="af-lab">Panini strength <b id="afPanV"></b></div><input type="range" id="afPan" min="0" max="1.5" step="0.05"></div>
        <div class="af-sec"><div class="af-lab">Frame</div><div class="af-seg" id="afAspect"></div></div>
        <label class="af-chk"><input type="checkbox" id="afThirds" checked> Show thirds and horizon</label>
        <div class="af-row">
          <button class="af-btn solid" id="afCapture" type="button">Capture</button>
          <button class="af-btn" id="afReset" type="button">Reset</button>
          <button class="af-btn" id="afClose" type="button">Back to 360</button>
        </div>
        <div class="af-note">Drag the picture to aim. Scroll or pinch to change the field of view. Keep verticals straight gives a two-point architectural perspective: use Rise / fall instead of tilting the camera. Capture renders at up to 4000 px wide; sharpness is limited by the panorama loaded.</div>
      </div>`;
    document.body.appendChild(root);
    const $ = id => root.querySelector("#" + id);
    PROJ.forEach(([n, v]) => { const b = el("button", { type: "button", textContent: n }); b.dataset.v = v; b.onclick = () => { st.proj = v; sync(); }; $("afProj").appendChild(b); });
    ASPECTS.forEach(([n, v]) => { const b = el("button", { type: "button", textContent: n }); b.dataset.v = v; b.onclick = () => { st.aspect = v; layout(); sync(); }; $("afAspect").appendChild(b); });
    const bind = (id, key, f) => $(id).addEventListener("input", e => { st[key] = f ? f(+e.target.value) : +e.target.value; sync(); });
    bind("afFov", "fov"); bind("afPitch", "pitch"); bind("afShift", "shift"); bind("afShiftX", "shiftX"); bind("afRoll", "roll"); bind("afPan", "panD");
    $("afStraight").addEventListener("change", e => { st.straight = e.target.checked; sync(); });
    $("afThirds").addEventListener("change", e => { st.thirds = e.target.checked; sync(); });
    $("afClose").onclick = close;
    $("afReset").onclick = () => { Object.assign(st, defaults(st.yaw0, 0, 90)); layout(); sync(); };
    $("afCapture").onclick = capture;
    root.querySelectorAll(".af-move button").forEach(b => b.onclick = () => step(+b.dataset.dir));
    document.addEventListener("keydown", onKey);
    // drag to aim
    const stage = $("afStage"); let drag = null;
    stage.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, yaw: st.yaw, pitch: st.pitch, shift: st.shift }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener("pointermove", e => {
      if (!drag) return; const c = $("afCanvas"); const k = st.fov / c.clientWidth;
      st.yaw = drag.yaw - (e.clientX - drag.x) * k;
      if (st.straight) st.shift = Math.max(-1.2, Math.min(1.2, drag.shift + (e.clientY - drag.y) * k * D2R * 1.2));
      else st.pitch = Math.max(-80, Math.min(80, drag.pitch + (e.clientY - drag.y) * k));
      sync();
    });
    stage.addEventListener("pointerup", () => drag = null); stage.addEventListener("pointercancel", () => drag = null);
    stage.addEventListener("wheel", e => { e.preventDefault(); st.fov = Math.max(20, Math.min(170, st.fov * Math.exp(e.deltaY * 0.0012))); sync(); }, { passive: false });
    window.addEventListener("resize", layout);
    // gl
    const c = $("afCanvas");
    gl = c.getContext("webgl", { preserveDrawingBuffer: true, antialias: false });
    if (!gl) { $("afTitle").textContent = "This browser has WebGL switched off, so the Angle Finder cannot run."; return; }
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ["tex", "aspect", "halfTan", "yaw", "pitch", "roll", "shiftY", "shiftX", "vaov", "voff", "panD", "proj", "straight"].forEach(n => U[n] = gl.getUniformLocation(prog, n));
    texObj = gl.createTexture();
  }
  function defaults(yaw, pitch, fov) { return { yaw0: yaw, yaw, pitch: 0, shift: Math.tan(pitch * D2R) * 0.9, shiftX: 0, fov: Math.max(60, fov), roll: 0, proj: 0, panD: 1, straight: true, aspect: st ? st.aspect : 0, thirds: true }; }
  function onKey(e) {
    if (!root || root.hidden) return;
    if (e.key === "Escape") { const s = document.querySelector(".af-shot"); if (s) s.remove(); else close(); return; }
    // arrow keys move between spots, unless a slider has focus
    const keys = { ArrowUp: 0, ArrowLeft: -90, ArrowRight: 90, ArrowDown: 180 };
    if (e.key in keys && !(document.activeElement && document.activeElement.type === "range") && !document.querySelector(".af-shot")) {
      e.preventDefault(); step(keys[e.key]);
    }
  }

  // Move to a neighbouring spot. The host decides which spot lies in that direction and
  // returns its panorama plus the yaw that keeps the same real-world heading; every other
  // setting (lens, field of view, shift, tilt, frame) stays as it is.
  let moving = false;
  function step(dir) {
    if (moving || !opts.move) return;
    const r = opts.move(dir, st.yaw);
    if (!r) return;
    moving = true;
    opts = Object.assign({}, opts, r);
    root.querySelector("#afTitle").textContent = opts.title;
    load(opts.url, () => { st.yaw = st.yaw0 = r.yaw; moving = false; sync(); });
  }
  function syncMoves() {
    const wrap = root.querySelector("#afMoveWrap");
    wrap.hidden = !opts.canMove;
    if (!opts.canMove) return;
    root.querySelectorAll(".af-move button").forEach(b => { b.disabled = !opts.canMove(+b.dataset.dir, st.yaw); });
  }

  function halfTanFor(proj, fov) {
    const h = Math.min(fov, 178) * D2R / 2;
    if (proj === 0) return Math.tan(Math.min(h, 1.53));
    if (proj === 2) return 2 * Math.tan(h / 2);
    const D = st.panD; return (D + 1) * Math.sin(h) / (D + Math.cos(h)); // panini half-width
  }
  function layout() {
    const stage = root.querySelector("#afStage"), c = root.querySelector("#afCanvas");
    const W = stage.clientWidth - 32, H = stage.clientHeight - 32;
    let w = W, h = H;
    if (st.aspect) { if (W / H > st.aspect) { w = H * st.aspect; } else { h = W / st.aspect; } }
    c.style.width = Math.round(w) + "px"; c.style.height = Math.round(h) + "px";
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g = root.querySelector("#afGrid"); g.style.width = c.style.width; g.style.height = c.style.height;
    g.setAttribute("viewBox", `0 0 ${Math.round(w)} ${Math.round(h)}`);
    draw();
  }
  function draw(target) {
    if (!gl || !img) return;
    const c = target || gl.canvas;
    gl.viewport(0, 0, c.width, c.height);
    gl.uniform1f(U.aspect, c.width / c.height);
    gl.uniform1f(U.halfTan, halfTanFor(st.proj, st.fov));
    gl.uniform1f(U.yaw, st.yaw * D2R); gl.uniform1f(U.pitch, st.pitch * D2R); gl.uniform1f(U.roll, st.roll * D2R);
    gl.uniform1f(U.shiftY, st.shift); gl.uniform1f(U.shiftX, st.shiftX);
    gl.uniform1f(U.vaov, opts.vaov * D2R); gl.uniform1f(U.voff, (opts.voff || 0) * D2R); gl.uniform1f(U.panD, st.panD);
    gl.uniform1i(U.proj, st.proj); gl.uniform1i(U.straight, st.straight ? 1 : 0); gl.uniform1i(U.tex, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function sync() {
    const $ = id => root.querySelector("#" + id);
    $("afFov").value = st.fov; $("afFovV").textContent = Math.round(st.fov) + "°";
    $("afPitch").value = st.pitch; $("afPitchV").textContent = st.straight ? "locked" : st.pitch.toFixed(1) + "°";
    $("afPitch").disabled = st.straight;
    $("afShift").value = st.shift; $("afShiftV").textContent = (st.shift >= 0 ? "+" : "") + st.shift.toFixed(2);
    $("afShiftX").value = st.shiftX; $("afShiftXV").textContent = (st.shiftX >= 0 ? "+" : "") + st.shiftX.toFixed(2);
    $("afRoll").value = st.roll; $("afRollV").textContent = st.roll.toFixed(1) + "°";
    $("afPan").value = st.panD; $("afPanV").textContent = st.panD.toFixed(2); $("afPanWrap").hidden = st.proj !== 1;
    $("afStraight").checked = st.straight;
    root.querySelectorAll("#afProj button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.v === st.proj));
    root.querySelectorAll("#afAspect button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.v === st.aspect));
    const g = $("afGrid"); const [, , w, h] = (g.getAttribute("viewBox") || "0 0 0 0").split(" ").map(Number);
    g.innerHTML = st.thirds ? `<g stroke="rgba(255,255,255,.45)" stroke-width="1" fill="none">
      <line x1="${w / 3}" y1="0" x2="${w / 3}" y2="${h}"/><line x1="${2 * w / 3}" y1="0" x2="${2 * w / 3}" y2="${h}"/>
      <line x1="0" y1="${h / 3}" x2="${w}" y2="${h / 3}"/><line x1="0" y1="${2 * h / 3}" x2="${w}" y2="${2 * h / 3}"/></g>` + horizonLine(w, h) : "";
    syncMoves();
    draw();
  }
  function horizonLine(w, h) {
    if (st.proj !== 0) return "";
    // where the true horizon falls (rectilinear only)
    const ht = halfTanFor(0, st.fov), aspect = w / h;
    let y;
    if (st.straight) y = h / 2 + (st.shift / (ht / aspect)) * h / 2;
    else y = h / 2 + (Math.tan(st.pitch * D2R) / (ht / aspect)) * h / 2;
    if (y < 0 || y > h) return "";
    return `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="rgba(255,90,79,.8)" stroke-dasharray="6 5" stroke-width="1.2"/>`;
  }
  function capture() {
    const c = gl.canvas, ratio = c.width / c.height;
    const outW = Math.min(4000, Math.max(1600, Math.round(img.naturalWidth * st.fov / 360 * 1.15)));
    const outH = Math.round(outW / ratio);
    const ow = c.width, oh = c.height;
    c.width = outW; c.height = outH; draw(c);
    let url; try { url = c.toDataURL("image/jpeg", 0.93); } catch (e) { url = null; }
    c.width = ow; c.height = oh; draw();
    const shot = el("div", { className: "af-shot" });
    const lens = PROJ.find(p => p[1] === st.proj)[0];
    shot.innerHTML = `<figure>${url ? `<img alt="Captured view">` : ""}<figcaption class="af-note">${url ? `${outW} × ${outH} px · ${lens} · ${Math.round(st.fov)}° field of view${st.straight ? " · verticals straight" : ""}. Right-click the image and choose Save image or Copy image.` : "This browser would not export the picture."}</figcaption><div class="af-row"><button class="af-btn solid" type="button">Close</button></div></figure>`;
    if (url) shot.querySelector("img").src = url;
    shot.querySelector("button").onclick = () => shot.remove();
    document.body.appendChild(shot);
  }
  let opts = {};
  function load(url, cb) {
    const im = new Image(); im.crossOrigin = "anonymous";
    im.onload = () => {
      img = im; gl.bindTexture(gl.TEXTURE_2D, texObj);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      cb && cb();
    };
    im.onerror = () => { root.querySelector("#afTitle").textContent = "Could not load this panorama."; };
    im.src = url;
  }
  function open(o) {
    opts = Object.assign({ vaov: 180, voff: 0, yaw: 0, pitch: 0, hfov: 90, title: "" }, o);
    if (!root) build(); root.hidden = false; document.documentElement.style.overflow = "hidden";
    st = Object.assign(defaults(opts.yaw, opts.pitch, opts.hfov), { aspect: st ? st.aspect : 0 });
    root.querySelector("#afTitle").textContent = opts.title;
    if (!gl) return;
    load(opts.url, () => { layout(); sync(); });
  }
  function close() { if (root) root.hidden = true; document.documentElement.style.overflow = ""; opts.onClose && opts.onClose(); }
  window.AngleFinder = { open, close };
})();
