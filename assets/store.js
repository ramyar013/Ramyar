/* Realm Academy — storefront */
(function(){
'use strict';
const { sb, $, $$, esc, num, dt, I, toast, modal, confirmBox, confetti, copyText, errMsg, setBusy, safeUrl, safeColor, waLink } = RA;

const S = { user:null, customer:null, products:[], stock:{}, methods:[], cat:'all', q:'', loaded:false, isAdmin:false };
const app = $('#app');

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

/* ───────── Header / chrome ───────── */
function brandMark(){
  const logo = safeUrl(RA.settings.logo);
  return logo ? `<img src="${esc(logo)}" alt="">` : I.logo;
}
function renderChrome(){
  const s = RA.settings;
  $('#brandMark').innerHTML = brandMark(); $('#footMark').innerHTML = brandMark();
  $('#brandName').textContent = s.name || 'Realm Academy'; $('#footName').textContent = s.name || 'Realm Academy';
  $('#footText').textContent = s.footer || '';
  const an = $('#announce'); if(s.announcement){ an.textContent = s.announcement; an.classList.remove('hidden'); } else an.classList.add('hidden');
  const soc = [];
  if(s.whatsapp) soc.push(`<a href="${esc(waLink(s.whatsapp))}" target="_blank" rel="noopener" aria-label="WhatsApp">${I.wa}</a>`);
  if(safeUrl(s.telegram)) soc.push(`<a href="${esc(s.telegram)}" target="_blank" rel="noopener" aria-label="Telegram">${I.tg}</a>`);
  if(safeUrl(s.instagram)) soc.push(`<a href="${esc(s.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${I.ig}</a>`);
  $('#socials').innerHTML = soc.join('');
  $('#themeBtn').innerHTML = document.documentElement.dataset.theme === 'light' ? I.moon : I.sun;
}
function renderHeader(){
  const box = $('#hdrUser');
  if(!S.user){ box.innerHTML = `<a class="btn btn-p btn-sm" href="#/login">چوونەژوورەوە</a>`; return; }
  const name = S.customer?.full_name || S.user.user_metadata?.full_name || S.user.email || '';
  const av = safeUrl(S.customer?.avatar_url || S.user.user_metadata?.avatar_url);
  box.innerHTML = `
    <a class="bal-chip" href="#/wallet/add" title="زیادکردنی پارە"><span class="num">${num(S.customer?.balance)}</span><small class="muted">IQD</small><span class="plus">+</span></a>
    <div class="avatar" id="avBtn" tabindex="0">${av ? `<img src="${esc(av)}" alt="" referrerpolicy="no-referrer">` : esc((name[0]||'?').toUpperCase())}</div>`;
  $('#avBtn').onclick = e => { e.stopPropagation(); toggleMenu(name); };
}
function toggleMenu(name){
  const old = $('.menu'); if(old){ old.remove(); return; }
  const m = document.createElement('div'); m.className='menu';
  m.innerHTML = `<div class="who"><b>${esc(name)}</b><small>${esc(S.user.email||'')}</small></div>
    <a href="#/wallet">${I.wallet.replace('<svg','<svg width="18" height="18"')} جزدان</a>
    <a href="#/orders">${I.bag.replace('<svg','<svg width="18" height="18"')} کڕینەکانم</a>
    <a href="#/account">${I.user.replace('<svg','<svg width="18" height="18"')} ئەکاونت</a>
    ${S.isAdmin ? `<a href="/admin.html">${I.shield.replace('<svg','<svg width="18" height="18"')} پانێڵی ئەدمین</a>` : ''}
    <button id="logoutBtn">${I.logout} چوونەدەرەوە</button>`;
  document.body.appendChild(m);
  $('#logoutBtn').onclick = async () => { await sb.auth.signOut(); m.remove(); location.hash = '#/'; toast('بە سەلامەتی 👋'); };
  setTimeout(()=>document.addEventListener('click', function h(e){ if(!m.contains(e.target)){ m.remove(); document.removeEventListener('click', h); } }), 0);
}
function renderBottomNav(r){
  const items = [['home','#/','سەرەکی',I.home],['wallet','#/wallet','جزدان',I.wallet],['orders','#/orders','کڕینەکانم',I.bag],['account', S.user?'#/account':'#/login', S.user?'ئەکاونت':'چوونەژوورەوە', I.user]];
  $('#bnav').innerHTML = items.map(([k,h,l,ic]) => `<a href="${h}" class="${r===k?'on':''}">${ic}<span>${l}</span></a>`).join('');
  $$('#topNav a').forEach(a => a.classList.toggle('on', a.dataset.r === r));
}

/* ───────── Router ───────── */
function route(){
  const h = location.hash.replace(/^#/, '') || '/';
  const parts = h.split('?')[0].split('/').filter(Boolean);
  $('.menu')?.remove();
  window.scrollTo({top:0, behavior:'instant'});
  RA.logVisit('/' + parts.join('/'));
  const r = parts[0] || 'home';
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
function productStockLabel(p){
  const auto = p.variants.some(v => v.auto_deliver && S.stock[v.id] > 0);
  return auto ? '<span class="stock">گەیاندنی خێرا</span>' : '<span class="stock manual">بەردەستە</span>';
}
function cardHTML(p){
  const img = safeUrl(p.image_url); const ac = safeColor(p.accent);
  return `<a class="card" href="#/p/${encodeURIComponent(p.slug)}" style="${ac?`--ac:${ac}`:''}">
    <div class="media">${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy">` : `<span class="em">${esc(p.emoji||'✨')}</span>`}
      ${p.badge ? `<span class="badge ${p.featured?'gold':''}">${esc(p.badge)}</span>` : ''}</div>
    <div class="body">
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.short)}</p>
      ${productStockLabel(p)}
      <div class="cfoot"><div><span class="from">دەستپێدەکات لە</span><span class="price"><span class="num">${num(minPrice(p))}</span> <small>IQD</small></span></div><span class="go">${I.arrow}</span></div>
    </div></a>`;
}
function viewHome(){
  const s = RA.settings;
  const title = esc(s.hero_title || 'باشترین ئەکاونتە پریمیەمەکان، یەکسەر بۆ تۆ');
  const words = title.split(' '); const hl = words.length > 2 ? words.slice(0,-2).join(' ') + ' <span class="g">' + words.slice(-2).join(' ') + '</span>' : title;
  app.innerHTML = `
  <section class="hero">
    <div>
      <span class="pill"><span class="dot"></span> ${esc(s.tagline || 'خێرا، پارێزراو، پڕۆفیشناڵ')}</span>
      <h1>${hl}</h1>
      <p class="lead">${esc(s.hero_text || '')}</p>
      <div class="cta">
        <a class="btn btn-p btn-lg" href="#products">بینینی بەرهەمەکان</a>
        <a class="btn btn-lg" href="#/wallet/add">${I.wallet.replace('<svg','<svg width="20" height="20"')} پڕکردنەوەی جزدان</a>
      </div>
      <div class="trust"><span>${I.bolt} گەیاندنی یەکسەر</span><span>${I.shield} پارێزراو 100%</span><span>${I.headset} سەپۆرتی بەردەوام</span></div>
    </div>
    <div class="hero-card">
      <div class="wallet-vis"><div style="display:flex;justify-content:space-between;align-items:center"><small>جزدانی ${esc(s.name||'Realm')}</small><span style="font-size:22px">◈</span></div>
        <div><small>باڵانس</small><div class="amt"><span class="num">${S.customer ? num(S.customer.balance) : '••••••'}</span> <span style="font-size:15px">IQD</span></div></div></div>
      <div class="steps">
        <div class="step"><i>1</i><div><b>پارە زیاد بکە</b><small>FIB · FastPay · SuperQi · ئاسیا · کریپتۆ</small></div></div>
        <div class="step"><i>2</i><div><b>بەرهەمەکەت هەڵبژێرە</b><small>بە یەک کلیک لە باڵانسەکەت دەکڕیت</small></div></div>
        <div class="step"><i>3</i><div><b>یەکسەر وەریبگرە</b><small>لە بەشی کڕینەکانم دەردەکەوێت</small></div></div>
      </div>
    </div>
  </section>
  <section class="sec" id="products">
    <div class="sec-h"><h2>بەرهەمەکان</h2>
      <label class="search">${I.search}<input id="q" placeholder="گەڕان بۆ بەرهەم..." value="${esc(S.q)}"></label></div>
    <div class="chips" id="chips"></div>
    <div class="grid" id="grid">${S.loaded ? '' : Array(6).fill('<div class="sk" style="height:300px"></div>').join('')}</div>
  </section>`;
  $('#q').oninput = e => { S.q = e.target.value; drawGrid(); };
  $('a[href="#products"]').onclick = e => { e.preventDefault(); $('#products').scrollIntoView({behavior:'smooth'}); };
  if(S.loaded) drawGrid(); else loadCatalog().then(drawGrid).catch(e => { $('#grid').innerHTML = `<div class="empty">${esc(errMsg(e))}</div>`; });
}
function drawGrid(){
  const cats = [...new Set(S.products.map(p=>p.category).filter(Boolean))];
  const chips = $('#chips'); if(!chips) return;
  chips.innerHTML = cats.length > 1 ? [['all','هەمووی'], ...cats.map(c=>[c,c])].map(([k,l]) => `<button class="chip ${S.cat===k?'on':''}" data-c="${esc(k)}">${esc(l)}</button>`).join('') : '';
  $$('.chip', chips).forEach(b => b.onclick = () => { S.cat = b.dataset.c; drawGrid(); });
  const q = S.q.trim().toLowerCase();
  const list = S.products.filter(p => (S.cat==='all' || p.category===S.cat) && (!q || (p.name+' '+p.short+' '+p.category).toLowerCase().includes(q)));
  $('#grid').innerHTML = list.length ? list.map(cardHTML).join('') : `<div class="empty" style="grid-column:1/-1"><div class="e">🔍</div>هیچ بەرهەمێک نەدۆزرایەوە</div>`;
}

/* ───────── Product ───────── */
async function viewProduct(slug){
  if(!S.loaded){ app.innerHTML = '<div class="sk" style="height:420px;margin-top:30px"></div>'; try{ await loadCatalog(); }catch(e){ app.innerHTML = `<div class="empty">${esc(errMsg(e))}</div>`; return; } }
  const p = S.products.find(x => x.slug === slug);
  if(!p){ app.innerHTML = `<div class="empty" style="padding:80px 0"><div class="e">🤷</div>ئەم بەرهەمە نەدۆزرایەوە<br><br><a class="btn" href="#/">گەڕانەوە</a></div>`; return; }
  let sel = p.variants[0];
  const img = safeUrl(p.image_url); const ac = safeColor(p.accent);
  const fields = Array.isArray(p.fields) ? p.fields : [];
  app.innerHTML = `
  <a class="back" href="#/">${I.back} گەڕانەوە بۆ بەرهەمەکان</a>
  <div class="pd" style="${ac?`--ac:${ac}`:''}">
    <div>
      <div class="media">${img ? `<img src="${esc(img)}" alt="${esc(p.name)}">` : `<span class="em">${esc(p.emoji||'✨')}</span>`}${p.badge?`<span class="badge ${p.featured?'gold':''}">${esc(p.badge)}</span>`:''}</div>
      <div class="panel" style="margin-top:18px"><h3>دەربارەی بەرهەم</h3><p class="desc">${esc(p.description || p.short)}</p></div>
    </div>
    <div class="buybox">
      ${p.category ? `<span class="pill" style="padding:4px 12px">${esc(p.category)}</span>` : ''}
      <h1>${esc(p.name)}</h1>
      <p class="t2">${esc(p.short)}</p>
      <div class="variants" id="vars"></div>
      <div id="flds">${fields.map((f,i) => `<div class="field"><label>${esc(f.label)} ${f.required?'<span style="color:var(--bad)">*</span>':''}</label><input class="inp" data-f="${i}" maxlength="300" placeholder="${esc(f.placeholder||'')}"></div>`).join('')}
        <div class="field"><label>تێبینی (ئارەزوومەندانە)</label><input class="inp" id="fNote" maxlength="300" placeholder="هەر تێبینییەک بۆ ئێمە..."></div></div>
      <div id="deliveryInfo"></div>
      <div class="total"><span class="t2">کۆی گشتی</span><span class="price" id="tot"></span></div>
      <button class="btn btn-p btn-lg btn-block" id="buyBtn">کڕین بە باڵانس</button>
      <p class="muted" style="font-size:12px;text-align:center;margin-top:10px" id="balHint"></p>
    </div>
  </div>`;
  const drawVars = () => {
    $('#vars').innerHTML = p.variants.map(v => `<div class="var ${sel&&sel.id===v.id?'on':''}" data-v="${v.id}"><span class="rd"></span><span class="nm">${esc(v.name)}</span><span>${v.old_price>v.price?`<span class="old num">${num(v.old_price)}</span>`:''}<b class="num">${num(v.price)}</b> <small class="muted">IQD</small></span></div>`).join('') || '<div class="empty">هیچ پلانێک بەردەست نییە</div>';
    $$('#vars .var').forEach(el => el.onclick = () => { sel = p.variants.find(v=>v.id===el.dataset.v); drawVars(); });
    $('#tot').innerHTML = sel ? `<span class="num">${num(sel.price)}</span> <small>IQD</small>` : '—';
    const instant = sel && sel.auto_deliver && S.stock[sel.id] > 0;
    $('#deliveryInfo').innerHTML = sel ? (instant ? `<div class="note-box" style="border-color:color-mix(in srgb,var(--ok) 30%,transparent);background:color-mix(in srgb,var(--ok) 10%,transparent)">⚡ گەیاندنی ئۆتۆماتیکی — دوای کڕین یەکسەر وەریدەگریت.</div>` : `<div class="note-box">⏱️ دوای کڕین، تیمەکەمان لە ماوەیەکی کەمدا بۆت ئامادە دەکات و لە «کڕینەکانم» دەردەکەوێت.</div>`) : '';
    const bal = Number(S.customer?.balance||0);
    $('#balHint').innerHTML = S.user ? `باڵانسی تۆ: <b class="num">${num(bal)}</b> IQD` : 'بۆ کڕین پێویستە بچیتە ژوورەوە';
    $('#buyBtn').disabled = !sel;
  };
  drawVars();
  $('#buyBtn').onclick = () => buy(p, sel);
}
async function buy(p, v){
  if(!v) return;
  if(!S.user){ try{ sessionStorage.setItem('ra_next', location.hash); }catch{} location.hash = '#/login'; toast('تکایە سەرەتا بچۆ ژوورەوە'); return; }
  const fields = {};
  const defs = Array.isArray(p.fields) ? p.fields : [];
  for(const el of $$('[data-f]')){ const f = defs[Number(el.dataset.f)]; const val = el.value.trim(); if(f.required && !val){ el.focus(); toast('تکایە «' + f.label + '» پڕبکەرەوە','bad'); return; } fields[f.label] = val; }
  const note = $('#fNote')?.value.trim(); if(note) fields.__note = note;
  await loadCustomer();
  const bal = Number(S.customer?.balance||0);
  if(bal < v.price){
    const need = v.price - bal;
    const m = modal(`<div class="modal-h"><h3>باڵانس بەش ناکات</h3><button class="icon-btn" data-close>${I.x}</button></div>
      <div style="text-align:center;padding:6px 0 16px"><div style="font-size:48px">👛</div>
      <p class="t2">بۆ کڕینی <b>${esc(p.name)} — ${esc(v.name)}</b> پێویستت بە <b class="num">${num(need)}</b> IQD زیاترە.</p></div>
      <div class="mini-stats" style="margin-bottom:16px"><div class="mini"><small>باڵانسی ئێستا</small><b class="num">${num(bal)}</b></div><div class="mini"><small>نرخ</small><b class="num">${num(v.price)}</b></div></div>
      <a class="btn btn-p btn-block btn-lg" href="#/wallet/add?amount=${need}" data-close>پارە زیاد بکە</a>`);
    return;
  }
  const ok = await confirmBox('دڵنیایت لە کڕین؟', `${p.name} — ${v.name}\nنرخ: ${num(v.price)} IQD\nباڵانس دوای کڕین: ${num(bal - v.price)} IQD`, 'بەڵێ، بیکڕە');
  if(!ok) return;
  const btn = $('#buyBtn'); setBusy(btn, true);
  const { data, error } = await sb.rpc('ra_purchase', { p_variant: v.id, p_fields: fields });
  setBusy(btn, false, 'کڕین بە باڵانس');
  if(error){ toast(errMsg(error), 'bad'); return; }
  const o = Array.isArray(data) ? data[0] : data;
  if(o && o.status==='delivered') S.stock[v.id] = Math.max(0, (S.stock[v.id]||1) - 1);
  await loadCustomer();
  confetti();
  showOrderSuccess(o, p);
}
function showOrderSuccess(o, p){
  const delivered = o.status === 'delivered';
  const m = modal(`<div style="text-align:center"><div class="success-ic">${I.check}</div>
    <h3 style="font-size:22px;font-weight:900">کڕینەکەت سەرکەوتوو بوو!</h3>
    <p class="muted" style="margin:4px 0 16px">داواکاری ژمارە <b class="num">#${esc(o.order_no)}</b></p></div>
    ${delivered ? `<div class="order"><div class="dl"><b>📦 بەرهەمەکەت:</b><pre>${esc(o.delivery)}</pre><button class="btn btn-sm" id="cpD">${I.copy} کۆپیکردن</button></div></div>
      ${p && p.delivery_note ? `<div class="note-box" style="margin-top:12px;white-space:pre-line">${esc(p.delivery_note)}</div>` : ''}`
      : `<div class="warn-box">⏱️ داواکارییەکەت وەرگیرا و لە ماوەیەکی کەمدا ئامادە دەکرێت. کاتێک ئامادە بوو، لە بەشی «کڕینەکانم» دەیبینیت.</div>`}
    <div style="display:flex;gap:10px;margin-top:18px"><a class="btn btn-p btn-block" href="#/orders" data-close>کڕینەکانم</a><button class="btn btn-block" data-close>باشە</button></div>`);
  const c = m.el.querySelector('#cpD'); if(c) c.onclick = () => copyText(o.delivery);
}

/* ───────── Login ───────── */
function viewLogin(mode){
  if(S.user){ goNext(); return; }
  let tab = mode === 'register' ? 'register' : 'login';
  const s = RA.settings;
  app.innerHTML = `<div class="auth">
    <div class="auth-art"><div class="orb a"></div><div class="orb b"></div>
      <div class="glass-tiles"><div>🤖</div><div>🎨</div><div>🎬</div></div>
      <h2>بەخێربێیت بۆ ${esc(s.name||'Realm Academy')}</h2>
      <p>یەک ئەکاونت، جزدانێکی پارێزراو، و گەیاندنی خێرا بۆ هەموو بەرهەمە پریمیەمەکان.</p></div>
    <div class="auth-form"><div class="auth-box" id="authBox"></div></div></div>`;
  const draw = () => {
    const reg = tab === 'register';
    $('#authBox').innerHTML = `
      <h1>${reg ? 'دروستکردنی ئەکاونت' : 'چوونەژوورەوە'}</h1>
      <p class="sub">${reg ? 'لە کەمتر لە خولەکێکدا ئەکاونتەکەت دروست بکە' : 'بەخێربێیتەوە! بچۆ ژوورەوە بۆ ئەکاونتەکەت'}</p>
      <button class="g-btn" id="gBtn">${I.google} بەردەوامبوون بە Google</button>
      <div class="or">یان بە ئیمەیڵ</div>
      <div class="seg"><button data-t="login" class="${!reg?'on':''}">چوونەژوورەوە</button><button data-t="register" class="${reg?'on':''}">خۆتۆمارکردن</button></div>
      <form id="authForm" autocomplete="on" novalidate>
        ${reg ? `<div class="field"><label>ناوی تەواو</label><div class="inp-wrap">${I.user}<input class="inp" name="name" autocomplete="name" required maxlength="80" placeholder="ناوت"></div></div>` : ''}
        <div class="field"><label>ئیمەیڵ</label><div class="inp-wrap">${I.mail}<input class="inp ltr" type="email" name="email" autocomplete="email" required placeholder="you@gmail.com" style="text-align:right"></div></div>
        <div class="field"><label style="display:flex;justify-content:space-between">وشەی نهێنی ${!reg ? '<button type="button" class="link" id="forgot">لەبیرتچووە؟</button>' : ''}</label><div class="inp-wrap">${I.lock}<input class="inp" type="password" name="password" autocomplete="${reg?'new-password':'current-password'}" required minlength="6" placeholder="••••••••"></div></div>
        <button class="btn btn-p btn-lg btn-block" type="submit" id="aBtn">${reg ? 'دروستکردنی ئەکاونت' : 'چوونەژوورەوە'}</button>
      </form>
      <p class="muted" style="font-size:12px;text-align:center;margin-top:16px">بە بەردەوامبوون، ڕازی دەبیت بە مەرج و یاساکانی ماڵپەڕەکە.</p>`;
    $$('.seg button').forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    $('#gBtn').onclick = async () => {
      const { error } = await sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: location.origin + '/' } });
      if(error) toast(errMsg(error), 'bad');
    };
    const fg = $('#forgot'); if(fg) fg.onclick = forgotPassword;
    $('#authForm').onsubmit = async e => {
      e.preventDefault();
      const f = new FormData(e.target); const email = String(f.get('email')||'').trim(); const password = String(f.get('password')||'');
      if(!/^\S+@\S+\.\S+$/.test(email)) return toast('ئیمەیڵەکە دروست نییە','bad');
      if(password.length < 6) return toast('وشەی نهێنی لانیکەم 6 پیت بێت','bad');
      const btn = $('#aBtn'); setBusy(btn, true);
      if(reg){
        const name = String(f.get('name')||'').trim();
        const { data, error } = await sb.auth.signUp({ email, password, options:{ data:{ full_name:name }, emailRedirectTo: location.origin + '/' } });
        setBusy(btn, false);
        if(error) return toast(errMsg(error), 'bad');
        if(data.session){ toast('بەخێربێیت! 🎉','ok'); }
        else modal(`<div style="text-align:center"><div style="font-size:54px">📧</div><h3 style="margin:8px 0">ئیمەیڵەکەت بپشکنە</h3><p class="t2">لینکی پشتڕاستکردنەوەمان نارد بۆ <b class="ltr">${esc(email)}</b>. کلیکی لێ بکە بۆ تەواوکردنی خۆتۆمارکردن.</p><button class="btn btn-p btn-block" style="margin-top:18px" data-close>باشە</button></div>`);
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        setBusy(btn, false);
        if(error) return toast(errMsg(error), 'bad');
        toast('بەخێربێیتەوە! 👋','ok');
      }
    };
  };
  draw();
}
function forgotPassword(){
  const m = modal(`<div class="modal-h"><h3>گەڕاندنەوەی وشەی نهێنی</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <p class="t2" style="margin-bottom:14px">ئیمەیڵەکەت بنووسە، لینکێکت بۆ دەنێرین.</p>
    <div class="field"><input class="inp ltr" id="fgEmail" type="email" placeholder="you@gmail.com" style="text-align:right"></div>
    <button class="btn btn-p btn-block" id="fgBtn">ناردنی لینک</button>`);
  m.el.querySelector('#fgBtn').onclick = async e => {
    const email = m.el.querySelector('#fgEmail').value.trim(); if(!email) return;
    setBusy(e.target, true);
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/#/reset' });
    setBusy(e.target, false, 'ناردنی لینک');
    if(error) return toast(errMsg(error),'bad');
    m.close(); toast('لینکەکە نێردرا، ئیمەیڵەکەت بپشکنە 📧','ok');
  };
}
function viewReset(){
  app.innerHTML = `<div style="max-width:420px;margin:60px auto"><div class="panel"><h3>وشەی نهێنی نوێ</h3>
    <div class="field"><input class="inp" type="password" id="np" minlength="6" placeholder="وشەی نهێنی نوێ"></div>
    <button class="btn btn-p btn-block" id="npBtn">پاشەکەوتکردن</button></div></div>`;
  $('#npBtn').onclick = async e => {
    const pw = $('#np').value; if(pw.length < 6) return toast('لانیکەم 6 پیت','bad');
    setBusy(e.target, true); const { error } = await sb.auth.updateUser({ password: pw }); setBusy(e.target, false, 'پاشەکەوتکردن');
    if(error) return toast(errMsg(error),'bad'); toast('وشەی نهێنی گۆڕدرا ✓','ok'); location.hash = '#/';
  };
}

/* ───────── Wallet ───────── */
async function viewWallet(){
  app.innerHTML = `<div class="page-h"><h1>جزدانەکەم</h1><p class="muted">باڵانس، پارە زیادکردن و مێژووی مامەڵەکان</p></div>
  <div class="wallet-top">
    <div class="bal-card"><div class="lbl">باڵانسی بەردەست</div>
      <div class="big"><span class="num" id="wBal">${num(S.customer?.balance)}</span> <span style="font-size:18px">IQD</span></div>
      <div class="row"><a class="btn" href="#/wallet/add">+ زیادکردنی پارە</a><a class="btn alt" href="#/">کڕین</a></div></div>
    <div class="mini-stats"><div class="mini"><small>کۆی پارەی زیادکراو</small><b class="num" id="stDep">—</b></div><div class="mini"><small>کۆی کڕینەکان</small><b class="num" id="stBuy">—</b></div>
      <div class="mini"><small>چاوەڕوانی پشکنین</small><b class="num" id="stPend">—</b></div><div class="mini"><small>ژمارەی کڕین</small><b class="num" id="stCnt">—</b></div></div>
  </div>
  <div class="panel" id="pendBox" style="margin-bottom:18px"><h3>داواکارییەکانی زیادکردنی پارە</h3><div class="list" id="depList"><div class="sk" style="height:70px"></div></div></div>
  <div class="panel"><h3>مێژووی مامەڵەکان</h3><div class="list" id="txList"><div class="sk" style="height:70px"></div></div></div>`;
  await loadCustomer(); $('#wBal').textContent = num(S.customer?.balance);
  const [d, t] = await Promise.all([
    sb.from('ra_deposits').select('*').eq('user_id', S.user.id).order('created_at',{ascending:false}).limit(30),
    sb.from('ra_wallet_tx').select('*').eq('user_id', S.user.id).order('created_at',{ascending:false}).limit(100)
  ]);
  const deps = d.data||[], txs = t.data||[];
  $('#stDep').textContent = num(deps.filter(x=>x.status==='approved').reduce((a,x)=>a+Number(x.approved_amount||0),0));
  $('#stBuy').textContent = num(-txs.filter(x=>x.kind==='purchase').reduce((a,x)=>a+Number(x.amount),0));
  $('#stPend').textContent = num(deps.filter(x=>x.status==='pending').length);
  $('#stCnt').textContent = num(txs.filter(x=>x.kind==='purchase').length);
  const stL = {pending:'چاوەڕوان',approved:'پەسەندکرا',rejected:'ڕەتکرایەوە'};
  $('#depList').innerHTML = deps.length ? deps.map(x => `<div class="item"><div class="ic">💳</div><div class="grow"><b>${esc(x.method_name)} — <span class="num">${num(x.approved_amount||x.amount)}</span> IQD</b><small>${dt(x.created_at)}${x.admin_note?' · '+esc(x.admin_note):''}</small></div><span class="st ${x.status}">${stL[x.status]}</span></div>`).join('')
    : `<div class="empty"><div class="e">💸</div>هێشتا پارەت زیاد نەکردووە<br><br><a class="btn btn-p" href="#/wallet/add">یەکەم جار پارە زیاد بکە</a></div>`;
  const kL = {deposit:['⬇️','زیادکردنی پارە'],purchase:['🛍️','کڕین'],refund:['↩️','گەڕاندنەوەی پارە'],adjust:['⚙️','ڕێکخستن']};
  $('#txList').innerHTML = txs.length ? txs.map(x => `<div class="item"><div class="ic">${kL[x.kind][0]}</div><div class="grow"><b>${kL[x.kind][1]}${x.note?' · '+esc(x.note):''}</b><small>${dt(x.created_at)} · باڵانس: <span class="num">${num(x.balance_after)}</span></small></div><span class="${x.amount>0?'amt-pos':'amt-neg'} num">${x.amount>0?'+':''}${num(x.amount)}</span></div>`).join('')
    : `<div class="empty">هیچ مامەڵەیەک نییە</div>`;
}

async function viewAddFunds(){
  const q = new URLSearchParams((location.hash.split('?')[1]||''));
  const pre = Number(q.get('amount')||0);
  app.innerHTML = `<a class="back" href="#/wallet">${I.back} گەڕانەوە بۆ جزدان</a>
  <div class="page-h" style="padding-top:12px"><h1>زیادکردنی پارە</h1><p class="muted">ڕێگای پارەدان هەڵبژێرە، پارەکە بنێرە و پسوڵەکە باربکە</p></div>
  <div class="panel" style="margin:14px 0"><h3>1. ڕێگای پارەدان هەڵبژێرە</h3><div class="methods" id="methods"><div class="sk" style="height:120px"></div></div></div>
  <div id="payForm"></div>`;
  const ms = await loadMethods();
  if(!ms.length){ $('#methods').innerHTML = '<div class="empty">هیچ ڕێگایەکی پارەدان بەردەست نییە</div>'; return; }
  const logo = m => { const u = safeUrl(m.logo_url); return u ? `<img src="${esc(u)}" alt="">` : esc((m.name||'?').replace(/[^\p{L}\p{N}]/gu,'').slice(0,3).toUpperCase()); };
  $('#methods').innerHTML = ms.map(m => `<button class="method" data-m="${m.id}" style="${safeColor(m.color)?`--mc:${safeColor(m.color)}`:''}"><span class="m-logo">${logo(m)}</span><b>${esc(m.name)}</b></button>`).join('');
  $$('#methods .method').forEach(b => b.onclick = () => { $$('#methods .method').forEach(x=>x.classList.toggle('on', x===b)); drawForm(ms.find(m=>m.id===b.dataset.m)); setTimeout(()=>$('#payForm').scrollIntoView({behavior:'smooth',block:'start'}),50); });

  function drawForm(m){
    let file = null;
    const isCrypto = m.kind === 'crypto' || (m.currency && m.currency !== 'IQD');
    const qr = safeUrl(m.qr_url);
    const quick = m.kind === 'asia' ? [5000,10000,15000,20000,25000,50000] : [5000,10000,25000,50000,100000];
    $('#payForm').innerHTML = `<div class="panel" style="--mc:${safeColor(m.color)||'var(--p)'}">
      <h3>2. پارەکە بنێرە بۆ ${esc(m.name)}</h3>
      ${m.account ? `<div class="acct"><code>${esc(m.account)}</code><button class="btn btn-sm" id="cpA">${I.copy} کۆپی</button></div>` : ''}
      ${m.holder ? `<p class="t2" style="font-size:13px">ناو / تۆڕ: <b>${esc(m.holder)}</b></p>` : ''}
      ${qr ? `<div class="qr"><img src="${esc(qr)}" alt="QR"></div>` : ''}
      ${m.instructions ? `<div class="note-box" style="margin:12px 0;white-space:pre-line">${esc(m.instructions)}</div>` : ''}
      <h3 style="margin-top:22px">3. زانیاری ناردنەکە</h3>
      <div class="field"><label>بڕی پارە (IQD) — ئەوەندە بۆ باڵانسەکەت زیاد دەکرێت</label>
        <input class="inp num" id="amt" type="number" inputmode="numeric" min="${Number(m.min_amount)||1000}" step="250" value="${pre||''}" placeholder="بۆ نموونە 10000" style="width:100%;text-align:right">
        <div class="quick">${quick.map(a=>`<button type="button" data-a="${a}" class="num">${num(a)}</button>`).join('')}</div>
        ${isCrypto ? `<small class="muted" id="conv"></small>` : ''}
        <small class="muted">کەمترین بڕ: <span class="num">${num(m.min_amount)}</span> IQD</small></div>
      ${m.needs_code ? `<div class="field"><label>کۆدی کارت <span style="color:var(--bad)">*</span></label><input class="inp ltr num" id="code" inputmode="numeric" maxlength="60" placeholder="0000 0000 0000 00" style="width:100%;text-align:right"></div>` : ''}
      <div class="row2">
        <div class="field"><label>${isCrypto ? 'TxID / Hash' : 'ژمارەی مامەڵە (ئارەزوومەندانە)'}</label><input class="inp ltr" id="ref" maxlength="120" style="text-align:right"></div>
        <div class="field"><label>ناو یان ژمارەی نێرەر</label><input class="inp" id="snd" maxlength="120"></div>
      </div>
      ${m.needs_receipt || !m.needs_code ? `<div class="field"><label>وێنەی پسوڵە ${m.needs_receipt ? '<span style="color:var(--bad)">*</span>' : ''}</label>
        <label class="drop" id="drop">${I.upload}<span>کلیک بکە بۆ هەڵبژاردنی وێنەی پسوڵە</span><input type="file" id="rc" accept="image/*" hidden></label></div>` : ''}
      <div class="note-box" style="margin-bottom:14px">${esc(RA.settings.deposit_note || 'دوای پشکنین، باڵانسەکەت زیاد دەکرێت.')}</div>
      <button class="btn btn-p btn-lg btn-block" id="sendDep">ناردنی داواکاری</button></div>`;
    const cp = $('#cpA'); if(cp) cp.onclick = () => copyText(m.account);
    const amt = $('#amt');
    const conv = () => { const c = $('#conv'); if(c){ const v = Number(amt.value||0)/Number(m.rate||1); c.innerHTML = v ? `پێویستە بنێریت: <b class="num">${v.toFixed(2)} ${esc(m.currency)}</b> (1 ${esc(m.currency)} = <span class="num">${num(m.rate)}</span> IQD)` : ''; } };
    amt.oninput = conv; conv();
    $$('.quick button').forEach(b => b.onclick = () => { amt.value = b.dataset.a; conv(); });
    const rc = $('#rc');
    if(rc) rc.onchange = () => {
      const f = rc.files[0]; if(!f) return;
      if(!/^image\//.test(f.type)) return toast('تەنها وێنە','bad');
      if(f.size > 10*1024*1024) return toast('قەبارەی وێنە زۆر گەورەیە','bad');
      file = f; const url = URL.createObjectURL(f);
      $('#drop').innerHTML = `<img src="${url}" alt=""><span>✓ ${esc(f.name)} — بۆ گۆڕین کلیک بکە</span>`; $('#drop').appendChild(rc);
    };
    $('#sendDep').onclick = async e => {
      const amount = Math.floor(Number(amt.value||0));
      if(!amount || amount < Number(m.min_amount||1)) return toast('بڕی پارە کەمترە لە کەمترین بڕ','bad');
      const code = $('#code')?.value.trim() || '';
      if(m.needs_code && !code) return toast('کۆدی کارتەکە بنووسە','bad');
      const ref = $('#ref').value.trim(), snd = $('#snd').value.trim();
      if(m.needs_receipt && !file && !ref) return toast('تکایە وێنەی پسوڵە باربکە','bad');
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
        setBusy(btn, false, 'ناردنی داواکاری');
        const md = modal(`<div style="text-align:center"><div class="success-ic">${I.check}</div><h3 style="font-size:21px;font-weight:900">داواکارییەکەت نێردرا!</h3>
          <p class="t2" style="margin:8px 0 18px">داواکاری زیادکردنی <b class="num">${num(amount)}</b> IQD لە ڕێگەی ${esc(m.name)} وەرگیرا. دوای پشکنین، باڵانسەکەت ئۆتۆماتیکی زیاد دەکرێت.</p>
          <a class="btn btn-p btn-block" href="#/wallet" data-close>بینینی جزدان</a></div>`);
      }catch(err){ setBusy(btn, false, 'ناردنی داواکاری'); toast(errMsg(err),'bad'); }
    };
  }
}

/* ───────── Orders ───────── */
async function viewOrders(){
  app.innerHTML = `<div class="page-h"><h1>کڕینەکانم</h1><p class="muted">هەموو بەرهەمە کڕدراوەکانت لێرەن</p></div><div class="list" id="ordList" style="gap:14px;margin-top:14px"><div class="sk" style="height:120px"></div></div>`;
  const { data, error } = await sb.from('ra_orders').select('*').eq('user_id', S.user.id).order('created_at',{ascending:false}).limit(100);
  if(error) return $('#ordList').innerHTML = `<div class="empty">${esc(errMsg(error))}</div>`;
  const stL = {processing:'ئامادە دەکرێت',delivered:'گەیەندرا',cancelled:'هەڵوەشێنرایەوە',refunded:'پارە گەڕێنرایەوە'};
  const prodMap = Object.fromEntries(S.products.map(p=>[p.id,p]));
  $('#ordList').innerHTML = (data||[]).length ? data.map(o => {
    const p = prodMap[o.product_id];
    const fields = Object.entries(o.fields||{}).filter(([k,v])=>v).map(([k,v])=>`${esc(k)}: ${esc(v)}`).join(' · ');
    return `<div class="order"><div class="top"><div class="ic" style="width:50px;height:50px;border-radius:15px;display:grid;place-items:center;font-size:24px;background:var(--s3)">${esc(p?.emoji||'📦')}</div>
      <div class="grow" style="flex:1;min-width:0"><b style="display:block">${esc(o.product_name)} <span class="muted" style="font-weight:600">— ${esc(o.variant_name)}</span></b>
      <small class="muted"><span class="num">#${esc(o.order_no)}</span> · ${dt(o.created_at)} · <span class="num">${num(o.price)}</span> IQD</small>${fields?`<br><small class="muted">${fields}</small>`:''}</div>
      <span class="st ${o.status}">${stL[o.status]}</span></div>
      ${o.status==='delivered' && o.delivery ? `<div class="dl blur" data-d="${o.id}"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><b>📦 زانیاری بەرهەم</b><span style="display:flex;gap:6px"><button class="btn btn-sm" data-show>👁 پیشاندان</button><button class="btn btn-sm" data-cp>${I.copy}</button></span></div><pre>${esc(o.delivery)}</pre>${p&&p.delivery_note?`<small class="muted" style="white-space:pre-line;display:block">${esc(p.delivery_note)}</small>`:''}</div>`
        : o.status==='processing' ? `<div class="wait"><span class="spin" style="color:var(--warn)"></span> تیمەکەمان خەریکی ئامادەکردنی داواکارییەکەتە...</div>`
        : o.admin_note ? `<div class="wait">${esc(o.admin_note)}</div>` : ''}
    </div>`;}).join('') : `<div class="empty"><div class="e">🛍️</div>هێشتا هیچت نەکڕیوە<br><br><a class="btn btn-p" href="#/">بینینی بەرهەمەکان</a></div>`;
  $$('[data-d]').forEach(box => {
    const o = data.find(x=>x.id===box.dataset.d);
    box.querySelector('[data-show]').onclick = e => { box.classList.toggle('blur'); e.currentTarget.textContent = box.classList.contains('blur') ? '👁 پیشاندان' : '🙈 شاردنەوە'; };
    box.querySelector('[data-cp]').onclick = () => copyText(o.delivery);
  });
}

/* ───────── Account ───────── */
async function viewAccount(){
  await loadCustomer();
  const c = S.customer || {};
  app.innerHTML = `<div class="page-h"><h1>ئەکاونتەکەم</h1></div>
  <div style="max-width:560px;display:grid;gap:16px;margin-top:10px">
    <div class="panel"><h3>زانیاری کەسی</h3>
      <div class="field"><label>ئیمەیڵ</label><input class="inp ltr" value="${esc(S.user.email||'')}" disabled style="text-align:right"></div>
      <div class="field"><label>ناو</label><input class="inp" id="aName" maxlength="80" value="${esc(c.full_name||'')}"></div>
      <div class="field"><label>ژمارەی مۆبایل</label><input class="inp ltr" id="aPhone" maxlength="20" inputmode="tel" value="${esc(c.phone||'')}" placeholder="07xx xxx xxxx" style="text-align:right"></div>
      <button class="btn btn-p" id="saveAcc">پاشەکەوتکردن</button></div>
    ${S.user.app_metadata?.provider === 'email' ? `<div class="panel"><h3>گۆڕینی وشەی نهێنی</h3><div class="field"><input class="inp" type="password" id="newPw" minlength="6" placeholder="وشەی نهێنی نوێ"></div><button class="btn" id="savePw">گۆڕین</button></div>` : ''}
    <button class="btn btn-bad" id="lo">${I.logout} چوونەدەرەوە</button>
  </div>`;
  $('#saveAcc').onclick = async e => { setBusy(e.target,true); const { error } = await sb.rpc('ra_update_profile', { p_name:$('#aName').value, p_phone:$('#aPhone').value }); setBusy(e.target,false,'پاشەکەوتکردن'); if(error) return toast(errMsg(error),'bad'); toast('پاشەکەوت کرا ✓','ok'); loadCustomer(); };
  const sp = $('#savePw'); if(sp) sp.onclick = async e => { const pw=$('#newPw').value; if(pw.length<6) return toast('لانیکەم 6 پیت','bad'); setBusy(e.target,true); const { error } = await sb.auth.updateUser({ password:pw }); setBusy(e.target,false,'گۆڕین'); if(error) return toast(errMsg(error),'bad'); toast('گۆڕدرا ✓','ok'); $('#newPw').value=''; };
  $('#lo').onclick = async () => { await sb.auth.signOut(); location.hash = '#/'; };
}

/* ───────── Boot ───────── */
$('#themeBtn').onclick = () => { RA.toggleTheme(); renderChrome(); };
window.addEventListener('hashchange', route);
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
  if(booted && prev !== S.user?.id){
    if(S.user && location.hash.startsWith('#/login')) goNext(); else route();
  }
});

(async function boot(){
  renderChrome(); renderHeader();
  try{ await RA.loadSettings(); }catch{}
  renderChrome();
  const { data } = await sb.auth.getSession(); S.user = data.session?.user || null;
  if(S.user){ await loadCustomer(); }
  booted = true;
  if(S.user && (location.hash.startsWith('#/login') || location.search.includes('code='))){ if(location.search) history.replaceState(null,'',location.pathname+location.hash); goNext(); }
  route();
  loadCatalog().then(()=>{ if(!location.hash || location.hash==='#/' ) drawGrid(); }).catch(()=>{});
  setInterval(()=>{ if(S.user && document.visibilityState==='visible') loadCustomer(); }, 30000);
})();
})();
