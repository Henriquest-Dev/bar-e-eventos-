// Hero — viagem Istambul → Maputo.
// Cena top-down composta em camadas num <canvas>, com a câmara controlada pelo scroll:
//
//   0 chão (5 cenários, pan + zoom por altitude, crossfade escondido por bancos de nuvens)
//   1 névoa de altitude
//   2 sombras das nuvens no chão
//   3 nuvens baixas (parallax lento)
//   4 rota pontilhada
//   5 sombra do avião (afasta-se com a altitude, junta-se ao aterrar)
//   6 avião
//   7 nuvens altas desfocadas (parallax rápido, passam por cima do avião)
//   8 bancos de nuvens nas transições entre cenários
//
// Timeline (u = progresso do scroll, 0 → 1):
//   0.00–0.14 descolagem em Istambul (zoom out)   0.14–0.70 cruzeiro por 4 cenários
//   0.70–0.90 descida sobre Maputo (zoom in)      0.88–1.00 avião sai de cena, entra o restaurante
(() => {
  const $ = id => document.getElementById(id);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hero = $('top'), canvas = $('hero-canvas'), ctx = canvas.getContext('2d');
  const ui = {
    intro: $('intro'), chapter: $('chapter'), hud: $('hud'), route: $('route'), veil: $('veil'),
    arrival: $('arrival'), skip: $('skip-trip'), loader: $('loader'),
    n: $('ch-n'), city: $('ch-city'), coords: $('ch-coords'), line: $('ch-line'),
    alt: $('hud-alt'), spd: $('hud-spd'), dist: $('hud-dist'), fill: $('route-fill'), plane: $('route-plane'),
  };

  const CHAPTERS = [
    { city: 'Istambul', coords: '41.0082° N · 28.9784° E', line: 'Onde nasce o sabor.' },
    { city: 'Mediterrâneo', coords: '34.2000° N · 28.4000° E', line: 'Azeite, sol e especiarias.' },
    { city: 'África Oriental', coords: '3.3700° S · 36.6800° E', line: 'Pela antiga rota das especiarias.' },
    { city: 'Costa de Maputo', coords: '24.8000° S · 33.9000° E', line: 'O mar anuncia a chegada.' },
    { city: 'Maputo', coords: '25.9692° S · 32.5732° E', line: 'A Turquia chegou a Maputo.' },
  ];
  const PLATES = ['env_01_istambul', 'env_02_mediterraneo', 'env_03_africa_oriental', 'env_04_costa_maputo', 'env_05_maputo'];
  const BOUND = [0.19, 0.37, 0.54, 0.70];   // passagem de um cenário para o seguinte
  const BANK = 0.045;                       // meia-largura de cada banco de nuvens
  const LAND = 0.9;                         // fim da descida
  const DISTANCE_KM = 7459;                 // Istambul → Maputo (ortodrómica)

  // ---------- utilitários ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const rand = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
  const fmt = n => Math.round(n).toLocaleString('pt-PT').replace(/ | |\./g, ' ');

  // ---------- assets ----------
  const load = src => new Promise(res => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => res(null); i.src = 'assets/viagem/' + src; });
  const plates = [];
  let plane = null, cloud = null, cloudSoft = null, planeShadow = null, cloudShadow = null;

  function sprite(w, h, paint) { const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); return c; }

  const essentials = Promise.all([load(PLATES[0] + '.webp'), load('plane_01.webp'), load('cloud_01.webp')]).then(([p0, p, c]) => {
    plates[0] = p0; plane = p; cloud = c;
    if (c) {
      // nuvem desfocada para a camada mais próxima da câmara (profundidade de campo)
      cloudSoft = sprite(c.width, c.height, (g, w, h) => { g.filter = 'blur(10px)'; g.drawImage(c, 0, 0, w, h); });
      cloudShadow = sprite(c.width, c.height, (g, w, h) => {
        g.filter = 'blur(28px)'; g.drawImage(c, 0, 0, w, h);
        g.filter = 'none'; g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(0,18,26)'; g.fillRect(0, 0, w, h);
      });
    }
    if (p) planeShadow = sprite(p.width, p.height, (g, w, h) => {
      g.filter = 'blur(6px)'; g.drawImage(p, 0, 0, w, h);
      g.filter = 'none'; g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(0,14,20)'; g.fillRect(0, 0, w, h);
    });
    ui.loader.classList.add('is-done');
    requestDraw(true);
  });
  essentials.then(() => PLATES.slice(1).forEach((n, k) => load(n + '.webp').then(img => { plates[k + 1] = img; requestDraw(true); })));

  // Nuvens com posições fixas (seed), para a cena ser sempre igual no mesmo ponto do scroll
  const far = Array.from({ length: 7 }, () => ({ x: rand(), y: rand(), s: lerp(.16, .28, rand()), a: lerp(.35, .6, rand()), v: lerp(.9, 1.3, rand()) }));
  const near = Array.from({ length: 3 }, () => ({ x: rand(), y: rand(), s: lerp(.55, .8, rand()), a: lerp(.55, .8, rand()), v: lerp(2.2, 3, rand()) }));
  const banks = BOUND.map(() => Array.from({ length: 11 }, (_, i) => ({ x: (i + rand() * .6) / 10.5 - .05, y: rand() * .5, s: lerp(.5, .95, rand()), v: lerp(.85, 1.25, rand()), over: i % 3 === 0 })));

  // ---------- estado da câmara ----------
  function scene(u) {
    const takeoff = smooth(0, .14, u), descent = smooth(BOUND[3], LAND, u);
    const alt = takeoff * (1 - descent);                       // 0 no chão, 1 em cruzeiro
    const zoom = 1.3 + .62 * Math.pow(1 - alt, 1.6);           // perto do chão = mais perto do cenário

    // cenário atual e seguinte
    let a = BOUND.findIndex(b => u < b); if (a < 0) a = 4;
    let b = a, mix = 0, bank = -1, w = 0;
    BOUND.forEach((bd, i) => {
      if (Math.abs(u - bd) < BANK) { bank = i; w = (u - bd + BANK) / (2 * BANK); a = i; b = i + 1; mix = smooth(.38, .62, w); }
    });
    return { u, alt, zoom, a, b, mix, bank, w };
  }

  function pan(k, u) {
    // o chão desliza para baixo (voamos "para cima" no ecrã)
    const s = k ? BOUND[k - 1] : 0, e = k < 4 ? BOUND[k] : LAND;
    const t = clamp((u - s + BANK) / (e - s + 2 * BANK), -.2, 1.2);
    if (k === 4) return { x: .55 + .15 * Math.sin(u * 6), y: lerp(-.9, .15, easeInOut(clamp(t))) }; // cidade fica à esquerda do cenário
    return { x: .35 * Math.sin(u * 7 + k * 1.7), y: lerp(-.95, .95, t) };
  }

  // ---------- desenho ----------
  let W = 0, H = 0, dpr = 1, unit = 1, minSide = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    unit = Math.hypot(W, H) / 1469; minSide = Math.min(W, H);
    requestDraw(true);
  }

  function ground(img, zoom, p, alpha) {
    if (!img || alpha <= 0) return;
    const r = Math.max(W / img.width, H / img.height) * zoom;
    const rw = img.width * r, rh = img.height * r;
    const mx = (rw - W) / 2, my = (rh - H) / 2;
    const x = -mx + clamp(p.x, -1, 1) * mx, y = -my + clamp(p.y, -1, 1) * my;
    ctx.globalAlpha = alpha; ctx.drawImage(img, x, y, rw, rh); ctx.globalAlpha = 1;
  }

  function cloudAt(img, cx, cy, size, alpha) {
    if (!img || alpha <= .01) return;
    ctx.globalAlpha = alpha; ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size); ctx.globalAlpha = 1;
  }

  const wrap = (v, span) => ((v % span) + span) % span;

  function draw(u) {
    if (!W) return;
    const S = scene(u), big = Math.max(W, H);
    const travel = u * 9;                                      // distância percorrida (em alturas de ecrã)

    // 0 · chão
    ctx.fillStyle = '#103947'; ctx.fillRect(0, 0, W, H);
    ground(plates[S.a] || plates[0], S.zoom, pan(S.a, u), 1);
    if (S.mix > 0) ground(plates[S.b], S.zoom, pan(S.b, u), S.mix);

    // 1 · névoa de altitude (ar entre a câmara e o chão)
    ctx.fillStyle = `rgba(214,232,238,${(.14 * S.alt).toFixed(3)})`; ctx.fillRect(0, 0, W, H);

    // 2+3 · sombras e nuvens baixas: desaparecem perto do chão
    const cloudiness = smooth(.04, .2, S.alt);
    far.forEach(c => {
      const size = c.s * big * (1.25 - .25 * S.alt), span = H + size * 2;
      const x = c.x * (W + size) - size / 2, y = wrap(c.y * span + travel * H * c.v, span) - size;
      cloudAt(cloudShadow, x + .06 * big * S.alt, y + .09 * big * S.alt, size * .9, .38 * cloudiness);
    });
    far.forEach(c => {
      const size = c.s * big * (1.25 - .25 * S.alt), span = H + size * 2;
      const x = c.x * (W + size) - size / 2, y = wrap(c.y * span + travel * H * c.v * 1.25, span) - size;
      cloudAt(cloud, x, y, size, c.a * cloudiness);
    });

    // 8a · banco de nuvens (metade por baixo do avião)
    const bankLayer = over => {
      if (S.bank < 0) return;
      const fade = Math.sin(Math.PI * S.w);
      banks[S.bank].forEach(c => {
        if (c.over !== over) return;
        const size = c.s * big, y = lerp(-size, H + size, clamp(S.w * c.v + c.y * .35 - .15, 0, 1.1));
        cloudAt(over ? cloudSoft : cloud, c.x * W, y, size, fade * (over ? .85 : .95));
      });
    };
    bankLayer(false);

    // posição do avião
    const exit = easeInOut(smooth(.88, .99, u));
    const pw = minSide * (W < H ? .3 : .2) * (1 - .12 * (1 - S.alt));
    const ph = plane ? pw * plane.height / plane.width : pw;
    const px = W / 2 + .03 * W * Math.sin(u * 11) * S.alt;
    const py = lerp(H * .5, -ph, exit) + (1 - smooth(0, .1, u)) * H * .26;  // descola de baixo, por baixo do título
    const bankAngle = -5 * Math.sin(u * 11) * S.alt * Math.PI / 180;

    // 4 · rota pontilhada atrás do avião
    ctx.fillStyle = 'rgba(255,226,167,.8)';
    for (let i = 1; i <= 9; i++) {
      const d = i * .036 * minSide + ph * .45;
      const x = px - Math.sin(bankAngle) * d + Math.sin(u * 11 - i * .25) * 4 * unit;
      ctx.globalAlpha = (1 - i / 10) * .8 * smooth(.01, .06, u) * (1 - exit);
      ctx.beginPath(); ctx.arc(x, py + d, 2.4 * unit + .6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (plane) {
      // 5 · sombra do avião: longe e difusa em cruzeiro, colada ao avião ao aterrar
      const off = S.alt * .16 * minSide, ss = 1 - .35 * S.alt;
      ctx.save(); ctx.translate(px + off * .7, py + off); ctx.rotate(bankAngle);
      ctx.globalAlpha = lerp(.55, .2, S.alt) * (1 - exit);
      ctx.drawImage(planeShadow, -pw * ss / 2, -ph * ss / 2, pw * ss, ph * ss);
      ctx.restore();

      // 6 · avião
      ctx.save(); ctx.translate(px, py); ctx.rotate(bankAngle);
      ctx.drawImage(plane, -pw / 2, -ph / 2, pw, ph);
      ctx.restore();
    }

    // 7 · nuvens altas (perto da câmara): rápidas, desfocadas, passam por cima de tudo
    near.forEach(c => {
      const size = c.s * big, span = H + size * 2;
      const x = c.x * (W + size * .6) - size * .3, y = wrap(c.y * span + travel * H * c.v, span) - size;
      cloudAt(cloudSoft, x, y, size, c.a * cloudiness * .75);
    });

    // 8b · banco de nuvens por cima
    bankLayer(true);
  }

  // ---------- UI ----------
  let lastChapter = -1;
  function updateUI(u) {
    const S = scene(u);
    const introOut = smooth(.005, .05, u), arrive = smooth(.9, .99, u);
    const flying = introOut * (1 - smooth(.86, .91, u));

    ui.intro.style.opacity = 1 - introOut;
    ui.intro.style.transform = `translateY(${-introOut * 40}px) scale(${1 + introOut * .04})`;
    ui.chapter.style.opacity = flying;
    ui.hud.style.opacity = flying;
    ui.route.style.opacity = flying;
    ui.skip.hidden = u > .86;
    ui.veil.style.opacity = arrive;
    ui.arrival.style.opacity = arrive;
    ui.arrival.style.transform = `translateY(${(1 - arrive) * 30}px)`;
    ui.arrival.classList.toggle('is-on', arrive > .02);

    const ch = S.bank >= 0 ? (S.w < .5 ? S.a : S.b) : S.a;
    if (ch !== lastChapter) {
      const c = CHAPTERS[ch];
      ui.n.textContent = String(ch + 1).padStart(2, '0');
      ui.city.textContent = c.city; ui.coords.textContent = c.coords; ui.line.textContent = c.line;
      ui.chapter.classList.remove('is-swap'); void ui.chapter.offsetWidth; ui.chapter.classList.add('is-swap');
      lastChapter = ch;
    }

    const trip = smooth(.01, LAND, u);
    ui.alt.textContent = fmt(Math.round(S.alt * 10668 / 10) * 10) + ' m';
    ui.spd.textContent = fmt(u < .005 ? 0 : 260 + 640 * S.alt) + ' km/h';
    ui.dist.textContent = fmt(DISTANCE_KM * (1 - trip)) + ' km';
    ui.fill.style.width = (trip * 100).toFixed(2) + '%';
    ui.plane.style.left = (trip * 100).toFixed(2) + '%';
  }

  // ---------- scroll → timeline (com inércia suave) ----------
  let target = 0, current = 0, raf = 0, last = 0, dirty = false;
  const progress = () => { const r = hero.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };

  function frame(t) {
    const dt = Math.min(64, t - (last || t)); last = t;
    const k = 1 - Math.exp(-dt / 110);                          // amortecimento independente dos fps
    current = Math.abs(target - current) < 1e-4 ? target : lerp(current, target, k);
    draw(current); updateUI(current);
    dirty = false;
    raf = current !== target ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  }
  function requestDraw(force) {
    if (force) dirty = true;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  if (reduceMotion) {
    // sem scrub: mostra diretamente a chegada a Maputo
    target = current = .999;
    essentials.then(() => load(PLATES[4] + '.webp').then(img => { plates[4] = img; requestDraw(true); }));
    addEventListener('resize', resize);
    resize();
    return;
  }

  addEventListener('scroll', () => { target = progress(); requestDraw(); }, { passive: true });
  addEventListener('resize', () => { resize(); target = progress(); });
  ui.skip.addEventListener('click', () => {
    const r = hero.getBoundingClientRect();
    scrollTo({ top: scrollY + r.top + r.height - innerHeight, behavior: 'smooth' });
  });
  // pausa quando a aba não está visível
  document.addEventListener('visibilitychange', () => { if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; } else requestDraw(true); });

  resize(); target = current = progress(); requestDraw(true);
})();
