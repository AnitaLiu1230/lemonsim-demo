/* LemonSIM demo: language switching + animated hero + newsletter preview.
   The page below the hero is the live site's own markup. Its English text is matched against
   LS_I18N.en at load and swapped per locale, so the markup itself stays untouched.
   In Nuxt this becomes $t() calls in the templates and locales/*.json. */
(function () {
  const I = window.LS_I18N, LOCALES = window.LS_LOCALES;

  /* ---------- language state ---------- */
  const safe = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
                 set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const subs = [];
  const store = {
    state: { lang: initialLang() },
    set(patch) { Object.assign(this.state, patch); if (patch.lang) safe.set('ls.lang', patch.lang); subs.forEach((f) => f(this.state)); },
    subscribe(f) { subs.push(f); },
  };
  function initialLang() {
    const pick = new URLSearchParams(location.search).get('lang') || safe.get('ls.lang') || 'en';
    return I[pick] ? pick : 'en';
  }

  function t(key, vars) {
    let s = (I[store.state.lang] || {})[key] ?? I.en[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
    return s;
  }
  /* Prices are stored in USD (what checkout charges) and shown in the visitor's currency.
     Demo rates; the real site would load daily rates from the payment provider. */
  const RATES = { USD: 1, CNY: 7.12, TWD: 31.6, HKD: 7.78, JPY: 151, KRW: 1385, EUR: 0.92, GBP: 0.78, AUD: 1.52, CAD: 1.38, SGD: 1.33, THB: 34.2, MXN: 18.9,
    MYR: 4.7, VND: 25400, IDR: 16200, PHP: 57, INR: 84, NZD: 1.68, BRL: 5.6, CHF: 0.88, SEK: 10.6, NOK: 10.8, DKK: 6.85, PLN: 4.0, CZK: 23, HUF: 365,
    AED: 3.67, SAR: 3.75, TRY: 34, EGP: 49, MAD: 9.9, ZAR: 18.2 };
  // Country -> currency. Anything not listed shows USD.
  const EURO = 'AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' ');
  const CUR_BY_COUNTRY = Object.assign(Object.fromEntries(EURO.map((c) => [c, 'EUR'])), {
    US: 'USD', CN: 'CNY', HK: 'HKD', MO: 'HKD', TW: 'TWD', JP: 'JPY', KR: 'KRW', SG: 'SGD', MY: 'MYR', TH: 'THB', VN: 'VND', ID: 'IDR', PH: 'PHP', IN: 'INR',
    AU: 'AUD', NZ: 'NZD', CA: 'CAD', MX: 'MXN', BR: 'BRL', GB: 'GBP', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF',
    AE: 'AED', SA: 'SAR', TR: 'TRY', EG: 'EGP', MA: 'MAD', ZA: 'ZAR' });
  // Time zone -> country: the best location signal a static page has without asking the network
  const TZ_COUNTRY = {
    'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Harbin': 'CN', 'Asia/Urumqi': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Macau': 'MO', 'Asia/Taipei': 'TW',
    'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN',
    'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Europe/Istanbul': 'TR',
    'Africa/Cairo': 'EG', 'Africa/Casablanca': 'MA', 'Africa/Johannesburg': 'ZA', 'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Vienna': 'AT',
    'Europe/Lisbon': 'PT', 'Europe/Athens': 'GR', 'Europe/Helsinki': 'FI', 'Europe/Zurich': 'CH', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO',
    'Europe/Copenhagen': 'DK', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Budapest': 'HU', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
    'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Pacific/Auckland': 'NZ', 'America/Toronto': 'CA', 'America/Vancouver': 'CA',
    'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/Mexico_City': 'MX', 'America/Cancun': 'MX', 'America/Tijuana': 'MX',
    'America/Sao_Paulo': 'BR', 'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Phoenix': 'US', 'America/Los_Angeles': 'US',
    'America/Anchorage': 'US', 'Pacific/Honolulu': 'US' };
  /* Where is the visitor? Strongest signal first; language never decides.
     1 ls_country cookie (set by a Cloudflare Transform Rule from ip.src.country on www.lemonsim.com)
     2 /cdn-cgi/trace, same origin, only on lemonsim.com and only when there is no cookie (async; prices update together)
     3 a time zone that maps to one country   4 the region in the browser's locale   5 USD */
  const sess = { get: (k) => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
                 set: (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const isCountry = (c) => /^[A-Z]{2}$/.test(c || '') && c !== 'XX' && c !== 'T1';
  function detectCountry() {
    const cookie = (document.cookie.match(/(?:^|;\s*)ls_country=([A-Za-z]{2})/) || [])[1];
    if (cookie && isCountry(cookie.toUpperCase())) return { country: cookie.toUpperCase(), source: 'cookie' };
    const cached = sess.get('ls.geo');
    if (cached && cached.v === 1 && isCountry(cached.country) && cached.source === 'trace') return cached;
    let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    if (TZ_COUNTRY[tz]) return { country: TZ_COUNTRY[tz], source: 'timezone' };
    const region = (navigator.languages || [navigator.language]).map((l) => (String(l).split('-').find((p, i) => i > 0 && /^[A-Z]{2}$/.test(p)) || '')).find(isCountry);
    return region ? { country: region, source: 'locale' } : { country: '', source: 'none' };
  }
  let geo = detectCountry();
  const localCurrency = () => CUR_BY_COUNTRY[geo.country] || 'USD';
  const currency = () => (safe.get('ls.showusd') === '1' ? 'USD' : localCurrency());
  function refineByTrace() {
    if (geo.source === 'cookie' || geo.source === 'trace' || !/(^|\.)lemonsim\.com$/.test(location.hostname)) return;
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 1500);
    fetch('/cdn-cgi/trace', { signal: ctl.signal }).then((r) => r.text()).then((txt) => {
      const loc = (txt.match(/^loc=([A-Z]{2})$/m) || [])[1]; if (!isCountry(loc)) return;
      geo = { v: 1, country: loc, source: 'trace' }; sess.set('ls.geo', geo); store.set({});   // one re-render updates every price
    }).catch(() => {});
  }
  const money = (n) => { const cur = currency();
    return new Intl.NumberFormat(store.state.lang, { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol', ...(cur === 'IDR' ? { maximumFractionDigits: 0 } : {}) }).format(n * RATES[cur]); };
  const date = (d) => new Intl.DateTimeFormat(store.state.lang, { year: 'numeric', month: 'short', day: 'numeric' }).format(d);

  /* ---------- translating the live markup ---------- */
  // English text -> key (first key wins; keys sharing an English value translate the same way)
  const byEnglish = {};
  Object.entries(I.en).forEach(([k, v]) => { if (!(v in byEnglish)) byEnglish[v] = k; });
  const nodes = []; // {node, render()}
  function collect(root) {
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest('.hero, .phero, script, .demo-badge, [data-i18n]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const raw = n.nodeValue, txt = raw.trim(); if (!txt) continue;
      const pad = (s) => raw.replace(txt, s);
      let m;
      if (byEnglish[txt]) { const k = byEnglish[txt]; nodes.push({ n, render: () => pad(t(k)) }); }
      else if ((m = txt.match(/^From \$(\d+(?:\.\d+)?)$/))) { const p = +m[1]; nodes.push({ n, render: () => pad(`${t('from')} ${money(p)}`) }); }
      else if ((m = txt.match(/^\$(\d+(?:\.\d+)?)$/)) && n.nextSibling && n.nextSibling.textContent === 'USD') {   // "$3.99 <span>USD</span>"
        const p = +m[1], code = n.nextSibling.firstChild;
        nodes.push({ n, render: () => pad(money(p)) }, { n: code, render: () => currency() });
      }
      else if ((m = txt.match(/^(.+) travel data from \$(\d+(?:\.\d+)?)$/)) && byEnglish[m[1]]) {
        const k = byEnglish[m[1]], p = +m[2]; nodes.push({ n, render: () => pad(t('pd.h1', { country: t(k), price: money(p) })) });
      }
      else if ((m = txt.match(/^(\d+) days$/))) { const d = m[1]; nodes.push({ n, render: () => pad(t('pd.days', { n: d })) }); }
      else if ((m = txt.match(/^Last updated on: (.+)$/))) { const d = new Date(m[1] + ' 12:00'); nodes.push({ n, render: () => pad(t('blog.updated', { date: date(d) })) }); }
    }
    root.querySelectorAll('input[placeholder]').forEach((el) => {
      const k = byEnglish[el.placeholder]; if (k) nodes.push({ n: el, attr: 'placeholder', render: () => t(k) });
    });
  }
  function applyI18n() {
    document.documentElement.lang = store.state.lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n, { country: el.dataset.dest ? t('d.' + el.dataset.dest) : '', n: el.dataset.n || '' })));
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
    document.querySelectorAll('[data-i18n-label]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));
    nodes.forEach((x) => (x.attr ? (x.n[x.attr] = x.render()) : (x.n.nodeValue = x.render())));
  }

  // Fill a sentence that contains {placeholders} with real elements (no string concatenation)
  function richText(el, key, parts) {
    el.textContent = '';
    t(key).split(/(\{\w+\})/).forEach((part) => {
      const m = part.match(/^\{(\w+)\}$/);
      el.append(m && parts[m[1]] ? parts[m[1]]() : part);
    });
  }
  const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); kids.flat().forEach((k) => e.append(k)); return e; };

  // Desktop header and mobile menu each have a switcher; keep them in sync
  function mountHeader() {
    const sels = document.querySelectorAll('select[data-lang]');
    sels.forEach((sel) => {
      LOCALES.forEach((l) => sel.append(h('option', { value: l.code }, l.label)));
      sel.value = store.state.lang;
      sel.addEventListener('change', () => {
        store.set({ lang: sel.value });
        const u = new URL(location.href); u.searchParams.set('lang', sel.value); history.replaceState(null, '', u);
      });
    });
    store.subscribe((s) => sels.forEach((sel) => (sel.value = s.lang)));
  }

  /* ---------- hero: rotating landmark slides ----------
     One config per slide; the price/flag/link come from the live Popular Destinations card for that
     destination, so they can't drift apart. In Nuxt this array would come from the CMS. */
  const SLIDES = [
    { id: 'nyc',      dest: 'usa',      pos: '50% 62%', posM: '50% 50%', sun: true,  water: 0 },
    { id: 'paris',    dest: 'europe',   pos: '50% 50%', posM: '50% 50%', sun: true,  water: 0 },
    { id: 'dubai',    dest: 'uae',      pos: '50% 45%', posM: '62% 50%', sun: false, water: 0 },
    { id: 'istanbul', dest: 'turkey',   pos: '62% 50%', posM: '76% 50%', sun: true,  water: '26%' },
    { id: 'bangkok',  dest: 'thailand', pos: '50% 42%', posM: '30% 50%', sun: true,  water: '28%' },
  ];
  const HOLD = 3800, FADE = 1200; // a new landmark every 5s, start to start

  function mountHero() {
    const hero = document.querySelector('.hero'); if (!hero) return;
    const layers = hero.querySelectorAll('.hero-photo'), chip = document.getElementById('hero-chip'), dotsEl = document.getElementById('hero-dots');
    const plane = hero.querySelector('.plane'), tog = document.getElementById('motion');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cur = 0, front = 0, timer = 0, token = 0;
    SLIDES.forEach((s) => {
      const card = document.querySelector(`a[href$="/${s.dest}-esim"]`), m = card && card.textContent.match(/\$(\d+(?:\.\d+)?)/);
      s.price = m ? +m[1] : null; s.href = card ? card.href : 'https://www.lemonsim.com/esim';
      s.flag = `${s.dest}.png`;
    });
    const big = () => innerWidth > 600 && hero.clientWidth * (devicePixelRatio || 1) > 2200;
    const src = (s) => `hero-${s.id}-${1920}.jpg`;
    function paint(layer, s, i) {
      layer.style.setProperty('--img', `url("${new URL(src(s), location.href)}")`); // absolute: a var() url resolves against the stylesheet
      layer.style.setProperty('--pos', s.pos); layer.style.setProperty('--pos-m', s.posM);
      layer.classList.toggle('rev', i % 2 === 1);
      layer.style.animation = 'none'; void layer.offsetWidth; layer.style.animation = ''; // restart the zoom while still transparent
    }

    // headline, chip and segment labels all follow the current slide
    function renderTitle() {
      const place = t('hero.places').split('|')[cur];
      richText(document.getElementById('hero-title'), 'hero.title', { anywhere: () => h('span', { class: 'typed' }, place) });
    }
    function renderChip() {
      const s = SLIDES[cur];
      chip.href = s.href; chip.querySelector('img').src = s.flag;
      chip.querySelector('b').textContent = `${t('hero.marks').split('|')[cur]} · ${t('d.' + s.dest)}`;
      chip.querySelector('small').textContent = s.price == null ? '' : t('hero.chip', { dest: t('d.' + s.dest), price: money(s.price) });
    }
    const dots = SLIDES.map((s, i) => { const b = h('button', { type: 'button' }); b.addEventListener('click', () => go(i)); dotsEl.append(b); return b; });
    function renderDots() {
      const marks = t('hero.marks').split('|');
      dots.forEach((b, i) => { b.setAttribute('aria-label', t('hero.slide', { place: marks[i], n: i + 1, total: SLIDES.length })); b.setAttribute('aria-current', String(i === cur)); });
    }
    function renderAll() { renderTitle(); renderChip(); renderDots(); }
    function setEffects(s) {
      hero.classList.toggle('no-sun', !s.sun); hero.classList.toggle('no-water', !s.water);
      if (s.water) hero.style.setProperty('--water', s.water);
    }

    // wait for the download, then give decode() a moment (some browsers defer decoding in background tabs)
    function load(url) {
      return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = url; })
        .then((img) => Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 800))]));
    }
    const paused = () => hero.classList.contains('paused') || document.hidden || reduced;
    function schedule() { clearTimeout(timer); if (!paused()) timer = setTimeout(() => go((cur + 1) % SLIDES.length), FADE + HOLD); }
    async function go(i) {
      if (i === cur) return schedule();
      const my = ++token, s = SLIDES[i];
      clearTimeout(timer);
      try { await load(src(s)); }
      catch (e) { if (my === token) schedule(); return; } // keep the current slide if the next one fails
      if (my !== token) return; // a newer click won
      const next = layers[1 - front];
      paint(next, s, i); layers.forEach((l) => l.classList.toggle('is-on', l === next)); front = 1 - front;
      cur = i; setEffects(s); renderAll();
      chip.classList.add('fade'); setTimeout(() => chip.classList.remove('fade'), 50);
      if (plane) plane.getAnimations().forEach((a) => (a.currentTime = 0)); // the plane "arrives" at each landmark
      schedule();
      new Image().src = src(SLIDES[(i + 1) % SLIDES.length]); // warm the cache for the next one only
    }

    paint(layers[0], SLIDES[0], 0); setEffects(SLIDES[0]);
    new Image().src = src(SLIDES[1]); schedule();
    renderAll(); store.subscribe(renderAll);
    document.addEventListener('visibilitychange', schedule);

    const depth = hero.querySelectorAll('[data-depth]');
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      depth.forEach((l) => (l.style.translate = `${-x * l.dataset.depth}px ${-y * l.dataset.depth}px`));
    });
    const content = hero.querySelector('.hero-content');
    addEventListener('scroll', () => { content.style.transform = `translateY(${scrollY * 0.25}px)`; content.style.opacity = String(Math.max(0, 1 - scrollY / 500)); }, { passive: true });
    const setTog = () => (tog.textContent = t(hero.classList.contains('paused') ? 'hero.play' : 'hero.pause'));
    tog.addEventListener('click', () => { hero.classList.toggle('paused'); setTog(); schedule(); }); setTog(); store.subscribe(setTog);
    hero.querySelector('.search').addEventListener('submit', (e) => { e.preventDefault(); location.href = 'https://www.lemonsim.com/esim'; });
  }

  /* ---------- inner-page heroes (eSIM, SIM card, Blog) ----------
     Same shell on all three; each scene reads its content from the page below it (plan grid, post grid),
     so nothing is typed twice. Pause and hidden tabs stop every timer and CSS animation. */
  function mountPageHero() {
    const hero = document.querySelector('.phero'); if (!hero) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const still = () => reduced || hero.classList.contains('paused') || document.hidden;
    const every = (ms, fn) => setInterval(() => { if (!still()) fn(); }, ms);
    const tog = hero.querySelector('[data-motion]');
    const setTog = () => (tog.textContent = t(hero.classList.contains('paused') ? 'hero.play' : 'hero.pause'));
    tog.addEventListener('click', () => { hero.classList.toggle('paused'); setTog(); });
    if (reduced) tog.hidden = true;
    setTog(); store.subscribe(setTog);
    const catLabel = (c) => (byEnglish[c] ? t(byEnglish[c]) : c);

    // eSIM: Install -> Activate -> Connected, with matching step pills (reduced motion shows the end state)
    const phone = hero.querySelector('.phone');
    if (phone) {
      const pills = hero.querySelectorAll('.steps li');
      let step = reduced ? 2 : 0;
      const show = () => { phone.dataset.step = step; pills.forEach((p, i) => p.classList.toggle('on', i === step)); };
      show(); every(2400, () => { step = (step + 1) % 3; show(); });
    }

    // price chips: only for destinations that exist in the plan grid on this page
    const chips = hero.querySelector('[data-chips]');
    if (chips) {
      const kind = chips.dataset.kind, made = [];
      chips.dataset.chips.split(',').forEach((dest) => {
        const card = [...document.querySelectorAll('#plans a')].find((a) => a.getAttribute('href').endsWith(`/${dest}-${kind}`));
        const m = card && card.textContent.match(/\$(\d+(?:\.\d+)?)/); if (!m) return;
        const name = h('span'), price = h('small');
        chips.append(h('a', { href: card.href }, h('img', { src: card.querySelector('img').src, alt: '' }), name, price));
        made.push(() => { name.textContent = t('d.' + dest); price.textContent = `${t('from')} ${money(+m[1])}`; });
      });
      const render = () => made.forEach((f) => f()); render(); store.subscribe(render);
    }

    // SIM card: light up one device connection at a time
    const devs = hero.querySelectorAll('.dev');
    if (devs.length) {
      let k = 0;
      const show = () => hero.querySelectorAll('[data-dev], [data-link]').forEach((el) => el.classList.toggle('on', +(el.dataset.dev ?? el.dataset.link) === k));
      show(); every(2000, () => { k = (k + 1) % devs.length; show(); });
    }

    // Blog: a trip route with four stages; each stage shows one hand-picked guide from the post grid
    const journey = hero.querySelector('[data-journey]');
    if (journey) {
      const grid = new Map([...document.querySelectorAll('#posts a.group')].map((a) => [a.getAttribute('href').split('/').pop(), a]));
      const stops = [...journey.querySelectorAll('.stop')].filter((b) => grid.has(b.dataset.slug) || (b.remove(), false));
      if (!stops.length) { journey.remove(); return; }
      const route = journey.querySelector('.route-draw'), card = journey.querySelector('.jcard');
      const len = route.getTotalLength();
      const place = () => stops.forEach((b, i) => {   // pins sit on the curve, evenly spaced
        const pt = route.getPointAtLength(len * (stops.length > 1 ? i / (stops.length - 1) : 0));
        b.style.left = `${pt.x / 5.2}%`; b.style.top = `${pt.y / 2}%`;
      });
      place();
      let cur = 0, hold = false, swapT = 0;
      function fill() {
        const a = grid.get(stops[cur].dataset.slug), meta = a.querySelectorAll('.mt-5 span');
        const cat = meta[0]?.textContent.trim(), when = new Date((meta[2]?.textContent.trim() || '') + ' 12:00');
        card.href = a.href; card.querySelector('img').src = a.querySelector('img').src;
        card.querySelector('b').textContent = a.querySelector('h2').textContent.trim();
        card.querySelector('small').textContent = `${t(stops[cur].querySelector('.stop-label').dataset.i18n)} · ${catLabel(cat)}`;
        card.querySelector('.jcard-meta').textContent = isNaN(when) ? '' : date(when);
      }
      function show(i, instant) {
        cur = i;
        route.style.strokeDashoffset = String(100 - (stops.length > 1 ? (100 * i) / (stops.length - 1) : 0));
        stops.forEach((b, k) => { b.setAttribute('aria-pressed', String(k === i)); b.classList.toggle('done', k < i); });
        clearTimeout(swapT);
        if (instant) { fill(); card.classList.remove('swap'); return; }
        card.classList.add('swap'); swapT = setTimeout(() => { fill(); card.classList.remove('swap'); }, 380);
      }
      show(0, true);
      if (reduced) route.style.strokeDashoffset = '0';
      stops.forEach((b, i) => b.addEventListener('click', () => show(i, reduced)));
      journey.addEventListener('pointerenter', () => (hold = true)); journey.addEventListener('pointerleave', () => (hold = false));
      journey.addEventListener('focusin', () => (hold = true)); journey.addEventListener('focusout', () => (hold = false));
      every(5000, () => { if (!hold) show((cur + 1) % stops.length); });
      store.subscribe(() => fill());
    }
  }

  /* ---------- destination pages: plan tabs, currency, compatibility checker ---------- */
  function mountDetail() {
    const tabs = document.querySelectorAll('[data-ptab]');
    const on = 'bg-primary-500 text-ink-900 shadow-floating'.split(' '), off = 'text-ink-700 hover:bg-primary-100'.split(' ');
    tabs.forEach((b) => b.addEventListener('click', () => {
      const lists = document.querySelectorAll('[data-plans]');
      if (![...lists].some((l) => l.dataset.plans === b.dataset.ptab)) return;
      tabs.forEach((x) => { const sel = x === b; x.classList.remove(...(sel ? off : on)); x.classList.add(...(sel ? on : off)); x.setAttribute('aria-pressed', String(sel)); });
      lists.forEach((l) => (l.hidden = l.dataset.plans !== b.dataset.ptab));
    }));
    const note = document.querySelector('[data-cur-note]'); if (!note) return;
    const text = h('span'), toggle = h('button', { type: 'button', class: 'cur-toggle' });
    note.append(text, toggle);
    toggle.addEventListener('click', () => { safe.set('ls.showusd', currency() === 'USD' ? '0' : '1'); store.set({}); });
    const render = () => {
      const local = localCurrency(), showingUsd = currency() === 'USD';
      note.hidden = local === 'USD';
      text.textContent = showingUsd ? '' : `${t('cur.note', { cur: local })} · `;
      toggle.textContent = showingUsd ? t('cur.showlocal', { cur: local }) : t('cur.showusd');
    };
    render(); store.subscribe(render);
  }

  // Device check in a dialog. Model lists are representative, not exhaustive; results say so.
  const DEVICES = {
    apple: { yes: ['iPhone 17 / 17 Pro / Air', 'iPhone 16 series', 'iPhone 15 series', 'iPhone 14 series', 'iPhone 13 series', 'iPhone 12 series', 'iPhone 11 series', 'iPhone SE (2nd / 3rd gen)', 'iPhone XS / XS Max / XR'], no: ['iPhone X or older'] },
    samsung: { yes: ['Galaxy S25 series', 'Galaxy S24 series', 'Galaxy S23 series', 'Galaxy S22 series', 'Galaxy S21 series', 'Galaxy S20 series', 'Galaxy Z Fold / Z Flip (all)', 'Galaxy Note 20 series', 'Galaxy A55 / A54 / A35'], no: ['Galaxy S10 or older', 'Galaxy A14 / A15 / A25'] },
    google: { yes: ['Pixel 10 series', 'Pixel 9 series', 'Pixel 8 series', 'Pixel 7 series', 'Pixel 6 series', 'Pixel 5 / 5a', 'Pixel 4 / 4a', 'Pixel 3 / 3a'], no: ['Pixel 2 or older'] },
    other: { yes: [], no: [] },
  };
  function mountCompat() {
    const triggers = document.querySelectorAll('[data-compat]'); if (!triggers.length) return;
    const dlg = h('dialog', { class: 'compat', 'aria-labelledby': 'compat-title' });
    dlg.innerHTML = `
      <form method="dialog" class="compat-close-row"><button class="compat-x" data-i18n-label="cmp.close" value="close">×</button></form>
      <h2 id="compat-title" data-i18n="cmp.title"></h2>
      <p class="compat-intro" data-cmp-intro></p>
      <div class="compat-fields">
        <label for="cmp-brand"><span data-i18n="cmp.brand"></span><select id="cmp-brand"><option value="apple">Apple iPhone</option><option value="samsung">Samsung Galaxy</option><option value="google">Google Pixel</option><option value="other" data-i18n="cmp.other"></option></select></label>
        <label for="cmp-model"><span data-i18n="cmp.model"></span><select id="cmp-model"></select></label>
      </div>
      <div class="compat-result" role="status" aria-live="polite"><span class="compat-icon" aria-hidden="true"></span><div><b></b><p></p></div></div>
      <details class="compat-more" open><summary data-i18n="cmp.how"></summary><ul><li data-i18n="cmp.how1"></li><li data-i18n="cmp.how2"></li><li data-i18n="cmp.how3"></li></ul></details>
      <details class="compat-more"><summary data-i18n="cmp.unlock"></summary><p data-i18n="cmp.unlock.p"></p></details>
      <p class="compat-foot" data-i18n="cmp.foot"></p>`;
    document.body.append(dlg);
    const brand = dlg.querySelector('#cmp-brand'), model = dlg.querySelector('#cmp-model'), res = dlg.querySelector('.compat-result');
    let mode = 'esim';
    function fillModels() {
      const d = DEVICES[brand.value]; model.textContent = '';
      if (brand.value === 'other') model.append(h('option', { value: 'other' }, t('cmp.other.model')));
      [...d.yes.map((m) => ['yes', m]), ...d.no.map((m) => ['no', m])].forEach(([ok, m]) => model.append(h('option', { value: ok }, m)));
      judge();
    }
    function judge() {
      const v = model.value, sim = mode === 'sim';
      const state = sim ? 'ok' : v === 'yes' ? 'ok' : v === 'no' ? 'no' : 'check';
      res.dataset.state = state;
      res.querySelector('.compat-icon').textContent = state === 'ok' ? '✓' : state === 'no' ? '✕' : '?';
      res.querySelector('b').textContent = t(sim ? 'cmp.sim.ok' : `cmp.${state}`);
      res.querySelector('p').textContent = t(sim ? 'cmp.sim.ok.p' : state === 'ok' ? `cmp.ok.p.${brand.value}` : `cmp.${state}.p`);
    }
    brand.addEventListener('change', fillModels); model.addEventListener('change', judge);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });   // click on the backdrop
    triggers.forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.compat; dlg.querySelector('[data-cmp-intro]').textContent = t(mode === 'sim' ? 'cmp.intro.sim' : 'cmp.intro.esim');
      applyI18n(); fillModels(); dlg.showModal();
    }));
    store.subscribe(() => { if (dlg.open) { dlg.querySelector('[data-cmp-intro]').textContent = t(mode === 'sim' ? 'cmp.intro.sim' : 'cmp.intro.esim'); fillModels(); } });
  }

  /* ---------- newsletter (simulated): nothing is sent; shows the welcome email preview ---------- */
  function mountNewsletter() {
    const f = document.getElementById('news-form'); if (!f) return;
    const ok = h('div', { class: 'news-ok', hidden: '' }, h('span', { 'data-i18n': 'news.ok' }), h('br'), h('a', { 'data-i18n': 'news.preview', target: '_blank', href: 'email/welcome.html' }));
    f.after(ok);
    f.addEventListener('submit', (e) => {
      e.preventDefault(); ok.hidden = false;
      ok.querySelector('a').href = store.state.lang.startsWith('zh') ? 'email/welcome.zh-CN.html' : 'email/welcome.html';
    });
  }

  /* ---------- open every new page at the top ----------
     Browsers already do this, but the claude.ai share viewer can keep its own scroll position across pages.
     Only for plain link navigations: reload, back/forward and #anchors keep the browser's behaviour.
     The scrollIntoView is a best-effort nudge for an outer scroller; browsers may stop it at the frame. */
  function startAtTop() {
    const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (location.hash || (nav && nav.type !== 'navigate')) return;
    scrollTo(0, 0);
    try { document.documentElement.scrollIntoView({ block: 'start', behavior: 'instant' }); } catch (e) {}
  }

  /* ---------- contact: email info@lemonsim.com ----------
     The mailto link carries a short template in the visitor's language; Copy covers webmail users with no mail app. */
  const MAIL = 'info@lemonsim.com';
  function mountContact() {
    const link = document.getElementById('ct-mailto'), copy = document.getElementById('ct-copy'), said = document.getElementById('ct-copied');
    if (!link) return;
    const update = () => {
      const body = ['ct.f.dest', 'ct.f.type', 'ct.f.phone', 'ct.f.order', 'ct.f.what'].map((k) => `${t(k)}: `).join('\n');
      link.href = `mailto:${MAIL}?subject=${encodeURIComponent(t('ct.mail.subject'))}&body=${encodeURIComponent(body + '\n')}`;
    };
    update(); store.subscribe(update);
    copy.addEventListener('click', () => {
      const done = () => { said.textContent = t('ct.mail.copied'); setTimeout(() => (said.textContent = ''), 2500); };
      const fallback = () => { const r = document.createRange(); r.selectNodeContents(document.getElementById('ct-addr')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); said.textContent = t('ct.mail.select'); };
      try { navigator.clipboard.writeText(MAIL).then(done, fallback); } catch (e) { fallback(); }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    startAtTop();
    collect(document.body);
    mountHeader(); mountHero(); mountPageHero(); mountDetail(); mountCompat(); mountNewsletter(); mountContact(); applyI18n(); refineByTrace();
    store.subscribe(applyI18n);
  });
})();
