// Viagem Istambul → Maputo, desenhada em canvas a partir dos 5 cenários + avião + nuvem.
// Reproduz a lógica de compose_premium.py (zoom/drift, crossfade, rota, nuvens),
// mas controlada pelo scroll em vez de 300 frames pré-renderizados.
(() => {
  const BASE = 'assets/viagem/';
  const PLATES = ['env_01_istambul', 'env_02_mediterraneo', 'env_03_africa_oriental', 'env_04_costa_maputo', 'env_05_maputo'];
  const mobile = matchMedia('(max-width: 900px)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const section = document.getElementById('journey');
  const canvas = document.getElementById('journey-canvas');
  const ctx = canvas.getContext('2d');
  const bar = document.getElementById('progress');
  const hint = document.getElementById('scroll-hint');
  const chapters = [...document.querySelectorAll('.chapters li')];

  const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const plates = PLATES.map(() => null);
  let plane = null, cloud = null;

  // Primeiro cenário antes de tudo; o resto carrega em seguida.
  load(BASE + PLATES[0] + (mobile ? '-m' : '') + '.webp').then(img => { plates[0] = img; draw(); });
  Promise.all([load(BASE + 'plane_01.webp'), load(BASE + 'cloud_01.webp')]).then(([p, c]) => { plane = p; cloud = c; draw(); });
  PLATES.slice(1).forEach((n, k) => load(BASE + n + (mobile ? '-m' : '') + '.webp').then(img => { plates[k + 1] = img; draw(); }));

  let W = 0, H = 0, S = 1, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = Math.max(W / 1280, H / 720); // escala relativa à composição original 1280×720
    draw();
  }

  function plan(u) {
    const pos = u * 4;
    let a = Math.min(3, Math.floor(pos)), q = pos - a, b = a, mix = 0;
    if (q >= 0.72) { b = a + 1; const z = (q - 0.72) / 0.28; mix = z * z * (3 - 2 * z); }
    if (u >= 0.995) { a = b = 4; mix = 0; }
    return { a, b, mix };
  }

  function drawPlate(img, u, stage, alpha) {
    if (!img || alpha <= 0) return;
    const ratio = Math.max(W / img.width, H / img.height) * (1.07 + 0.075 * u);
    const rw = img.width * ratio, rh = img.height * ratio;
    let x = (W - rw) / 2 - 20 * S * Math.sin(u * 5.5 + stage * 0.8);
    let y = (H - rh) / 2 - 18 * S * Math.cos(u * 4.4 + stage * 0.9);
    x = Math.min(0, Math.max(W - rw, x)); y = Math.min(0, Math.max(H - rh, y));
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x, y, rw, rh);
    ctx.globalAlpha = 1;
  }

  const shadow = document.createElement('canvas');
  shadow.width = 400; shadow.height = 190;
  (c => { c.filter = 'blur(23px)'; c.fillStyle = 'rgba(0,22,33,.1)'; c.beginPath(); c.ellipse(200, 95, 140, 35, 0, 0, Math.PI * 2); c.fill(); })(shadow.getContext('2d'));

  const FRAMES = 300; // mantém a velocidade das nuvens do original
  function draw() {
    if (!W) return;
    const u = current, f = u * (FRAMES - 1);
    const { a, b, mix } = plan(u);
    const cx = W / 2, cy = H / 2 - 16 * S;

    ctx.fillStyle = '#103947'; ctx.fillRect(0, 0, W, H);
    // Enquanto o cenário seguinte ainda não carregou, fica o atual.
    drawPlate(plates[a] || plates[0], u, a, 1);
    if (mix) drawPlate(plates[b], u, b, mix);

    // Sombras das nuvens (sprite desfocado pré-renderizado: blur por frame é caro no telemóvel)
    for (let j = 0; j < 4; j++) {
      const x = ((j * 420 + f * (1.3 + j * 0.2)) % 1880 - 300) * W / 1280;
      const y = ((j * 273 + f * (0.7 + j * 0.13)) % 1020 - 150) * H / 720;
      ctx.drawImage(shadow, x - 200 * S, y - 95 * S, 400 * S, 190 * S);
    }

    // Rota pontilhada atrás do avião
    ctx.fillStyle = 'rgba(255,226,167,.72)';
    for (let y = 470; y < 690; y += 23) {
      const x = 640 + 32 * Math.sin(y / 135 + u * 4);
      ctx.beginPath(); ctx.arc(cx + (x - 640) * S, cy + (y - 344) * S, 3 * S, 0, Math.PI * 2); ctx.fill();
    }

    // Avião
    if (plane) {
      const pw = (127 + u * 20) * S, ph = pw * plane.height / plane.width;
      ctx.save();
      ctx.translate(cx + 14 * S * Math.sin(u * 8), cy);
      ctx.rotate((-6 * Math.sin(u * 9)) * Math.PI / 180);
      ctx.shadowColor = 'rgba(0,20,30,.35)'; ctx.shadowBlur = 18 * S; ctx.shadowOffsetX = 12 * S; ctx.shadowOffsetY = 18 * S;
      ctx.drawImage(plane, -pw / 2, -ph / 2, pw, ph);
      ctx.restore();
    }

    // Nuvens em primeiro plano
    if (cloud) {
      for (let j = 0; j < 5; j++) {
        const x = ((j * 339 + f * (0.6 + j * 0.27)) % 1700 - 250) * W / 1280;
        const y = ((j * 151 + f * (0.36 + j * 0.13)) % 1000 - 150) * H / 720;
        const s = (0.16 + (j % 3) * 0.055) * 1254 * S; // tamanho relativo à nuvem original
        ctx.globalAlpha = 0.22 + (j % 2) * 0.11;
        ctx.drawImage(cloud, x, y, s, s);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Scroll → progresso, com um pouco de inércia
  let target = 0, current = 0, raf = 0;
  function progress() {
    const r = section.getBoundingClientRect();
    const total = r.height - innerHeight;
    return Math.min(1, Math.max(0, -r.top / total));
  }
  function updateUI(u) {
    bar.style.width = (u * 100).toFixed(2) + '%';
    hint.style.opacity = u > 0.02 ? 0 : 1;
    const active = Math.min(4, Math.floor(u * 4 + 0.15));
    chapters.forEach((li, i) => li.classList.toggle('is-active', i === active));
  }
  function tick() {
    const d = target - current;
    current = Math.abs(d) < 0.0005 || reduceMotion ? target : current + d * 0.12;
    draw(); updateUI(current);
    raf = current !== target ? requestAnimationFrame(tick) : 0;
  }
  function onScroll() { target = progress(); if (!raf) raf = requestAnimationFrame(tick); }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', resize);
  resize(); onScroll();
})();
