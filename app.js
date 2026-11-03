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
      acceptNode: (n) => (n.parentElement.closest('.hero, .phero, script, .demo-badge, [data-i18n], [data-i18n-html]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
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
      else if ((m = txt.match(/^(.+) Guide Blog$/)) && (byEnglish[m[1]] || '').startsWith('d.')) { const k = byEnglish[m[1]]; nodes.push({ n, render: () => pad(t('pd.blog', { country: t(k) })) }); }
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
    document.querySelectorAll('[data-i18n-html]').forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml))); // our own strings, may hold links
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
    document.querySelectorAll('[data-sub]').forEach((el) => {   // destination subtitle: live English text, a generic sentence elsewhere
      el.dataset.en = el.dataset.en || el.textContent.trim();
      el.textContent = store.state.lang === 'en' ? el.dataset.en : t('pd.sub', { country: t('d.' + el.dataset.sub) });
    });
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
    const plane = hero.querySelector('.plane');
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
    let hovering = false; // a temporary pause while the pointer or keyboard focus is in the hero; never undoes an explicit pause
    const paused = () => hero.classList.contains('paused') || hovering || document.hidden || reduced;
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
    // icon-only pause/play at the end of the slide dots: stops the timer, zoom and sun together
    const tog = h('button', { type: 'button', class: 'pp' }); dotsEl.append(tog);
    if (reduced) tog.hidden = true;
    const setTog = () => { const on = hero.classList.contains('paused'); tog.classList.toggle('is-paused', on); tog.setAttribute('aria-label', t(on ? 'hero.play.slides' : 'hero.pause.slides')); tog.setAttribute('aria-pressed', String(on)); };
    tog.addEventListener('click', () => { hero.classList.toggle('paused'); setTog(); schedule(); }); setTog(); store.subscribe(setTog);
    const hold = (v) => () => { hovering = v; schedule(); };
    hero.addEventListener('mouseenter', hold(true)); hero.addEventListener('mouseleave', hold(false));
    hero.addEventListener('focusin', hold(true)); hero.addEventListener('focusout', (e) => { if (!hero.contains(e.relatedTarget)) hold(false)(); });
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
    const setTog = () => { const on = hero.classList.contains('paused'); tog.classList.toggle('is-paused', on); tog.setAttribute('aria-label', t(on ? 'hero.play' : 'hero.pause')); tog.setAttribute('aria-pressed', String(on)); };
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

    // About: a flight hops between the 13 destinations; the arc draws, the plane follows it, the next dot lights up
    const map = hero.querySelector('[data-route]');
    if (map) {
      const dots = [...map.querySelectorAll('.rdot')], arc = map.querySelector('.route-arc'), trail = map.querySelector('.route-trail');
      const plane = map.querySelector('.route-plane'), label = map.querySelector('.route-label'), text = label.querySelector('text');
      const at = (g) => g.getAttribute('transform').match(/[\d.]+/g).map(Number);
      let k = 0;
      const hop = () => {
        const [x1, y1] = at(dots[k]); k = (k + 1) % dots.length; const [x2, y2] = at(dots[k]);
        const lift = Math.max(40, Math.hypot(x2 - x1, y2 - y1) * 0.3);
        const d = `M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - lift} ${x2} ${y2}`;
        trail.setAttribute('d', arc.getAttribute('d') || d); arc.setAttribute('d', d);
        plane.style.offsetPath = `path('${d}')`;
        [arc, plane].forEach((el) => { el.classList.remove('go'); void el.getBoundingClientRect(); el.classList.add('go'); });
        dots.forEach((g, i) => g.classList.toggle('on', i === k));
        label.setAttribute('transform', `translate(${x2} ${y2})`); text.textContent = t('d.' + dots[k].dataset.dest);
      };
      if (reduced) { dots.forEach((g) => g.classList.add('on')); label.remove(); plane.remove(); }
      else { hop(); every(2600, hop); store.subscribe(() => (text.textContent = t('d.' + dots[k].dataset.dest))); }
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
      let cur = 0, swapT = 0;
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
      // next stop 5s after each change; pointer/focus hold, hidden tab and the pause button each stop it on their own
      let timer = 0, hover = false, focus = false;
      const next = () => { clearTimeout(timer); if (!still() && !hover && !focus) timer = setTimeout(() => { show((cur + 1) % stops.length); next(); }, 5000); };
      stops.forEach((b, i) => b.addEventListener('click', () => { show(i, reduced); next(); }));
      journey.addEventListener('pointerenter', () => { hover = true; next(); }); journey.addEventListener('pointerleave', () => { hover = false; next(); });
      journey.addEventListener('focusin', () => { focus = true; next(); }); journey.addEventListener('focusout', (e) => { if (!journey.contains(e.relatedTarget)) { focus = false; next(); } });
      document.addEventListener('visibilitychange', next); tog.addEventListener('click', next);
      next();
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
  /* ---------- device compatibility checker ----------
     Model-level list (checked 2026-11-02 against manufacturer pages and Airalo's public device list). A match means
     "this model has eSIM" with the brand's regional caveat shown as text; no match never means "unsupported". */
  /* PHONES:start — generated from tools/data/phones.json by build_pages.py */
  const PHONES = {"apple": ["iPhone XR", "iPhone XS", "iPhone XS Max", "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max", "iPhone SE (2020)", "iPhone SE (2022)", "iPhone 12 mini", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max", "iPhone 13 mini", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max", "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max", "iPhone 16e", "iPhone 17", "iPhone 17 Pro", "iPhone 17 Pro Max", "iPhone 17e", "iPhone Air", "iPhone 18 Pro", "iPhone 18 Pro Max", "iPad (7th gen or later)", "iPad Air (3rd gen or later)", "iPad mini (5th gen or later)", "iPad Pro 11-inch", "iPad Pro 12.9-inch (3rd gen or later)"], "samsung": ["Galaxy S20", "Galaxy S20+", "Galaxy S20 Ultra", "Galaxy S21", "Galaxy S21+", "Galaxy S21 Ultra", "Galaxy S22", "Galaxy S22+", "Galaxy S22 Ultra", "Galaxy S23", "Galaxy S23+", "Galaxy S23 Ultra", "Galaxy S23 FE", "Galaxy S24", "Galaxy S24+", "Galaxy S24 Ultra", "Galaxy S24 FE", "Galaxy S25", "Galaxy S25+", "Galaxy S25 Ultra", "Galaxy S25 Edge", "Galaxy Note 20", "Galaxy Note 20 Ultra", "Galaxy Z Fold", "Galaxy Z Fold2", "Galaxy Z Fold3", "Galaxy Z Fold4", "Galaxy Z Fold5", "Galaxy Z Fold6", "Galaxy Z Flip", "Galaxy Z Flip3", "Galaxy Z Flip4", "Galaxy Z Flip5", "Galaxy Z Flip6", "Galaxy A23 5G", "Galaxy A35", "Galaxy A36", "Galaxy A54", "Galaxy A55", "Galaxy A56", "Galaxy A17", "Galaxy XCover7 Pro"], "google": ["Pixel 3", "Pixel 3 XL", "Pixel 3a", "Pixel 3a XL", "Pixel 4", "Pixel 4 XL", "Pixel 4a", "Pixel 4a 5G", "Pixel 5", "Pixel 5a", "Pixel 6", "Pixel 6 Pro", "Pixel 6a", "Pixel 7", "Pixel 7 Pro", "Pixel 7a", "Pixel 8", "Pixel 8 Pro", "Pixel 8a", "Pixel Fold", "Pixel 9", "Pixel 9 Pro", "Pixel 9 Pro XL", "Pixel 9 Pro Fold", "Pixel 9a", "Pixel 10", "Pixel 10 Pro", "Pixel 10 Pro Fold", "Pixel 11", "Pixel 11 Pro", "Pixel 11 Pro XL", "Pixel 11 Pro Fold"], "xiaomi": ["Xiaomi 12T Pro", "Xiaomi 13", "Xiaomi 13 Pro", "Xiaomi 13 Lite", "Xiaomi 13T", "Xiaomi 13T Pro", "Xiaomi 14", "Xiaomi 14 Pro", "Xiaomi 14T", "Xiaomi 14T Pro", "Xiaomi 15", "Xiaomi 15 Ultra", "Xiaomi 15T", "Xiaomi 15T Pro", "Redmi Note 13 Pro", "Redmi Note 13 Pro+", "Redmi Note 14 Pro", "Redmi Note 14 Pro+"], "oppo": ["OPPO Find X3", "OPPO Find X3 Pro", "OPPO Find X5", "OPPO Find X5 Pro", "OPPO Find X8", "OPPO Find X8 Pro", "OPPO Find X9", "OPPO Find X9 Pro", "OPPO Find N2 Flip", "OPPO Find N5", "OPPO Reno14", "OPPO Reno14 Pro"], "honor": ["HONOR Magic4 Pro", "HONOR Magic5 Pro", "HONOR Magic6 Pro", "HONOR Magic7 Pro", "HONOR Magic V2", "HONOR Magic V3", "HONOR Magic V5", "HONOR 90", "HONOR 200", "HONOR 200 Pro", "HONOR 400", "HONOR 400 Pro"], "huawei": ["HUAWEI P40", "HUAWEI P40 Pro", "HUAWEI Mate 40 Pro"], "oneplus": ["OnePlus 11", "OnePlus 12", "OnePlus 13", "OnePlus 13R", "OnePlus 15", "OnePlus Open"], "motorola": ["Motorola Edge 40 Pro", "Motorola Edge 50 Pro", "Motorola Edge 50 Ultra", "Motorola Edge 50 Fusion", "Motorola Edge 60", "Motorola Edge 60 Pro", "Motorola Razr 40", "Motorola Razr 40 Ultra", "Motorola Razr 50", "Motorola Razr 50 Ultra", "Motorola Razr 2024", "Motorola Razr+ 2024", "Motorola Razr 2025", "Motorola Razr+ 2025"], "sony": ["Xperia 1 IV", "Xperia 1 V", "Xperia 1 VI", "Xperia 1 VII", "Xperia 5 IV", "Xperia 5 V", "Xperia 10 V", "Xperia 10 VI"], "vivo": ["vivo X100 Pro", "vivo X200", "vivo X200 Pro", "vivo X300", "vivo X300 Pro", "vivo V40", "vivo V50"], "other": ["Nothing Phone (3a) Pro", "Fairphone 4", "Fairphone 5"]};
  const BRAND = {"apple": "Apple", "samsung": "Samsung", "google": "Google", "xiaomi": "Xiaomi", "oppo": "OPPO", "honor": "HONOR", "huawei": "HUAWEI", "oneplus": "OnePlus", "motorola": "Motorola", "sony": "Sony", "vivo": "vivo", "other": "Other"};
  /* PHONES:end */
  const NOTE = (b) => (['apple', 'samsung', 'google'].includes(b) ? `cmp.note.${b}` : 'cmp.note.region');
  const norm = (x) => x.toLowerCase().replace(/[^a-z0-9+]/g, '');

  function mountCompat() {
    const dlg = h('dialog', { class: 'compat', 'aria-labelledby': 'compat-title' });
    dlg.innerHTML = `
      <form method="dialog" class="compat-close-row"><button class="compat-x" data-i18n-label="cmp.close" value="close">×</button></form>
      <h2 id="compat-title" data-i18n="cmp.title"></h2>
      <div data-mode="esim">
        <p class="compat-intro" data-i18n="cmp.need"></p>
        <ul class="compat-needs"><li data-i18n="cmp.need1"></li><li data-i18n="cmp.need2"></li><li data-i18n="cmp.need3"></li></ul>
        <div class="compat-fast"><b data-i18n="cmp.fast"></b><p data-i18n="cmp.fast.p"></p><p class="compat-fastnote" data-i18n="cmp.fast.note"></p></div>
        <label class="compat-search"><span data-i18n="cmp.search"></span><input type="search" id="cmp-q" autocomplete="off" data-i18n-ph="cmp.search.ph"></label>
        <div class="compat-brands" role="group" aria-labelledby="compat-title"></div>
        <p class="compat-count" role="status" aria-live="polite"></p>
        <ul class="compat-list" aria-labelledby="compat-title"></ul>
        <p class="compat-listnote" hidden><i class="iconfont icon-question" aria-hidden="true"></i><span data-i18n="cmp.listnote"></span></p>
        <div class="compat-none" hidden><b data-i18n="cmp.none"></b><p class="rich" data-i18n-html="cmp.none.p"></p></div>
        <details class="compat-more"><summary data-i18n="cmp.settings"></summary><ul><li data-i18n="cmp.settings1"></li><li data-i18n="cmp.settings2"></li></ul></details>
      </div>
      <div data-mode="sim">
        <p class="compat-intro" data-i18n="cmp.sim.intro"></p>
        <ul class="compat-needs"><li data-i18n="cmp.sim1"></li><li data-i18n="cmp.sim2"></li><li data-i18n="cmp.sim3"></li></ul>
        <p class="compat-text" data-i18n="cmp.sim.dual"></p>
        <p class="compat-text rich" data-i18n-html="cmp.sim.esim"></p>
      </div>
      <details class="compat-more"><summary data-i18n="cmp.unlock"></summary><p data-i18n="cmp.unlock.p"></p></details>
      <a class="compat-guide" href="esim-compatible-phones.html"><span data-i18n="cp.guide"></span> <i class="iconfont icon-right" aria-hidden="true"></i></a>`;
    document.body.append(dlg);
    const q = dlg.querySelector('#cmp-q'), list = dlg.querySelector('.compat-list'), none = dlg.querySelector('.compat-none');
    const count = dlg.querySelector('.compat-count'), brands = dlg.querySelector('.compat-brands');
    const listnote = dlg.querySelector('.compat-listnote'), guide = dlg.querySelector('.compat-guide');
    let brand = 'all', opener = null, mode = 'esim';
    ['all', ...Object.keys(PHONES)].forEach((b) => {
      const chip = h('button', { type: 'button', class: 'compat-chip', 'data-brand': b, 'aria-pressed': String(b === 'all') });
      chip.addEventListener('click', () => { brand = b; brands.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === chip))); render(); });
      brands.append(chip);
    });
    function render() {
      brands.querySelectorAll('button').forEach((x) => (x.textContent = x.dataset.brand === 'all' ? t('cmp.all') : BRAND[x.dataset.brand]));
      const k = norm(q.value), groups = [];
      Object.entries(PHONES).forEach(([b, models]) => {
        if (brand !== 'all' && b !== brand) return;
        const hits = models.filter((m) => !k || norm(m).includes(k) || norm(BRAND[b] + m).includes(k));
        if (hits.length) groups.push([b, hits]);
      });
      const n = groups.reduce((a, [, m]) => a + m.length, 0);
      const browsing = !k && brand === 'all';
      list.textContent = '';
      if (!browsing) groups.forEach(([b, hits]) => {
        list.append(h('li', { class: 'compat-group' }, h('b', {}, BRAND[b]), h('p', {}, t(NOTE(b)))));
        hits.forEach((m) => list.append(h('li', { class: 'compat-row' }, h('span', {}, m), h('em', {}, '✓ ' + t('cmp.likely')))));
      });
      list.hidden = browsing;
      none.hidden = browsing || n > 0;
      listnote.hidden = browsing || n === 0;
      count.textContent = browsing ? '' : t('cmp.count', { n });
      guide.href = mode === 'sim' ? 'esim-compatible-phones.html#sim'
        : 'esim-compatible-phones.html' + (q.value.trim() ? '?q=' + encodeURIComponent(q.value.trim()) : '');   // the page picks up the search
    }
    q.addEventListener('input', render);
    function open(m, from) {
      opener = from; mode = m;
      dlg.querySelectorAll('[data-mode]').forEach((el) => (el.hidden = el.dataset.mode !== mode));
      applyI18n(); render(); dlg.showModal();
      if (mode === 'esim') q.focus();
    }
    // delegated, so links inside translated text (re-rendered on language change) keep working
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-compat]'); if (!b) return;
      // the popup is for buying (destination pages); everywhere else a checker link is a plain link to the page
      if (b.tagName === 'A' && !b.closest('dialog') && !document.querySelector('[data-pbar]')) {
        if (!document.querySelector('[data-compat-page]')) return;
        e.preventDefault();   // already on the page: jump to the search (or the SIM card section)
        const to = document.getElementById(b.dataset.compat === 'sim' ? 'sim' : 'search');
        to.scrollIntoView({ behavior: 'smooth' }); if (to.id === 'search') document.getElementById('cp-q').focus({ preventScroll: true });
        return;
      }
      e.preventDefault(); if (dlg.open) dlg.close(); open(b.dataset.compat, b.closest('dialog') ? opener : b);
    });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });   // click on the backdrop
    dlg.addEventListener('close', () => { if (opener && opener.isConnected) opener.focus(); });
    store.subscribe(() => { if (dlg.open) render(); });
  }

  /* ---------- the checker page (esim-compatible-phones): the static brand list is the result list, filtered in place ---------- */
  function mountCompatPage() {
    const page = document.querySelector('[data-compat-page]'); if (!page) return;
    const q = page.querySelector('#cp-q'), brands = page.querySelector('.compat-brands'), count = page.querySelector('.compat-count');
    const none = page.querySelector('.compat-none'), reset = page.querySelector('.cp-reset'), listnote = page.querySelector('.compat-listnote');
    const groups = [...page.querySelectorAll('.cp-brand')];
    let brand = 'all';
    ['all', ...Object.keys(PHONES)].forEach((b) => {
      const chip = h('button', { type: 'button', class: 'compat-chip', 'data-brand': b, 'aria-pressed': String(b === 'all') });
      chip.addEventListener('click', () => { brand = b; brands.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === chip))); render(); });
      brands.append(chip);
    });
    function render() {
      brands.querySelectorAll('button').forEach((x) => (x.textContent = x.dataset.brand === 'all' ? t('cmp.all') : BRAND[x.dataset.brand]));
      const k = norm(q.value), browsing = !k && brand === 'all';
      let n = 0;
      groups.forEach((g) => {
        const b = g.dataset.brand, rows = [...g.querySelectorAll('li')];
        let hits = 0;
        rows.forEach((li) => {
          const ok = (brand === 'all' || b === brand) && (!k || norm(li.textContent).includes(k) || norm(BRAND[b] + li.textContent).includes(k));
          li.hidden = !ok; hits += ok;
        });
        g.hidden = !hits; g.open = !browsing && hits > 0; n += hits;
        const c = g.querySelector('.cp-n'); c.textContent = t('cp.models', { n: browsing ? c.dataset.n : hits });
      });
      none.hidden = browsing || n > 0;
      reset.hidden = browsing;
      listnote.hidden = n === 0;
      count.textContent = browsing ? '' : t('cmp.count', { n });
      const url = new URL(location.href);   // keep ?q= in the address so a search can be shared; clearing removes it
      if (q.value.trim()) url.searchParams.set('q', q.value.trim()); else url.searchParams.delete('q');
      try { history.replaceState(null, '', url); } catch (e) { /* file:// and sandboxed frames */ }
    }
    q.value = new URLSearchParams(location.search).get('q') || '';
    q.addEventListener('input', render);
    reset.addEventListener('click', () => { q.value = ''; brand = 'all'; brands.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.brand === 'all'))); render(); q.focus(); });
    store.subscribe(render);
    render();
  }

  /* ---------- package choice: the live plan URL (/usa-esim/5gb-7days) is the destination page with one package picked ----------
     Here that is usa-esim.html?plan=5gb-7days. A fixed bar shows the pick, its price and "Buy now" (checkout stays on lemonsim.com). */
  function mountPlans() {
    const bar = document.querySelector('[data-pbar]'); if (!bar) return;
    const { slug, dest, kind } = bar.dataset;
    const rows = [...document.querySelectorAll('[data-plan]')], dlg = document.querySelector('[data-pdlg]');
    const info = (row) => { const [, gb, days] = row.dataset.plan.match(/^(\d+gb|unlimited)-(\d+)days$/); return { gb, days, usd: +row.dataset.usd }; };
    const dataLabel = (gb) => (gb === 'unlimited' ? t('pd.unl') : gb.replace('gb', ' GB'));
    const fit = () => document.documentElement.style.setProperty('--pbar-h', `${bar.offsetHeight}px`);
    let cur = null;
    function render() {
      if (!cur) return;
      const p = info(cur);
      bar.querySelector('[data-pbar-name]').textContent = [t('d.' + dest), dataLabel(p.gb), t('pd.days', { n: p.days })].join(' · ');
      bar.querySelector('[data-pbar-price]').textContent = money(p.usd);
      dlg.querySelector('[data-pdlg-title]').textContent = bar.querySelector('[data-pbar-name]').textContent;
      const nets = [...document.querySelectorAll('.op-row:not(.op-row--country) b')].map((b) => b.textContent).join(' · ');
      const items = [['pb.dest', t('d.' + dest)], ['pb.data', dataLabel(p.gb)], ['pb.valid', t('pd.days', { n: p.days })],
        ['pb.rule', t(kind === 'esim' ? 'val.esim' : 'val.sim')], nets && ['pb.nets', nets], ['pb.hotspot', t('pb.yes')],
        ['pb.topup', t(kind === 'esim' ? 'pb.topup.esim' : 'pb.topup.sim'), true], kind === 'sim' && ['pb.delivery', t('pb.delivery.v')], kind === 'sim' && ['pb.addr', t('pb.addr.v')]].filter(Boolean);
      const list = dlg.querySelector('[data-pdlg-list]'); list.textContent = '';
      items.forEach(([k, v, html]) => { const dd = h('dd'); dd[html ? 'innerHTML' : 'textContent'] = v; list.append(h('div', {}, h('dt', {}, t(k)), dd)); });
      fit();
    }
    function pick(row, remember) {
      cur = row;
      rows.forEach((r) => r.setAttribute('aria-checked', String(r === row)));
      const list = row.closest('[data-plans]');
      if (list.hidden) document.querySelector(`[data-ptab="${list.dataset.plans}"]`)?.click();
      bar.querySelector('[data-pbar-buy]').href = `https://www.lemonsim.com/${slug}/${row.dataset.plan}`;
      bar.hidden = false; document.body.classList.add('has-pbar');
      if (remember) { const u = new URL(location.href); u.searchParams.set('plan', row.dataset.plan); history.replaceState(history.state, '', u); }
      render();
    }
    rows.forEach((r) => {
      r.addEventListener('click', (e) => { e.preventDefault(); pick(r, true); });
      r.addEventListener('keydown', (e) => { if (e.key === ' ') { e.preventDefault(); pick(r, true); } });
    });
    const want = rows.find((r) => r.dataset.plan === new URLSearchParams(location.search).get('plan'));
    if (want) pick(want, false);   // unknown ?plan= values are ignored
    bar.querySelector('[data-pdlg-open]').addEventListener('click', () => { applyI18n(); render(); dlg.showModal(); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    store.subscribe(render); addEventListener('resize', fit);
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
    mountHeader(); mountHero(); mountPageHero(); mountDetail(); mountPlans(); mountCompat(); mountCompatPage(); mountNewsletter(); mountContact(); applyI18n(); refineByTrace();
    store.subscribe(applyI18n);
  });
})();
