/* Realm Academy — storefront */
(function(){
'use strict';
const { sb, $, $$, esc, num, dt, I, toast, modal, confirmBox, confetti, copyText, errMsg, setBusy, safeUrl, safeColor, waLink, t, money, L } = RA;

const S = { revealed:{}, noReveal:false, user:null, customer:null, products:[], stock:{}, methods:[], cat:'all', q:'', loaded:false, isAdmin:false };
const app = $('#app');
const DEFAULT_DOMAINS = ['gmail.com','googlemail.com','outlook.com','hotmail.com','live.com','msn.com','yahoo.com','ymail.com','icloud.com','me.com','mac.com','proton.me','protonmail.com','aol.com','yandex.com','yandex.ru','mail.ru','gmx.com','gmx.de','zoho.com'];

/* ───────── Data ───────── */
async function loadCatalog(){
  const [p, st] = await Promise.all([
    sb.from('ra_products').select('*, ra_variants(*)').eq('active', true).or('category_en.is.null,category_en.neq.Xbox Games').order('sort_order'),
    sb.rpc('ra_stock_counts')
  ]);
  if(p.error) throw p.error;
  S.products = (p.data||[]).map(x => ({...x, variants:(x.ra_variants||[]).filter(v=>v.active).sort((a,b)=>a.sort_order-b.sort_order||a.price-b.price)})).filter(x => x.variants.length || !(x.ra_variants||[]).length);
  S.stock = {}; (st.data||[]).forEach(r => S.stock[r.variant_id] = Number(r.available));
  S.loaded = true;
}
async function loadMethods(){
  if(S.methods.length) return S.methods;
  const { data } = await sb.from('ra_payment_methods').select('*').eq('active', true).order('sort_order');
  S.methods = data || []; return S.methods;
}
async function loadCustomer(){
  if(!S.user){ S.customer = null; return; }
  const { data } = await sb.from('ra_customers').select('*').eq('id', S.user.id).maybeSingle();
  S.customer = data || { balance:0 };
  renderHeader();
}

/* ───────── Helpers ───────── */
const ORDW = { ku:['یەکەم','دووەم','سێیەم','چوارەم','پێنجەم','شەشەم','حەوتەم','هەشتەم','نۆیەم','دەیەم','یازدەیەم','دوازدەیەم'], ar:['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر'] };
function ordinal(n){ if(RA.lang === 'en'){ const sx=['th','st','nd','rd'], v=n%100; return n + (sx[(v-20)%10] || sx[v] || sx[0]); } return (ORDW[RA.lang] || ORDW.ku)[n-1] || String(n); }
function subInfo(x){ // x: order row or meta
  const parts = Number(x.sub_parts ?? x.parts) || 1, every = Math.max(1, Number(x.sub_every ?? x.every) || 1), months = Number(x.sub_months ?? x.months) || parts * every;
  return { parts, every, months };
}
function partLabel(x, n){
  const { every, months } = subInfo(x); const a = (n-1)*every + 1, b = Math.min(n*every, months || n*every);
  return every <= 1 || a === b ? t('sub_month_n', { ord: ordinal(a) }) : t('sub_months_range', { a, b });
}
function subBar(parts, done, cur){
  return `<div class="sub-bar" style="--n:${parts}">${Array.from({length:parts}, (_,i) => `<i class="${i < done ? 'on' : ''} ${cur && i === cur-1 ? 'cur' : ''}"></i>`).join('')}</div>`;
}
function dday(d){ const x = new Date(d); const p = n => String(n).padStart(2,'0'); return '\u2066' + p(x.getDate()) + '/' + p(x.getMonth()+1) + '/' + x.getFullYear() + '\u2069'; }
function credHTML(content){
  const c = RA.parseCred(content);
  if(!RA.credFound(c)) return `<pre>${esc(content)}</pre>`;
  const row = (ic, k, v, secret) => `<div class="cred-row"><span class="cr-k">${ic} ${esc(t(k))}</span><code class="cr-v" dir="ltr">${esc(v)}</code><button class="cr-cp" data-copy="${esc(v)}" aria-label="${esc(t('copy'))}">${I.copy}</button></div>`;
  return `<div class="cred">${c.email ? row('📧','cred_email', c.email) : ''}${c.username ? row('👤','cred_user', c.username) : ''}${row('🔑','cred_pass', c.password, true)}${c.extra.length ? `<div class="cred-x">${esc(c.extra.join('\n'))}</div>` : ''}</div>`;
}
function daysLeft(d){ return Math.ceil((new Date(d) - Date.now()) / 86400000); }
function unlockAt(o){ return o.unlock_at || (o.next_due ? new Date(new Date(o.next_due) - 5*86400000).toISOString() : null); }
function isDue(o){ const u = unlockAt(o); return !u || new Date(u) <= new Date(); }
function planTag(v){ if(!(v.months > 1 && v.every < v.months)) return ''; return `<span class="plan-sub">${esc(t('sub_plan_tag',{n:v.months}))} · ${esc(v.every > 1 ? t('sub_plan_every',{e:v.every}) : t('sub_plan_monthly'))}</span>`; }

function brandMark(){ const logo = safeUrl(RA.settings.logo); return logo ? `<img src="${esc(logo)}" alt="" class="logo-img">` : I.logo; }
function richTitle(s){ return esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="g">$1</span>'); }
/* product description → tidy paragraphs, headings and bullet lists */
const inlTxt = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener nofollow">$1</a>');
const EMO_RE = /^(?:\p{Extended_Pictographic}|[\u2600-\u27BF])(?:\uFE0F|\u200D(?:\p{Extended_Pictographic}|[\u2600-\u27BF]))*\uFE0F?\s*/u;
function fmtDesc(txt){
  const lines = String(txt || '').replace(/\r/g, '').split('\n');
  let html = '', list = null, para = [];
  const fP = () => { if(para.length){ html += `<p>${para.join('<br>')}</p>`; para = []; } };
  const fL = () => { if(list){ html += `<ul class="dl">${list.join('')}</ul>`; list = null; } };
  for(const raw of lines){
    const ln = raw.trim(); let m;
    if(!ln){ fP(); fL(); continue; }
    if((m = ln.match(/^(?:[-–•*▪●◦►▸➤]|\d{1,2}[.)\-])\s+(.+)$/))){ fP(); (list = list || []).push(`<li><span>${inlTxt(m[1])}</span></li>`); continue; }
    if((m = ln.match(EMO_RE)) && ln.length > m[0].length + 1){ fP(); (list = list || []).push(`<li class="em"><i>${esc(m[0].trim())}</i><span>${inlTxt(ln.slice(m[0].length))}</span></li>`); continue; }
    if(ln.length <= 70 && /[:：]$/.test(ln)){ fP(); fL(); html += `<h4>${inlTxt(ln.replace(/[:：]$/, ''))}</h4>`; continue; }
    fL(); para.push(inlTxt(ln));
  }
  fP(); fL(); return html;
}
function descBlock(txt, extra = ''){
  return `<div class="dsc short" data-dsc><div class="dsc-in">${fmtDesc(txt)}${extra}</div><button type="button" class="dsc-more"><span>${esc(t('show_more'))}</span> <i>⌄</i></button></div>`;
}
function bindDesc(root){
  $$('[data-dsc]', root).forEach(d => {
    const inn = d.querySelector('.dsc-in'), btn = d.querySelector('.dsc-more');
    const fit = () => { if(d.classList.contains('clamp') && inn.scrollHeight <= inn.clientHeight + 24){ d.classList.remove('clamp'); d.classList.add('short'); } };
    fit(); setTimeout(fit, 400);
    btn.onclick = () => { const open = d.classList.toggle('open'); d.classList.toggle('clamp', !open); btn.querySelector('span').textContent = t(open ? 'show_less' : 'show_more'); if(!open) d.scrollIntoView({ block:'nearest', behavior:'smooth' }); };
  });
}
function ico(svg, size=18){ return svg.replace('<svg', `<svg width="${size}" height="${size}"`); }
/* Product image block: blurred backdrop + crisp centred image */
function mediaHTML(p, big){
  const img = safeUrl(p.image_url);
  if(!img) return `<span class="em">${esc(p.emoji||'✨')}</span>`;
  const fit = p.image_fit === 'cover' ? 'cover' : 'contain';
  const lz = big ? 'fetchpriority="high"' : 'loading="lazy"';
  if(fit === 'cover') return `<img class="img-cover" src="${esc(img)}" alt="${esc(p.name)}" decoding="async" ${lz}>`;
  return `<img class="img-bg" src="${esc(img)}" alt="" aria-hidden="true" decoding="async" ${lz}><img class="img-fg" src="${esc(img)}" alt="${esc(p.name)}" decoding="async" ${lz}>`;
}
function allowedDomains(){ const d = RA.settings.allowed_domains; return Array.isArray(d) && d.length ? d.map(x=>String(x).toLowerCase().trim()).filter(Boolean) : DEFAULT_DOMAINS; }

/* ───────── Chrome ───────── */
function renderChrome(){
  const s = RA.settings;
  $('#brandMark').innerHTML = brandMark(); $('#footMark').innerHTML = brandMark();
  $('#brandName').textContent = s.name || 'Realm Academy'; $('#footName').textContent = s.name || 'Realm Academy';
  $('#footText').textContent = t('footer');
  $('#lnkPrivacy').textContent = t('privacy'); $('#lnkTerms').textContent = t('terms');
  const ib = $('#instBtn'); if(ib){ ib.innerHTML = I.download; ib.setAttribute('aria-label', t('install_app')); ib.title = t('install_app'); ib.classList.remove('hidden'); ib.onclick = doInstall; }
  const li = $('#lnkInstall'); if(li){ li.textContent = '📲 ' + t('install_app'); li.classList.toggle('hidden', isStandalone()); li.onclick = e => { e.preventDefault(); doInstall(); }; }
  const annText = t('announcement');
  const an = $('#announce'); if(annText && annText !== '-'){ an.classList.remove('hidden'); setAnnounce(an, annText); } else an.classList.add('hidden');
  const soc = [];
  if(s.whatsapp) soc.push(`<a href="${esc(waLink(s.whatsapp))}" target="_blank" rel="noopener" aria-label="WhatsApp">${I.wa}</a>`);
  if(safeUrl(s.telegram)) soc.push(`<a href="${esc(s.telegram)}" target="_blank" rel="noopener" aria-label="Telegram">${I.tg}</a>`);
  if(safeUrl(s.instagram)) soc.push(`<a href="${esc(s.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${I.ig}</a>`);
  $('#socials').innerHTML = soc.join('');
  $('#themeBtn').innerHTML = document.documentElement.dataset.theme === 'light' ? I.moon : I.sun;
  $('#langBtn').innerHTML = `${I.globe}<span>${({ku:'کوردی',en:'EN',ar:'عربي'})[RA.lang]}</span>`;
  Chat.chrome();
  $$('#topNav a').forEach(a => a.textContent = t('nav_' + a.dataset.r));
}
/* announcement: when the text is longer than the screen it glides smoothly instead of wrapping */
function setAnnounce(an, txt){
  an.classList.remove('mq'); an.textContent = txt;
  requestAnimationFrame(() => {
    if(an.scrollWidth <= an.clientWidth + 2 && an.offsetHeight < 44) return;
    an.innerHTML = `<div class="an-track"><span>${esc(txt)}</span><span aria-hidden="true">${esc(txt)}</span></div>`;
    an.classList.add('mq');
    const sp = an.querySelector('span'); const w = sp.getBoundingClientRect().width + 60;
    const rtl = document.documentElement.dir === 'rtl';
    an.style.setProperty('--d', (rtl ? w : -w) + 'px'); an.style.setProperty('--dur', Math.max(10, w / 45) + 's');
  });
}
let anTm; window.addEventListener('resize', () => { clearTimeout(anTm); anTm = setTimeout(() => { const an = $('#announce'); const txt = t('announcement'); if(an && !an.classList.contains('hidden') && txt && txt !== '-') setAnnounce(an, txt); }, 300); });
function renderHeader(){
  const box = $('#hdrUser');
  if(!S.user){ box.innerHTML = `<a class="btn btn-p btn-sm" href="#/login">${esc(t('nav_login'))}</a>`; return; }
  const name = S.customer?.full_name || S.user.user_metadata?.full_name || S.user.email || '';
  const av = safeUrl(S.customer?.avatar_url || S.user.user_metadata?.avatar_url);
  box.innerHTML = `
    <a class="bal-chip" href="#/wallet/add" title="${esc(t('add_balance'))}"><span class="num">${num(S.customer?.balance)}</span><small class="muted cur">${esc(t('currency'))}</small><span class="plus">+</span></a>
    <button class="avatar" id="avBtn" aria-label="menu">${av ? `<img src="${esc(av)}" alt="" referrerpolicy="no-referrer">` : esc((name[0]||'?').toUpperCase())}</button>`;
  $('#avBtn').onclick = e => { e.stopPropagation(); toggleMenu(name); };
}
function toggleMenu(name){
  const old = $('.menu'); if(old){ old.remove(); return; }
  const m = document.createElement('div'); m.className='menu';
  m.innerHTML = `<div class="who"><b>${esc(name)}</b><small>${esc(S.user.email||'')}</small></div>
    <a href="#/wallet">${ico(I.wallet)} ${esc(t('nav_wallet'))}</a>
    <a href="#/orders">${ico(I.bag)} ${esc(t('nav_orders'))}</a>
    <a href="#/account">${ico(I.user)} ${esc(t('nav_account'))}</a>
    <button id="menuChat">${ico(I.chat)} ${esc(t('chat_title'))}</button>
    ${S.isAdmin ? `<a href="/admin.html">${ico(I.shield)} ${esc(t('admin_panel'))}</a>` : ''}
    ${canShowInstall() ? `<button id="menuInstall">${I.download} ${esc(t('install_app'))}</button>` : ''}
    <button id="logoutBtn">${I.logout} ${esc(t('logout'))}</button>`;
  document.body.appendChild(m);
  $('#logoutBtn').onclick = async () => { await sb.auth.signOut(); m.remove(); location.hash = '#/'; toast(t('bye')); };
  const mi = $('#menuInstall'); if(mi) mi.onclick = () => { m.remove(); doInstall(); };
  $('#menuChat').onclick = () => { m.remove(); Chat.open(); };
  setTimeout(()=>document.addEventListener('click', function h(e){ if(!m.contains(e.target)){ m.remove(); document.removeEventListener('click', h); } }), 0);
}
function renderBottomNav(r){
  const items = [['home','#/',t('nav_home'),I.home],['wallet','#/wallet',t('nav_wallet'),I.wallet],['orders','#/orders',t('nav_orders'),I.bag],['account', S.user?'#/account':'#/login', S.user?t('nav_account'):t('nav_login'), I.user]];
  $('#bnav').innerHTML = items.map(([k,h,l,ic]) => `<a href="${h}" class="${r===k?'on':''}">${ic}<span>${esc(l)}</span></a>`).join('');
  $$('#topNav a').forEach(a => a.classList.toggle('on', a.dataset.r === r));
}

/* ───────── Router ───────── */
let currentRoute = 'home';
/* remember scroll position per page, restore it when coming back from a product */
const POS = {}; let posKey = '', posLock = false, posRaf = 0;
try{ history.scrollRestoration = 'manual'; }catch{}
window.addEventListener('scroll', () => { if(posKey && !posLock) POS[posKey] = window.scrollY; }, { passive:true });
['wheel','touchstart','keydown'].forEach(ev => window.addEventListener(ev, () => { posLock = false; }, { passive:true }));
function restoreScroll(key){
  const y = POS[key] || 0; posLock = true; let tries = 0;
  const go = () => {
    if(posKey !== key || !posLock) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top:Math.min(y, Math.max(0, max)), behavior:'instant' });
    if(max < y && ++tries < 40) setTimeout(go, 50); else setTimeout(() => { posLock = false; }, 120);
  };
  setTimeout(go, 0);
}
function route(){
  const pm = location.pathname.match(/^\/p\/([^/?#]+)/);
  if(location.pathname !== '/' && location.hash.length > 1){ history.replaceState(null, '', '/' + location.hash); }
  const h = location.hash.replace(/^#/, '') || (pm && location.pathname !== '/' ? '/p/' + pm[1] : '/');
  if(h === 'products'){ return; }
  const parts = h.split('?')[0].split('/').filter(Boolean);
  $('.menu')?.remove();
  const key = '/' + parts.join('/'), prevKey = posKey;
  const back = /^\/(p|b)\//.test(prevKey) && !/^\/(p|b)\//.test(key) && POS[key] > 0;
  posKey = key;
  posLock = back;
  RA.logVisit(key);
  const r = parts[0] || 'home'; currentRoute = r;
  const seq = ++navSeq;
  const run = () => { if(!back) window.scrollTo({top:0, behavior:'instant'}); const out = dispatch(r, parts); if(back) restoreScroll(key); return out; };
  if(!booted || document.hidden){ app.classList.remove('pg-out','pg-in'); return run(); }
  /* smooth, flicker-free page change (same on iPhone and Android):
     1) fade the old page out  2) build the new page while hidden  3) wait for its first images  4) fade it in */
  app.classList.remove('pg-in'); app.classList.add('pg-out');
  setTimeout(async () => {
    if(seq !== navSeq) return;
    S.noReveal = true;
    let out; try{ out = run(); }catch(e){ console.error(e); }
    await Promise.race([Promise.resolve(out).catch(() => {}), sleep(380)]);
    S.noReveal = false;
    await imgsReady(app, 260);
    if(seq !== navSeq) return;
    app.classList.remove('pg-out'); void app.offsetWidth; app.classList.add('pg-in');
  }, 150);
}
let navSeq = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function imgsReady(root, max){
  const vh = window.innerHeight;
  const imgs = [...root.querySelectorAll('img')].filter(i => { const r = i.getBoundingClientRect(); return r.top < vh * 1.2 && r.bottom > -50; }).slice(0, 8);
  return Promise.race([Promise.all(imgs.map(i => (i.complete && i.naturalWidth) ? null : (i.decode ? i.decode().catch(() => {}) : null))), sleep(max)]);
}
function dispatch(r, parts){
  renderBottomNav(r === 'p' || r === 'b' ? 'home' : r === 'login' || r === 'support' ? 'account' : r);
  if(r === 'home') return viewHome();
  if(r === 'p') return viewProduct(decodeURIComponent(parts[1]||''));
  if(r === 'steam') return viewSteam();
  if(r === 'xbox') return viewXbox();
  if(r === 'b') return viewBundle(decodeURIComponent(parts[1]||''));
  if(r === 'support'){ location.replace('#/'); setTimeout(() => Chat.open(), 50); return; }
  if(r === 'login') return viewLogin(parts[1]);
  if(r === 'wallet') return needAuth() && (parts[1]==='add' ? viewAddFunds() : viewWallet());
  if(r === 'orders') return needAuth() && viewOrders();
  if(r === 'account') return needAuth() && viewAccount();
  if(r === 'reset') return viewReset();
  return viewHome();
}
function needAuth(){
  if(S.user) return true;
  try{ sessionStorage.setItem('ra_next', location.hash); }catch{}
  location.hash = '#/login'; return false;
}
function goNext(){
  let n = ''; try{ n = sessionStorage.getItem('ra_next') || ''; sessionStorage.removeItem('ra_next'); }catch{}
  location.hash = n && !n.includes('login') ? n : '#/';
}

/* ───────── Home ───────── */
function minPrice(p){ return p.variants.length ? Math.min(...p.variants.map(v=>effPrice(v))) : 0; }
function saleInfo(p){ const sv = p.variants.filter(saleOf); if(!sv.length) return null; const pct = Math.max(...sv.map(v => Math.round((1 - effPrice(v)/Number(v.price))*100))); const until = sv.map(v=>v.sale_until).filter(Boolean).sort()[0] || null; return { pct, until }; }
function stockLabel(p){
  const auto = p.variants.some(v => v.auto_deliver && S.stock[v.id] > 0);
  return auto ? `<span class="stock">${esc(t('stock_instant'))}</span>` : `<span class="stock manual">${esc(t('stock_available'))}</span>`;
}
function cardHTML(p){
  const ac = safeColor(p.accent);
  return `<a class="card" href="/p/${encodeURIComponent(p.slug)}" data-spa="#/p/${encodeURIComponent(p.slug)}" style="${ac?`--ac:${ac}`:''}">
    <div class="media">${mediaHTML(p)}${p.badge ? `<span class="badge ${p.featured?'gold':''}">${esc(L(p,'badge'))}</span>` : ''}${(() => { const si = saleInfo(p); return si ? `<span class="sale-tag">🔥 −${si.pct}%</span>` : ''; })()}</div>
    <div class="body">
      <h3>${esc(L(p,'name'))}</h3>
      <p>${esc(L(p,'short'))}</p>
      ${stockLabel(p)}
      ${(() => { const si = saleInfo(p); return si && si.until ? `<div class="cd-mini" data-cd="${esc(si.until)}">⏳ <span class="cdv num">${esc(cdText(si.until))}</span></div>` : ''; })()}
      <div class="cfoot"><div><span class="from">${esc(t('price_from'))}</span><span class="price"><span class="num">${num(minPrice(p))}</span> <small>${esc(t('currency'))}</small></span></div><span class="go">${I.arrow}</span></div>
    </div></a>`;
}
const HOME_TITLE = 'Realm Academy — ئەکاونتی پریمیەمی ڕەسەن | ChatGPT، CapCut، Canva، Gemini', HOME_DESC = location.pathname === '/' ? (document.querySelector('meta[name="description"]')?.getAttribute('content') || '') : '';
function viewHome(){
  document.title = HOME_TITLE.replace('Realm Academy', RA.settings.name || 'Realm Academy'); if(HOME_DESC) document.querySelector('meta[name="description"]')?.setAttribute('content', HOME_DESC);
  const s = RA.settings;
  app.innerHTML = `
  <section class="hero">
    <div class="hero-main">
      <span class="pill"><span class="dot"></span> ${esc(t('hero_pill'))}</span>
      <h1>${richTitle(t('hero_title'))}</h1>
      <p class="lead">${esc(t('hero_text'))}</p>
      <div class="cta">
        <a class="btn btn-p btn-lg" href="#products" id="ctaProducts">${esc(t('hero_cta_products'))}</a>
        <a class="btn btn-lg" href="#/wallet/add">${ico(I.wallet,20)} ${esc(t('hero_cta_wallet'))}</a>
      </div>
      <div class="trust"><span>${I.bolt} ${esc(t('trust_fast'))}</span><span>${I.shield} ${esc(t('trust_safe'))}</span><span>${I.headset} ${esc(t('trust_support'))}</span></div>
    </div>
    <div class="hero-card">
      <div class="wallet-vis"><div class="wv-top"><small>${esc(t('wallet_card_title',{name:s.name||'Realm Academy'}))}</small><span class="wv-logo">${I.logo}</span></div>
        <div><small>${esc(t('wallet_card_balance'))}</small><div class="amt"><span class="num">${S.customer ? num(S.customer.balance) : '••••••'}</span> <span class="cur">${esc(t('currency'))}</span></div></div></div>
      <div class="steps">
        <div class="step"><i>1</i><div><b>${esc(t('step1_title'))}</b><small>${esc(t('step1_text'))}</small></div></div>
        <div class="step"><i>2</i><div><b>${esc(t('step2_title'))}</b><small>${esc(t('step2_text'))}</small></div></div>
        <div class="step"><i>3</i><div><b>${esc(t('step3_title'))}</b><small>${esc(t('step3_text'))}</small></div></div>
      </div>
    </div>
  </section>
  <section class="sec games-sec hidden" id="gamesSec"></section>
  <section class="sec" id="products">
    <div class="sec-h"><h2>${esc(t('products_title'))}</h2>
      <label class="search">${I.search}<input id="q" placeholder="${esc(t('search_ph'))}" value="${esc(S.q)}"></label></div>
    <div class="chips" id="chips"></div>
    <div class="grid" id="grid">${S.loaded ? '' : Array(6).fill('<div class="sk" style="height:300px"></div>').join('')}</div>
  </section>
  <section class="sec hidden" id="bundlesSec"><div class="sec-h"><h2>${esc(t('bundles_title'))}</h2></div><div class="bgrid" id="bGrid"></div></section>
  ${canShowInstall() ? `<section class="sec app-promo" id="appPromo"><div class="ap-ic">${I.logo}</div><div class="ap-txt"><h2>${esc(t('install_sec_title'))}</h2><p class="t2">${esc(t('install_sec_text'))}</p></div><button class="btn btn-p btn-lg" id="apBtn">${I.download} ${esc(t('install_app'))}</button></section>` : ''}`;
  const apb = $('#apBtn'); if(apb) apb.onclick = doInstall;
  $('#q').oninput = e => { S.q = e.target.value; drawGrid(); };
  $('#ctaProducts').onclick = e => { e.preventDefault(); $('#products').scrollIntoView({behavior:'smooth'}); };
  if(S.loaded){ drawGrid(); drawGames(); } else loadCatalog().then(() => { drawGrid(); drawSteamStrip(); }).catch(e => { const g=$('#grid'); if(g) g.innerHTML = `<div class="empty">${esc(errMsg(e))}</div>`; });
  drawGames();
  drawBundles();
  drawXboxStrip();
}
async function loadBundles(){
  if(S.bundles) return S.bundles;
  const { data } = await sb.from('ra_bundles').select('*').eq('active', true).order('sort_order');
  S.bundles = data || []; return S.bundles;
}
function bundleInfo(b){
  const vm = {}; S.products.forEach(p => p.variants.forEach(v => vm[v.id] = { v, p }));
  const items = (b.items||[]).map(id => vm[id]).filter(Boolean);
  if(items.length !== (b.items||[]).length || items.length < 2) return null;
  const full = items.reduce((a,x)=>a+Number(x.v.price),0), paid = items.reduce((a,x)=>a+Number(x.v.price)-Math.floor(Number(x.v.price)*b.percent/100),0);
  return { items, full, paid };
}
async function drawBundles(){
  try{ if(!S.loaded) await loadCatalog(); await loadBundles(); }catch{ return; }
  const sec = $('#bundlesSec'), g = $('#bGrid'); if(!sec || !g) return;
  const list = S.bundles.map(b => ({ b, i:bundleInfo(b) })).filter(x => x.i);
  sec.classList.toggle('hidden', !list.length);
  g.innerHTML = list.map(({b,i}) => `<a class="bcard" href="#/b/${b.id}"><div class="bc-top"><span class="bc-ic">${safeUrl(b.image_url)?`<img src="${esc(b.image_url)}" alt="">`:esc(b.emoji||'🎁')}</span><span class="sale-tag static">−${b.percent}%</span></div>
    <h3>${esc(L(b,'name'))}</h3>${L(b,'short')?`<p class="muted">${esc(L(b,'short'))}</p>`:''}
    <div class="bc-items">${i.items.map(x=>`<span class="bc-it"><span class="bc-th">${safeUrl(x.p.image_url)?`<img src="${esc(x.p.image_url)}" alt="">`:esc(x.p.emoji||'✨')}</span>${esc(L(x.p,'name'))}</span>`).join('<b class="bc-plus">+</b>')}</div>
    <div class="cfoot"><div><s class="muted num">${num(i.full)}</s> <span class="price"><span class="num">${num(i.paid)}</span> <small>${esc(t('currency'))}</small></span></div><span class="go">${I.arrow}</span></div></a>`).join('');
}
async function viewBundle(id){
  app.innerHTML = '<div class="sk" style="height:420px;margin-top:30px"></div>';
  try{ if(!S.loaded) await loadCatalog(); S.bundles = null; await loadBundles(); }catch(e){ app.innerHTML = `<div class="empty">${esc(errMsg(e))}</div>`; return; }
  const b = S.bundles.find(x => x.id === id); const i = b && bundleInfo(b);
  if(!b || !i){ app.innerHTML = `<div class="empty" style="padding:80px 0"><div class="e">🤷</div>${esc(t('not_found'))}<br><br><a class="btn" href="#/">${esc(t('go_back'))}</a></div>`; return; }
  const cur = esc(t('currency'));
  app.innerHTML = `<a class="back" href="#/">${I.back} ${esc(t('back_products'))}</a>
  <div class="narrow" style="margin-top:14px"><div class="panel bundle-page">
    <div class="bc-top"><span class="bc-ic big">${safeUrl(b.image_url)?`<img src="${esc(b.image_url)}" alt="">`:esc(b.emoji||'🎁')}</span><span class="sale-tag static">${esc(t('bundle_save',{pct:b.percent}))}</span></div>
    <h1 style="margin:10px 0 4px">${esc(L(b,'name'))}</h1>${L(b,'short')?`<p class="t2">${esc(L(b,'short'))}</p>`:''}
    <div class="lbl-sm" style="margin-top:14px">${esc(t('bundle_items'))}</div>
    <div class="list">${i.items.map(x => `<div class="item"><div class="othumb">${safeUrl(x.p.image_url)?`<img src="${esc(x.p.image_url)}" alt="">`:esc(x.p.emoji||'✨')}</div><div class="grow"><b>${esc(L(x.p,'name'))}</b><small class="muted">${esc(L(x.v,'name'))} · <a href="/p/${encodeURIComponent(x.p.slug)}" data-spa="#/p/${encodeURIComponent(x.p.slug)}">${esc(t('about_product'))}</a></small></div><span class="num"><s class="muted">${num(x.v.price)}</s> <b>${num(Number(x.v.price)-Math.floor(Number(x.v.price)*b.percent/100))}</b></span></div>`).join('')}</div>
    <div id="bFlds">${i.items.map(x => (Array.isArray(x.p.fields)?x.p.fields:[]).map((f,k) => `<div class="field"><label>${esc(L(x.p,'name'))} — ${esc(L(f,'label'))} ${f.required?'<span class="req">*</span>':''}</label><input class="inp" data-bv="${x.v.id}" data-bk="${k}" ${fieldAttrs(f)}></div>`).join('')).join('')}</div>
    <div class="price-break"><div><span>${esc(t('price_list'))}</span><s class="num">${num(i.full)}</s></div><div class="pb-save">🎉 ${esc(t('you_save',{amount:money(i.full-i.paid)}))}</div></div>
    <div class="total"><span class="t2">${esc(t('total'))}</span><span class="price"><span class="num">${num(i.paid)}</span> <small>${cur}</small></span></div>
    <label class="accept" id="accBox"><input type="checkbox" id="accChk"><span>${esc(t('accept_check'))} · <a href="/terms.html" target="_blank" rel="noopener">${esc(t('accept_terms'))}</a></span></label>
    <button class="btn btn-p btn-lg btn-block" id="bBuy">🎁 ${esc(t('bundle_buy'))}</button>
    <p class="muted hint">${S.user ? esc(t('your_balance',{amount:money(S.customer?.balance||0)})) : esc(t('login_to_buy'))}</p>
  </div></div>`;
  $('#accChk').onchange = () => $('#accBox').classList.remove('need');
  $('#bBuy').onclick = async () => {
    if(!$('#accChk').checked){ const bx = $('#accBox'); bx.classList.remove('need'); void bx.offsetWidth; bx.classList.add('need'); toast(t('accept_need'),'bad'); return; }
    if(!S.user){ try{ sessionStorage.setItem('ra_next', location.hash); }catch{} location.hash = '#/login'; toast(t('login_first')); return; }
    const fields = {};
    for(const x of i.items){ const defs = Array.isArray(x.p.fields) ? x.p.fields : []; const fv = {};
      for(const el of $$(`[data-bv="${x.v.id}"]`)){ const f = defs[Number(el.dataset.bk)]; const val = el.value.trim(); if(f.required && !val){ el.focus(); toast(t('fill_field',{label:L(f,'label')}),'bad'); return; } if(fieldBad(f, val)){ el.focus(); toast(t(fieldKind(f)==='gmail'?'bad_gmail':'bad_email'),'bad'); return; } fv[f.label] = val; }
      if(pairBad(defs, fv)){ toast(t('pair_need'),'bad'); return; }
      fields[x.v.id] = fv; }
    await loadCustomer(); const bal = Number(S.customer?.balance||0);
    if(bal < i.paid){ insufficientModal(L(b,'name'), i.paid - bal, bal, i.paid); return; }
    if(!(await confirmBox(t('confirm_title'), `${L(b,'name')}\n${t('price')}: ${money(i.paid)}\n${t('confirm_after')}: ${money(bal - i.paid)}`, t('confirm_yes')))) return;
    const btn = $('#bBuy'); setBusy(btn, true);
    const { error } = await sb.rpc('ra_purchase_bundle', { p_bundle: b.id, p_fields: fields });
    setBusy(btn, false, '🎁 ' + esc(t('bundle_buy')));
    if(error) return toast(errMsg(error), 'bad');
    await loadCustomer(); confetti(); toast(t('bundle_done'), 'ok');
    Chat.open(`✅ ${esc(t('bundle_done'))}`);
    loadCatalog().catch(()=>{});
  };
}
function drawGrid(){
  const chips = $('#chips'); if(!chips) return;
  const cats = [...new Set(S.products.filter(p=>!isSteam(p)).map(p=>p.category).filter(Boolean))];
  const hasSteam = S.products.some(isSteam), hasXbox = !!(XB.teaser && XB.teaser.count);
  chips.innerHTML = cats.length > 1 || hasSteam || hasXbox ? [['all',t('filter_all')], ...cats.map(c=>[c, L(S.products.find(p=>p.category===c),'category') || c])].map(([k,l]) => `<button class="chip ${S.cat===k?'on':''}" data-c="${esc(k)}">${esc(l)}</button>`).join('') + (hasSteam ? `<a class="chip chip-steam" href="#/steam">${stLogo('chip-logo')} ${esc(t('steam_title'))}</a>` : '') + (hasXbox ? `<a class="chip chip-xbox" href="#/xbox">${xbLogo('chip-logo')} ${esc(t('xbox_title'))}</a>` : '') : '';
  $$('.chip[data-c]', chips).forEach(b => b.onclick = () => { S.cat = b.dataset.c; drawGrid(); });
  const q = S.q.trim().toLowerCase();
  const list = S.products.filter(p => (q ? true : !isSteam(p)) && (S.cat==='all' || p.category===S.cat) && (!q || [p.name,p.short,p.short_en,p.short_ar,p.category,p.category_en,p.category_ar].join(' ').toLowerCase().includes(q)));
  const had = !!$('#grid .card');
  const cards = list.map(cardHTML);
  const withShow = S.cat === 'all' && !q && cards.length > 8;
  if(withShow) cards.splice(8, 0, showcaseHTML());
  $('#grid').innerHTML = cards.length ? cards.join('') : `<div class="empty" style="grid-column:1/-1"><div class="e">🔍</div>${esc(t('no_results'))}</div>`;
  if(withShow) startShowcase($('#grid .showcase'));
  reveal($('#grid'), !had && !S.noReveal && !S.revealed.grid && (S.revealed.grid = true));
}

/* ───────── Showcase slider (70% apps · 30% games, random, no repeats) ───────── */
function shuffle(a){ a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function showcaseSeq(){
  const apps = S.products.filter(p => !isSteam(p) && safeUrl(p.image_url) && p.variants.length);
  const games = [...steamGames(), ...((XB.teaser && XB.teaser.items) || [])].filter(p => safeUrl(p.image_url) && p.variants.length);
  const sig = apps.length + ':' + games.length;
  if(S.show && S.show.sig === sig) return S.show.seq;
  const A = shuffle(apps), G = shuffle(games).slice(0, Math.max(1, Math.round(A.length * 3 / 7)));
  const seq = []; let acc = 0, ai = 0, gi = 0;
  while(ai < A.length || gi < G.length){
    acc += 0.3;
    if(gi < G.length && (acc >= 1 || ai >= A.length)){ seq.push(G[gi++]); acc -= 1; } else if(ai < A.length) seq.push(A[ai++]);
  }
  S.show = { sig, seq }; return seq;
}
function showTile(p, hide){
  const g = isSteam(p) ? stLogo('sc-lg') : isXbox(p) ? xbLogo('sc-lg') : '';
  const img = esc(safeUrl(p.image_url));
  return `<a class="sc-it ${g ? 'is-game' : ''}" href="/p/${encodeURIComponent(p.slug)}" data-spa="#/p/${encodeURIComponent(p.slug)}" draggable="false" ${hide ? 'tabindex="-1" aria-hidden="true"' : ''}>
    <span class="sc-img"><img class="sc-bg" src="${img}" alt="" loading="lazy" decoding="async" draggable="false"><img class="sc-fg ${p.image_fit === 'cover' ? 'cv' : ''}" src="${img}" alt="${hide ? '' : esc(L(p,'name'))}" loading="lazy" decoding="async" draggable="false">${g ? `<span class="sc-badge">${g}</span>` : ''}</span>
    <span class="sc-tx"><b dir="auto">${esc(L(p,'name'))}</b><small><span class="num">${num(minPrice(p))}</span> ${esc(t('currency'))}</small></span></a>`;
}
function showcaseHTML(){
  const seq = showcaseSeq(); if(seq.length < 3) return '';
  const set = h => seq.map(p => showTile(p, h)).join('');
  return `<div class="showcase" aria-label="${esc(t('slider_title'))}"><div class="sc-h"><span class="sc-spark">✦</span><b>${esc(t('slider_title'))}</b></div><div class="sc-view"><div class="sc-track">${set(false)}${set(true)}</div></div></div>`;
}
function startShowcase(root, view, track, base){
  if(!root) return;
  view = view || root.querySelector('.sc-view'); track = track || root.querySelector('.sc-track'); if(!view || !track) return;
  const reduce = false;
  const speed = reduce ? 0 : (base || (window.innerWidth < 600 ? 34 : 46)); // px per second
  let x = 0, w = 0, last = 0, vis = true, hover = false, drag = null, moved = false, vel = 0, hold = 0;
  const measure = () => { w = track.scrollWidth / 2; };
  measure(); setTimeout(measure, 800); window.addEventListener('resize', measure, { passive:true });
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(e => { vis = e[0].isIntersecting; }) : null; io && io.observe(root);
  const frame = now => {
    if(!root.isConnected){ io && io.disconnect(); window.removeEventListener('resize', measure); return; }
    requestAnimationFrame(frame);
    const dt = Math.min(50, now - (last || now)); last = now;
    if(!vis || document.hidden) return;
    if(!drag){
      if(Math.abs(vel) > .02){ x += vel * dt; vel *= Math.pow(.92, dt / 16); }
      else if(!hover && now > hold) x -= speed * dt / 1000;
    }
    if(w > 0){ while(x <= -w) x += w; while(x > 0) x -= w; }
    track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
  };
  requestAnimationFrame(frame);
  view.addEventListener('mouseenter', () => { hover = true; });
  view.addEventListener('mouseleave', () => { hover = false; });
  view.addEventListener('pointerdown', e => { if(e.button) return; drag = { sx:e.clientX, sy:e.clientY, x0:x, lx:e.clientX, lt:performance.now(), axis:0 }; moved = false; vel = 0; });
  window.addEventListener('pointermove', e => {
    if(!drag || !root.isConnected) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if(!drag.axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) drag.axis = Math.abs(dx) > Math.abs(dy) ? 1 : 2;
    if(drag.axis === 2){ drag = null; return; }
    if(drag.axis === 1){ moved = true; x = drag.x0 + dx; const n = performance.now(); vel = (e.clientX - drag.lx) / Math.max(1, n - drag.lt); drag.lx = e.clientX; drag.lt = n; }
  }, { passive:true });
  const end = () => { if(!drag) return; drag = null; hold = performance.now() + 1800; };
  window.addEventListener('pointerup', end, { passive:true }); window.addEventListener('pointercancel', end, { passive:true });
  root.addEventListener('click', e => { if(moved){ e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
}
/* gentle reveal animation for cards as they come into view */
let revIO = null;
function reveal(scope, animate = true){
  if(!scope) return;
  const els = $$('.card:not(.rv), .showcase:not(.rv)', scope);
  if(!animate || !('IntersectionObserver' in window)){ els.forEach(el => el.classList.add('rv','in')); return; }
  if(!revIO) revIO = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); revIO.unobserve(e.target); } }), { rootMargin:'0px 0px -6% 0px' });
  els.forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--rd', (i % 4) * 60 + 'ms'); revIO.observe(el); });
}

/* ───────── Steam collection ───────── */
/* customer fields: e-mail fields only accept a real e-mail (Gmail fields only @gmail.com) */
const fieldKind = f => { if(f.type === 'password') return 'password'; const l = [f.label, f.label_en, f.label_ar].join(' ').toLowerCase(); return /gmail/.test(l) ? 'gmail' : (f.type === 'email' || /ئیمەیڵ|ایمەیل|e-?mail|بريد/.test(l)) ? 'email' : 'text'; };
const fieldAttrs = f => { const k = fieldKind(f); if(k === 'password') return 'type="password" autocomplete="off" dir="ltr" maxlength="120"'; return k === 'text' ? 'maxlength="300"' : `type="email" inputmode="email" autocomplete="email" dir="ltr" maxlength="120" placeholder="${k === 'gmail' ? 'name@gmail.com' : 'name@example.com'}"`; };
function fieldBad(f, val){ if(!val) return false; const k = fieldKind(f); if(k === 'text' || k === 'password') return false; const ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(val); return k === 'gmail' ? !(ok && /@gmail\.com$/i.test(val)) : !ok; }
/* email + password must be given together (or both empty = new account) */
function pairBad(defs, vals){ const e = defs.findIndex(f => fieldKind(f) === 'email'), pw = defs.findIndex(f => fieldKind(f) === 'password'); if(e < 0 || pw < 0) return false; return !!vals[defs[e].label] !== !!vals[defs[pw].label]; }
function isSteam(p){ return p && p.category_en === 'Steam Games'; }
const steamKind = p => ({ shared: p.variants.some(v => /^شەیرد/.test(v.name)), priv: p.variants.some(v => /تایبەت/.test(v.name)) });
function steamGames(){ return S.products.filter(isSteam); }
function steamFrom(){ const sh = steamGames().flatMap(p => p.variants.filter(v => /^شەیرد/.test(v.name)).map(effPrice)); return sh.length ? Math.min(...sh) : 0; }
function steamPanel(g){
  const from = steamFrom();
  return `<div class="steam-box">
    <div class="steam-head gp-head"><a class="btn btn-steam" href="#/steam">${esc(t('steam_see_all',{n:num(g.length)}))} ${I.arrow}</a><span class="steam-ic">${stLogo()}</span></div>
    ${mqRow(shuffle(g).slice(0, 16), 'steam-mini')}
  </div>`;
}
function drawSteamStrip(){ drawGames(); }
/* games row that glides by itself (swipe works too) */
function mqRow(list, cls){
  const tile = (p, hide) => `<a class="${cls}" href="/p/${encodeURIComponent(p.slug)}" data-spa="#/p/${encodeURIComponent(p.slug)}" draggable="false" ${hide ? 'tabindex="-1" aria-hidden="true"' : ''}><div class="sm-img">${mediaHTML(p)}</div><b dir="auto">${esc(L(p,'name'))}</b><small><span class="num">${num(minPrice(p))}</span> ${esc(t('currency'))}</small></a>`;
  if(list.length < 3) return `<div class="steam-row">${list.map(p => tile(p)).join('')}</div>`;
  return `<div class="steam-row mq-view"><div class="mq-track">${list.map(p => tile(p)).join('')}${list.map(p => tile(p, true)).join('')}</div></div>`;
}
/* ───────── Games tabs (Steam / Xbox / later PlayStation) on the home page ───────── */
function drawGames(){
  const sec = $('#gamesSec'); if(!sec) return;
  if(!S.loaded || !XB.teaserTried){
    if(!sec.dataset.sk){ sec.dataset.sk = '1'; sec.classList.remove('hidden'); sec.innerHTML = `<div class="sec-h"><h2>${esc(t('games_title'))}</h2></div><div class="gtabs"><div class="sk gtab-sk"></div><div class="sk gtab-sk"></div></div><div class="sk" style="height:250px;margin-top:12px;border-radius:22px"></div>`; }
    return;
  }
  delete sec.dataset.sk;
  const tabs = [];
  const g = S.loaded ? steamGames() : [];
  const tz = XB.teaser;
  if(tz && tz.count) tabs.push({ k:'xbox', ic:xbLogo('gt-logo'), l:t('xbox_title'), n:tz.count, html:() => xboxPanel(tz) });
  if(g.length) tabs.push({ k:'steam', ic:stLogo('gt-logo'), l:t('steam_title'), n:g.length, html:() => steamPanel(g) });
  /* PlayStation: push { k:'ps', ... } here when ready */
  if(!tabs.length){ sec.classList.add('hidden'); return; }
  if(!S.gtab) S.gtab = 'xbox';
  const cur = tabs.find(x => x.k === S.gtab) || tabs[0];
  sec.classList.remove('hidden');
  sec.innerHTML = `<div class="sec-h"><h2>${esc(t('games_title'))}</h2></div>
    <div class="gtabs" role="tablist">${tabs.map(x => `<button class="gtab gtab-${x.k} ${x === cur ? 'on' : ''}" data-gt="${x.k}" role="tab" aria-selected="${x === cur}"><span class="gt-ic">${x.ic}</span><span class="gt-tx"><b>${esc(x.l)}</b><small><span class="num">${num(x.n)}</span> ${esc(t('games_count'))}</small></span><span class="gt-go">${x === cur ? '✓' : I.arrow}</span></button>`).join('')}</div>
    <div class="gpanel">${cur.html()}</div>`;
  const mq = $('.mq-view', sec); if(mq) startShowcase(mq.parentElement, mq, $('.mq-track', mq), 30);
  $$('[data-gt]', sec).forEach(b => b.onclick = () => { S.gtab = b.dataset.gt; drawGames(); });
}
let steamF = 'all', steamQ = '';
async function viewSteam(){
  if(!S.loaded){ app.innerHTML = '<div class="sk" style="height:420px;margin-top:30px"></div>'; try{ await loadCatalog(); }catch(e){ app.innerHTML = `<div class="empty">${esc(errMsg(e))}</div>`; return; } }
  document.title = t('steam_title') + ' | ' + (RA.settings.name || 'Realm Academy');
  const from = steamFrom();
  app.innerHTML = `<a class="back" href="#/">${I.back} ${esc(t('go_back'))}</a>
    <section class="steam-hero"><span class="steam-ic big">${stLogo()}</span><div><h1>${esc(t('steam_title'))}</h1><p>${esc(t('steam_sub'))}</p></div></section>
    <div class="steam-kinds"><div class="sk-card"><b>🤝 ${esc(t('steam_shared'))}${from ? ` · <span class="num">${num(from)}</span> ${esc(t('currency'))}` : ''}</b><small>${esc(t('steam_shared_info'))}</small></div><div class="sk-card"><b>🔐 ${esc(t('steam_private'))}</b><small>${esc(t('steam_private_info'))}</small></div></div>
    <div class="sec-h" style="margin-top:18px"><div class="chips" id="stF">${[['all',t('steam_all')],['shared',t('steam_shared')],['priv',t('steam_private')]].map(([k,l])=>`<button class="chip ${steamF===k?'on':''}" data-f="${k}">${esc(l)}</button>`).join('')}</div>
      <label class="search">${I.search}<input id="stQ" placeholder="${esc(t('search_ph'))}" value="${esc(steamQ)}"></label></div>
    <div class="grid" id="stGrid"></div>`;
  const draw = () => { const q = steamQ.trim().toLowerCase();
    const list = steamGames().filter(p => { const k = steamKind(p); return (steamF==='all' || (steamF==='shared' ? k.shared : k.priv)) && (!q || String(p.name).toLowerCase().includes(q)); });
    const had = !!$('#stGrid .card'); $('#stGrid').innerHTML = list.length ? list.map(cardHTML).join('') : `<div class="empty" style="grid-column:1/-1"><div class="e">🎮</div>${esc(t('no_results'))}</div>`; reveal($('#stGrid'), !had && !S.noReveal && !S.revealed.st && (S.revealed.st = true)); };
  $$('#stF .chip').forEach(b => b.onclick = () => { steamF = b.dataset.f; $$('#stF .chip').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  $('#stQ').oninput = e => { steamQ = e.target.value; draw(); };
  draw();
}

/* ───────── Xbox collection (loaded only when needed — keeps the main catalogue light) ───────── */
const XBOX = 'Xbox Games';
const XCOLS = 'id,slug,name,image_url,image_fit,emoji,badge,category_en,sort_order,ra_variants(id,price,sale_price,sale_until,active,auto_deliver,sort_order)';
const XB = { list:null, loading:null, teaser:null, full:{}, f:'all', q:'', shown:60 };
function isXbox(p){ return p && p.category_en === XBOX; }
function xbPrep(x){ return { ...x, variants:(x.ra_variants||[]).filter(v=>v.active).sort((a,b)=>a.sort_order-b.sort_order||a.price-b.price) }; }
const xbGen = p => /one/i.test(p.badge||'') ? 'O' : 'S';
async function loadXbox(){
  if(XB.list) return XB.list;
  if(!XB.loading) XB.loading = (async () => {
    const out = [];
    for(let from = 0; ; from += 1000){
      const { data, error } = await sb.from('ra_products').select(XCOLS).eq('active', true).eq('category_en', XBOX).order('sort_order').order('id').range(from, from + 999);
      if(error) throw error;
      out.push(...(data||[]).map(xbPrep));
      if(!data || data.length < 1000) break;
    }
    XB.list = out.filter(p => p.variants.length); return XB.list;
  })().finally(() => { XB.loading = null; });
  return XB.loading;
}
async function loadXboxTeaser(){
  if(XB.teaser) return XB.teaser;
  const { data, count, error } = await sb.from('ra_products').select(XCOLS, { count:'exact' }).eq('active', true).eq('category_en', XBOX).order('sort_order').limit(14);
  if(error) throw error;
  XB.teaser = { items:(data||[]).map(xbPrep).filter(p => p.variants.length), count:count||0 };
  return XB.teaser;
}
function xbFrom(list){ const pr = list.map(minPrice).filter(x => x > 0); return pr.length ? Math.min(...pr) : 0; }
const XLOGO = 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg';
const STLOGO = 'https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg';
const stLogo = (cls = '') => `<img class="st-logo ${cls}" src="${STLOGO}" alt="Steam" loading="lazy" decoding="async">`;
const xbLogo = (cls = '') => `<img class="xb-logo ${cls}" src="${XLOGO}" alt="Xbox" loading="lazy" decoding="async">`;
function xboxPanel(tz){
  return `<div class="xbox-box">
    <div class="steam-head gp-head"><a class="btn btn-xbox" href="#/xbox">${esc(t('xbox_see_all',{n:num(tz.count)}))} ${I.arrow}</a><span class="xbox-ic">${xbLogo()}</span></div>
    ${mqRow(tz.items, 'steam-mini xbox-mini')}
  </div>`;
}
async function drawXboxStrip(){
  try{ await loadXboxTeaser(); }catch{}
  XB.teaserTried = true;
  drawGames();
  if(S.loaded && currentRoute === 'home') drawGrid();
}
function xbCard(p){
  return `<a class="card xb-card" href="/p/${encodeURIComponent(p.slug)}" data-spa="#/p/${encodeURIComponent(p.slug)}">
    <div class="media">${mediaHTML(p)}${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}<span class="xb-corner">${xbLogo()}</span></div>
    <div class="body"><h3>${esc(L(p,'name'))}</h3>
      <div class="cfoot"><div><span class="from">${esc(t('price_from'))}</span><span class="price"><span class="num">${num(minPrice(p))}</span> <small>${esc(t('currency'))}</small></span></div><span class="go">${I.arrow}</span></div>
    </div></a>`;
}
async function viewXbox(){
  document.title = t('xbox_title') + ' | ' + (RA.settings.name || 'Realm Academy');
  app.innerHTML = `<a class="back" href="#/">${I.back} ${esc(t('go_back'))}</a>
    <section class="xbox-hero"><span class="xbox-ic big">${xbLogo()}</span><div><h1>${esc(t('xbox_title'))}</h1><p>${esc(t('xbox_sub'))}</p></div></section>
    <div class="steam-kinds"><div class="sk-card xb-k"><b>🔑 ${esc(t('xbox_key'))}</b><small>${esc(t('xbox_key_info'))}</small></div><div class="sk-card xb-k"><b>🎮 ${esc(t('xbox_compat'))}</b><small>${esc(t('xbox_compat_info'))}</small></div></div>
    <div class="sec-h" style="margin-top:18px"><div class="chips" id="xbF">${[['all',t('xbox_all')],['O',t('xbox_one_series')],['S',t('xbox_series_only')]].map(([k,l])=>`<button class="chip ${XB.f===k?'on':''}" data-f="${k}">${esc(l)}</button>`).join('')}</div>
      <label class="search">${I.search}<input id="xbQ" placeholder="${esc(t('xbox_search_ph'))}" value="${esc(XB.q)}"></label></div>
    <p class="muted xb-count" id="xbCount"></p>
    <div class="grid" id="xbGrid">${Array(8).fill('<div class="sk" style="height:260px"></div>').join('')}</div>
    <div class="xb-more"><button class="btn btn-lg hidden" id="xbMore">${esc(t('xbox_more'))}</button></div>`;
  let list;
  try{ list = await loadXbox(); }catch(e){ const g = $('#xbGrid'); if(g) g.innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(errMsg(e))}</div>`; return; }
  if(currentRoute !== 'xbox' || !$('#xbGrid')) return;
  const draw = () => {
    const q = XB.q.trim().toLowerCase();
    const res = list.filter(p => (XB.f === 'all' || xbGen(p) === XB.f) && (!q || String(p.name).toLowerCase().includes(q)));
    $('#xbCount').textContent = t('xbox_count', { n:num(res.length) });
    const had = !!$('#xbGrid .card'); $('#xbGrid').innerHTML = res.length ? res.slice(0, XB.shown).map(xbCard).join('') : `<div class="empty" style="grid-column:1/-1"><div class="e">🎮</div>${esc(t('no_results'))}</div>`; reveal($('#xbGrid'), !had && !S.noReveal && !S.revealed.xb && (S.revealed.xb = true));
    $('#xbMore').classList.toggle('hidden', res.length <= XB.shown);
  };
  $$('#xbF .chip').forEach(b => b.onclick = () => { XB.f = b.dataset.f; XB.shown = 60; $$('#xbF .chip').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  let tm; $('#xbQ').oninput = e => { XB.q = e.target.value; XB.shown = 60; clearTimeout(tm); tm = setTimeout(draw, 150); };
  $('#xbMore').onclick = () => { XB.shown += 60; draw(); };
  draw();
}
async function findProduct(slug){
  const p = S.products.find(x => x.slug === slug) || XB.full[slug];
  if(p) return p;
  const { data } = await sb.from('ra_products').select('*, ra_variants(*)').eq('slug', slug).eq('active', true).maybeSingle();
  if(!data) return null;
  const x = { ...data, variants:(data.ra_variants||[]).filter(v=>v.active).sort((a,b)=>a.sort_order-b.sort_order||a.price-b.price) };
  XB.full[slug] = x; return x;
}

/* ───────── Product ───────── */
function saleOf(v){ return !!v && Number(v.sale_price) > 0 && Number(v.sale_price) < Number(v.price) && (!v.sale_until || new Date(v.sale_until) > new Date()); }
function effPrice(v){ return saleOf(v) ? Number(v.sale_price) : Number(v.price); }
function cdText(until){ const ms = new Date(until) - Date.now(); if(!(ms > 0)) return ''; const s = Math.floor(ms/1000), d = Math.floor(s/86400); const hms = [Math.floor(s%86400/3600), Math.floor(s%3600/60), s%60].map(n=>String(n).padStart(2,'0')).join(':'); return (d ? t('cd_days',{d}) + ' ' : '') + hms; }
setInterval(() => $$('[data-cd]').forEach(el => { const txt = cdText(el.dataset.cd); const v = el.querySelector('.cdv'); if(!txt){ el.classList.add('hidden'); return; } if(v) v.textContent = txt; }), 1000);
function savedCoupon(){ try{ return localStorage.getItem('ra_coupon') || ''; }catch{ return ''; } }
function setSavedCoupon(c){ try{ c ? localStorage.setItem('ra_coupon', c) : localStorage.removeItem('ra_coupon'); }catch{} }
async function viewProduct(slug){
  if(!S.loaded){ app.innerHTML = '<div class="sk" style="height:420px;margin-top:30px"></div>'; try{ await loadCatalog(); }catch(e){ app.innerHTML = `<div class="empty">${esc(errMsg(e))}</div>`; return; } }
  const p = await findProduct(slug);
  if(!p){ app.innerHTML = `<div class="empty" style="padding:80px 0"><div class="e">🤷</div>${esc(t('not_found'))}<br><br><a class="btn" href="#/">${esc(t('go_back'))}</a></div>`; return; }
  const qv = new URLSearchParams(location.hash.split('?')[1] || '').get('v');
  let sel = p.variants.find(v => v.id === qv) || p.variants[0];
  let coupon = savedCoupon(); let Q = null; let qSeq = 0;
  document.title = `${L(p,'name')}${L(p,'short') ? ' — ' + L(p,'short') : ''} | ${RA.settings.name || 'Realm Academy'}`.slice(0, 90);
  const md = document.querySelector('meta[name="description"]'); if(md) md.setAttribute('content', (L(p,'short') + ' ' + (L(p,'description')||'')).replace(/\s+/g,' ').trim().slice(0, 160));
  const ac = safeColor(p.accent);
  const fields = Array.isArray(p.fields) ? p.fields : [];
  app.innerHTML = `
  <a class="back" href="${isXbox(p) ? '#/xbox' : '#/'}">${I.back} ${esc(isXbox(p) ? t('xbox_title') : t('back_products'))}</a>
  <div class="pd" style="${ac?`--ac:${ac}`:''}">
    <div class="pd-left">
      <div class="media big">${mediaHTML(p, true)}${isXbox(p) ? `<span class="xb-corner big">${xbLogo()}</span>` : ''}${p.badge?`<span class="badge ${p.featured?'gold':''}">${esc(L(p,'badge'))}</span>`:''}</div>
      ${(L(p,'description') || L(p,'delivery_note')) ? `<div class="panel pd-desc pd-about" id="pdDesc"><div class="pa-h"><span>📋</span> ${esc(t('about_product'))}</div>${descBlock(L(p,'description') || '', L(p,'delivery_note') ? `<div class="pa-note"><b>📌 ${esc(t('after_note'))}</b>${fmtDesc(L(p,'delivery_note'))}</div>` : '')}</div>` : ''}
    </div>
    <div class="buybox">
      ${isXbox(p) ? `<span class="pill pill-xbox">${xbLogo()} ${esc(L(p,'category'))}</span>` : p.category ? `<span class="pill" style="padding:4px 12px">${esc(L(p,'category'))}</span>` : ''}
      <h1>${esc(L(p,'name'))}</h1>
      <p class="t2">${esc(L(p,'short'))}</p>
      <div class="lbl-sm">${esc(t('choose_plan'))}</div>
      <div class="variants" id="vars"></div>
      <div id="saleBox"></div>
      <div id="flds">${fields.map((f,i) => `<div class="field"><label>${esc(L(f,'label'))} ${f.required?'<span class="req">*</span>':''}</label><input class="inp" data-f="${i}" ${fieldAttrs(f)}></div>`).join('')}
        <div class="field"><label>${esc(t('note_label'))}</label><input class="inp" id="fNote" maxlength="300" placeholder="${esc(t('note_ph'))}"></div></div>
      <div id="deliveryInfo"></div>
      <div class="coupon-box"><button type="button" class="link-btn" id="cpToggle">🏷️ ${esc(t('coupon_have'))}</button>
        <div class="cp-row ${coupon?'':'hidden'}" id="cpRow"><input class="inp ltr-inp" id="cpIn" maxlength="40" placeholder="${esc(t('coupon_ph'))}" value="${esc(coupon)}" style="text-transform:uppercase"><button type="button" class="btn" id="cpApply">${esc(t('coupon_apply'))}</button></div>
        <div id="cpMsg"></div></div>
      <div class="price-break" id="pBreak"></div>
      <div class="total"><span class="t2">${esc(t('total'))}</span><span class="price" id="tot"></span></div>
      <label class="accept" id="accBox"><input type="checkbox" id="accChk"><span class="acc-t"><span class="acc-main">${esc(t('accept_check'))}</span><span class="acc-links">${(L(p,'description') || L(p,'delivery_note')) ? `<a href="#" id="accRead">${esc(t('about_product'))}</a><i></i>` : ''}<a href="/terms.html" target="_blank" rel="noopener">${esc(t('accept_terms'))}</a></span></span></label>
      <button class="btn btn-p btn-lg btn-block" id="buyBtn">${esc(t('buy_btn'))}</button>
      <p class="muted hint" id="balHint"></p>
    </div>
  </div>`;
  const cur = esc(t('currency'));
  const drawPrice = () => {
    if(!sel){ $('#tot').innerHTML = '—'; $('#pBreak').innerHTML = ''; return; }
    const base = effPrice(sel), final = Q && Q.v === sel.id ? Number(Q.final) : base;
    const rows = [];
    if(saleOf(sel)) rows.push(`<div><span>${esc(t('price_list'))}</span><s class="num">${num(sel.price)}</s></div><div class="pb-sale"><span>🔥 ${esc(t('price_sale'))}</span><b class="num">${num(base)}</b></div>`);
    if(Q && Q.v === sel.id && Number(Q.discount) > 0){
      const lbl = Q.applied === 'coupon' ? t('price_disc_coupon',{code:Q.coupon}) : t('price_disc_tier',{tier:t('tier_'+(Q.tier_key||'bronze'))});
      rows.push(`<div class="pb-disc"><span>🏷️ ${esc(lbl)}</span><b class="num">−${num(Q.discount)}</b></div>`);
    }
    const saved = Number(sel.price) - final;
    $('#pBreak').innerHTML = rows.length ? rows.join('') + (saved > 0 ? `<div class="pb-save">🎉 ${esc(t('you_save',{amount:money(saved)}))}</div>` : '') : '';
    $('#tot').innerHTML = `${final < Number(sel.price) ? `<s class="num old">${num(sel.price)}</s> ` : ''}<span class="num">${num(final)}</span> <small>${cur}</small>`;
  };
  const quote = async () => {
    if(!sel) return; const my = ++qSeq; const vid = sel.id;
    const { data, error } = await sb.rpc('ra_quote', { p_variant: vid, p_coupon: coupon || null });
    if(my !== qSeq) return;
    const msg = $('#cpMsg'); if(!msg) return;
    if(error){ Q = null; drawPrice(); return; }
    Q = { ...data, v: vid };
    if(coupon){
      if(data.coupon_ok){ msg.innerHTML = `<div class="cp-ok">${esc(t('coupon_ok'))} ${data.applied === 'tier' ? `<small>${esc(t('coupon_tier_better'))}</small>` : ''} <button type="button" class="link-btn" id="cpRm">${esc(t('coupon_remove'))}</button></div>`; }
      else { msg.innerHTML = `<div class="cp-err">${esc(errMsg({message:data.coupon_err}))} <button type="button" class="link-btn" id="cpRm">${esc(t('coupon_remove'))}</button></div>`; }
      const rm = $('#cpRm'); if(rm) rm.onclick = () => { coupon = ''; setSavedCoupon(''); $('#cpIn').value = ''; msg.innerHTML = ''; quote(); };
    } else msg.innerHTML = '';
    drawPrice();
  };
  const drawVars = () => {
    $('#vars').innerHTML = p.variants.map(v => { const sale = saleOf(v); const old = sale ? Number(v.price) : (v.old_price > v.price ? Number(v.old_price) : 0);
      return `<button class="var ${sel&&sel.id===v.id?'on':''} ${sale?'is-sale':''}" data-v="${v.id}"><span class="rd"></span><span class="nm">${esc(L(v,'name'))}${planTag(v)}${sale?`<span class="plan-sale">🔥 −${Math.round((1 - effPrice(v)/Number(v.price))*100)}%</span>`:''}</span><span class="vp">${old?`<span class="old num">${num(old)}</span>`:''}<b class="num">${num(effPrice(v))}</b> <small class="muted">${cur}</small></span></button>`; }).join('') || `<div class="empty">${esc(t('no_plans'))}</div>`;
    $$('#vars .var').forEach(el => el.onclick = () => { sel = p.variants.find(v=>v.id===el.dataset.v); drawVars(); });
    $('#saleBox').innerHTML = sel && saleOf(sel) && sel.sale_until ? `<div class="sale-box" data-cd="${esc(sel.sale_until)}">⏳ ${esc(t('sale_ends'))} <b class="cdv num">${esc(cdText(sel.sale_until))}</b></div>` : '';
    const instant = sel && sel.auto_deliver && S.stock[sel.id] > 0;
    const subNote = sel && sel.months > 1 && sel.every < sel.months ? `<div class="note-box sub-note">📅 ${esc(t('sub_plan_note',{n:sel.months, how: sel.every > 1 ? t('sub_plan_every',{e:sel.every}) : t('sub_plan_monthly')}))}</div>` : '';
    $('#deliveryInfo').innerHTML = sel ? `<div class="note-box ${instant?'ok':''}">${esc(instant ? t('delivery_instant') : t('delivery_manual'))}</div>${subNote}` : '';
    $('#balHint').textContent = S.user ? t('your_balance',{amount:money(S.customer?.balance||0)}) : t('login_to_buy');
    $('#buyBtn').disabled = !sel;
    drawPrice(); quote();
  };
  drawVars();
  $('#cpToggle').onclick = () => { $('#cpRow').classList.toggle('hidden'); $('#cpIn').focus(); };
  const apply = () => { coupon = $('#cpIn').value.trim().toUpperCase(); quote(); };
  $('#cpApply').onclick = apply;
  $('#cpIn').onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); apply(); } };
  bindDesc(app);
  const ar = $('#accRead'); if(ar) ar.onclick = e => { e.preventDefault(); const d = $('#pdDesc'); if(!d) return; const b = d.querySelector('.dsc'); if(b && b.classList.contains('clamp')) b.querySelector('.dsc-more').click(); const y = d.getBoundingClientRect().top + window.scrollY - 84; window.scrollTo({ top:y, behavior:'smooth' }); d.classList.add('flash'); setTimeout(()=>$('#pdDesc')?.classList.remove('flash'), 1600); };
  $('#accChk').onchange = () => $('#accBox').classList.remove('need');
  $('#buyBtn').onclick = () => {
    if(!$('#accChk').checked){ const b = $('#accBox'); b.classList.remove('need'); void b.offsetWidth; b.classList.add('need'); b.scrollIntoView({behavior:'smooth', block:'center'}); toast(t('accept_need'),'bad'); return; }
    buy(p, sel, { coupon, getQ: () => Q && Q.v === sel.id ? Q : null });
  };
}
function insufficientModal(item, need, bal, price){
  modal(`<div class="modal-h"><h3>${esc(t('insufficient_title'))}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div style="text-align:center;padding:6px 0 16px"><div style="font-size:48px">👛</div>
    <p class="t2">${esc(t('insufficient_text',{item, amount:money(need)}))}</p></div>
    <div class="mini-stats" style="margin-bottom:16px"><div class="mini"><small>${esc(t('current_balance'))}</small><b class="num">${num(bal)}</b></div><div class="mini"><small>${esc(t('price'))}</small><b class="num">${num(price)}</b></div></div>
    <a class="btn btn-p btn-block btn-lg" href="#/wallet/add?amount=${need}" data-close>${esc(t('add_balance'))}</a>`);
}
async function buy(p, v, opt = {}){
  if(!v) return;
  if(!S.user){ try{ sessionStorage.setItem('ra_next', location.hash); }catch{} location.hash = '#/login'; toast(t('login_first')); return; }
  const fields = {};
  const defs = Array.isArray(p.fields) ? p.fields : [];
  for(const el of $$('[data-f]')){ const f = defs[Number(el.dataset.f)]; const val = el.value.trim(); if(f.required && !val){ el.focus(); toast(t('fill_field',{label: L(f,'label')}),'bad'); return; } if(fieldBad(f, val)){ el.focus(); toast(t(fieldKind(f)==='gmail'?'bad_gmail':'bad_email'),'bad'); return; } fields[f.label] = val; }
  if(pairBad(defs, fields)){ toast(t('pair_need'),'bad'); return; }
  const note = $('#fNote')?.value.trim(); if(note) fields.__note = note;
  await loadCustomer();
  let q = opt.getQ ? opt.getQ() : null;
  if(!q){ const r = await sb.rpc('ra_quote', { p_variant: v.id, p_coupon: opt.coupon || null }); q = r.data || null; }
  const couponOk = !!(q && q.coupon_ok && opt.coupon);
  if(opt.coupon && q && !q.coupon_ok){ toast(errMsg({message:q.coupon_err}), 'bad'); return; }
  const price = q ? Number(q.final) : effPrice(v);
  const bal = Number(S.customer?.balance||0);
  const item = `${L(p,'name')} — ${L(v,'name')}`;
  if(bal < price){ insufficientModal(item, price - bal, bal, price); return; }
  const ok = await confirmBuy(p, v, item, bal, price, q);
  if(!ok) return;
  const btn = $('#buyBtn'); setBusy(btn, true);
  const { data, error } = await sb.rpc('ra_purchase', { p_variant: v.id, p_fields: fields, p_coupon: couponOk ? opt.coupon : null });
  setBusy(btn, false, esc(t('buy_btn')));
  if(error){ toast(errMsg(error), 'bad'); return; }
  if(couponOk && q.applied === 'coupon') setSavedCoupon('');
  const o = Array.isArray(data) ? data[0] : data;
  if(o && o.status==='delivered') S.stock[v.id] = Math.max(0, (S.stock[v.id]||1) - 1);
  await loadCustomer();
  confetti();
  Chat.afterPurchase(o, p);
}
function confirmBuy(p, v, item, bal, price, q){
  return new Promise(res => {
    let done = false; const fin = x => { if(done) return; done = true; res(x); };
    const desc = L(p,'description') || L(p,'short'); const dn = L(p,'delivery_note');
    const disc = Number(v.price) - price;
    const m = modal(`<div class="modal-h"><h3>${esc(t('confirm_title'))}</h3><button class="icon-btn" data-close>${I.x}</button></div>
      <div class="cb-item"><b>${esc(item)}</b></div>
      <div class="mini-stats" style="margin:12px 0"><div class="mini"><small>${esc(t('price'))}</small><b class="num">${disc > 0 ? `<s class="old">${num(v.price)}</s> ` : ''}${num(price)}</b></div><div class="mini"><small>${esc(t('current_balance'))}</small><b class="num">${num(bal)}</b></div><div class="mini"><small>${esc(t('confirm_after'))}</small><b class="num">${num(bal - price)}</b></div></div>
      ${disc > 0 ? `<div class="note-box ok" style="margin-bottom:10px">🎉 ${esc(t('you_save',{amount:money(disc)}))}${q && q.applied === 'coupon' ? ' · 🏷️ ' + esc(q.coupon) : q && q.applied === 'tier' ? ' · ' + esc(t('tier_' + q.tier_key)) : ''}</div>` : ''}
      ${desc ? `<div class="lbl-sm">${esc(t('about_product'))}</div><div class="cb-desc fmt">${fmtDesc(desc)}</div>` : ''}
      ${dn ? `<div class="note-box pa-note" style="margin-top:10px"><b>📌 ${esc(t('after_note'))}</b>${fmtDesc(dn)}</div>` : ''}
      ${v.months > 1 && v.every < v.months ? `<div class="note-box sub-note" style="margin-top:10px">📅 ${esc(t('sub_plan_note',{n:v.months, how: v.every > 1 ? t('sub_plan_every',{e:v.every}) : t('sub_plan_monthly')}))}</div>` : ''}
      <div class="note-box ok" style="margin-top:10px">✓ ${esc(t('accept_check'))}</div>
      <div class="row-btns" style="margin-top:14px"><button class="btn btn-p btn-lg btn-block" id="cbYes">${esc(t('confirm_yes'))}</button><button class="btn btn-lg" data-close>${esc(t('cancel'))}</button></div>`, { onClose: () => fin(false) });
    m.el.querySelector('#cbYes').onclick = () => { fin(true); m.close(); };
  });
}
function showOrderSuccess(o, p){
  const delivered = o.status === 'delivered';
  const dn = p ? L(p,'delivery_note') : '';
  const m = modal(`<div style="text-align:center"><div class="success-ic">${I.check}</div>
    <h3 style="font-size:22px;font-weight:900">${esc(t('success_title'))}</h3>
    <p class="muted" style="margin:4px 0 16px">${esc(t('order_no'))} <b class="num">#${esc(o.order_no)}</b></p></div>
    ${delivered ? `<div class="order"><div class="dl"><b>${esc(t('your_product'))}</b>${credHTML(o.delivery)}<button class="btn btn-sm" id="cpD">${I.copy} ${esc(t('copy'))}</button></div></div>
      ${dn ? `<div class="note-box" style="margin-top:12px;white-space:pre-line">${esc(dn)}</div>` : ''}`
      : `<div class="warn-box">${esc(t('success_processing'))}</div>`}
    <div class="row-btns"><a class="btn btn-p btn-block" href="#/orders" data-close>${esc(t('my_orders'))}</a><button class="btn btn-block" data-close>${esc(t('ok'))}</button></div>`);
  const c = m.el.querySelector('#cpD'); if(c) c.onclick = () => copyText(o.delivery);
  $$('[data-copy]', m.el).forEach(x => x.onclick = () => copyText(x.dataset.copy));
}

/* ───────── Login ───────── */
function viewLogin(mode){
  if(S.user){ goNext(); return; }
  let tab = mode === 'register' ? 'register' : 'login';
  const s = RA.settings;
  app.innerHTML = `<div class="auth">
    <div class="auth-art"><div class="orb a"></div><div class="orb b"></div>
      <div class="auth-logo">${I.logo}</div>
      <h2>${esc(t('auth_art_title',{name:s.name||'Realm Academy'}))}</h2>
      <p>${esc(t('auth_art_text'))}</p></div>
    <div class="auth-form"><div class="auth-box" id="authBox"></div></div></div>`;
  const draw = () => {
    const reg = tab === 'register';
    $('#authBox').innerHTML = `
      <div class="auth-logo-sm">${I.logo}</div>
      <h1>${esc(reg ? t('register_title') : t('login_title'))}</h1>
      <p class="sub">${esc(reg ? t('register_sub') : t('login_sub'))}</p>
      <button class="g-btn" id="gBtn">${I.google} ${esc(t('google_btn'))}</button>
      <div class="or">${esc(t('or_email'))}</div>
      <div class="seg"><button data-t="login" class="${!reg?'on':''}">${esc(t('tab_login'))}</button><button data-t="register" class="${reg?'on':''}">${esc(t('tab_register'))}</button></div>
      <form id="authForm" autocomplete="on" novalidate>
        ${reg ? `<div class="field"><label>${esc(t('full_name'))}</label><div class="inp-wrap">${I.user}<input class="inp" name="name" autocomplete="name" required maxlength="80" placeholder="${esc(t('name_ph'))}"></div></div>` : ''}
        <div class="field"><label>${esc(t('email'))}</label><div class="inp-wrap">${I.mail}<input class="inp ltr-inp" type="email" name="email" autocomplete="email" inputmode="email" required placeholder="you@gmail.com"></div></div>
        <div class="field"><label class="lbl-row"><span>${esc(t('password'))}</span>${!reg ? `<button type="button" class="link" id="forgot">${esc(t('forgot'))}</button>` : ''}</label><div class="inp-wrap">${I.lock}<input class="inp ltr-inp" type="password" name="password" autocomplete="${reg?'new-password':'current-password'}" required minlength="6" placeholder="••••••••"></div></div>
        <button class="btn btn-p btn-lg btn-block" type="submit" id="aBtn">${esc(reg ? t('create_account') : t('login_title'))}</button>
      </form>
      <p class="muted terms-note">${esc(t('terms_note'))}</p>`;
    $$('.seg button').forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    $('#gBtn').onclick = async () => {
      const { error } = await sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: location.origin + '/' } });
      if(error) toast(errMsg(error), 'bad');
    };
    const fg = $('#forgot'); if(fg) fg.onclick = forgotPassword;
    $('#authForm').onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(e.target); const email = String(f.get('email')||'').trim().toLowerCase(); const password = String(f.get('password')||'');
      if(!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return toast(t('email_invalid'),'bad');
      if(password.length < 6) return toast(t('pw_short'),'bad');
      const btn = $('#aBtn'); const label = btn.innerHTML; setBusy(btn, true);
      if(reg){
        if(!allowedDomains().includes(email.split('@')[1])){ setBusy(btn,false,label); return toast(t('email_domain_bad'),'bad'); }
        const name = String(f.get('name')||'').trim();
        const { data, error } = await sb.auth.signUp({ email, password, options:{ data:{ full_name:name }, emailRedirectTo: location.origin + '/' } });
        setBusy(btn, false, label);
        if(error) return toast(errMsg(error), 'bad');
        if(data.session){ toast(t('welcome'),'ok'); }
        else modal(`<div style="text-align:center"><div style="font-size:54px">📧</div><h3 style="margin:8px 0">${esc(t('check_email_title'))}</h3><p class="t2">${esc(t('check_email_text',{email}))}</p><button class="btn btn-p btn-block" style="margin-top:18px" data-close>${esc(t('ok'))}</button></div>`);
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        setBusy(btn, false, label);
        if(error) return toast(errMsg(error), 'bad');
        toast(t('welcome_back'),'ok');
      }
    };
  };
  draw();
}
function forgotPassword(){
  const m = modal(`<div class="modal-h"><h3>${esc(t('reset_title'))}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <p class="t2" style="margin-bottom:14px">${esc(t('reset_text'))}</p>
    <div class="field"><input class="inp ltr-inp" id="fgEmail" type="email" placeholder="you@gmail.com"></div>
    <button class="btn btn-p btn-block" id="fgBtn">${esc(t('send_link'))}</button>`);
  m.el.querySelector('#fgBtn').onclick = async e => {
    const email = m.el.querySelector('#fgEmail').value.trim(); if(!email) return;
    setBusy(e.target, true);
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/#/reset' });
    setBusy(e.target, false, esc(t('send_link')));
    if(error) return toast(errMsg(error),'bad');
    m.close(); toast(t('link_sent'),'ok');
  };
}
function viewReset(){
  app.innerHTML = `<div class="narrow"><div class="panel"><h3>${esc(t('new_password'))}</h3>
    <div class="field"><input class="inp" type="password" id="np" minlength="6" placeholder="${esc(t('new_password'))}"></div>
    <button class="btn btn-p btn-block" id="npBtn">${esc(t('save'))}</button></div></div>`;
  $('#npBtn').onclick = async e => {
    const pw = $('#np').value; if(pw.length < 6) return toast(t('pw_short'),'bad');
    setBusy(e.target, true); const { error } = await sb.auth.updateUser({ password: pw }); setBusy(e.target, false, esc(t('save')));
    if(error) return toast(errMsg(error),'bad'); toast(t('pw_changed'),'ok'); location.hash = '#/';
  };
}

/* ───────── Wallet ───────── */
async function viewWallet(){
  app.innerHTML = `<div class="page-h"><h1>${esc(t('wallet_title'))}</h1><p class="muted">${esc(t('wallet_sub'))}</p></div>
  <div class="wallet-top">
    <div class="bal-card"><div class="lbl">${esc(t('available_balance'))}</div>
      <div class="big"><span class="num" id="wBal">${num(S.customer?.balance)}</span> <span class="cur">${esc(t('currency'))}</span></div>
      <div class="row"><a class="btn" href="#/wallet/add">+ ${esc(t('add_balance'))}</a><a class="btn alt" href="#/">${esc(t('shop'))}</a></div></div>
    <div class="mini-stats"><div class="mini"><small>${esc(t('stat_deposited'))}</small><b class="num" id="stDep">—</b></div><div class="mini"><small>${esc(t('stat_spent'))}</small><b class="num" id="stBuy">—</b></div>
      <div class="mini"><small>${esc(t('stat_pending'))}</small><b class="num" id="stPend">—</b></div><div class="mini"><small>${esc(t('stat_count'))}</small><b class="num" id="stCnt">—</b></div></div>
  </div>
  <div class="loyal-grid">
    <div class="panel loyal tier-card" id="tierCard"><div class="sk" style="height:90px"></div></div>
    <div class="panel loyal"><h3>${esc(t('points_title'))}</h3><div class="pts"><b class="num" id="ptsN">${num(S.customer?.points||0)}</b><small class="muted" id="ptsV"></small></div>
      <small class="muted">${esc(t('points_hint'))}</small><button class="btn btn-p btn-block" id="ptsGo" style="margin-top:10px">${esc(t('points_redeem'))}</button></div>
    <div class="panel loyal"><h3>${esc(t('code_title'))}</h3><div class="cp-row"><input class="inp ltr-inp" id="codeIn" maxlength="40" placeholder="${esc(t('code_ph'))}" style="text-transform:uppercase"><button class="btn btn-p" id="codeGo">${esc(t('coupon_apply'))}</button></div>
      <div id="codeSaved"></div></div>
  </div>
  <div class="note-box" style="margin-bottom:18px">${esc(t('manual_notice'))}</div>
  <div class="panel" style="margin-bottom:18px"><h3>${esc(t('deposit_requests'))}</h3><div class="list" id="depList"><div class="sk" style="height:70px"></div></div></div>
  <div class="panel"><h3>${esc(t('tx_history'))}</h3><div class="list" id="txList"><div class="sk" style="height:70px"></div></div></div>`;
  await loadCustomer(); const wb = $('#wBal'); if(!wb) return; wb.textContent = num(S.customer?.balance);
  const pts = Number(S.customer?.points||0); $('#ptsN').textContent = num(pts); $('#ptsV').textContent = t('points_value',{amount:money(Math.floor(pts/100)*1000)});
  $('#ptsGo').onclick = async e => { const n = Math.floor(Number(S.customer?.points||0)/100)*100; if(n < 100) return toast(t('points_min'),'bad'); setBusy(e.currentTarget, true);
    const { error } = await sb.rpc('ra_redeem_points', { p_points:n }); setBusy(e.currentTarget, false, esc(t('points_redeem'))); if(error) return toast(errMsg(error),'bad'); toast(t('points_done',{amount:money(n*10)}),'ok'); confetti(); viewWallet(); };
  const drawSaved = () => { const c = savedCoupon(); const box = $('#codeSaved'); if(!box) return; box.innerHTML = c ? `<div class="cp-ok" style="margin-top:8px">🏷️ ${esc(t('coupon_active',{code:c}))} <button type="button" class="link-btn" id="cpRm2">${esc(t('coupon_remove'))}</button></div>` : ''; const r = $('#cpRm2'); if(r) r.onclick = () => { setSavedCoupon(''); drawSaved(); }; };
  drawSaved();
  const redeem = async () => { const code = $('#codeIn').value.trim().toUpperCase(); if(code.length < 3) return; const btn = $('#codeGo'); setBusy(btn, true);
    const { data, error } = await sb.rpc('ra_redeem_code', { p_code:code }); setBusy(btn, false, esc(t('coupon_apply')));
    if(error) return toast(errMsg(error),'bad');
    $('#codeIn').value = '';
    if(data.kind === 'gift'){ toast(t('gift_done',{amount:money(data.amount)}),'ok'); confetti(); viewWallet(); }
    else { setSavedCoupon(data.code); const desc = [data.percent ? data.percent + '%' : '', data.amount ? money(data.amount) : ''].filter(Boolean).join(' + '); toast(t('coupon_saved',{code:data.code, desc}),'ok'); drawSaved(); } };
  $('#codeGo').onclick = redeem; $('#codeIn').onkeydown = e => { if(e.key === 'Enter') redeem(); };
  sb.rpc('ra_my_tier').then(({ data:tr }) => { const box = $('#tierCard'); if(!box || !tr) return;
    const ic = { bronze:'🥉', silver:'🥈', gold:'🥇' }[tr.key] || '🏅';
    const prog = tr.next_min ? Math.min(100, Math.round(Number(tr.spent) / Number(tr.next_min) * 100)) : 100;
    box.classList.add('tier-' + tr.key);
    box.innerHTML = `<h3>${esc(t('tier_title'))}</h3><div class="tier-row"><span class="tier-ic">${ic}</span><div><b class="tier-name">${esc(t('tier_' + tr.key))}</b><small class="muted">${esc(tr.pct ? t('tier_disc',{pct:tr.pct}) : t('tier_none'))}</small></div></div>
      <div class="tier-bar"><i style="width:${prog}%"></i></div><small class="muted">${esc(tr.next_key ? t('tier_next',{amount:money(Number(tr.next_min) - Number(tr.spent)), tier:t('tier_' + tr.next_key), pct:tr.next_pct}) : t('tier_top'))}</small>`; });
  const [d, tx] = await Promise.all([
    sb.from('ra_deposits').select('*').eq('user_id', S.user.id).order('created_at',{ascending:false}).limit(30),
    sb.from('ra_wallet_tx').select('*').eq('user_id', S.user.id).order('created_at',{ascending:false}).limit(100)
  ]);
  if(!$('#depList')) return;
  const deps = d.data||[], txs = tx.data||[];
  $('#stDep').textContent = num(deps.filter(x=>x.status==='approved').reduce((a,x)=>a+Number(x.approved_amount||0),0));
  $('#stBuy').textContent = num(-txs.filter(x=>x.kind==='purchase').reduce((a,x)=>a+Number(x.amount),0));
  $('#stPend').textContent = num(deps.filter(x=>x.status==='pending').length);
  $('#stCnt').textContent = num(txs.filter(x=>x.kind==='purchase').length);
  $('#depList').innerHTML = deps.length ? deps.map(x => `<div class="item"><div class="ic">💳</div><div class="grow"><b>${esc(x.method_name)} — <span class="num">${num(x.approved_amount||x.amount)}</span> ${esc(t('currency'))}</b><small>${dt(x.created_at)}${x.admin_note?' · '+esc(x.admin_note):''}</small></div><span class="st ${x.status}">${esc(t('st_'+x.status))}</span></div>`).join('')
    : `<div class="empty"><div class="e">💸</div>${esc(t('no_deposits'))}<br><br><a class="btn btn-p" href="#/wallet/add">${esc(t('first_deposit'))}</a></div>`;
  const kI = {deposit:'⬇️',purchase:'🛍️',refund:'↩️',adjust:'⚙️',gift:'🎁',points:'⭐'};
  $('#txList').innerHTML = txs.length ? txs.map(x => `<div class="item"><div class="ic">${kI[x.kind]}</div><div class="grow"><b>${esc(t('tx_'+x.kind))}${x.note?' · '+esc(x.note):''}</b><small>${dt(x.created_at)} · ${esc(t('balance_after'))}: <span class="num">${num(x.balance_after)}</span></small></div><span class="${x.amount>0?'amt-pos':'amt-neg'} num">${x.amount>0?'+':''}${num(x.amount)}</span></div>`).join('')
    : `<div class="empty">${esc(t('no_tx'))}</div>`;
}

async function viewAddFunds(){
  const q = new URLSearchParams((location.hash.split('?')[1]||''));
  const pre = Number(q.get('amount')||0);
  app.innerHTML = `<a class="back" href="#/wallet">${I.back} ${esc(t('back_wallet'))}</a>
  <div class="page-h" style="padding-top:12px"><h1>${esc(t('add_title'))}</h1><p class="muted">${esc(t('add_sub'))}</p></div>
  <div class="notice-card"><span class="nc-ic">⏱️</span><div>${esc(t('manual_notice').replace(/^⏱️\s*/,''))}</div></div>
  <div class="panel" style="margin:14px 0"><h3><span class="stepn">1</span> ${esc(t('step_method'))}</h3><div class="methods" id="methods"><div class="sk" style="height:120px"></div></div></div>
  <div id="payForm"></div>`;
  const ms = await loadMethods();
  if(!$('#methods')) return;
  if(!ms.length){ $('#methods').innerHTML = `<div class="empty">${esc(t('no_methods'))}</div>`; return; }
  const logo = m => { const u = safeUrl(m.logo_url); return u ? `<img src="${esc(u)}" alt="${esc(m.name)}" referrerpolicy="no-referrer">` : esc((m.name||'?').replace(/[^\p{L}\p{N}]/gu,'').slice(0,3).toUpperCase()); };
  $('#methods').innerHTML = ms.map(m => `<button class="method" data-m="${m.id}" style="${safeColor(m.color)?`--mc:${safeColor(m.color)}`:''}"><span class="m-logo">${logo(m)}</span><b>${esc(L(m,'name'))}</b><span class="m-check">${I.check}</span></button>`).join('');
  $$('#methods .method').forEach(b => b.onclick = () => { $$('#methods .method').forEach(x=>x.classList.toggle('on', x===b)); drawForm(ms.find(m=>m.id===b.dataset.m)); setTimeout(()=>$('#payForm').scrollIntoView({behavior:'smooth',block:'start'}),50); });

  function drawForm(m){
    let file = null;
    const isCrypto = m.kind === 'crypto' || (m.currency && m.currency !== 'IQD');
    const qr = safeUrl(m.qr_url);
    const quick = m.kind === 'asia' ? [5000,10000,15000,20000,25000,50000] : [5000,10000,25000,50000,100000];
    const needsReceiptField = m.needs_receipt || !m.needs_code;
    $('#payForm').innerHTML = `<div class="panel pay-panel" style="--mc:${safeColor(m.color)||'var(--p)'}">
      <div class="pay-head"><span class="m-logo sm">${logo(m)}</span><h3 style="margin:0"><span class="stepn">2</span> ${esc(t('step_send',{name:L(m,'name')}))}</h3></div>
      ${m.account ? `<div class="lbl-sm">${esc(t('account_no'))}</div><div class="acct"><code>${esc(m.account)}</code><button class="btn btn-sm" id="cpA">${I.copy} ${esc(t('copy'))}</button></div>` : ''}
      ${m.holder ? `<p class="t2" style="font-size:13px">${esc(t('holder'))}: <b>${esc(m.holder)}</b></p>` : ''}
      ${qr ? `<div class="qr"><img src="${esc(qr)}" alt="QR"></div>` : ''}
      ${m.instructions ? `<div class="note-box" style="margin:12px 0;white-space:pre-line">${esc(L(m,'instructions'))}</div>` : ''}
      <h3 style="margin-top:22px"><span class="stepn">3</span> ${esc(t('step_info'))}</h3>
      <div class="field"><label>${esc(t('amount_label',{cur:t('currency')}))}</label>
        <input class="inp num-inp" id="amt" type="number" inputmode="numeric" min="${Number(m.min_amount)||1000}" step="250" value="${pre||''}" placeholder="${esc(t('amount_ph'))}">
        <div class="quick">${quick.map(a=>`<button type="button" data-a="${a}" class="num">${num(a)}</button>`).join('')}</div>
        ${isCrypto ? `<small class="conv" id="conv"></small>` : ''}
        <small class="muted">${esc(t('min_amount',{amount:money(m.min_amount)}))}</small></div>
      ${m.needs_code ? `<div class="field"><label>${esc(t('card_code'))} <span class="req">*</span></label><input class="inp ltr-inp num" id="code" inputmode="numeric" maxlength="60" placeholder="0000 0000 0000 00"></div>` : ''}
      <div class="row2">
        <div class="field"><label>${esc(isCrypto ? t('txid_label') : t('ref_label'))}</label><input class="inp ltr-inp" id="ref" maxlength="120"></div>
        <div class="field"><label>${esc(t('sender_label'))}</label><input class="inp" id="snd" maxlength="120"></div>
      </div>
      ${needsReceiptField ? `<div class="field"><label>${esc(t('receipt'))} ${m.needs_receipt ? '<span class="req">*</span>' : ''}</label>
        <label class="drop" id="drop">${I.upload}<span>${esc(t('receipt_pick'))}</span><input type="file" id="rc" accept="image/*" hidden></label></div>` : ''}
      <div class="note-box" style="margin-bottom:14px">${esc(t('manual_notice'))}</div>
      <button class="btn btn-p btn-lg btn-block" id="sendDep">${esc(t('send_request'))}</button></div>`;
    const cp = $('#cpA'); if(cp) cp.onclick = () => copyText(m.account);
    const amt = $('#amt');
    const conv = () => { const c = $('#conv'); if(c){ const v = Number(amt.value||0)/Number(m.rate||1); c.innerHTML = v ? `${esc(t('you_send',{amount: v.toFixed(2)+' '+m.currency}))} <span class="muted">(1 ${esc(m.currency)} = ${num(m.rate)} ${esc(t('currency'))})</span>` : ''; } };
    amt.oninput = conv; conv();
    $$('.quick button').forEach(b => b.onclick = () => { amt.value = b.dataset.a; conv(); });
    const rc = $('#rc');
    if(rc) rc.onchange = () => {
      const f = rc.files[0]; if(!f) return;
      if(!/^image\//.test(f.type)) return toast(t('images_only'),'bad');
      if(f.size > 15*1024*1024) return toast(t('image_big'),'bad');
      file = f; const url = URL.createObjectURL(f);
      $('#drop').innerHTML = `<img src="${url}" alt=""><span>✓ ${esc(f.name)} — ${esc(t('receipt_change'))}</span>`; $('#drop').appendChild(rc);
    };
    $('#sendDep').onclick = async e => {
      const amount = Math.floor(Number(amt.value||0));
      if(!amount || amount < Number(m.min_amount||1)) return toast(t('amount_low'),'bad');
      const code = $('#code')?.value.trim() || '';
      if(m.needs_code && !code) return toast(t('code_needed'),'bad');
      const ref = $('#ref').value.trim(), snd = $('#snd').value.trim();
      if(m.needs_receipt && !file && !ref) return toast(t('receipt_needed'),'bad');
      const btn = e.currentTarget; setBusy(btn, true);
      try{
        let path = '';
        if(file){
          const f = await RA.compressImage(file, 1600, .85);
          path = `${S.user.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${(f.type.split('/')[1]||'jpg').replace('jpeg','jpg')}`;
          const up = await sb.storage.from('receipts').upload(path, f, { contentType: f.type, upsert:false });
          if(up.error) throw up.error;
        }
        const sent = isCrypto ? (amount/Number(m.rate||1)).toFixed(2) + ' ' + m.currency : '';
        const { error } = await sb.rpc('ra_create_deposit', { p_method:m.id, p_amount:amount, p_reference:ref, p_card_code:code, p_sender:snd, p_receipt:path, p_sent_amount:sent });
        if(error) throw error;
        setBusy(btn, false, esc(t('send_request')));
        modal(`<div style="text-align:center"><div class="success-ic">${I.check}</div><h3 style="font-size:21px;font-weight:900">${esc(t('request_sent_title'))}</h3>
          <p class="t2" style="margin:8px 0 12px">${esc(t('request_sent_text',{amount:money(amount), method:L(m,'name')}))}</p>
          <div class="note-box" style="margin-bottom:16px;text-align:start">${esc(t('manual_notice'))}</div>
          <a class="btn btn-p btn-block" href="#/wallet" data-close>${esc(t('view_wallet'))}</a></div>`);
      }catch(err){ setBusy(btn, false, esc(t('send_request'))); toast(errMsg(err),'bad'); }
    };
  }
}

/* ───────── Orders ───────── */
async function viewOrders(){
  app.innerHTML = `<div class="page-h"><h1>${esc(t('my_orders'))}</h1><p class="muted">${esc(t('my_orders_sub'))}</p></div><div class="list" id="ordList" style="gap:14px;margin-top:14px"><div class="sk" style="height:120px"></div></div>`;
  if(!S.loaded) { try{ await loadCatalog(); }catch{} }
  const { data, error } = await sb.from('ra_orders').select('*').eq('user_id', S.user.id).order('created_at',{ascending:false}).limit(100);
  if(!$('#ordList')) return;
  if(error) return $('#ordList').innerHTML = `<div class="empty">${esc(errMsg(error))}</div>`;
  const prodMap = Object.fromEntries(S.products.map(p=>[p.id,p]));
  const miss = [...new Set((data||[]).map(o=>o.product_id).filter(id => id && !prodMap[id]))];
  if(miss.length){ const r = await sb.from('ra_products').select('*, ra_variants(*)').in('id', miss); (r.data||[]).forEach(x => { prodMap[x.id] = { ...x, variants:(x.ra_variants||[]).filter(v=>v.active) }; }); if(!$('#ordList')) return; }
  $('#ordList').innerHTML = (data||[]).length ? data.map(o => {
    const p = prodMap[o.product_id];
    const fields = Object.entries(o.fields||{}).filter(([k,v])=>v).map(([k,v])=>`${esc(k)}: ${esc(v)}`).join(' · ');
    const thumb = p && safeUrl(p.image_url) ? `<img src="${esc(p.image_url)}" alt="">` : esc(p?.emoji||'📦');
    return `<div class="order"><div class="top"><div class="othumb">${thumb}</div>
      <div class="grow"><b>${esc(o.product_name)} <span class="muted" style="font-weight:600">— ${esc(o.variant_name)}</span></b>
      <small class="muted"><span class="num">#${esc(o.order_no)}</span> · ${dt(o.created_at)} · <span class="num">${num(o.price)}</span> ${esc(t('currency'))}</small>${fields?`<small class="muted fields">${fields}</small>`:''}</div>
      <span class="st ${o.status}">${esc(t('ost_'+o.status))}</span></div>
      ${o.sub_parts > 1 && o.status === 'delivered' ? subBoxHTML(o) : ''}
      <div class="ord-acts">${p && p.variants.some(v=>v.id===o.variant_id) ? `<a class="btn btn-sm" href="#/p/${encodeURIComponent(p.slug)}?v=${o.variant_id}">${esc(t('reorder'))}</a>` : ''}<button class="btn btn-sm" data-help>${esc(t('need_help'))}</button></div>
      ${o.status==='delivered' && o.delivery ? `<div class="dl blur" data-d="${o.id}"><div class="dl-h"><b>${esc(t('order_ready'))}</b><span><button class="btn btn-sm" data-chat>${I.chat.replace('<svg','<svg width="16" height="16"')}</button><button class="btn btn-sm" data-show>${esc(t('show'))}</button><button class="btn btn-sm" data-cp>${I.copy}</button></span></div>${credHTML(o.delivery)}${p&&L(p,'delivery_note')?`<small class="muted" style="white-space:pre-line;display:block">${esc(L(p,'delivery_note'))}</small>`:''}</div>`
        : o.status==='processing' ? `<div class="wait"><span class="spin" style="color:var(--warn)"></span> ${esc(t('preparing'))}</div>`
        : o.admin_note ? `<div class="wait">${esc(o.admin_note)}</div>` : ''}
    </div>`;}).join('') : `<div class="empty"><div class="e">🛍️</div>${esc(t('no_orders'))}<br><br><a class="btn btn-p" href="#/">${esc(t('browse'))}</a></div>`;
  $$('[data-d]').forEach(box => {
    const o = data.find(x=>x.id===box.dataset.d);
    box.querySelector('[data-show]').onclick = e => { box.classList.toggle('blur'); e.currentTarget.textContent = box.classList.contains('blur') ? t('show') : t('hide'); };
    box.querySelector('[data-cp]').onclick = () => copyText(o.delivery);
    box.querySelector('[data-chat]').onclick = () => Chat.open();
    $$('[data-copy]', box).forEach(x => x.onclick = () => copyText(x.dataset.copy));
  });
  bindSubButtons($('#ordList'), () => viewOrders());
}
function subBoxHTML(o){
  const { parts } = subInfo(o); const done = Number(o.parts_done)||0; const finished = done >= parts;
  const nextLbl = finished ? '' : partLabel(o, done + 1);
  let status = '';
  if(finished) status = `<span class="sub-st ok">${esc(t('sub_done'))}</span>`;
  else if(o.renew_requested) status = `<span class="sub-st wait"><span class="spin"></span> ${esc(t('sub_waiting',{label:nextLbl}))}</span>`;
  else if(isDue(o)) status = `<button class="btn btn-p btn-sm sub-req" data-req="${o.id}">🔄 ${esc(t('sub_request',{label:nextLbl}))}</button>`;
  else status = `<span class="sub-st">${esc(t('sub_next_on',{label:nextLbl, date:dday(unlockAt(o))}))} · <b>${esc(t('sub_in_days',{n:daysLeft(unlockAt(o))}))}</b></span>`;
  return `<div class="sub-box"><div class="sub-top"><b>📅 ${esc(partLabel(o, Math.max(done,1)))} <small class="muted">${esc(t('sub_of',{n:subInfo(o).months}))}</small></b><small class="muted">${esc(t('sub_progress',{done, parts}))}</small></div>${subBar(parts, done, done)}<div class="sub-foot">${status}</div></div>`;
}
function bindSubButtons(root, after){
  if(!root) return;
  $$('[data-req]', root).forEach(b => b.onclick = async () => {
    const html = b.innerHTML; setBusy(b, true);
    const { data, error } = await sb.rpc('ra_request_next_part', { p_order: b.dataset.req });
    if(error){ setBusy(b, false, html); toast(errMsg(error), 'bad'); return; }
    toast(data === 'delivered' ? t('chat_delivery') : t('sub_requested'), 'ok');
    if(after) after();
  });
}

/* ───────── Support tickets ───────── */
const TK_ST = s => `<span class="st ${({open:'pending',answered:'delivered',closed:'cancelled'})[s]}">${esc(t('ticket_' + s))}</span>`;
async function viewSupport(){
  app.innerHTML = `<div class="page-h"><h1>${esc(t('support_title'))}</h1><p class="muted">${esc(t('support_sub'))}</p></div>
    <a class="btn btn-p" href="#/support/new" style="margin:6px 0 14px">${esc(t('ticket_new'))}</a><div class="list" id="tkList"><div class="sk" style="height:80px"></div></div>`;
  const { data } = await sb.from('ra_tickets').select('*').eq('user_id', S.user.id).order('updated_at',{ascending:false}).limit(50);
  const box = $('#tkList'); if(!box) return;
  box.innerHTML = (data||[]).map(x => `<a class="item item-btn ${x.unread_user?'unread-row':''}" href="#/support/${x.id}"><div class="ic">🎫</div><div class="grow"><b>#${x.ticket_no} · ${esc(x.subject)}</b><small class="muted">${esc(t('cat_' + x.category))} · ${ago(x.updated_at)}</small></div>${TK_ST(x.status)}</a>`).join('') || `<div class="empty"><div class="e">🎫</div>${esc(t('no_tickets'))}</div>`;
}
async function viewTicketNew(){
  const pre = new URLSearchParams(location.hash.split('?')[1] || '').get('order') || '';
  const { data:ords } = await sb.from('ra_orders').select('id,order_no,product_name,variant_name').eq('user_id', S.user.id).order('created_at',{ascending:false}).limit(30);
  app.innerHTML = `<a class="back" href="#/support">${I.back} ${esc(t('support_title'))}</a>
  <div class="narrow" style="margin-top:14px"><div class="panel"><h3>${esc(t('ticket_new').replace('+','').trim())}</h3>
    <div class="field"><label>${esc(t('ticket_cat'))}</label><div class="seg" id="tkCat">${['order','payment','account','other'].map((c,i)=>`<button type="button" data-c="${c}" class="${(pre?c==='order':i===0)?'on':''}">${esc(t('cat_' + c))}</button>`).join('')}</div></div>
    <div class="field"><label>${esc(t('ticket_order'))}</label><select class="inp" id="tkOrd"><option value="">${esc(t('none_opt'))}</option>${(ords||[]).map(o=>`<option value="${o.id}" ${o.id===pre?'selected':''}>#${o.order_no} · ${esc(o.product_name)} — ${esc(o.variant_name)}</option>`).join('')}</select></div>
    <div class="field"><label>${esc(t('ticket_subject'))}</label><input class="inp" id="tkSub" maxlength="120"></div>
    <div class="field"><label>${esc(t('ticket_body'))}</label><textarea class="inp" id="tkBody" rows="6" maxlength="3000"></textarea></div>
    <button class="btn btn-p btn-lg btn-block" id="tkSend">${esc(t('ticket_send'))}</button></div></div>`;
  let cat = pre ? 'order' : 'order';
  $$('#tkCat button').forEach(b => b.onclick = () => { cat = b.dataset.c; $$('#tkCat button').forEach(x=>x.classList.toggle('on', x===b)); });
  $('#tkSend').onclick = async e => { const sub = $('#tkSub').value.trim(), body = $('#tkBody').value.trim(); if(!sub){ $('#tkSub').focus(); return; } if(!body){ $('#tkBody').focus(); return; }
    setBusy(e.currentTarget, true); const { data, error } = await sb.rpc('ra_ticket_create', { p_subject:sub, p_category:cat, p_order:$('#tkOrd').value || null, p_body:body });
    setBusy(e.currentTarget, false, esc(t('ticket_send'))); if(error) return toast(errMsg(error),'bad');
    toast(t('ticket_sent'),'ok'); const tk = Array.isArray(data) ? data[0] : data; location.hash = '#/support/' + tk.id; };
}
async function viewTicket(id){
  app.innerHTML = '<div class="sk" style="height:300px;margin-top:30px"></div>';
  const [{ data:tk }, { data:msgs }] = await Promise.all([ sb.from('ra_tickets').select('*').eq('id', id).maybeSingle(), sb.from('ra_ticket_msgs').select('*').eq('ticket_id', id).order('id') ]);
  if(!tk){ app.innerHTML = `<div class="empty" style="padding:80px 0">${esc(t('not_found'))}</div>`; return; }
  if(tk.unread_user) sb.rpc('ra_ticket_seen', { p_ticket:id });
  const closed = tk.status === 'closed';
  app.innerHTML = `<a class="back" href="#/support">${I.back} ${esc(t('support_title'))}</a>
  <div class="narrow" style="margin-top:14px"><div class="panel"><div class="h-row"><h3 style="margin:0">#${tk.ticket_no} · ${esc(tk.subject)}</h3>${TK_ST(tk.status)}</div>
    <small class="muted">${esc(t('cat_' + tk.category))} · ${dt(tk.created_at)}</small>
    <div class="tk-thread">${(msgs||[]).map(x=>`<div class="cm ${x.sender==='user'?'me':'them'}"><div class="cb">${esc(x.body)}</div><span class="ct">${esc(x.sender==='user'?t('you'):t('store'))} · ${dt(x.created_at)}</span></div>`).join('')}</div>
    ${closed ? `<div class="note-box">${esc(t('ticket_closed_note'))}</div>` : `<div class="field"><textarea class="inp" id="tkR" rows="3" maxlength="3000" placeholder="${esc(t('ticket_reply'))}"></textarea></div>
    <div class="row-btns"><button class="btn btn-p btn-block" id="tkS">${esc(t('ticket_send'))}</button><button class="btn" id="tkC">${esc(t('ticket_close'))}</button></div>`}</div></div>`;
  const s1 = $('#tkS'); if(s1) s1.onclick = async e => { const b = $('#tkR').value.trim(); if(!b) return; setBusy(e.currentTarget, true); const { error } = await sb.rpc('ra_ticket_reply', { p_ticket:id, p_body:b }); setBusy(e.currentTarget, false, esc(t('ticket_send'))); if(error) return toast(errMsg(error),'bad'); viewTicket(id); };
  const c1 = $('#tkC'); if(c1) c1.onclick = async () => { const { error } = await sb.rpc('ra_ticket_close', { p_ticket:id }); if(error) return toast(errMsg(error),'bad'); viewTicket(id); };
}

/* ───────── Account ───────── */
async function viewAccount(){
  await loadCustomer();
  const c = S.customer || {};
  app.innerHTML = `<div class="page-h"><h1>${esc(t('account_title'))}</h1></div>
  <div class="narrow" style="margin:10px 0 0;display:grid;gap:16px">
    <div class="panel"><h3>${esc(t('personal_info'))}</h3>
      <div class="field"><label>${esc(t('email'))}</label><input class="inp ltr-inp" value="${esc(S.user.email||'')}" disabled></div>
      <div class="field"><label>${esc(t('name'))}</label><input class="inp" id="aName" maxlength="80" value="${esc(c.full_name||'')}"></div>
      <div class="field"><label>${esc(t('phone'))}</label><input class="inp ltr-inp" id="aPhone" maxlength="20" inputmode="tel" value="${esc(c.phone||'')}" placeholder="07xx xxx xxxx"></div>
      <button class="btn btn-p" id="saveAcc">${esc(t('save'))}</button></div>
    ${S.user.app_metadata?.provider === 'email' ? `<div class="panel"><h3>${esc(t('change_password'))}</h3><div class="field"><input class="inp" type="password" id="newPw" minlength="6" placeholder="${esc(t('new_password'))}"></div><button class="btn" id="savePw">${esc(t('change'))}</button></div>` : ''}
    ${canShowInstall() ? `<button class="btn" id="accInstall">${I.download} ${esc(t('install_app'))}</button>` : ''}
    ${S.isAdmin ? `<a class="btn" href="/admin.html">${ico(I.shield)} ${esc(t('admin_panel'))}</a>` : ''}
    <button class="btn btn-bad" id="lo">${I.logout} ${esc(t('logout'))}</button>
  </div>`;
  $('#saveAcc').onclick = async e => { setBusy(e.target,true); const { error } = await sb.rpc('ra_update_profile', { p_name:$('#aName').value, p_phone:$('#aPhone').value }); setBusy(e.target,false,esc(t('save'))); if(error) return toast(errMsg(error),'bad'); toast(t('saved'),'ok'); loadCustomer(); };
  const sp = $('#savePw'); if(sp) sp.onclick = async e => { const pw=$('#newPw').value; if(pw.length<6) return toast(t('pw_short'),'bad'); setBusy(e.target,true); const { error } = await sb.auth.updateUser({ password:pw }); setBusy(e.target,false,esc(t('change'))); if(error) return toast(errMsg(error),'bad'); toast(t('pw_changed'),'ok'); $('#newPw').value=''; };
  const ai = $('#accInstall'); if(ai) ai.onclick = doInstall;
  $('#lo').onclick = async () => { await sb.auth.signOut(); location.hash = '#/'; };
}

/* ───────── Install as app (PWA) ───────── */
let deferredPrompt = window.__bip || null;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function installAvailable(){ return !isStandalone() && (deferredPrompt || isIOS()); }
function canShowInstall(){ return !isStandalone(); }
async function doInstall(){
  if(isStandalone()) return toast(t('install_done'),'ok');
  if(!deferredPrompt) deferredPrompt = window.__bip || null;
  if(!deferredPrompt && !isIOS()){ for(let i = 0; i < 15 && !deferredPrompt; i++){ await new Promise(r => setTimeout(r, 100)); deferredPrompt = window.__bip || deferredPrompt; } }
  if(deferredPrompt){ const ev = deferredPrompt; deferredPrompt = null; window.__bip = null; try{ await ev.prompt(); const c = await ev.userChoice; if(c && c.outcome === 'accepted') toast(t('install_done'),'ok'); }catch{} hideInstall(); return; }
  if(isIOS()) return showIOSHelp();
  const mobile = /android|mobi/i.test(navigator.userAgent);
  modal(`<div style="text-align:center"><div class="install-ic">${I.logo}</div><h3 style="margin:10px 0 6px">${esc(t('install_title'))}</h3>
    <p class="t2">${esc(mobile ? t('install_android') : t('install_desktop'))}</p>
    <button class="btn btn-p btn-block" style="margin-top:16px" data-close>${esc(t('ok'))}</button></div>`);
}
function showIOSHelp(){
  const ua = navigator.userAgent;
  const inApp = isIOS() && /Instagram|FBAN|FBAV|FB_IAB|Telegram|Line\/|Snapchat|TikTok|musical_ly|WhatsApp|GSA\/|CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|DuckDuckGo|Brave/i.test(ua);
  const ipad = /ipad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const topShare = ipad || /CriOS|FxiOS|EdgiOS/i.test(ua);
  const addIc = `<b class="share-ic"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg></b>`;
  const fill = (k) => esc(t(k)).replace('{share}', `<b class="share-ic">${I.share}</b>`).replace('{add}', addIc);
  const notIOS = !isIOS() ? `<p class="t2" style="margin:8px 0 0;font-weight:600">📱 ${esc(t('ios_open_phone'))}</p>` : '';
  const safariNote = `<div class="safari-note">🧭 ${esc(t('ios_safari_first'))}</div>`;
  const body = notIOS + (inApp
    ? `${safariNote}<p class="t2" style="margin:8px 0 14px">${esc(t('ios_inapp'))}</p><button class="btn btn-p btn-block btn-lg" id="iosCopy">${I.copy} ${esc(t('copy_link'))}</button>`
    : `${safariNote}${iosGuideHTML()}
      <p class="muted ig-old">${esc(t('iosg_old'))}</p>
      <button class="btn btn-p btn-block btn-lg" style="margin-top:12px" data-close>${esc(t('ios_got'))}</button>`);
  const m = modal(`<div style="text-align:center"><div class="install-ic">${I.logo}</div><h3 style="margin:10px 0 2px">${esc(t('install_title'))}</h3></div>${body}`, { onClose: () => { if(inApp || !isIOS()) return; $('#iosArrow')?.remove(); const a = document.createElement('div'); a.id = 'iosArrow'; a.className = 'ios-arrow ' + (topShare ? 'top' : 'bottom'); a.innerHTML = `<span>${I.share}</span>`; document.body.appendChild(a); setTimeout(() => a.remove(), 9000); document.addEventListener('touchstart', () => a.remove(), { once:true }); } });
  startIosGuide(m.el);
  const cp = m.el.querySelector('#iosCopy'); if(cp) cp.onclick = () => { copyText(location.origin + '/'); toast(t('link_copied'),'ok'); };
}
/* animated iPhone install guide: real screenshots + pointing arrow */
const IOSG = [ { x:86, y:93.5, up:false }, { x:44, y:62.9, up:false }, { x:83, y:88.8, up:false }, { x:36, y:79.5, up:false }, { x:87.4, y:10.7, up:true } ];
function iosGuideHTML(){
  return `<div class="ig" id="iosGuide">
    <div class="ig-phone"><div class="ig-screen">${IOSG.map((g,i) => `<div class="ig-slide ${i ? '' : 'on'}" style="--fx:${g.x}%;--fy:${g.y}%"><img src="/assets/img/ios/s${i+1}.webp" alt="" decoding="async" ${i ? 'loading="lazy"' : ''}><span class="ig-ring" style="left:${g.x}%;top:${g.y}%"></span><span class="ig-arrow ${g.up ? 'up' : ''}" style="left:${g.x}%;top:${g.y}%"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v15M5 12l7 7 7-7"/></svg></span></div>`).join('')}</div></div>
    <div class="ig-cap"><span class="ig-n" id="igN"></span><b id="igT"></b></div>
    <div class="ig-dots">${IOSG.map((_,i) => `<button type="button" class="${i ? '' : 'on'}" data-ig="${i}" aria-label="${i+1}"></button>`).join('')}</div>
  </div>`;
}
function startIosGuide(root){
  const box = root.querySelector('#iosGuide'); if(!box) return;
  const slides = [...box.querySelectorAll('.ig-slide')], dots = [...box.querySelectorAll('[data-ig]')];
  let cur = 0, tm = null;
  const show = i => {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s,k) => s.classList.toggle('on', k === cur)); dots.forEach((d,k) => d.classList.toggle('on', k === cur));
    box.querySelector('#igN').textContent = t('iosg_step', { n:cur+1, t:slides.length }); box.querySelector('#igT').textContent = t('iosg_' + (cur+1));
    clearTimeout(tm); tm = setTimeout(() => { if(box.isConnected) show(cur + 1); }, cur === slides.length - 1 ? 4200 : 3400);
  };
  dots.forEach(d => d.onclick = () => show(+d.dataset.ig));
  let sx = null; box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive:true });
  box.addEventListener('touchend', e => { if(sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if(Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); }, { passive:true });
  box.querySelector('.ig-phone').onclick = () => show(cur + 1);
  show(0);
}
function hideInstall(){ $('#installBar')?.remove(); }
function maybeShowInstallBar(){
  if(!installAvailable() || $('#installBar')) return;
  let snooze = 0; try{ snooze = Number(localStorage.getItem('ra_install_snooze')||0); }catch{}
  if(Date.now() < snooze) return;
  const b = document.createElement('div'); b.id = 'installBar'; b.className = 'install-bar';
  b.innerHTML = `<span class="ib-ic">${I.logo}</span><div class="ib-txt"><b>${esc(t('install_title'))}</b><small>${esc(t('install_text'))}</small></div>
    <button class="btn btn-p btn-sm" id="ibGo">${esc(t('install_btn'))}</button><button class="icon-btn ib-x" id="ibX" aria-label="close">${I.x}</button>`;
  document.body.appendChild(b);
  $('#ibGo').onclick = doInstall;
  $('#ibX').onclick = () => { try{ localStorage.setItem('ra_install_snooze', String(Date.now() + 3*86400000)); }catch{} hideInstall(); };
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; window.__bip = e; setTimeout(maybeShowInstallBar, 2500); });
window.addEventListener('appinstalled', () => { deferredPrompt = null; hideInstall(); });
if('serviceWorker' in navigator){ window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{})); }


/* ───────── Live chat ───────── */
const Chat = (() => {
  const C = { subs:[], open:false, msgs:[], unread:0, channel:null, poll:null, banner:null, lastId:0, sending:false, readAt:null };
  const fab = () => $('#chatFab');
  function chrome(){
    let f = fab();
    if(!f){
      f = document.createElement('button'); f.id = 'chatFab'; f.className = 'chat-fab'; f.setAttribute('aria-label','chat');
      document.body.appendChild(f); f.onclick = () => C.open ? close() : open();
    }
    f.innerHTML = `${I.chat}<span class="cf-lbl">${esc(t('chat_open'))}</span><span class="cf-badge ${C.unread?'':'hidden'}">${C.unread>9?'9+':C.unread}</span>`;
    f.classList.toggle('hidden', C.open);
  }
  function setUnread(n){ C.unread = Math.max(0, n|0); chrome(); }
  function bidiTitle(x){ return x.split(' — ').map(p => `<bdi>${esc(p)}</bdi>`).join(' — '); }
  function linkify(txt){ return esc(txt).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener nofollow">$1</a>'); }
  function timeOf(d){ const x = new Date(d); return '\u2066' + String(x.getHours()).padStart(2,'0') + ':' + String(x.getMinutes()).padStart(2,'0') + '\u2069'; }
  function dayLabel(d){ const x = new Date(d), n = new Date(); const y = new Date(n); y.setDate(n.getDate() - 1);
    if(x.toDateString() === n.toDateString()) return t('chat_today'); if(x.toDateString() === y.toDateString()) return t('chat_yday'); return dday(d); }
  const isSeen = m => !!(C.readAt && !m.tmp && !m.uploading && new Date(m.created_at) <= new Date(C.readAt));
  function tick(m){ if(m.sender !== 'user') return ''; if(m.tmp || m.uploading) return '<i class="tick wait">🕓</i>'; const sn = isSeen(m); return `<i class="tick ${sn ? 'seen' : ''}" data-at="${esc(m.created_at)}" title="${esc(t(sn ? 'chat_seen' : 'chat_sent'))}">${sn ? '✓✓' : '✓'}</i>`; }
  function updTicks(){ const b = $('#chatBody'); if(!b) return; $$('.tick[data-at]', b).forEach(el => { const sn = isSeen({ created_at:el.dataset.at }); el.classList.toggle('seen', sn); el.textContent = sn ? '✓✓' : '✓'; el.title = t(sn ? 'chat_seen' : 'chat_sent'); }); seenLbl(b); }
  function seenLbl(b){ $$('.seen-lbl', b).forEach(x => x.remove()); const mine = $$('.cm.me .tick[data-at]', b); const lastEl = mine[mine.length - 1]; if(lastEl && lastEl.classList.contains('seen')) lastEl.closest('.cm').insertAdjacentHTML('beforeend', `<span class="seen-lbl">✓✓ ${esc(t('chat_seen'))}</span>`); }
  function bubble(m){
    if(m.kind === 'delivery'){
      const parts = String(m.body).split('\n\n'); const head = parts.shift() || ''; let note = '';
      if(parts.length && parts[parts.length-1].startsWith('📌')) note = parts.pop();
      const content = parts.join('\n\n');
      const [title, no] = head.split('\n');
      const mt = m.meta && Number(m.meta.parts) > 1 ? m.meta : null;
      const lbl = mt ? partLabel(mt, Number(mt.part)) : '';
      const subH = mt ? `<div class="sub-rib"><span>📅 ${esc(lbl)}</span><small class="num">${Number(mt.part)}/${Number(mt.parts)}</small></div>${subBar(Number(mt.parts), Number(mt.part), Number(mt.part))}` : '';
      const subF = mt ? `<div class="sub-nx">${Number(mt.part) >= Number(mt.parts) ? esc(t('sub_last')) : (mt.unlock_at || mt.next_due) ? '⏭️ ' + esc(t('sub_next_on',{label:partLabel(mt, Number(mt.part)+1), date:dday(mt.unlock_at || mt.next_due)})) : ''}</div>` : '';
      return `<div class="cm sys"><div class="dcard ${mt?'is-sub':''}"><div class="dc-h"><span>${esc(mt && Number(mt.part) > 1 ? t('sub_arrived',{label:lbl}) : t('chat_delivery'))}</span><small class="num">${esc(no||'')}</small></div>${subH}
        <b class="dc-t">${bidiTitle(String(title||'').replace(/^✅\s*/,''))}</b>${credHTML(content)}
        <button class="btn btn-sm dc-copy" data-copy="${esc(content)}">${I.copy} ${esc(t('copy'))}</button>${note?`<div class="dc-note">${linkify(note)}</div>`:''}${subF}</div><span class="ct">${timeOf(m.created_at)}</span></div>`;
    }
    if(m.kind === 'order'){
      const [title, no, , ...rest] = String(m.body).split('\n');
      return `<div class="cm sys"><div class="ocard"><div class="dc-h"><span>${esc(t('chat_order'))}</span><small class="num">${esc(no||'')}</small></div><b>${bidiTitle(String(title||'').replace(/^🛒\s*/,''))}</b><p>${esc(t('success_processing'))}</p></div><span class="ct">${timeOf(m.created_at)}</span></div>`;
    }
    if(m.kind === 'renew'){
      const mt = m.meta || {}; const [title, no] = String(m.body).split('\n');
      return `<div class="cm me"><div class="cb rcard"><b>🔄 ${esc(t('sub_renew_msg',{label: mt.parts ? partLabel(mt, Number(mt.part)) : ''}))}</b><small>${bidiTitle(String(title||'').replace(/^🔄\s*/,''))} <span class="num">${esc(no||'')}</span></small></div><span class="ct">${timeOf(m.created_at)}${tick(m)}</span></div>`;
    }
    const who = m.sender === 'user' ? 'me' : (m.sender === 'system' ? 'sys' : 'them');
    if(m.kind === 'image' || m.kind === 'video' || m.kind === 'voice') return `<div class="cm ${who}"><div class="cb cbm cbm-${m.kind}">${RA.ChatMedia.html(m)}${m.uploading ? `<span class="up-ov"><span class="spin"></span></span>` : ''}</div><span class="ct">${m.uploading ? esc(t('uploading')) : timeOf(m.created_at)}${tick(m)}</span></div>`;
    return `<div class="cm ${who}"><div class="cb">${linkify(m.body)}</div><span class="ct">${timeOf(m.created_at)}${tick(m)}</span></div>`;
  }
  function panelHTML(){
    const s = RA.settings;
    return `<div class="chat-panel" id="chatPanel" role="dialog" aria-label="chat">
      <div class="cp-h"><span class="cp-logo">${I.logo}<i class="cp-dot"></i></span><div class="cp-t"><b>${esc(t('chat_title'))}</b><small>${esc(t('chat_sub'))}</small></div><button class="icon-btn" id="chatX" aria-label="close">${I.x}</button></div>
      <div class="cp-b" id="chatBody"></div>
      <div class="cp-f" id="chatFoot"></div></div>`;
  }
  function renderBody(){
    const b = $('#chatBody'); if(!b) return;
    const s = RA.settings;
    let html = `<div class="cm them welcome"><div class="cb">${esc(t('chat_welcome',{name:s.name||'Realm Academy'}))}</div></div>`;
    if(C.banner) html += `<div class="chat-banner">${C.banner}</div>`;
    let lastDay = '';
    html += C.msgs.map(m => { const d = new Date(m.created_at).toDateString(); const sep = d !== lastDay ? `<div class="cday"><span>${esc(dayLabel(m.created_at))}</span></div>` : ''; lastDay = d; return sep + bubble(m); }).join('');
    let html2 = '';
    if(S.user && C.subs.length) html2 = `<div class="sub-strip"><div class="ss-h">📅 ${esc(t('sub_active'))}</div>${C.subs.map(o => `<div class="ss-item"><div class="ss-t"><b>${bidiTitle(o.product_name + ' — ' + o.variant_name)}</b><small class="muted">${esc(t('sub_progress',{done:o.parts_done, parts:o.sub_parts}))}</small></div>${subBar(o.sub_parts, o.parts_done, o.parts_done)}<div class="sub-foot">${
      o.renew_requested ? `<span class="sub-st wait"><span class="spin"></span> ${esc(t('sub_waiting',{label:partLabel(o, o.parts_done+1)}))}</span>`
      : isDue(o) ? `<button class="btn btn-p btn-sm sub-req" data-req="${o.id}">🔄 ${esc(t('sub_request',{label:partLabel(o, o.parts_done+1)}))}</button>`
      : `<span class="sub-st">${esc(t('sub_next_on',{label:partLabel(o, o.parts_done+1), date:dday(unlockAt(o))}))} · <b>${esc(t('sub_in_days',{n:daysLeft(unlockAt(o))}))}</b></span>`}</div></div>`).join('')}</div>`;
    html += html2;
    if(!S.user){
      const soc = [];
      if(s.whatsapp) soc.push(`<a class="btn btn-sm" href="${esc(waLink(s.whatsapp))}" target="_blank" rel="noopener">${I.wa} WhatsApp</a>`);
      if(safeUrl(s.telegram)) soc.push(`<a class="btn btn-sm" href="${esc(s.telegram)}" target="_blank" rel="noopener">${I.tg} Telegram</a>`);
      html += `<div class="chat-guest"><a class="btn btn-p btn-block" href="#/login" id="chatLogin">${esc(t('chat_login'))}</a>${soc.length?`<small class="muted">${esc(t('chat_or'))}</small><div class="cg-soc">${soc.join('')}</div>`:''}</div>`;
    }
    b.innerHTML = html; seenLbl(b);
    $$('[data-copy]', b).forEach(x => x.onclick = () => copyText(x.dataset.copy));
    $$('[data-chat-close]', b).forEach(x => x.addEventListener('click', () => close()));
    bindSubButtons(b, async () => { await load(); renderBody(); });
    RA.ChatMedia.hydrate(b).then(() => { b.scrollTop = b.scrollHeight; });
    const cl = $('#chatLogin'); if(cl) cl.onclick = () => { try{ sessionStorage.setItem('ra_next','#/'); }catch{} close(); };
    b.scrollTop = b.scrollHeight;
  }
  function renderFoot(){
    const f = $('#chatFoot'); if(!f) return;
    if(!S.user){ f.innerHTML = ''; f.classList.add('hidden'); return; }
    f.classList.remove('hidden');
    f.innerHTML = `<button type="button" class="cp-ic" id="chatAtt" aria-label="${esc(t('chat_attach'))}" title="${esc(t('chat_attach'))}">${RA.ChatMedia.ICON.clip}</button><textarea id="chatIn" rows="1" maxlength="2000" placeholder="${esc(t('chat_ph'))}"></textarea><button type="button" class="cp-ic" id="chatMic" aria-label="${esc(t('chat_voice'))}" title="${esc(t('chat_voice'))}">${RA.ChatMedia.ICON.mic}</button><button class="cp-send" id="chatSend" aria-label="${esc(t('chat_send'))}">${I.send}</button>`;
    $('#chatAtt').onclick = () => RA.ChatMedia.pick(async file => { try{ sendMedia(await RA.ChatMedia.prepare(file)); }catch(e){ toast(errMsg(e), 'bad'); } });
    $('#chatMic').onclick = () => RA.ChatMedia.record(f, prep => sendMedia(prep));
    const inp = $('#chatIn');
    const grow = () => { inp.style.height = 'auto'; inp.style.height = Math.min(120, inp.scrollHeight) + 'px'; };
    inp.oninput = grow;
    inp.onkeydown = e => { if(e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)){ e.preventDefault(); send(); } };
    $('#chatSend').onclick = send;
  }
  async function send(){
    const inp = $('#chatIn'); if(!inp || C.sending) return;
    const body = inp.value.trim(); if(!body) return;
    C.sending = true; $('#chatSend').disabled = true;
    const tmp = { id:'tmp'+Date.now(), sender:'user', kind:'text', body, created_at:new Date().toISOString(), tmp:true };
    C.msgs.push(tmp); inp.value = ''; inp.style.height = 'auto'; renderBody();
    const { data, error } = await sb.rpc('ra_chat_send', { p_body: body });
    C.sending = false; const sb2 = $('#chatSend'); if(sb2) sb2.disabled = false;
    if(error){ C.msgs = C.msgs.filter(m => m !== tmp); renderBody(); if($('#chatIn')) $('#chatIn').value = body; toast(errMsg(error),'bad'); return; }
    tmp.id = data; tmp.tmp = false; C.lastId = Math.max(C.lastId, Number(data)||0); renderBody();
    $('#chatIn')?.focus();
  }
  async function sendMedia(prep){
    if(!S.user) return;
    const local = URL.createObjectURL(prep.blob);
    const tmp = { id:'tmp'+Date.now(), sender:'user', kind:prep.kind, body:'', meta:{ ...prep.meta, mime:prep.mime, local }, created_at:new Date().toISOString(), tmp:true, uploading:true };
    C.msgs.push(tmp); C.stick = true; renderBody();
    try{
      const path = await RA.ChatMedia.upload(S.user.id, prep);
      const { data, error } = await sb.rpc('ra_chat_send_media', { p_kind:prep.kind, p_path:path, p_meta:{ ...prep.meta, mime:prep.mime } });
      if(error) throw error;
      tmp.id = data; tmp.uploading = false; tmp.meta.path = path; C.lastId = Math.max(C.lastId, Number(data)||0);
      C.msgs = C.msgs.filter(m => m === tmp || String(m.id) !== String(data));
      renderBody();
    }catch(e){ C.msgs = C.msgs.filter(m => m !== tmp); renderBody(); toast(errMsg(e), 'bad'); }
  }
  async function load(){
    if(!S.user){ C.msgs = []; return; }
    const { data } = await sb.from('ra_chat_messages').select('*').eq('user_id', S.user.id).order('id', { ascending:false }).limit(80);
    C.msgs = (data||[]).reverse(); C.lastId = C.msgs.reduce((a,m)=>Math.max(a, Number(m.id)||0), 0);
    await Promise.all([loadSubs(), loadRead()]);
  }
  async function loadRead(){
    if(!S.user) return;
    const { data } = await sb.from('ra_chat_threads').select('admin_read_at').eq('user_id', S.user.id).maybeSingle();
    const v = data?.admin_read_at || null; if(v !== C.readAt){ C.readAt = v; updTicks(); }
  }
  async function loadSubs(){
    if(!S.user){ C.subs = []; return; }
    const { data } = await sb.from('ra_orders').select('id,order_no,product_name,variant_name,sub_parts,sub_every,sub_months,parts_done,next_due,unlock_at,renew_requested,status').eq('user_id', S.user.id).eq('status','delivered').gt('sub_parts', 1).order('created_at',{ascending:false}).limit(10);
    C.subs = (data||[]).filter(o => o.parts_done < o.sub_parts);
  }
  async function refreshUnread(){
    if(!S.user){ setUnread(0); return; }
    const { data } = await sb.from('ra_chat_threads').select('unread_user').eq('user_id', S.user.id).maybeSingle();
    setUnread(C.open ? 0 : (data?.unread_user || 0));
  }
  function markRead(){ if(document.visibilityState !== 'visible') return; if(S.user) sb.rpc('ra_chat_mark_read').then(()=>{},()=>{}); setUnread(0); }
  document.addEventListener('visibilitychange', () => { if(C.open && document.visibilityState === 'visible'){ markRead(); loadRead(); } });
  async function open(banner){
    C.open = true; C.banner = banner || null; $('.menu')?.remove();
    if(!$('#chatPanel')){ document.body.insertAdjacentHTML('beforeend', panelHTML()); $('#chatX').onclick = close; }
    document.body.classList.add('chat-open');
    chrome(); renderFoot(); renderBody();
    await load(); renderBody(); markRead();
    if(!('ontouchstart' in window)) $('#chatIn')?.focus();
    startPoll();
  }
  function close(){ C.open = false; C.banner = null; $('#chatPanel')?.remove(); document.body.classList.remove('chat-open'); chrome(); stopPoll(); }
  function startPoll(){ stopPoll(); C.poll = setInterval(async () => { if(!S.user || !C.open || document.visibilityState !== 'visible') return; const { data } = await sb.from('ra_chat_messages').select('*').eq('user_id', S.user.id).gt('id', C.lastId).order('id'); (data||[]).forEach(onMessage); loadRead(); }, 10000); }
  function stopPoll(){ if(C.poll){ clearInterval(C.poll); C.poll = null; } }
  function ding(){ try{ const a = new (window.AudioContext||window.webkitAudioContext)(); const o = a.createOscillator(); const g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.setValueAtTime(.12, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .35); o.start(); o.stop(a.currentTime + .36); }catch{} }
  function onMessage(m){
    if(!m || !S.user || m.user_id !== S.user.id) return;
    if(C.msgs.some(x => String(x.id) === String(m.id))) return;
    C.lastId = Math.max(C.lastId, Number(m.id)||0);
    if(m.sender === 'user'){ if(!C.msgs.some(x => x.tmp && (x.body === m.body || (x.kind === m.kind && x.kind !== 'text' && (x.uploading || String(x.id) === String(m.id)))))) { C.msgs.push(m); if(C.open) renderBody(); } return; }
    C.msgs.push(m);
    if(m.meta && m.kind === 'delivery') loadSubs().then(() => { if(C.open) renderBody(); });
    if(C.open){ renderBody(); markRead(); ding(); return; }
    ding();
    if(m.kind === 'delivery'){ confetti(); open(); toast(t('chat_delivery'),'ok'); loadCustomer(); }
    else { setUnread(C.unread + 1); toast(t('chat_new') + ': ' + String(m.body).slice(0,60)); }
    if(m.sender === 'system') loadCustomer();
  }
  function subscribe(){
    unsubscribe(); if(!S.user) return;
    C.channel = sb.channel('chat-' + S.user.id)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'ra_chat_messages', filter:'user_id=eq.' + S.user.id }, p => onMessage(p.new))
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'ra_chat_threads', filter:'user_id=eq.' + S.user.id }, p => { const v = p.new?.admin_read_at || null; if(v && v !== C.readAt){ C.readAt = v; updTicks(); } })
      .subscribe();
  }
  function unsubscribe(){ if(C.channel){ sb.removeChannel(C.channel); C.channel = null; } }
  async function afterPurchase(o, p){
    const banner = `✅ ${esc(t('success_title'))} <span class="num">#${esc(o.order_no)}</span>`;
    await open(banner);
    toast(o.status === 'delivered' ? t('order_in_chat') : t('success_processing'), 'ok');
  }
  function init(){ chrome(); if(S.user){ subscribe(); refreshUnread(); } setInterval(()=>{ if(S.user && !C.open && document.visibilityState==='visible') refreshUnread(); }, 30000); }
  function onAuth(){ C.msgs = []; C.lastId = 0; C.readAt = null; if(S.user){ subscribe(); refreshUnread(); } else { unsubscribe(); setUnread(0); } if(C.open){ renderFoot(); load().then(renderBody); } }
  function relang(){ chrome(); if(C.open){ $('#chatPanel')?.remove(); C.open = false; open(C.banner); } }
  return { chrome, open, close, afterPurchase, init, onAuth, relang };
})();
window.RA.openChat = () => Chat.open();
document.addEventListener('click', e => { if(e.target.closest('[data-help]')) Chat.open(); });

/* ───────── Boot ───────── */
$('#themeBtn').onclick = () => { RA.toggleTheme(); renderChrome(); };
$('#langBtn').onclick = e => {
  e.stopPropagation();
  const old = $('.lang-menu'); if(old){ old.remove(); return; }
  const m = document.createElement('div'); m.className = 'menu lang-menu';
  m.innerHTML = [['ku','کوردی','🇮🇶'],['ar','العربية','🇮🇶'],['en','English','🇬🇧']].map(([k,l]) => `<button data-l="${k}" class="${RA.lang===k?'on':''}"><span class="lang-code">${k.toUpperCase()}</span> ${l}${RA.lang===k?' ✓':''}</button>`).join('');
  document.body.appendChild(m);
  $$('button', m).forEach(b => b.onclick = () => { m.remove(); if(b.dataset.l === RA.lang) return; RA.setLang(b.dataset.l); renderChrome(); renderHeader(); hideInstall(); route(); maybeShowInstallBar(); Chat.relang(); });
  setTimeout(()=>document.addEventListener('click', function h(ev){ if(!m.contains(ev.target)){ m.remove(); document.removeEventListener('click', h); } }), 0);
};
window.addEventListener('hashchange', route);
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[data-spa]'); if(!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); if(location.hash === a.dataset.spa) route(); else location.hash = a.dataset.spa; });
window.addEventListener('focus', () => { if(S.user) loadCustomer(); });

let booted = false;
sb.auth.onAuthStateChange(async (ev, session) => {
  const prev = S.user?.id;
  S.user = session?.user || null;
  if(ev === 'PASSWORD_RECOVERY'){ location.hash = '#/reset'; }
  if(S.user){
    loadCustomer();
    sb.rpc('ra_is_admin').then(r => { S.isAdmin = !!r.data; });
  } else { S.customer = null; S.isAdmin = false; }
  renderHeader();
  if(booted && prev !== S.user?.id) Chat.onAuth();
  if(booted && prev !== S.user?.id){
    if(S.user && location.hash.startsWith('#/login')) goNext(); else route();
  }
});

(async function boot(){
  renderChrome(); renderHeader();
  const wait = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);
  let hasCache = false; try{ hasCache = !!localStorage.getItem('ra_settings'); }catch{}
  const setP = RA.loadSettings().catch(()=>{});
  const sesP = sb.auth.getSession();
  if(!hasCache) await wait(setP, 4000);
  renderChrome();
  const { data } = await sesP; S.user = data.session?.user || null;
  if(S.user){ await wait(loadCustomer().catch(()=>{}), 3000); sb.rpc('ra_is_admin').then(r => { S.isAdmin = !!r.data; }); }
  booted = true;
  setP.then(() => { if(RA.settings._changed){ renderChrome(); renderHeader(); if(currentRoute === 'home') route(); } });
  if(location.search.includes('code=')) history.replaceState(null,'',location.pathname+location.hash);
  if(S.user && location.hash.startsWith('#/login')) goNext();
  route();
  const bootEl = document.getElementById('boot'); if(bootEl){ bootEl.classList.add('out'); setTimeout(() => bootEl.remove(), 450); }
  Chat.init();
  loadCatalog().then(()=>{ if(currentRoute === 'home') drawGrid(); }).catch(()=>{});
  setInterval(()=>{ if(S.user && document.visibilityState==='visible') loadCustomer(); }, 30000);
  if(isIOS() && !isStandalone()) setTimeout(maybeShowInstallBar, 4000);
})();
})();
