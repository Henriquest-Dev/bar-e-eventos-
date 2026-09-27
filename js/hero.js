// Hero — a travessia de Istambul a Maputo.
// O vídeo ilustrado foi convertido em 120 imagens; o scroll escolhe a imagem e o canvas
// funde a atual com a seguinte, para o movimento ser contínuo nos dois sentidos.
// O scroll é o nativo do navegador: só se lê a posição, nunca se intercepta.
(() => {
  const $ = id => document.getElementById(id);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { $('reveal').classList.add('is-on'); return; }

  const FRAMES = 120;
  const VIDEO_END = .86;                 // o resto do scroll segura a última imagem para a chegada
  const small = matchMedia('(max-width: 760px)').matches;
  const dir = `assets/viagem-mar/${small ? 'm' : 'd'}/`;

  const STOPS = [
    { until: .30, place: 'Istambul', text: 'Onde aprendemos a cozinhar: carne na brasa, pão acabado de sair do forno e chá servido em copo de vidro.' },
    { until: .66, place: 'A travessia', text: 'Muitos dias de mar, com as especiarias e as receitas de família na bagagem.' },
    { until: 1.01, place: 'Maputo', text: 'Chegámos. A mesa agora é posta aqui, com os mesmos sabores.' },
  ];

  const hero = $('top'), canvas = $('hero-canvas'), ctx = canvas.getContext('2d');
  const story = $('story'), reveal = $('reveal'), hint = $('hint'), skip = $('skip-trip'), boat = $('route-boat');

  // ---------- imagens: carregamento progressivo ----------
  // Primeiro de 8 em 8 (a viagem toda fica navegável logo), depois 4, 2 e 1.
  const img = new Array(FRAMES);
  const order = [];
  [8, 4, 2, 1].forEach(step => { for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i); });
  if (!order.includes(FRAMES - 1)) order.splice(1, 0, FRAMES - 1);

  let cursor = 0;
  function loadNext() {
    if (cursor >= order.length) return;
    const i = order[cursor++], im = new Image();
    im.decoding = 'async';
    im.onload = () => { img[i] = im; if (Math.abs(i - current * (FRAMES - 1) / VIDEO_END) < 10) draw(true); loadNext(); };
    im.onerror = loadNext;
    im.src = dir + String(i).padStart(3, '0') + '.webp';
  }
  for (let k = 0; k < 4; k++) loadNext();     // 4 pedidos em paralelo

  // imagem carregada mais próxima (para nunca mostrar vazio enquanto carrega)
  function nearest(i) {
    for (let d = 0; d < FRAMES; d++) {
      if (img[i - d]) return img[i - d];
      if (img[i + d]) return img[i + d];
    }
    return null;
  }

  // ---------- desenho ----------
  let W = 0, H = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    draw(true);
  }

  function cover(im, alpha) {
    // cobre o ecrã; em retrato o barco fica ao centro, ligeiramente abaixo
    const r = Math.max(W / im.width, H / im.height), w = im.width * r, h = im.height * r;
    const fx = .5, fy = W < H ? .6 : .5;
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, (W - w) * fx, (H - h) * fy, w, h);
  }

  let lastKey = '';
  function draw(force) {
    if (!W) return;
    const f = Math.min(1, current / VIDEO_END) * (FRAMES - 1);
    const a = Math.floor(f), b = Math.min(FRAMES - 1, a + 1), t = f - a;
    const A = img[a] || nearest(a), B = img[b];
    const key = a + ':' + (t * 20 | 0);
    if (!force && key === lastKey) return;
    lastKey = key;
    if (!A) return;
    cover(A, 1);
    if (B && B !== A && t > .02) cover(B, t);
    ctx.globalAlpha = 1;
  }

  // ---------- texto ----------
  let lastStop = -1;
  function updateUI(u) {
    const trip = Math.min(1, u / VIDEO_END);
    const s = STOPS.findIndex(x => trip < x.until);
    if (s !== lastStop) {
      $('story-n').textContent = s + 1;
      $('story-place').textContent = STOPS[s].place;
      $('story-text').textContent = STOPS[s].text;
      story.classList.remove('is-swap'); void story.offsetWidth; story.classList.add('is-swap');
      lastStop = s;
    }
    boat.style.left = (trip * 100).toFixed(2) + '%';
    hint.style.opacity = u > .015 ? 0 : 1;

    // chegada: a legenda sai e a cartela do restaurante entra
    const arrive = Math.min(1, Math.max(0, (u - .84) / .1));
    story.style.opacity = 1 - arrive;
    story.style.transform = `translateY(${arrive * 16}px)`;
    story.style.visibility = arrive > .99 ? 'hidden' : 'visible';
    reveal.style.opacity = arrive;
    reveal.style.transform = `translateY(${(1 - arrive) * 18}px)`;
    reveal.classList.toggle('is-on', arrive > .01);
    skip.hidden = arrive > .5;
  }

  // ---------- scroll nativo → progresso (com leve amortecimento) ----------
  let target = 0, current = 0, raf = 0, last = 0;
  const progress = () => { const r = hero.getBoundingClientRect(); return Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };

  function frame(now) {
    const dt = Math.min(64, now - (last || now)); last = now;
    current += (target - current) * (1 - Math.exp(-dt / 70));
    if (Math.abs(target - current) < 1e-4) current = target;
    draw(); updateUI(current);
    if (current !== target) raf = requestAnimationFrame(frame); else { raf = 0; last = 0; }
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  addEventListener('scroll', () => { target = progress(); kick(); }, { passive: true });
  addEventListener('resize', () => { resize(); target = progress(); kick(); });
  skip.addEventListener('click', () => {
    const r = hero.getBoundingClientRect();
    scrollTo({ top: scrollY + r.top + r.height - innerHeight, behavior: 'smooth' });
  });

  resize();
  target = current = progress();
  updateUI(current); draw(true);
})();
