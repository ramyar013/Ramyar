/* Realm Academy — storefront */
(function(){
'use strict';
const { sb, $, $$, esc, num, dt, I, toast, modal, confirmBox, confetti, copyText, errMsg, setBusy, safeUrl, safeColor, waLink, t, money, L } = RA;

const S = { user:null, customer:null, products:[], stock:{}, methods:[], cat:'all', q:'', loaded:false, isAdmin:false };
const app = $('#app');
const DEFAULT_DOMAINS = ['gmail.com','googlemail.com','outlook.com','hotmail.com','live.com','msn.com','yahoo.com','ymail.com','icloud.com','me.com','mac.com','proton.me','protonmail.com','aol.com','yandex.com','yandex.ru','mail.ru','gmx.com','gmx.de','zoho.com'];

/* ───────── Data ───────── */
async function loadCatalog(){
  const [p, st] = await Promise.all([
    sb.from('ra_products').select('*, ra_variants(*)').eq('active', true).order('sort_order'),
    sb.rpc('ra_stock_counts')
  ]);
  if(p.error) throw p.error;
  S.products = (p.data||[]).map(x => ({...x, variants:(x.ra_variants||[]).filter(v=>v.active).sort((a,b)=>a.sort_order-b.sort_order||a.price-b.price)}));
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
function ico(svg, size=18){ return svg.replace('<svg', `<svg width="${size}" height="${size}"`); }
/* Product image block: blurred backdrop + crisp centred image */
function mediaHTML(p, big){
  const img = safeUrl(p.image_url);
  if(!img) return `<span class="em">${esc(p.emoji||'✨')}</span>`;
  const fit = p.image_fit === 'cover' ? 'cover' : 'contain';
  if(fit === 'cover') return `<img class="img-cover" src="${esc(img)}" alt="${esc(p.name)}" ${big?'':'loading="lazy"'}>`;
  return `<img class="img-bg" src="${esc(img)}" alt="" aria-hidden="true" ${big?'':'loading="lazy"'}><img class="img-fg" src="${esc(img)}" alt="${esc(p.name)}" ${big?'':'loading="lazy"'}>`;
}
function allowedDomains(){ const d = RA.settings.allowed_domains; return Array.isArray(d) && d.length ? d.map(x=>String(x).toLowerCase().trim()).filter(Boolean) : DEFAULT_DOMAINS; }

/* ───────── Chrome ───────── */
function renderChrome(){
  const s = RA.settings;
  $('#brandMark').innerHTML = brandMark(); $('#footMark').innerHTML = brandMark();
  $('#brandName').textContent = s.name || 'Realm Academy'; $('#footName').textContent = s.name || 'Realm Academy';
  $('#footText').textContent = t('footer');
  $('#lnkPrivacy').textContent = t('privacy'); $('#lnkTerms').textContent = t('terms');
  const li = $('#lnkInstall'); if(li){ li.textContent = '📲 ' + t('install_app'); li.classList.toggle('hidden', isStandalone()); li.onclick = e => { e.preventDefault(); doInstall(); }; }
  const annText = t('announcement');
  const an = $('#announce'); if(annText && annText !== '-'){ an.textContent = annText; an.classList.remove('hidden'); } else an.classList.add('hidden');
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
function route(){
  const pm = location.pathname.match(/^\/p\/([^/?#]+)/);
  if(location.pathname !== '/' && location.hash.length > 1){ history.replaceState(null, '', '/' + location.hash); }
  const h = location.hash.replace(/^#/, '') || (pm && location.pathname !== '/' ? '/p/' + pm[1] : '/');
  if(h === 'products'){ return; }
  const parts = h.split('?')[0].split('/').filter(Boolean);
  $('.menu')?.remove();
  window.scrollTo({top:0, behavior:'instant'});
  RA.logVisit('/' + parts.join('/'));
  const r = parts[0] || 'home'; currentRoute = r;
  renderBottomNav(r === 'p' ? 'home' : r === 'login' ? 'account' : r);
  if(r === 'home') return viewHome();
  if(r === 'p') return viewProduct(decodeURIComponent(parts[1]||''));
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
function minPrice(p){ return p.variants.length ? Math.min(...p.variants.map(v=>Number(v.price))) : 0; }
function stockLabel(p){
  const auto = p.variants.some(v => v.auto_deliver && S.stock[v.id] > 0);
  return auto ? `<span class="stock">${esc(t('stock_instant'))}</span>` : `<span class="stock manual">${esc(t('stock_available'))}</span>`;
}
function cardHTML(p){
  const ac = safeColor(p.accent);
  return `<a class="card" href="/p/${encodeURIComponent(p.slug)}" data-spa="#/p/${encodeURIComponent(p.slug)}" style="${ac?`--ac:${ac}`:''}">
    <div class="media">${mediaHTML(p)}${p.badge ? `<span class="badge ${p.featured?'gold':''}">${esc(L(p,'badge'))}</span>` : ''}</div>
    <div class="body">
      <h3>${esc(L(p,'name'))}</h3>
      <p>${esc(L(p,'short'))}</p>
      ${stockLabel(p)}
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
  <section class="sec" id="products">
    <div class="sec-h"><h2>${esc(t('products_title'))}</h2>
      <label class="search">${I.search}<input id="q" placeholder="${esc(t('search_ph'))}" value="${esc(S.q)}"></label></div>
    <div class="chips" id="chips"></div>
    <div class="grid" id="grid">${S.loaded ? '' : Array(6).fill('<div class="sk" style="height:300px"></div>').join('')}</div>
  </section>
  ${canShowInstall() ? `<section class="sec app-promo" id="appPromo"><div class="ap-ic">${I.logo}</div><div class="ap-txt"><h2>${esc(t('install_sec_title'))}</h2><p class="t2">${esc(t('install_sec_text'))}</p></div><button class="btn btn-p btn-lg" id="apBtn">${I.download} ${esc(t('install_app'))}</button></section>` : ''}`;
  const apb = $('#apBtn'); if(apb) apb.onclick = doInstall;
  $('#q').oninput = e => { S.q = e.target.value; drawGrid(); };
  $('#ctaProducts').onclick = e => { e.preventDefault(); $('#products').scrollIntoView({behavior:'smooth'}); };
  if(S.loaded) drawGrid(); else loadCatalog().then(drawGrid).catch(e => { const g=$('#grid'); if(g) g.innerHTML = `<div class="empty">${esc(errMsg(e))}</div>`; });
}
function drawGrid(){
  const chips = $('#chips'); if(!chips) return;
  const cats = [...new Set(S.products.map(p=>p.category).filter(Boolean))];
  chips.innerHTML = cats.length > 1 ? [['all',t('filter_all')], ...cats.map(c=>[c, L(S.products.find(p=>p.category===c),'category') || c])].map(([k,l]) => `<button class="chip ${S.cat===k?'on':''}" data-c="${esc(k)}">${esc(l)}</button>`).join('') : '';
  $$('.chip', chips).forEach(b => b.onclick = () => { S.cat = b.dataset.c; drawGrid(); });
  const q = S.q.trim().toLowerCase();
  const list = S.products.filter(p => (S.cat==='all' || p.category===S.cat) && (!q || [p.name,p.short,p.short_en,p.short_ar,p.category,p.category_en,p.category_ar].join(' ').toLowerCase().includes(q)));
  $('#grid').innerHTML = list.length ? list.map(cardHTML).join('') : `<div class="empty" style="grid-column:1/-1"><div class="e">🔍</div>${esc(t('no_results'))}</div>`;
}

/* ───────── Product ───────── */
async function viewProduct(slug){
  if(!S.loaded){ app.innerHTML = '<div class="sk" style="height:420px;margin-top:30px"></div>'; try{ await loadCatalog(); }catch(e){ app.innerHTML = `<div class="empty">${esc(errMsg(e))}</div>`; return; } }
  const p = S.products.find(x => x.slug === slug);
  if(!p){ app.innerHTML = `<div class="empty" style="padding:80px 0"><div class="e">🤷</div>${esc(t('not_found'))}<br><br><a class="btn" href="#/">${esc(t('go_back'))}</a></div>`; return; }
  let sel = p.variants[0];
  document.title = `${L(p,'name')}${L(p,'short') ? ' — ' + L(p,'short') : ''} | ${RA.settings.name || 'Realm Academy'}`.slice(0, 90);
  const md = document.querySelector('meta[name="description"]'); if(md) md.setAttribute('content', (L(p,'short') + ' ' + (L(p,'description')||'')).replace(/\s+/g,' ').trim().slice(0, 160));
  const ac = safeColor(p.accent);
  const fields = Array.isArray(p.fields) ? p.fields : [];
  app.innerHTML = `
  <a class="back" href="#/">${I.back} ${esc(t('back_products'))}</a>
  <div class="pd" style="${ac?`--ac:${ac}`:''}">
    <div class="pd-left">
      <div class="media big">${mediaHTML(p, true)}${p.badge?`<span class="badge ${p.featured?'gold':''}">${esc(L(p,'badge'))}</span>`:''}</div>
      <div class="panel pd-desc" id="pdDesc"><h3>${esc(t('about_product'))}</h3><p class="desc">${esc(L(p,'description') || L(p,'short'))}</p>${L(p,'delivery_note') ? `<div class="note-box" style="margin-top:12px;white-space:pre-line"><b>📌 ${esc(t('after_note'))}</b><br>${esc(L(p,'delivery_note'))}</div>` : ''}</div>
    </div>
    <div class="buybox">
      ${p.category ? `<span class="pill" style="padding:4px 12px">${esc(L(p,'category'))}</span>` : ''}
      <h1>${esc(L(p,'name'))}</h1>
      <p class="t2">${esc(L(p,'short'))}</p>
      <div class="lbl-sm">${esc(t('choose_plan'))}</div>
      <div class="variants" id="vars"></div>
      <div id="flds">${fields.map((f,i) => `<div class="field"><label>${esc(L(f,'label'))} ${f.required?'<span class="req">*</span>':''}</label><input class="inp" data-f="${i}" maxlength="300"></div>`).join('')}
        <div class="field"><label>${esc(t('note_label'))}</label><input class="inp" id="fNote" maxlength="300" placeholder="${esc(t('note_ph'))}"></div></div>
      <div id="deliveryInfo"></div>
      <div class="total"><span class="t2">${esc(t('total'))}</span><span class="price" id="tot"></span></div>
      <label class="accept" id="accBox"><input type="checkbox" id="accChk"><span>${esc(t('accept_check'))} — <a href="#" id="accRead">${esc(t('about_product'))}</a> · <a href="/terms.html" target="_blank" rel="noopener">${esc(t('accept_terms'))}</a></span></label>
      <button class="btn btn-p btn-lg btn-block" id="buyBtn">${esc(t('buy_btn'))}</button>
      <p class="muted hint" id="balHint"></p>
    </div>
  </div>`;
  const drawVars = () => {
    $('#vars').innerHTML = p.variants.map(v => `<button class="var ${sel&&sel.id===v.id?'on':''}" data-v="${v.id}"><span class="rd"></span><span class="nm">${esc(L(v,'name'))}${planTag(v)}</span><span class="vp">${v.old_price>v.price?`<span class="old num">${num(v.old_price)}</span>`:''}<b class="num">${num(v.price)}</b> <small class="muted">${esc(t('currency'))}</small></span></button>`).join('') || `<div class="empty">${esc(t('no_plans'))}</div>`;
    $$('#vars .var').forEach(el => el.onclick = () => { sel = p.variants.find(v=>v.id===el.dataset.v); drawVars(); });
    $('#tot').innerHTML = sel ? `<span class="num">${num(sel.price)}</span> <small>${esc(t('currency'))}</small>` : '—';
    const instant = sel && sel.auto_deliver && S.stock[sel.id] > 0;
    const subNote = sel && sel.months > 1 && sel.every < sel.months ? `<div class="note-box sub-note">📅 ${esc(t('sub_plan_note',{n:sel.months, how: sel.every > 1 ? t('sub_plan_every',{e:sel.every}) : t('sub_plan_monthly')}))}</div>` : '';
    $('#deliveryInfo').innerHTML = sel ? `<div class="note-box ${instant?'ok':''}">${esc(instant ? t('delivery_instant') : t('delivery_manual'))}</div>${subNote}` : '';
    $('#balHint').textContent = S.user ? t('your_balance',{amount:money(S.customer?.balance||0)}) : t('login_to_buy');
    $('#buyBtn').disabled = !sel;
  };
  drawVars();
  $('#accRead').onclick = e => { e.preventDefault(); $('#pdDesc').scrollIntoView({behavior:'smooth', block:'start'}); $('#pdDesc').classList.add('flash'); setTimeout(()=>$('#pdDesc')?.classList.remove('flash'), 1600); };
  $('#accChk').onchange = () => $('#accBox').classList.remove('need');
  $('#buyBtn').onclick = () => {
    if(!$('#accChk').checked){ const b = $('#accBox'); b.classList.remove('need'); void b.offsetWidth; b.classList.add('need'); b.scrollIntoView({behavior:'smooth', block:'center'}); toast(t('accept_need'),'bad'); return; }
    buy(p, sel);
  };
}
async function buy(p, v){
  if(!v) return;
  if(!S.user){ try{ sessionStorage.setItem('ra_next', location.hash); }catch{} location.hash = '#/login'; toast(t('login_first')); return; }
  const fields = {};
  const defs = Array.isArray(p.fields) ? p.fields : [];
  for(const el of $$('[data-f]')){ const f = defs[Number(el.dataset.f)]; const val = el.value.trim(); if(f.required && !val){ el.focus(); toast(t('fill_field',{label: L(f,'label')}),'bad'); return; } fields[f.label] = val; }
  const note = $('#fNote')?.value.trim(); if(note) fields.__note = note;
  await loadCustomer();
  const bal = Number(S.customer?.balance||0);
  const item = `${L(p,'name')} — ${L(v,'name')}`;
  if(bal < v.price){
    const need = v.price - bal;
    modal(`<div class="modal-h"><h3>${esc(t('insufficient_title'))}</h3><button class="icon-btn" data-close>${I.x}</button></div>
      <div style="text-align:center;padding:6px 0 16px"><div style="font-size:48px">👛</div>
      <p class="t2">${esc(t('insufficient_text',{item, amount:money(need)}))}</p></div>
      <div class="mini-stats" style="margin-bottom:16px"><div class="mini"><small>${esc(t('current_balance'))}</small><b class="num">${num(bal)}</b></div><div class="mini"><small>${esc(t('price'))}</small><b class="num">${num(v.price)}</b></div></div>
      <a class="btn btn-p btn-block btn-lg" href="#/wallet/add?amount=${need}" data-close>${esc(t('add_balance'))}</a>`);
    return;
  }
  const ok = await confirmBuy(p, v, item, bal);
  if(!ok) return;
  const btn = $('#buyBtn'); setBusy(btn, true);
  const { data, error } = await sb.rpc('ra_purchase', { p_variant: v.id, p_fields: fields });
  setBusy(btn, false, esc(t('buy_btn')));
  if(error){ toast(errMsg(error), 'bad'); return; }
  const o = Array.isArray(data) ? data[0] : data;
  if(o && o.status==='delivered') S.stock[v.id] = Math.max(0, (S.stock[v.id]||1) - 1);
  await loadCustomer();
  confetti();
  Chat.afterPurchase(o, p);
}
function confirmBuy(p, v, item, bal){
  return new Promise(res => {
    let done = false; const fin = x => { if(done) return; done = true; res(x); };
    const desc = L(p,'description') || L(p,'short'); const dn = L(p,'delivery_note');
    const m = modal(`<div class="modal-h"><h3>${esc(t('confirm_title'))}</h3><button class="icon-btn" data-close>${I.x}</button></div>
      <div class="cb-item"><b>${esc(item)}</b></div>
      <div class="mini-stats" style="margin:12px 0"><div class="mini"><small>${esc(t('price'))}</small><b class="num">${num(v.price)}</b></div><div class="mini"><small>${esc(t('current_balance'))}</small><b class="num">${num(bal)}</b></div><div class="mini"><small>${esc(t('confirm_after'))}</small><b class="num">${num(bal - v.price)}</b></div></div>
      ${desc ? `<div class="lbl-sm">${esc(t('about_product'))}</div><div class="cb-desc">${esc(desc)}</div>` : ''}
      ${dn ? `<div class="note-box" style="margin-top:10px;white-space:pre-line"><b>📌 ${esc(t('after_note'))}</b><br>${esc(dn)}</div>` : ''}
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
  <div class="note-box" style="margin-bottom:18px">${esc(t('manual_notice'))}</div>
  <div class="panel" style="margin-bottom:18px"><h3>${esc(t('deposit_requests'))}</h3><div class="list" id="depList"><div class="sk" style="height:70px"></div></div></div>
  <div class="panel"><h3>${esc(t('tx_history'))}</h3><div class="list" id="txList"><div class="sk" style="height:70px"></div></div></div>`;
  await loadCustomer(); const wb = $('#wBal'); if(!wb) return; wb.textContent = num(S.customer?.balance);
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
  const kI = {deposit:'⬇️',purchase:'🛍️',refund:'↩️',adjust:'⚙️'};
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
  $('#ordList').innerHTML = (data||[]).length ? data.map(o => {
    const p = prodMap[o.product_id];
    const fields = Object.entries(o.fields||{}).filter(([k,v])=>v).map(([k,v])=>`${esc(k)}: ${esc(v)}`).join(' · ');
    const thumb = p && safeUrl(p.image_url) ? `<img src="${esc(p.image_url)}" alt="">` : esc(p?.emoji||'📦');
    return `<div class="order"><div class="top"><div class="othumb">${thumb}</div>
      <div class="grow"><b>${esc(o.product_name)} <span class="muted" style="font-weight:600">— ${esc(o.variant_name)}</span></b>
      <small class="muted"><span class="num">#${esc(o.order_no)}</span> · ${dt(o.created_at)} · <span class="num">${num(o.price)}</span> ${esc(t('currency'))}</small>${fields?`<small class="muted fields">${fields}</small>`:''}</div>
      <span class="st ${o.status}">${esc(t('ost_'+o.status))}</span></div>
      ${o.sub_parts > 1 && o.status === 'delivered' ? subBoxHTML(o) : ''}
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
let deferredPrompt = null;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function installAvailable(){ return !isStandalone() && (deferredPrompt || isIOS()); }
function canShowInstall(){ return !isStandalone(); }
async function doInstall(){
  if(isStandalone()) return toast(t('install_done'),'ok');
  if(deferredPrompt){ deferredPrompt.prompt(); try{ await deferredPrompt.userChoice; }catch{} deferredPrompt = null; hideInstall(); return; }
  if(isIOS()) return showIOSHelp();
  const mobile = /android|mobi/i.test(navigator.userAgent);
  modal(`<div style="text-align:center"><div class="install-ic">${I.logo}</div><h3 style="margin:10px 0 6px">${esc(t('install_title'))}</h3>
    <p class="t2">${esc(mobile ? t('install_android') : t('install_desktop'))}</p>
    <button class="btn btn-p btn-block" style="margin-top:16px" data-close>${esc(t('ok'))}</button></div>`);
}
function showIOSHelp(){
  const ua = navigator.userAgent;
  const inApp = /Instagram|FBAN|FBAV|FB_IAB|Telegram|Line\/|Snapchat|TikTok|musical_ly|WhatsApp|GSA\//i.test(ua);
  const ipad = /ipad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const topShare = ipad || /CriOS|FxiOS|EdgiOS/i.test(ua);
  const addIc = `<b class="share-ic"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg></b>`;
  const fill = (k) => esc(t(k)).replace('{share}', `<b class="share-ic">${I.share}</b>`).replace('{add}', addIc);
  const body = inApp
    ? `<p class="t2" style="margin:8px 0 14px">${esc(t('ios_inapp'))}</p><button class="btn btn-p btn-block btn-lg" id="iosCopy">${I.copy} ${esc(t('copy_link'))}</button>`
    : `<p class="t2" style="margin:6px 0 12px">${esc(t('ios_note'))}</p>
      <div class="ios-steps">
        <div class="ios-step"><i>1</i><span>${fill('ios_s1')} <small class="muted">${esc(t(topShare ? 'ios_s1_where_top' : 'ios_s1_where_bottom'))}</small></span></div>
        <div class="ios-step"><i>2</i><span>${fill('ios_s2')}</span></div>
        <div class="ios-step"><i>3</i><span>${fill('ios_s3')}</span></div>
      </div>
      <button class="btn btn-p btn-block btn-lg" style="margin-top:14px" data-close>${esc(t('ios_got'))}</button>`;
  const m = modal(`<div style="text-align:center"><div class="install-ic">${I.logo}</div><h3 style="margin:10px 0 2px">${esc(t('install_title'))}</h3></div>${body}`, { onClose: () => { if(inApp) return; $('#iosArrow')?.remove(); const a = document.createElement('div'); a.id = 'iosArrow'; a.className = 'ios-arrow ' + (topShare ? 'top' : 'bottom'); a.innerHTML = `<span>${I.share}</span>`; document.body.appendChild(a); setTimeout(() => a.remove(), 9000); document.addEventListener('touchstart', () => a.remove(), { once:true }); } });
  const cp = m.el.querySelector('#iosCopy'); if(cp) cp.onclick = () => { copyText(location.origin + '/'); toast(t('link_copied'),'ok'); };
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
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; setTimeout(maybeShowInstallBar, 2500); });
window.addEventListener('appinstalled', () => { deferredPrompt = null; hideInstall(); });
if('serviceWorker' in navigator){ window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(()=>{})); }


/* ───────── Live chat ───────── */
const Chat = (() => {
  const C = { subs:[], open:false, msgs:[], unread:0, channel:null, poll:null, banner:null, lastId:0, sending:false };
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
  function timeOf(d){ const x = new Date(d); return String(x.getHours()).padStart(2,'0') + ':' + String(x.getMinutes()).padStart(2,'0'); }
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
      return `<div class="cm me"><div class="cb rcard"><b>🔄 ${esc(t('sub_renew_msg',{label: mt.parts ? partLabel(mt, Number(mt.part)) : ''}))}</b><small>${bidiTitle(String(title||'').replace(/^🔄\s*/,''))} <span class="num">${esc(no||'')}</span></small></div><span class="ct">${timeOf(m.created_at)}</span></div>`;
    }
    const who = m.sender === 'user' ? 'me' : (m.sender === 'system' ? 'sys' : 'them');
    return `<div class="cm ${who}"><div class="cb">${linkify(m.body)}</div><span class="ct">${timeOf(m.created_at)}</span></div>`;
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
    html += C.msgs.map(bubble).join('');
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
    b.innerHTML = html;
    $$('[data-copy]', b).forEach(x => x.onclick = () => copyText(x.dataset.copy));
    bindSubButtons(b, async () => { await load(); renderBody(); });
    const cl = $('#chatLogin'); if(cl) cl.onclick = () => { try{ sessionStorage.setItem('ra_next','#/'); }catch{} close(); };
    b.scrollTop = b.scrollHeight;
  }
  function renderFoot(){
    const f = $('#chatFoot'); if(!f) return;
    if(!S.user){ f.innerHTML = ''; f.classList.add('hidden'); return; }
    f.classList.remove('hidden');
    f.innerHTML = `<textarea id="chatIn" rows="1" maxlength="2000" placeholder="${esc(t('chat_ph'))}"></textarea><button class="cp-send" id="chatSend" aria-label="${esc(t('chat_send'))}">${I.send}</button>`;
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
    tmp.id = data; C.lastId = Math.max(C.lastId, Number(data)||0);
    $('#chatIn')?.focus();
  }
  async function load(){
    if(!S.user){ C.msgs = []; return; }
    const { data } = await sb.from('ra_chat_messages').select('*').eq('user_id', S.user.id).order('id', { ascending:false }).limit(80);
    C.msgs = (data||[]).reverse(); C.lastId = C.msgs.reduce((a,m)=>Math.max(a, Number(m.id)||0), 0);
    await loadSubs();
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
  function markRead(){ if(S.user) sb.rpc('ra_chat_mark_read').then(()=>{},()=>{}); setUnread(0); }
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
  function startPoll(){ stopPoll(); C.poll = setInterval(async () => { if(!S.user || !C.open) return; const { data } = await sb.from('ra_chat_messages').select('*').eq('user_id', S.user.id).gt('id', C.lastId).order('id'); (data||[]).forEach(onMessage); }, 12000); }
  function stopPoll(){ if(C.poll){ clearInterval(C.poll); C.poll = null; } }
  function ding(){ try{ const a = new (window.AudioContext||window.webkitAudioContext)(); const o = a.createOscillator(); const g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.setValueAtTime(.12, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .35); o.start(); o.stop(a.currentTime + .36); }catch{} }
  function onMessage(m){
    if(!m || !S.user || m.user_id !== S.user.id) return;
    if(C.msgs.some(x => String(x.id) === String(m.id))) return;
    C.lastId = Math.max(C.lastId, Number(m.id)||0);
    if(m.sender === 'user'){ if(!C.msgs.some(x => x.tmp && x.body === m.body)) { C.msgs.push(m); if(C.open) renderBody(); } return; }
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
      .subscribe();
  }
  function unsubscribe(){ if(C.channel){ sb.removeChannel(C.channel); C.channel = null; } }
  async function afterPurchase(o, p){
    const banner = `✅ ${esc(t('success_title'))} <span class="num">#${esc(o.order_no)}</span>`;
    await open(banner);
    toast(o.status === 'delivered' ? t('order_in_chat') : t('success_processing'), 'ok');
  }
  function init(){ chrome(); if(S.user){ subscribe(); refreshUnread(); } setInterval(()=>{ if(S.user && !C.open && document.visibilityState==='visible') refreshUnread(); }, 30000); }
  function onAuth(){ C.msgs = []; C.lastId = 0; if(S.user){ subscribe(); refreshUnread(); } else { unsubscribe(); setUnread(0); } if(C.open){ renderFoot(); load().then(renderBody); } }
  function relang(){ chrome(); if(C.open){ $('#chatPanel')?.remove(); C.open = false; open(C.banner); } }
  return { chrome, open, close, afterPurchase, init, onAuth, relang };
})();
window.RA.openChat = () => Chat.open();

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
