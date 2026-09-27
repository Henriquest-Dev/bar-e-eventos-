(() => {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MENU = window.MENU, CATS = window.CATS;
  const img = id => `assets/dishes/${id}.webp`;

  /* ---------- navegação ---------- */
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('is-scrolled', scrollY > 8);

  /* ---------- menu em destaque (referência 2) ---------- */
  const rail = $('#sc-rail'), plate = $('#sc-plate'), head = $('.showcase__head');
  let index = MENU.findIndex(d => d.id === 'sis');

  rail.innerHTML = MENU.map((d, i) => `
    <button class="rail__item" role="option" id="opt-${d.id}" data-i="${i}" aria-selected="false">
      <img src="${img(d.id)}" alt="" loading="lazy" width="152" height="152">
      <span>${d.pt}</span>
    </button>`).join('');
  const items = [...rail.children];

  // pré-carregar os pratos para a troca não piscar
  MENU.forEach(d => { const i = new Image(); i.src = img(d.id); });

  function render(i, dir) {
    const d = MENU[i];
    $('#sc-cat').textContent = CATS[d.cat];
    $('#sc-tr').textContent = d.tr;
    $('#sc-pt').textContent = d.pt;
    $('#sc-desc').textContent = d.desc;
    $('#sc-ingr').innerHTML = d.ingr.map(x => `<li>${x}</li>`).join('');
    items.forEach((el, k) => el.setAttribute('aria-selected', String(k === i)));
    rail.setAttribute('aria-activedescendant', `opt-${d.id}`);
    // centra a miniatura só dentro do carrossel (scrollIntoView também moveria a página)
    const it = items[i];
    rail.scrollTo({ left: it.offsetLeft - (rail.clientWidth - it.offsetWidth) / 2, behavior: reduce || dir === 0 ? 'auto' : 'smooth' });

    head.classList.remove('is-swap'); void head.offsetWidth; head.classList.add('is-swap');

    if (reduce || dir === 0) { plate.src = img(d.id); return; }
    // o prato atual roda e sai; o novo entra a rodar pelo lado oposto
    const rev = dir < 0;
    plate.classList.remove('is-in', 'rev');
    plate.classList.toggle('rev', rev);
    plate.classList.add('is-out');
    setTimeout(() => {
      plate.src = img(d.id);
      plate.classList.remove('is-out');
      void plate.offsetWidth;
      plate.classList.add('is-in');
    }, 420);
  }

  function go(i) {
    const n = MENU.length, next = (i + n) % n;
    if (next === index) return;
    const dir = i > index ? 1 : -1;          // decidido antes de dar a volta à lista
    index = next; render(index, dir);
  }

  $('#sc-prev').addEventListener('click', () => go(index - 1));
  $('#sc-next').addEventListener('click', () => go(index + 1));
  rail.addEventListener('click', e => { const b = e.target.closest('.rail__item'); if (b) go(+b.dataset.i); });
  rail.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); items[index].focus(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); items[index].focus(); }
  });

  // deslizar o prato no telemóvel
  let sx = null;
  const wrap = $('.showcase__plate-wrap');
  wrap.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  wrap.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
  });

  // separadores Sobre o prato / Ingredientes
  const tabs = [$('#tab-sobre'), $('#tab-ingr')], panes = [$('#pane-sobre'), $('#pane-ingr')];
  function selectTab(k) {
    tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(j === k)); t.tabIndex = j === k ? 0 : -1; panes[j].hidden = j !== k; });
  }
  tabs.forEach((t, k) => {
    t.addEventListener('click', () => selectTab(k));
    t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const j = 1 - k; selectTab(j); tabs[j].focus(); } });
  });

  render(index, 0);

  /* ---------- na nossa mesa (referência 1) ---------- */
  const grid = $('#dish-grid'), catTabs = [...document.querySelectorAll('#cat-tabs .tabs__tab')];
  function showCat(cat) {
    catTabs.forEach(t => { const on = t.dataset.cat === cat; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    grid.innerHTML = MENU.filter(d => d.cat === cat).map((d, k) => `
      <li class="dish" style="--i:${k}">
        <button class="dish__btn" data-id="${d.id}" aria-label="Ver ${d.pt} no menu">
          <img src="${img(d.id)}" alt="${d.pt}" loading="lazy" width="500" height="500">
          <span class="dish__tr">${d.tr}</span>
          <span class="dish__name">${d.pt}</span>
          <span class="dish__desc">${d.desc.split('. ')[0]}.</span>
        </button>
      </li>`).join('');
  }
  catTabs.forEach((t, k) => {
    t.addEventListener('click', () => showCat(t.dataset.cat));
    t.addEventListener('keydown', e => {
      const dirK = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dirK) return;
      e.preventDefault(); const j = (k + dirK + catTabs.length) % catTabs.length; showCat(catTabs[j].dataset.cat); catTabs[j].focus();
    });
  });
  grid.addEventListener('click', e => {
    const b = e.target.closest('.dish__btn'); if (!b) return;
    go(MENU.findIndex(d => d.id === b.dataset.id));
    $('#menu').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });
  showCat('principais');

  /* ---------- reservas: compõe a mensagem e abre o WhatsApp ---------- */
  const form = $('#book-form'), err = $('#book-error');
  form.addEventListener('input', e => {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity()) e.target.setAttribute('aria-invalid', 'false');
    if (err.textContent && ![...form.elements].some(el => el.getAttribute('aria-invalid') === 'true')) err.textContent = '';
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = [...form.elements].filter(el => el.name && !el.checkValidity());
    [...form.elements].forEach(el => el.name && el.setAttribute('aria-invalid', String(bad.includes(el))));
    if (bad.length) {
      err.textContent = 'Preencha ' + bad.map(el => el.closest('label').firstChild.textContent.trim().toLowerCase()).join(', ') + ' para enviar o pedido.';
      bad[0].focus(); return;
    }
    err.textContent = '';
    const f = Object.fromEntries(new FormData(form));
    const data = new Date(f.data + 'T00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
    const msg = `Olá! Gostaria de reservar uma mesa para ${f.pessoas} pessoa(s) em ${data}, às ${f.hora}. Nome: ${f.nome}.`;
    window.open(`https://wa.me/${window.WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

  /* ---------- parallax dos ingredientes e rotação dos pratos ---------- */
  const heroPlate = $('#hero-plate');
  const spinners = [...document.querySelectorAll('[data-spin]')];
  const layers = [...document.querySelectorAll('.ing')].map(el => ({ el, depth: +el.dataset.depth, box: el.closest('section') }));
  let ticking = false;

  function update() {
    ticking = false;
    onScrollNav();
    if (reduce) return;
    const vh = innerHeight;
    layers.forEach(l => {
      const r = l.box.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const t = (r.top + r.height / 2 - vh / 2);           // distância do centro do ecrã
      l.el.style.setProperty('--py', (-t * l.depth * .35).toFixed(1) + 'px');
      l.el.style.setProperty('--pr', (t * l.depth * .04).toFixed(1) + 'deg');
    });
    heroPlate.style.transform = `rotate(${(scrollY * .08).toFixed(2)}deg)`;
    spinners.forEach(s => { const r = s.getBoundingClientRect(); s.style.transform = `rotate(${((r.top - vh) * -.06).toFixed(2)}deg)`; });
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();
