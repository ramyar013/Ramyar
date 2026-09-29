/* Realm Academy — admin panel (v3) */
(function(){
'use strict';
const { sb, $, $$, esc, num, dt, ago, I, toast, modal, confirmBox, copyText, errMsg, setBusy, safeUrl, safeColor } = RA;
const root = $('#root');
const A = { user:null, tab:'dash', products:[], methods:[], stock:{} };

const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC = {
  dash: svg('<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>'),
  deposits: I.wallet, orders: I.bag,
  products: svg('<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>'),
  payments: svg('<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>'),
  customers: svg('<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>'),
  visitors: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  texts: svg('<path d="M4 7V5h16v2M9 19h6M12 5v14"/>'),
  chat: I.chat,
  tickets: svg('<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M13 6v2M13 11v2M13 16v2"/>'),
  coupons: svg('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  bundles: svg('<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5"/>'),
  writer: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  backups: svg('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>'),
  subs: svg('<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/><path d="M9.5 15.5a2.5 2.5 0 1 0 .7-1.8M9.5 12.5v1.9h1.9"/>'),
  ai: svg('<path d="M12 3l1.9 4.8L19 9.7l-4.8 1.9L12 16.4l-1.9-4.8L5 9.7l5.1-1.9Z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9Z"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
  admins: I.shield,
  agent: svg('<rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 3v4M9 12h.01M15 12h.01M9.5 16h5"/>')
};
const TABS = [['dash','داشبۆرد'],['agent','یاریدەدەری Claude'],['chat','چاتی ڕاستەوخۆ'],['deposits','پارەدانەکان'],['orders','فرۆشتنەکان'],['subs','بەشداربوونەکان'],['products','بەرهەمەکان'],['bundles','پاکێجەکان'],['coupons','کوپۆن و کۆدی دیاری'],['customers','کڕیارەکان و باڵانس'],['payments','ڕێگاکانی پارەدان'],['visitors','سەردانیکەران'],['writer','نووسین و ناردن'],['ai','یاریدەدەری AI'],['texts','دەقەکانی سایت'],['settings','ڕێکخستنی سایت'],['backups','باکئەپ'],['admins','ئەدمینەکان']];
const stDep = {pending:'چاوەڕوان',approved:'پەسەندکرا',rejected:'ڕەتکرایەوە'};
const stOrd = {processing:'چاوەڕوانی گەیاندن',delivered:'گەیەندرا',cancelled:'هەڵوەشێنرایەوە',refunded:'پارە گەڕێنرایەوە'};
const PAY_LOGOS = {
  fib:'https://play-lh.googleusercontent.com/BzofwPzJamQoWAfxMNoNIZXbGYsCCnWTcjhpBqpjruSb0lwP9pjCc5tql1DG9xwqM66GuJ01FM7B3rVhHHx5aw=s256',
  fastpay:'https://play-lh.googleusercontent.com/k9IY0w3aMVFclmH_spseyfbmyOXtMqzNs_AeutUsa31adul0ucZxOEZZPJyTGeoAAvWrLPC51L0ag6kFiF-i=s256',
  superqi:'https://play-lh.googleusercontent.com/dgXKvaa3QjdWzzVvZK-14CwH0tixOtWmuOKP8GmwLMjpoK10_G3_9dHLAUK1LJ_RCaewbZMrm5oidvQRam2_Dw=s256',
  asia:'https://play-lh.googleusercontent.com/BLyGhGyTLvJDjxErg3TCd9KiApznm4ixZassi3GBrZ2kxWg0qLix_HDNZg0mrgbCATGoSHDfrBH6EnyJ09EwZZg=s256',
  crypto:'https://play-lh.googleusercontent.com/UTytMyLhXXlVeUEKA5T5LHu3Tymk-WhQyuSTG5ES5k0OY2-0bKFWMtK0tyLKol0LXQRKFK5g--Qjek4fjoaawxA=s256'
};
const sw = (id, on) => `<label class="sw"><input type="checkbox" id="${id}" ${on?'checked':''}><span></span></label>`;
const td = (label, html, cls='') => `<td data-l="${esc(label)}" class="${cls}"><div class="tdv">${html}</div></td>`;
const cur = ' دینار';

/* ───── Gate ───── */
function gate(msg){
  root.innerHTML = `<div class="gate"><div class="panel gate-box">
    <div class="gate-logo">${I.logo}</div>
    <h2>پانێڵی ئەدمین</h2><p class="muted" style="margin:4px 0 18px">بۆ بەڕێوەبردنی سایتەکە بچۆ ژوورەوە</p>
    ${msg ? `<div class="warn-box" style="margin-bottom:16px">${esc(msg)}</div>` : ''}
    <button class="g-btn" id="gIn">${I.google} چوونەژوورەوە بە Google</button>
    <div class="or">یان بە ئیمەیڵ</div>
    <form id="aF" style="text-align:start">
      <div class="field"><label>ئیمەیڵ</label><input class="inp ltr-inp" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label>وشەی نهێنی</label><input class="inp ltr-inp" name="password" type="password" autocomplete="current-password" required></div>
      <button class="btn btn-p btn-block btn-lg" id="aB">چوونەژوورەوە</button></form>
    <a href="/" class="muted" style="display:block;margin-top:16px;font-size:13px">گەڕانەوە بۆ سایت</a></div></div>`;
  $('#gIn').onclick = () => sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: location.origin + '/admin.html' } });
  $('#aF').onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target); const b=$('#aB'); setBusy(b,true);
    const { error } = await sb.auth.signInWithPassword({ email:String(f.get('email')).trim(), password:String(f.get('password')) }); setBusy(b,false,'چوونەژوورەوە');
    if(error) toast(errMsg(error),'bad'); };
}
async function check(){
  const { data } = await sb.auth.getSession(); A.user = data.session?.user || null;
  if(!A.user) return gate();
  const r = await sb.rpc('ra_is_admin');
  if(!r.data){ gate('ئەم ئەکاونتە (' + (A.user.email||'') + ') دەسەڵاتی ئەدمینی نییە.'); root.querySelector('.panel').insertAdjacentHTML('beforeend', `<button class="btn btn-block" style="margin-top:10px" id="so">چوونەدەرەوە</button>`); $('#so').onclick = () => sb.auth.signOut(); return; }
  shell();
}

/* ───── Shell ───── */
function shell(){
  const s = RA.settings;
  root.innerHTML = `<div class="adm">
    <aside class="side" id="side"><a class="brand" href="/" target="_blank"><span class="mark">${safeUrl(s.logo)?`<img src="${esc(s.logo)}" alt="">`:I.logo}</span><span>${esc(s.name||'Realm Academy')}</span></a>
      ${TABS.map(([k,l]) => `<a data-t="${k}">${IC[k]}<span>${l}</span><span class="cnt hidden" data-c="${k}"></span></a>`).join('')}
      <div class="grow"></div>
      <a id="thm">${I.sun}<span>ڕووناک / تاریک</span></a>
      <a href="/" target="_blank">${I.home}<span>بینینی سایت</span></a>
      <a id="out">${I.logout}<span>چوونەدەرەوە</span></a>
      <div class="muted who-mail">${esc(A.user.email||'')}</div></aside>
    <div class="side-bg" id="sideBg"></div>
    <div class="adm-main">
      <header class="mhead"><button class="icon-btn" id="menuBtn" aria-label="menu">${svg('<path d="M4 6h16M4 12h16M4 18h16"/>')}</button>
        <span class="mark sm">${I.logo}</span><b id="mTitle">داشبۆرد</b><span class="mbadge hidden" id="mBadge"></span></header>
      <main class="mainA" id="view"></main></div></div>
    <button class="bell" id="bellBtn" aria-label="ئاگادارکردنەوەکان">${svg('<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>')}<span class="bell-n hidden" id="bellN"></span></button>`;
  $('#bellBtn').onclick = e => { e.stopPropagation(); bellToggle(); };
  $$('[data-t]').forEach(a => a.onclick = () => { location.hash = a.dataset.t; closeSide(); });
  $('#out').onclick = async () => { await sb.auth.signOut(); location.reload(); };
  $('#thm').onclick = () => RA.toggleTheme();
  $('#menuBtn').onclick = () => { $('#side').classList.add('open'); $('#sideBg').classList.add('open'); };
  $('#sideBg').onclick = closeSide;
  if(!A.hc){ window.addEventListener('hashchange', go); A.hc = true; }
  go(); refreshBadges(); bellLoad(); if(!A.iv) A.iv = setInterval(() => { refreshBadges(); }, 45000);
  if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
  adminRealtime();
}
function closeSide(){ $('#side')?.classList.remove('open'); $('#sideBg')?.classList.remove('open'); }
async function refreshBadges(){
  const [d, o, c, sd, tq] = await Promise.all([
    sb.from('ra_deposits').select('id',{count:'exact',head:true}).eq('status','pending'),
    sb.from('ra_orders').select('id',{count:'exact',head:true}).eq('status','processing'),
    sb.rpc('ra_admin_unread_chats'),
    sb.rpc('ra_admin_due_subs')
  ]);
  const due = Number(sd.data)||0, tk = 0; A.dueSubs = due; A.openTickets = tk;
  const set = (k, n) => $$(`[data-c="${k}"]`).forEach(e => { e.textContent = n; e.classList.toggle('hidden', !n); });
  set('deposits', d.count||0); set('orders', o.count||0); set('chat', Number(c.data)||0); set('subs', due); set('tickets', tk);
  const tot = (d.count||0) + (o.count||0) + (Number(c.data)||0) + due + tk;
  const mb = $('#mBadge'); if(mb){ mb.textContent = tot; mb.classList.toggle('hidden', !tot); }
  document.title = (tot ? `(${tot}) ` : '') + 'پانێڵی ئەدمین';
}
function go(){
  const tkey = (location.hash.slice(1) || 'dash'); A.tab = TABS.some(x=>x[0]===tkey) ? tkey : 'dash';
  $$('[data-t]').forEach(a => a.classList.toggle('on', a.dataset.t === A.tab));
  const tl = TABS.find(x=>x[0]===A.tab); if($('#mTitle')) $('#mTitle').textContent = tl[1];
  const v = $('#view'); v.innerHTML = '<div class="sk" style="height:200px"></div>'; window.scrollTo(0,0);
  ({dash, chat, tickets, bundles, coupons, writer, backups, deposits, orders, subs, products, payments, customers, visitors, ai:aiTab, agent:agentTab, texts, settings, admins})[A.tab]().catch(e => { v.innerHTML = `<div class="warn-box">${esc(errMsg(e))}</div>`; });
}
const head = (title, extra='') => `<div class="topA"><h1>${title}</h1>${extra?`<div class="topA-x">${extra}</div>`:''}</div>`;
function bars(arr, key, cls=''){
  const max = Math.max(1, ...arr.map(x=>Number(x[key]||0)));
  return `<div class="bars ${cls}">${arr.map(x => `<div class="b" title="${esc(x.day)}: ${num(x[key])}"><i style="height:${Math.max(2, Number(x[key]||0)/max*100)}%"></i><span>${esc(String(x.day).slice(3))}</span></div>`).join('')}</div>`;
}
async function customerMap(ids){
  if(!ids.length) return {};
  const { data } = await sb.from('ra_customers').select('id,email,full_name,phone,balance').in('id', ids);
  return Object.fromEntries((data||[]).map(c=>[c.id,c]));
}

/* ───── Dashboard ───── */
async function dash(){
  const { data:s, error } = await sb.rpc('ra_admin_stats'); if(error) throw error;
  const [dq, oq, pf, low] = await Promise.all([
    sb.from('ra_deposits').select('*').eq('status','pending').order('created_at',{ascending:false}).limit(5),
    sb.from('ra_orders').select('*').order('created_at',{ascending:false}).limit(8),
    sb.rpc('ra_admin_profit'),
    lowStock()
  ]);
  const P = pf.data || {};
  const k = (ic, l, v, cls='', href='') => `<${href?`a href="${href}"`:'div'} class="kpi ${cls}"><span class="ico">${ic}</span><small>${l}</small><b class="num">${v}</b></${href?'a':'div'}>`;
  $('#view').innerHTML = head('داشبۆرد', `<button class="btn btn-p" id="qAdd">+ زیادکردنی باڵانس بۆ کڕیار</button>`) + `
    <div class="kpis">
      ${k('💰','فرۆشتنی ئەمڕۆ', num(s.sales_today)+cur + (s.orders_today?` <small class="up">${num(s.orders_today)} داواکاری</small>`:''))}
      ${k('📈','فرۆشتنی ئەم مانگە', num(s.sales_month)+cur)}
      ${k('💵','قازانجی ئەمڕۆ', num(P.profit_today||0)+cur, 'good')}
      ${k('💎','قازانجی ئەم مانگە', num(P.profit_month||0)+cur, 'good')}
      ${k('🏦','کۆی فرۆشتن', num(s.sales_total)+cur)}
      ${k('⏳','پارەدانی چاوەڕوان', num(s.pending_deposits), s.pending_deposits?'hot':'', '#deposits')}
      ${k('📦','داواکاری بۆ گەیاندن', num(s.processing_orders), s.processing_orders?'hot':'', '#orders')}
      ${k('🔄','بەشداربوونی کاتی ناردن', num(s.due_subs ?? A.dueSubs ?? 0), (s.due_subs ?? A.dueSubs)?'hot':'', '#subs')}
      ${k('👥','کڕیاران', num(s.customers) + (s.customers_today?` <small class="up">+${num(s.customers_today)}</small>`:''), '', '#customers')}
      ${k('👁️','سەردانیکەرانی ئەمڕۆ', num(s.visitors_today), '', '#visitors')}
      ${k('🟢','ئێستا لەسەر سایتن', num(s.online_now), '', '#visitors')}
      ${k('👛','کۆی باڵانسی کڕیاران', num(s.balance_total)+cur)}
      ${k('⬇️','پارەی زیادکراوی ئەمڕۆ', num(s.deposits_today||0)+cur)}
      ${k('🏧','پارەی زیادکراو (ئەم مانگە)', num(s.deposits_month)+cur)}
      ${k('↩️','پارەی گەڕێنراوە (ئەم مانگە)', num(s.refunds_month||0)+cur)}
    </div>
    <p class="muted" style="font-size:12px;margin:-8px 0 16px">🕒 ئامارەکان بە کاتی عێراق (بەغدا) هەژمار دەکرێن · سەردانی ئەدمینەکان و باڵانسی ئەدمینەکان ناژمێردرێن · فرۆشتنی گەڕێنراوە لە فرۆشتن دەردەکرێت.</p>
    ${P.cost_missing ? `<div class="warn-box" style="margin-bottom:14px">💡 بۆ ئەوەی قازانجی ڕاستەقینە ببینیت، «نرخی کڕین» بۆ ${num(P.cost_missing)} پلان دابنێ (بەرهەمەکان ← دەستکاری ← پلان و نرخ).</div>` : ''}
    ${low.length ? `<div class="panel low-panel" style="margin-bottom:16px"><h3 class="h-row">📦 کۆگای کەم <a class="link" href="#products">بەرهەمەکان</a></h3><div class="list">${low.map(v=>`<div class="item" style="padding:10px"><div class="ic">${v.n?'⚠️':'🚫'}</div><div class="grow"><b>${esc(v.pname)} — ${esc(v.name)}</b><small>${v.n ? `تەنها ${v.n} دانە ماوە` : 'کۆگا بەتاڵە — کڕینەکان دێنە لای تۆ بۆ گەیاندنی دەستی'}</small></div></div>`).join('')}</div></div>` : ''}
    ${(P.top_month||[]).length ? `<div class="panel" style="margin-bottom:16px"><h3>🏆 باشترین بەرهەمەکانی ئەم مانگە</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>بەرهەم</th><th>فرۆشتن</th><th>داهات</th><th>قازانج</th></tr></thead><tbody>${P.top_month.map(x=>`<tr><td>${esc(x.product_name)}</td><td><span class="num">${num(x.n)}</span></td><td><span class="num">${num(x.sales)}</span></td><td><span class="num" style="color:var(--ok)">${num(x.profit)}</span></td></tr>`).join('')}</tbody></table></div></div>` : ''}
    <div class="two">
      <div class="panel"><h3>فرۆشتن — 14 ڕۆژی ڕابردوو</h3>${bars(s.daily||[], 'sales')}</div>
      <div class="panel"><h3>سەردانیکەران — 14 ڕۆژ</h3>${bars(s.daily||[], 'visitors', 'gold')}</div>
    </div>
    <div class="two" style="margin-top:16px">
      <div class="panel"><h3 class="h-row">دوایین فرۆشتنەکان <a class="link" href="#orders">هەمووی</a></h3><div class="list">${(oq.data||[]).map(o=>`<div class="item"><div class="ic">📦</div><div class="grow"><b>${esc(o.product_name)} — ${esc(o.variant_name)}</b><small><span class="num">#${o.order_no}</span> · ${ago(o.created_at)} · <span class="num">${num(o.price)}</span></small></div><span class="st ${o.status}">${stOrd[o.status]}</span></div>`).join('') || '<div class="empty">هێشتا هیچ فرۆشتنێک نییە</div>'}</div></div>
      <div class="panel"><h3 class="h-row">پارەدانی چاوەڕوان <a class="link" href="#deposits">هەمووی</a></h3><div class="list">${(dq.data||[]).map(d=>`<button class="item item-btn" data-dep="${d.id}"><div class="ic">💳</div><div class="grow"><b>${esc(d.method_name)} — <span class="num">${num(d.amount)}</span></b><small>${ago(d.created_at)}</small></div><span class="st pending">پشکنین</span></button>`).join('') || '<div class="empty">✓ هیچ پارەدانێکی چاوەڕوان نییە</div>'}</div></div>
    </div>`;
  $('#qAdd').onclick = () => balanceDialog();
  $$('[data-dep]').forEach(el => el.onclick = () => openDeposit((dq.data||[]).find(x=>x.id===el.dataset.dep)));
}

/* ───── Manual balance by e-mail ───── */
async function balanceDialog(presetEmail=''){
  const { data:list } = await sb.from('ra_customers').select('email,full_name,balance').order('last_seen',{ascending:false}).limit(500);
  const m = modal(`<div class="modal-h"><h3>زیادکردن / کەمکردنەوەی باڵانس</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="field"><label>ئیمەیڵی کڕیار</label><input class="inp ltr-inp" id="bE" list="bEl" value="${esc(presetEmail)}" placeholder="name@gmail.com" autocomplete="off">
      <datalist id="bEl">${(list||[]).map(c=>`<option value="${esc(c.email)}">${esc(c.full_name||'')} — ${num(c.balance)}</option>`).join('')}</datalist>
      <small class="muted" id="bInfo"></small></div>
    <div class="seg" id="bMode"><button class="on" data-m="1">➕ زیادکردن</button><button data-m="-1">➖ کەمکردنەوە</button></div>
    <div class="field"><label>بڕ (دینار)</label><input class="inp num-inp" id="bA" type="number" inputmode="numeric" placeholder="10000">
      <div class="quick">${[5000,10000,25000,50000,100000].map(a=>`<button type="button" data-a="${a}" class="num">${num(a)}</button>`).join('')}</div></div>
    <div class="field"><label>هۆکار (ئارەزوومەندانە)</label><input class="inp" id="bN" maxlength="200" placeholder="بۆ نموونە: پارەدان بە دەست"></div>
    <button class="btn btn-p btn-lg btn-block" id="bGo">جێبەجێکردن</button>`);
  let sign = 1;
  const info = () => { const e = $('#bE', m.el).value.trim().toLowerCase(); const c = (list||[]).find(x=>String(x.email).toLowerCase()===e); $('#bInfo', m.el).innerHTML = c ? `✓ ${esc(c.full_name||'')} — باڵانسی ئێستا: <b class="num">${num(c.balance)}</b>${cur}` : (e ? 'ئەم ئیمەیڵە لە لیستدا نییە' : ''); };
  $('#bE', m.el).oninput = info; info();
  $$('#bMode button', m.el).forEach(b => b.onclick = () => { sign = Number(b.dataset.m); $$('#bMode button', m.el).forEach(x=>x.classList.toggle('on', x===b)); });
  $$('.quick button', m.el).forEach(b => b.onclick = () => { $('#bA', m.el).value = b.dataset.a; });
  $('#bGo', m.el).onclick = async e => {
    const email = $('#bE', m.el).value.trim(); const amount = Math.floor(Math.abs(Number($('#bA', m.el).value||0)));
    if(!email) return toast('ئیمەیڵ بنووسە','bad'); if(!amount) return toast('بڕ بنووسە','bad');
    const btn = e.currentTarget;
    if(!(await confirmBox('دڵنیایت؟', `${sign>0?'زیادکردنی':'کەمکردنەوەی'} ${num(amount)}${cur}\n${email}`, 'بەڵێ'))) return;
    setBusy(btn, true);
    const { data, error } = await sb.rpc('ra_admin_adjust_by_email', { p_email:email, p_delta: sign*amount, p_note: $('#bN', m.el).value });
    setBusy(btn, false, 'جێبەجێکردن');
    if(error) return toast(errMsg(error),'bad');
    toast(`✓ باڵانسی نوێ: ${num(data.balance)}${cur}`,'ok'); m.close(); if(A.tab==='customers') customers();
  };
}

/* ───── Deposits ───── */
let depFilter = 'pending';
async function deposits(){
  let q = sb.from('ra_deposits').select('*').order('created_at',{ascending:false}).limit(200);
  if(depFilter !== 'all') q = q.eq('status', depFilter);
  const { data, error } = await q; if(error) throw error;
  const cm = await customerMap([...new Set((data||[]).map(d=>d.user_id))]);
  const pendList = (data||[]).filter(d=>d.status==='pending');
  $('#view').innerHTML = head('پارەدانەکان', pendList.length > 1 ? `<button class="btn btn-ok" id="bulkOk" disabled>✓ پەسەندکردنی دیاریکراوەکان</button>` : '') + `
    <div class="tabs2">${[['pending','چاوەڕوان'],['approved','پەسەندکراو'],['rejected','ڕەتکراوە'],['all','هەمووی']].map(([k,l])=>`<button class="chip ${depFilter===k?'on':''}" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="tbl-wrap"><table class="tbl rtbl"><thead><tr><th>کڕیار</th><th>ڕێگا</th><th>بڕ</th><th>زانیاری</th><th>کات</th><th>دۆخ</th><th></th></tr></thead><tbody>
    ${(data||[]).map(d => { const c = cm[d.user_id]||{}; return `<tr>${td('کڕیار',`${d.status==='pending'&&pendList.length>1?`<input type="checkbox" class="bulk-chk" data-bk="${d.id}"> `:''}<b>${esc(c.full_name||'—')}</b><br><small class="muted ltr">${esc(c.email||'')}</small>`)}${td('ڕێگا',esc(d.method_name))}${td('بڕ',`<b class="num">${num(d.approved_amount||d.amount)}</b>${d.sent_amount?`<br><small class="muted num">${esc(d.sent_amount)}</small>`:''}`)}
      ${td('زانیاری',`<small>${d.card_code?`🔢 <span class="ltr num">${esc(d.card_code)}</span><br>`:''}${d.reference?`🧾 <span class="ltr">${esc(d.reference)}</span><br>`:''}${d.sender?`👤 ${esc(d.sender)}<br>`:''}${d.receipt_path?'🖼️ پسوڵەی هەیە':''}</small>`)}
      ${td('کات',`<small>${dt(d.created_at)}</small>`)}${td('دۆخ',`<span class="st ${d.status}">${stDep[d.status]}</span>`)}${td('',`<button class="btn btn-sm ${d.status==='pending'?'btn-p':''}" data-o="${d.id}">${d.status==='pending'?'پشکنین':'بینین'}</button>`,'act')}</tr>`; }).join('') || `<tr class="empty-row"><td colspan="7"><div class="empty">هیچ شتێک نییە</div></td></tr>`}
    </tbody></table></div>`;
  $$('[data-f]').forEach(b => b.onclick = () => { depFilter = b.dataset.f; deposits(); });
  $$('[data-o]').forEach(b => b.onclick = () => { const d = data.find(x=>x.id===b.dataset.o); openDeposit(d, cm[d.user_id]); });
  const bo = $('#bulkOk'); if(bo){
    const sel = () => $$('.bulk-chk').filter(x=>x.checked).map(x=>data.find(d=>d.id===x.dataset.bk));
    $$('.bulk-chk').forEach(x => x.onchange = () => { const l = sel(); bo.disabled = !l.length; bo.textContent = l.length ? `✓ پەسەندکردنی ${l.length} پارەدان (${num(l.reduce((a,d)=>a+Number(d.amount),0))} دینار)` : '✓ پەسەندکردنی دیاریکراوەکان'; });
    bo.onclick = async () => { const l = sel(); if(!l.length) return;
      if(!(await confirmBox('پەسەندکردنی بە کۆمەڵ', `${l.length} پارەدان بە هەمان ئەو بڕەی کڕیار نووسیویەتی پەسەند دەکرێن (کۆی ${num(l.reduce((a,d)=>a+Number(d.amount),0))} دینار). دڵنیایت پسوڵەکانت پشکنیوە؟`, 'بەڵێ، پەسەندیان بکە'))) return;
      setBusy(bo, true); let ok = 0;
      for(const d of l){ const { error } = await sb.rpc('ra_admin_review_deposit', { p_id:d.id, p_approve:true, p_amount:Number(d.amount), p_note:'' }); if(!error) ok++; }
      setBusy(bo, false); toast(`✓ ${ok} پارەدان پەسەند کران`,'ok'); refreshBadges(); deposits(); };
  }
}
async function openDeposit(d, c){
  if(!d) return;
  if(!c){ c = (await customerMap([d.user_id]))[d.user_id] || {}; }
  let img = '';
  if(d.receipt_path){ const { data } = await sb.storage.from('receipts').createSignedUrl(d.receipt_path, 600); img = data?.signedUrl || ''; }
  const pend = d.status === 'pending';
  const m = modal(`<div class="modal-h"><h3>پارەدان — ${esc(d.method_name)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <dl class="kv"><dt>کڕیار</dt><dd>${esc(c.full_name||'—')} <span class="muted ltr">${esc(c.email||'')}</span></dd>
      <dt>مۆبایل</dt><dd class="ltr">${esc(c.phone||'—')}</dd>
      <dt>باڵانسی ئێستا</dt><dd class="num">${num(c.balance)}${cur}</dd>
      <dt>بڕی داواکراو</dt><dd><b class="num">${num(d.amount)}${cur}</b> ${d.sent_amount?`<span class="muted">(${esc(d.sent_amount)})</span>`:''}</dd>
      ${d.card_code?`<dt>کۆدی کارت</dt><dd><b class="ltr num">${esc(d.card_code)}</b> <button class="btn btn-sm" data-cp="${esc(d.card_code)}">${I.copy}</button></dd>`:''}
      ${d.reference?`<dt>ژمارەی مامەڵە</dt><dd class="ltr">${esc(d.reference)}</dd>`:''}
      ${d.sender?`<dt>نێرەر</dt><dd>${esc(d.sender)}</dd>`:''}
      <dt>کات</dt><dd>${dt(d.created_at)}</dd>
      ${!pend?`<dt>دۆخ</dt><dd><span class="st ${d.status}">${stDep[d.status]}</span> ${esc(d.admin_note||'')}</dd>`:''}</dl>
    ${img ? `<a href="${esc(img)}" target="_blank" rel="noopener"><img class="rcpt" src="${esc(img)}" alt="receipt"></a><button type="button" class="btn btn-ai btn-block" id="aiR" style="margin-top:10px">✨ خوێندنەوەی پسوڵە بە AI</button><div id="aiRes"></div>` : '<div class="note-box">وێنەی پسوڵە نییە</div>'}
    ${pend ? `<div style="margin-top:16px"><div class="field"><label>ئەو بڕەی دەخرێتە سەر باڵانس (دینار)</label><input class="inp num-inp" id="apAmt" type="number" value="${d.amount}"></div>
      <div class="field"><label>تێبینی بۆ کڕیار (ئارەزوومەندانە)</label><input class="inp" id="apNote" maxlength="300" placeholder="بۆ نموونە: کۆدەکە هەڵەیە"></div>
      <div class="row-btns"><button class="btn btn-ok btn-block btn-lg" id="apOk">✓ پەسەندکردن</button><button class="btn btn-bad btn-block btn-lg" id="apNo">✕ ڕەتکردنەوە</button></div></div>` : ''}`, {wide:true});
  $$('[data-cp]', m.el).forEach(b => b.onclick = () => copyText(b.dataset.cp));
  const showAi = async r => {
    const box = $('#aiRes', m.el); if(!box || !r) return;
    const amt = Number(r.amount)||0, isIqd = !r.currency || /iqd|دینار|dinar/i.test(r.currency);
    const match = amt && isIqd ? (amt === Number(d.amount) ? 'ok' : 'bad') : '';
    let dup = [];
    const tx = String(r.txid||'').replace(/[^A-Za-z0-9-]/g,'');
    if(tx.length >= 4){
      const [q1, q2] = await Promise.all([ sb.from('ra_deposits').select('id,created_at,status').neq('id', d.id).eq('reference', tx).limit(5), sb.from('ra_deposit_ai').select('deposit_id,created_at').neq('deposit_id', d.id).eq('data->>txid', tx).limit(5) ]);
      const ids2 = (q2.data||[]).map(x=>x.deposit_id); let more = [];
      if(ids2.length){ const q3 = await sb.from('ra_deposits').select('id,created_at,status').in('id', ids2); more = q3.data || []; }
      const seen = new Set(); dup = [...(q1.data||[]), ...more].filter(x => !seen.has(x.id) && seen.add(x.id)); }
    box.innerHTML = `<div class="ai-rc ${match}"><div class="ai-rc-h">✨ ئەنجامی خوێندنەوە ${r.confidence?`<small class="muted">(${esc(String(r.confidence))})</small>`:''}</div>
      <dl class="kv">${r.amount!=null?`<dt>بڕ</dt><dd><b class="num">${num(amt)}</b> ${esc(r.currency||'')} ${match==='ok'?'<span class="st delivered">✓ وەک داواکراو</span>':match==='bad'?`<span class="st cancelled">⚠️ جیاوازە لە ${num(d.amount)}</span>`:''}</dd>`:''}
      ${r.txid?`<dt>ژمارەی مامەڵە</dt><dd class="ltr">${esc(r.txid)} ${d.reference && tx && !String(d.reference).includes(tx) ? '<span class="st cancelled">⚠️ جیاوازە لەوەی کڕیار نووسیویەتی</span>' : ''}</dd>`:''}
      ${r.date?`<dt>کات</dt><dd>${esc(r.date)}</dd>`:''}${r.sender?`<dt>نێرەر</dt><dd>${esc(r.sender)}</dd>`:''}${r.receiver?`<dt>وەرگر</dt><dd>${esc(r.receiver)}</dd>`:''}${r.app?`<dt>ئەپ</dt><dd>${esc(r.app)}</dd>`:''}</dl>
      ${dup.length?`<div class="warn-box">🚨 ئاگاداربە: ئەم ژمارەی مامەڵەیە پێشتر بەکارهاتووە (${dup.map(x=>dt(x.created_at)+' · '+stDep[x.status]).join(' | ')}) — لەوانەیە پسوڵەی دووبارە بێت!</div>`:''}
      ${r.notes?`<small class="muted">${esc(r.notes)}</small>`:''}
      ${pend && amt && isIqd && amt !== Number($('#apAmt', m.el)?.value) ? `<button class="btn btn-sm" id="aiUse">بەکارهێنانی ئەم بڕە (${num(amt)})</button>`:''}</div>`;
    const u = $('#aiUse', m.el); if(u) u.onclick = () => { $('#apAmt', m.el).value = amt; u.remove(); };
  };
  sb.from('ra_deposit_ai').select('data').eq('deposit_id', d.id).maybeSingle().then(({ data:x }) => { if(x?.data){ d.ai_data = x.data; showAi(x.data); } });
  const aiBtn = $('#aiR', m.el); if(aiBtn) aiBtn.onclick = async () => { setBusy(aiBtn, true); const r = await readReceipt(d); setBusy(aiBtn, false, '✨ خوێندنەوەی پسوڵە بە AI'); if(!r) return;
    d.ai_data = r; sb.rpc('ra_admin_set_deposit_ai', { p_id:d.id, p_data:r }); showAi(r); };
  if(!pend) return;
  const act = async (approve, btn) => {
    const amount = Math.floor(Number($('#apAmt', m.el).value||0)); const note = $('#apNote', m.el).value;
    if(approve && amount <= 0) return toast('بڕەکە دروست نییە','bad');
    if(!approve && !(await confirmBox('ڕەتکردنەوە؟','ئەم پارەدانە ڕەتدەکرێتەوە.','ڕەتکردنەوە',true))) return;
    setBusy(btn, true);
    const { error } = await sb.rpc('ra_admin_review_deposit', { p_id:d.id, p_approve:approve, p_amount:amount, p_note:note });
    setBusy(btn, false);
    if(error) return toast(errMsg(error),'bad');
    toast(approve ? `✓ ${num(amount)}${cur} خرایە سەر باڵانسی کڕیار` : 'ڕەتکرایەوە', approve?'ok':''); m.close(); refreshBadges(); go();
  };
  $('#apOk', m.el).onclick = e => act(true, e.currentTarget);
  $('#apNo', m.el).onclick = e => act(false, e.currentTarget);
}

/* ───── Orders ───── */
let ordFilter = 'processing', ordQ = '';
async function orders(){
  let q = sb.from('ra_orders').select('*').order('created_at',{ascending:false}).limit(300);
  if(ordFilter !== 'all') q = q.eq('status', ordFilter);
  const { data, error } = await q; if(error) throw error;
  const cm = await customerMap([...new Set((data||[]).map(o=>o.user_id))]);
  const vids = [...new Set((data||[]).map(o=>o.variant_id).filter(Boolean))];
  const { data:srcs } = vids.length ? await sb.from('ra_variant_sources').select('variant_id,url,usd,note').in('variant_id', vids) : { data:[] };
  A.osrc = Object.fromEntries((srcs||[]).map(x=>[x.variant_id, x]));
  const draw = () => {
    const list = (data||[]).filter(o => !ordQ || JSON.stringify([o.product_name,o.variant_name,o.order_no,cm[o.user_id]?.email,cm[o.user_id]?.full_name,o.fields]).toLowerCase().includes(ordQ.toLowerCase()));
    const total = list.filter(o=>['processing','delivered'].includes(o.status)).reduce((a,o)=>a+Number(o.price),0);
    $('#oSum').innerHTML = `${num(list.length)} داواکاری · <b class="num">${num(total)}</b>${cur}`;
    $('#oBody').innerHTML = list.map(o => { const c = cm[o.user_id]||{}; const f = Object.entries(o.fields||{}).filter(([k,v])=>v).map(([k,v])=>`<b>${esc(k)}:</b> ${esc(v)}`).join('<br>');
      return `<tr>${td('#',`<span class="num">${o.order_no}</span>`)}${td('بەرهەم',`<b>${esc(o.product_name)}</b><br><small class="muted">${esc(o.variant_name)}</small>${o.sub_parts>1?` <small class="sub-pill num">📅 ${o.parts_done}/${o.sub_parts}</small>`:''}`)}${td('کڕیار',`${esc(c.full_name||'—')}<br><small class="muted ltr">${esc(c.email||'')}</small>`)}${td('زانیاری کڕیار',`<small>${f||'—'}</small>`)}${td('نرخ',`<span class="num">${num(o.price)}</span>`)}${td('کات',`<small>${dt(o.created_at)}</small>`)}${td('دۆخ',`<span class="st ${o.status}">${stOrd[o.status]}</span>`)}
      ${td('',`${o.status==='processing' && safeUrl(A.osrc[o.variant_id]?.url) ? `<a class="btn btn-sm btn-buy" href="${esc(safeUrl(A.osrc[o.variant_id].url))}" target="_blank" rel="noopener" title="کڕین لە Plati">🛒 کڕین</a>` : ''}<button class="btn btn-sm ${o.status==='processing'?'btn-p':''}" data-o="${o.id}">${o.status==='processing'?'گەیاندن':'بینین'}</button>`,'act')}</tr>`; }).join('') || `<tr class="empty-row"><td colspan="8"><div class="empty">هیچ شتێک نییە</div></td></tr>`;
    $$('[data-o]').forEach(b => b.onclick = () => { const o = data.find(x=>x.id===b.dataset.o); openOrder(o, cm[o.user_id]||{}); });
  };
  $('#view').innerHTML = head('فرۆشتنەکان', `<label class="search">${I.search}<input id="oq" placeholder="گەڕان..." value="${esc(ordQ)}"></label>`) + `
    <div class="tabs2">${[['processing','چاوەڕوانی گەیاندن'],['delivered','گەیەندراو'],['refunded','گەڕێنراوە'],['all','هەمووی']].map(([k,l])=>`<button class="chip ${ordFilter===k?'on':''}" data-f="${k}">${l}</button>`).join('')}<span class="muted tabs-sum" id="oSum"></span></div>
    <div class="tbl-wrap"><table class="tbl rtbl"><thead><tr><th>#</th><th>بەرهەم</th><th>کڕیار</th><th>زانیاری کڕیار</th><th>نرخ</th><th>کات</th><th>دۆخ</th><th></th></tr></thead><tbody id="oBody"></tbody></table></div>`;
  $('#oq').oninput = e => { ordQ = e.target.value; draw(); };
  $$('[data-f]').forEach(b => b.onclick = () => { ordFilter = b.dataset.f; orders(); });
  draw();
}
function openOrder(o, c){
  const f = Object.entries(o.fields||{}).filter(([k,v])=>v);
  const m = modal(`<div class="modal-h"><h3>داواکاری #${o.order_no}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <dl class="kv"><dt>بەرهەم</dt><dd><b>${esc(o.product_name)}</b> — ${esc(o.variant_name)}</dd><dt>نرخ</dt><dd class="num">${num(o.price)}${cur}</dd>
    <dt>کڕیار</dt><dd>${esc(c.full_name||'—')} <span class="muted ltr">${esc(c.email||'')}</span> ${c.phone?`· <span class="ltr">${esc(c.phone)}</span>`:''}</dd>
    ${f.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)} <button class="btn btn-sm" data-cp="${esc(v)}">${I.copy}</button></dd>`).join('')}
    <dt>کات</dt><dd>${dt(o.created_at)}</dd><dt>دۆخ</dt><dd><span class="st ${o.status}">${stOrd[o.status]}</span></dd></dl>
    ${(() => { const s = A.osrc?.[o.variant_id]; if(!s || !(safeUrl(s.url) || s.note)) return ''; return `<div class="buy-box"><div><b>🛒 سەرچاوەی کڕین</b>${Number(s.usd)>0?` <span class="muted">· نرخی کڕین نزیکەی <b class="num">$${Number(s.usd).toFixed(2)}</b></span>`:''}${s.note?`<small>${esc(s.note)}</small>`:''}</div>${safeUrl(s.url)?`<a class="btn btn-p" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener">کڕین لە Plati ↗</a>`:''}</div>`; })()}
    ${o.sub_parts > 1 ? `<div class="sub-sum"><b>📅 بەشداربوون: ${o.sub_months} مانگ · ${o.sub_every>1?`هەر ${o.sub_every} مانگ جارێک`:'مانگانە'}</b>${segBar(o.sub_parts, o.parts_done)}<small>${o.parts_done} لە ${o.sub_parts} بەش نێردراوە${o.parts_done<o.sub_parts && o.status==='delivered'?` · بەشی داهاتوو: <b>${partLbl(o, o.parts_done+1)}</b> ${dueText(o)}`:''}</small>
      ${o.status==='delivered' && o.parts_done < o.sub_parts ? `<button class="btn btn-p btn-block" id="spNext" style="margin-top:10px">📤 ناردنی ${partLbl(o, o.parts_done+1)}</button>` : ''}</div>` : ''}
    ${['processing','delivered'].includes(o.status) ? `<div class="field"><label>ئەوەی کڕیار وەریدەگرێت (ئەکاونت، کۆد، لینک...)</label><textarea class="inp ltr-inp" id="dl" rows="5" placeholder="Email: ...&#10;Password: ...">${esc(o.delivery||'')}</textarea></div>
      <div class="field"><label>تێبینی (ئارەزوومەندانە)</label><input class="inp" id="dn" value="${esc(o.admin_note||'')}"></div>
      <div class="row-btns"><button class="btn btn-p btn-lg btn-block" id="dlOk">${o.status==='processing'?(o.sub_parts>1?'✓ ناردنی '+partLbl(o,1)+' بۆ کڕیار (لە چاتیش)':'✓ ناردن بۆ کڕیار (لە چاتیش)'):'پاشەکەوتکردن و ناردنەوە لە چات'}</button><button class="btn btn-bad btn-lg btn-block" id="rf">↩ گەڕاندنەوەی پارە</button></div>`
      : `<div class="note-box">${esc(o.admin_note||'')}</div>`}`, {wide:true});
  $$('[data-cp]', m.el).forEach(b => b.onclick = () => copyText(b.dataset.cp));
  const spn = $('#spNext', m.el); if(spn) spn.onclick = () => { m.close(); sendPartDialog(o, c, () => go()); };
  const ok = $('#dlOk', m.el); if(!ok) return;
  ok.onclick = async e => { const d = RA.normCred($('#dl', m.el).value.trim()); if(!d) return toast('زانیاری بەرهەمەکە بنووسە','bad'); setBusy(e.currentTarget,true);
    const { error } = await sb.rpc('ra_admin_deliver', { p_order:o.id, p_delivery:d, p_note:$('#dn', m.el).value }); if(error){ setBusy(ok,false); return toast(errMsg(error),'bad'); }
    toast('✓ نێردرا — کڕیار ئێستا دەیبینێت','ok'); m.close(); refreshBadges(); go(); };
  $('#rf', m.el).onclick = async () => { if(!(await confirmBox('گەڕاندنەوەی پارە', `${num(o.price)}${cur} دەگەڕێتەوە بۆ باڵانسی کڕیار.`, 'گەڕاندنەوە', true))) return;
    const { error } = await sb.rpc('ra_admin_refund', { p_order:o.id, p_note:$('#dn', m.el).value || 'گەڕاندنەوە' }); if(error) return toast(errMsg(error),'bad'); toast('پارەکە گەڕێنرایەوە','ok'); m.close(); refreshBadges(); go(); };
}

/* ───── Subscriptions (parts delivered over time) ───── */
const ORDKU = ['یەکەم','دووەم','سێیەم','چوارەم','پێنجەم','شەشەم','حەوتەم','هەشتەم','نۆیەم','دەیەم','یازدەیەم','دوازدەیەم'];
function partLbl(o, n){
  const every = Math.max(1, Number(o.sub_every ?? o.every) || 1), months = Number(o.sub_months ?? o.months) || n*every;
  const a = (n-1)*every + 1, b = Math.min(n*every, months);
  return every <= 1 || a === b ? 'مانگی ' + (ORDKU[a-1] || a) : `مانگەکانی ${a}–${b}`;
}
function segBar(parts, done){ return `<div class="sub-bar" style="--n:${parts}">${Array.from({length:parts},(_,i)=>`<i class="${i<done?'on':''} ${i===done-1?'cur':''}"></i>`).join('')}</div>`; }
function unlockOf(o){ return o.unlock_at || (o.next_due ? new Date(new Date(o.next_due) - 5*86400000).toISOString() : null); }
function dueText(o){
  const u = unlockOf(o); if(!u) return '';
  if(new Date(u) <= new Date()) return '<b class="req">دوگمەی داواکاری بۆ کڕیار کراوەتەوە</b>';
  const d = Math.ceil((new Date(u) - Date.now())/86400000);
  return d > 1 ? `دوگمەی کڕیار دوای ${d} ڕۆژ دەکرێتەوە` : 'دوگمەی کڕیار سبەینێ دەکرێتەوە';
}
function subGroup(o){
  if(o.parts_done >= o.sub_parts) return 'done';
  if(o.renew_requested) return 'req';
  const u = unlockOf(o); const d = u ? (new Date(u) - Date.now())/86400000 : 0;
  return d <= 1 ? 'due' : d <= 7 ? 'soon' : 'active';
}
let subFilter = 'open';
async function subs(){
  const { data, error } = await sb.from('ra_orders').select('*').eq('status','delivered').gt('sub_parts', 1).order('next_due',{ascending:true, nullsFirst:false}).limit(500);
  if(error) throw error;
  const list = (data || []).filter(o => Number(o.sub_parts) > 1); const cm = await customerMap([...new Set(list.map(o=>o.user_id))]);
  const G = { req:['🔔 داوایان کردووە','hot'], due:['⏰ کاتی ناردنیەتی','hot'], soon:['📆 لە ٧ ڕۆژی داهاتوودا',''], active:['✅ چالاک',''], done:['🏁 تەواوبوو','muted'] };
  const by = {}; list.forEach(o => (by[subGroup(o)] ||= []).push(o));
  const cnt = k => (by[k]||[]).length;
  const card = o => { const c = cm[o.user_id]||{}; const g = subGroup(o); const next = o.parts_done + 1;
    return `<div class="sub-card g-${g}"><div class="sc-h"><div class="grow"><b>${esc(o.product_name)} <span class="muted">— ${esc(o.variant_name)}</span></b><small class="muted">${esc(c.full_name||'—')} · <span class="ltr">${esc(c.email||'')}</span> · <span class="num">#${o.order_no}</span></small></div>
      <span class="sc-cnt num">${o.parts_done}/${o.sub_parts}</span></div>${segBar(o.sub_parts, o.parts_done)}
      <div class="sc-f">${g==='done' ? '<span class="muted">هەموو بەشەکان نێردران ✓</span>' : `<span>بەشی داهاتوو: <b>${partLbl(o, next)}</b> · ${o.renew_requested ? '<b class="req">🔔 کڕیار داوای کردووە</b>' : dueText(o)}</span>`}
      <span class="sc-btns">${g!=='done'?`<button class="btn btn-p btn-sm" data-sp="${o.id}">📤 ناردنی ${partLbl(o, next)}</button>`:''}<button class="btn btn-sm" data-sc="${o.user_id}">💬</button><button class="btn btn-sm" data-sh="${o.id}">🕘</button></span></div></div>`; };
  const order = subFilter === 'open' ? ['req','due','soon','active'] : ['done'];
  $('#view').innerHTML = head('بەشداربوونەکان') + `
    <div class="note-box" style="margin-bottom:14px">بۆ ئەو پلانانەی کە بە چەند بەش دەنێردرێن (بۆ نموونە 3 مانگ، مانگانە). لە «بەرهەمەکان ← پلان و نرخ» ماوە و شێوازی ناردن دیاری بکە. کڕیار خۆی لە چات داوای بەشی داهاتوو دەکات و لێرە دەردەکەوێت.</div>
    <div class="kpis kpis-4">${['req','due','soon','active'].map(k=>`<div class="kpi ${(k==='req'||k==='due')&&cnt(k)?'hot':''}"><small>${G[k][0]}</small><b class="num">${cnt(k)}</b></div>`).join('')}</div>
    <div class="tabs2"><button class="chip ${subFilter==='open'?'on':''}" data-sf="open">چالاکەکان</button><button class="chip ${subFilter==='done'?'on':''}" data-sf="done">تەواوبووەکان (${cnt('done')})</button></div>
    ${order.map(k => cnt(k) ? `<h3 class="sub-gh">${G[k][0]} <span class="num">${cnt(k)}</span></h3><div class="sub-grid">${by[k].map(card).join('')}</div>` : '').join('') || '<div class="empty"><div class="e">📅</div>هێشتا هیچ بەشداربوونێک نییە</div>'}`;
  $$('[data-sf]').forEach(b => b.onclick = () => { subFilter = b.dataset.sf; subs(); });
  $$('[data-sp]').forEach(b => b.onclick = () => { const o = list.find(x=>x.id===b.dataset.sp); sendPartDialog(o, cm[o.user_id]||{}, subs); });
  $$('[data-sc]').forEach(b => b.onclick = () => { chatSel = b.dataset.sc; location.hash = '#chat'; });
  $$('[data-sh]').forEach(b => b.onclick = () => partsHistory(list.find(x=>x.id===b.dataset.sh)));
}
async function partsHistory(o){
  const { data } = await sb.from('ra_order_parts').select('*').eq('order_id', o.id).order('part_no');
  const m = modal(`<div class="modal-h"><h3>مێژووی #${o.order_no} — ${esc(o.product_name)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    ${segBar(o.sub_parts, o.parts_done)}
    <div class="list">${(data||[]).map(x=>`<div class="item" style="align-items:flex-start"><div class="ic">📦</div><div class="grow"><b>${partLbl(o, x.part_no)} <small class="muted">${dt(x.created_at)}</small></b><pre class="mono ltr" style="white-space:pre-wrap;margin:6px 0 0">${esc(x.content)}</pre>${x.note?`<small class="muted">${esc(x.note)}</small>`:''}</div><button class="btn btn-sm" data-cpx="${x.id}">${I.copy}</button></div>`).join('') || '<div class="empty">هیچ بەشێک تۆمار نەکراوە</div>'}</div>`, {wide:true});
  $$('[data-cpx]', m.el).forEach(b => b.onclick = () => copyText((data||[]).find(x=>String(x.id)===b.dataset.cpx)?.content||''));
}
function sendPartDialog(o, c, after){
  const n = o.parts_done + 1; const lbl = partLbl(o, n);
  const m = modal(`<div class="modal-h"><h3>📤 ناردنی ${lbl}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="sub-sum"><b>${esc(o.product_name)} — ${esc(o.variant_name)}</b><small class="muted">${esc(c.full_name||'')} <span class="ltr">${esc(c.email||'')}</span> · <span class="num">#${o.order_no}</span></small>${segBar(o.sub_parts, o.parts_done)}<small>بەشی <b class="num">${n}</b> لە <b class="num">${o.sub_parts}</b> ${n>=o.sub_parts?' · <b style="color:var(--gold)">کۆتا بەش 🎉</b>':''}</small></div>
    <div class="field"><label>ئەوەی کڕیار وەریدەگرێت</label><textarea class="inp ltr-inp" id="spC" rows="5" placeholder="Email: ...&#10;Password: ...">${esc(o.delivery||'')}</textarea>
      <small class="muted">دوایین ناردن خۆکارانە نووسراوە — ئەگەر هەمان ئەکاونتە تەنها بینێرە، ئەگەر نا بیگۆڕە.</small></div>
    <div class="field"><label>تێبینی بۆ کڕیار (ئارەزوومەندانە)</label><input class="inp" id="spN" placeholder="بۆ نموونە: ${lbl} چالاک کرا ✓"></div>
    <button class="btn btn-p btn-lg btn-block" id="spGo">✓ ناردنی ${lbl} لە چات</button>`, {wide:true});
  $('#spGo', m.el).onclick = async e => {
    const content = RA.normCred($('#spC', m.el).value.trim()); if(!content) return toast('ناوەڕۆکەکە بنووسە','bad');
    setBusy(e.currentTarget, true);
    const { error } = await sb.rpc('ra_admin_deliver_part', { p_order:o.id, p_content:content, p_note:$('#spN', m.el).value.trim() });
    if(error){ setBusy(e.currentTarget, false, '✓ ناردن'); return toast(errMsg(error),'bad'); }
    toast(`✓ ${lbl} نێردرا — کڕیار لە چاتدا دەیبینێت`,'ok'); m.close(); refreshBadges(); if(after) after();
  };
}

/* ───── Products ───── */
function thumb(x){
  const u = safeUrl(x.image_url); if(!u) return esc(x.emoji||'✨');
  return x.image_fit === 'cover' ? `<img src="${esc(u)}" alt="">` : `<img class="tb-bg" src="${esc(u)}" alt=""><img class="tb-fg" src="${esc(u)}" alt="">`;
}
const NOT_XBOX = 'category_en.is.null,category_en.neq.Xbox Games';
async function inChunks(ids, fn, size=200){ const out = []; for(let i=0;i<ids.length;i+=size){ const { data } = await fn(ids.slice(i,i+size)); out.push(...(data||[])); } return out; }
async function loadProductRows(xbox){
  if(!xbox){ const r = await sb.from('ra_products').select('*, ra_variants(*)').or(NOT_XBOX).order('sort_order'); if(r.error) throw r.error; return r.data||[]; }
  const out = [];
  for(let from = 0; ; from += 1000){ const r = await sb.from('ra_products').select('*, ra_variants(*)').eq('category_en','Xbox Games').order('sort_order').order('id').range(from, from+999); if(r.error) throw r.error; out.push(...(r.data||[])); if((r.data||[]).length < 1000) break; }
  return out;
}
async function products(){
  const xbox = A.pview === 'xbox';
  const [rows, st] = await Promise.all([ loadProductRows(xbox), sb.rpc('ra_stock_counts') ]);
  A.products = rows.map(x => ({...x, variants:(x.ra_variants||[]).sort((a,b)=>a.sort_order-b.sort_order)}));
  A.stock = {}; (st.data||[]).forEach(r => A.stock[r.variant_id] = Number(r.available));
  const vids = A.products.flatMap(x => x.variants.map(v => v.id));
  const [costs, srcs] = await Promise.all([ inChunks(vids, c => sb.from('ra_variant_costs').select('variant_id,cost').in('variant_id', c)), inChunks(vids, c => sb.from('ra_variant_sources').select('variant_id,url,usd,note').in('variant_id', c)) ]);
  A.costs = Object.fromEntries(costs.map(x=>[x.variant_id, Number(x.cost)]));
  A.srcs = Object.fromEntries(srcs.map(x=>[x.variant_id, x]));
  A.products.forEach(x => x.variants.forEach(v => { v.cost = A.costs[v.id] || 0; const s = A.srcs[v.id]; v.src_url = s?.url || ''; v.src_note = s?.note || ''; v.src_usd = Number(s?.usd)||0; }));
  const rowHTML = (x,i) => `
    <div class="prow ${x.active?'':'off'}"><div class="th">${thumb(x)}</div>
      <div class="grow"><b>${esc(x.name)} ${x.featured?'⭐':''} ${x.active?'':'<span class="st cancelled">شاراوە</span>'}</b>
      <small class="muted">${x.variants.map(v=>`${esc(v.name)}: <span class="num">${num(v.price)}</span>${v.auto_deliver?` <span style="color:${(A.stock[v.id]||0)<=2?'var(--bad)':'var(--ok)'}">⚡${num(A.stock[v.id]||0)}${(A.stock[v.id]||0)<=2?' ⚠️':''}</span>`:''}${xbox && v.src_usd ? ` · <span class="muted">$${v.src_usd.toFixed(2)}</span>` : ''}`).join(' · ') || 'هیچ پلانێک نییە'}</small></div>
      <div class="acts">${xbox ? '' : `<button class="btn btn-sm" data-up="${i}" ${i===0?'disabled':''} aria-label="up">▲</button><button class="btn btn-sm" data-dn="${i}" ${i===A.products.length-1?'disabled':''} aria-label="down">▼</button>`}
      <button class="btn btn-sm" data-tg="${i}">${x.active?'شاردنەوە':'پیشاندان'}</button><button class="btn btn-sm btn-p" data-ed="${i}">دەستکاری</button></div></div>`;
  $('#view').innerHTML = head('بەرهەمەکان', `<button class="btn" id="bpBtn">💲 گۆڕینی نرخ</button><button class="btn" id="trAll">🌐 وەرگێڕانی هەموو</button><button class="btn btn-ai" id="addPAi">✨ بەرهەمی نوێ بە AI</button><button class="btn btn-p" id="addP">+ بەرهەمی نوێ</button>`) +
    `<div class="pal-row" style="margin-bottom:12px;align-items:center;gap:8px;flex-wrap:wrap"><button class="chip ${xbox?'':'on'}" data-pv="main">بەرهەمەکان</button><button class="chip ${xbox?'on':''}" data-pv="xbox">🎮 Xbox</button>${xbox ? `<input class="inp" id="pq" placeholder="گەڕان بە ناوی یاری…" style="flex:1 1 200px;max-width:320px"><span class="muted" id="pcnt" style="font-size:13px"></span>` : ''}</div>` +
    `<div class="list" id="pl">${xbox ? '' : (A.products.map(rowHTML).join('') || '<div class="empty">هیچ بەرهەمێک نییە</div>')}</div>${xbox ? '<div style="text-align:center;margin:12px 0"><button class="btn hidden" id="pMore">زیاتر</button></div>' : ''}`;
  $$('[data-pv]').forEach(b => b.onclick = () => { A.pview = b.dataset.pv; products(); });
  const bindRows = () => {
    $$('[data-ed]').forEach(b => b.onclick = () => editProduct(A.products[b.dataset.ed]));
    $$('[data-tg]').forEach(b => b.onclick = async () => { const x = A.products[b.dataset.tg]; const { error } = await sb.from('ra_products').update({ active:!x.active }).eq('id', x.id); if(error) return toast(errMsg(error),'bad'); products(); });
  };
  if(xbox){
    let shown = 100;
    const drawX = () => { const q = ($('#pq')?.value||'').trim().toLowerCase(); const idx = A.products.map((x,i)=>i).filter(i => !q || String(A.products[i].name).toLowerCase().includes(q));
      $('#pcnt').textContent = `${num(idx.length)} یاری`;
      $('#pl').innerHTML = idx.slice(0, shown).map(i => rowHTML(A.products[i], i)).join('') || '<div class="empty">هیچ یارییەک نییە</div>';
      $('#pMore').classList.toggle('hidden', idx.length <= shown); bindRows(); };
    let tm; $('#pq').oninput = () => { shown = 100; clearTimeout(tm); tm = setTimeout(drawX, 200); };
    $('#pMore').onclick = () => { shown += 100; drawX(); };
    drawX();
  }
  $('#addP').onclick = () => editProduct(null);
  $('#addPAi').onclick = () => aiProductDialog();
  $('#bpBtn').onclick = () => bulkPrice();
  $('#trAll').onclick = async e => {
    const todo = A.products.filter(needsTr);
    if(!todo.length) return toast('✓ هەموو بەرهەمەکان پێشتر وەرگێڕدراون','ok');
    const btn = e.currentTarget; btn.disabled = true; let ok = 0;
    for(const [i,x] of todo.entries()){ btn.textContent = `🌐 ${i+1}/${todo.length}...`; if(await autoTranslate(x, i>0)) ok++; else if(i===0) break; }
    toast(`✓ ${ok} بەرهەم وەرگێڕدرا`, ok?'ok':'bad'); products();
  };
  if(!xbox) bindRows();
  const move = async (i, d) => { const arr = A.products; const j = i+d; [arr[i],arr[j]] = [arr[j],arr[i]];
    await Promise.all(arr.map((x,k) => x.sort_order===k+1 ? null : sb.from('ra_products').update({ sort_order:k+1 }).eq('id', x.id))); products(); };
  $$('[data-up]').forEach(b => b.onclick = () => move(+b.dataset.up, -1));
  $$('[data-dn]').forEach(b => b.onclick = () => move(+b.dataset.dn, 1));
}
async function uploadMedia(file, folder){
  const f = await RA.compressImage(file, 1400, .9);
  const ext = f.type === 'image/svg+xml' ? 'svg' : (f.type.split('/')[1]||'png').replace('jpeg','jpg');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, f, { contentType:f.type, upsert:false, cacheControl:'31536000' });
  if(error) throw error;
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}
function imgField(id, val, label){
  return `<div class="field"><label>${label}</label><div class="img-field">
    <div class="th" id="${id}Prev">${safeUrl(val)?`<img src="${esc(val)}" alt="">`:'🖼️'}</div>
    <input class="inp ltr-inp" id="${id}" value="${esc(val||'')}" placeholder="https://... یان وێنە باربکە">
    <label class="btn btn-sm">باربکە<input type="file" accept="image/*" hidden data-upl="${id}"></label>
    <button type="button" class="btn btn-sm" data-clr="${id}" aria-label="clear">✕</button></div></div>`;
}
function bindImgFields(scope, folder, onChange){
  const prev = (id, url) => { $('#'+id+'Prev', scope).innerHTML = safeUrl(url) ? `<img src="${esc(url)}" alt="">` : '🖼️'; onChange && onChange(); };
  $$('[data-upl]', scope).forEach(inp => inp.onchange = async () => {
    const f = inp.files[0]; if(!f) return; const id = inp.dataset.upl; const lbl = inp.parentElement; lbl.firstChild.textContent = '...';
    try{ const url = await uploadMedia(f, folder); $('#'+id, scope).value = url; prev(id, url); toast('وێنەکە بارکرا ✓','ok'); }
    catch(e){ toast(errMsg(e),'bad'); } lbl.firstChild.textContent = 'باربکە';
  });
  $$('[data-clr]', scope).forEach(b => b.onclick = () => { $('#'+b.dataset.clr, scope).value=''; prev(b.dataset.clr, ''); });
  $$('.img-field input.inp', scope).forEach(i => i.addEventListener('change', () => prev(i.id, i.value.trim())));
}
function slugify(t){ return String(t||'').toLowerCase().trim().replace(/[^\w؀-ۿ]+/g,'-').replace(/^-+|-+$/g,'') || ('p-'+Date.now()); }

function editProduct(p, draft){
  const isNew = !p;
  p = p || {...{ name:'', slug:'', badge:'', emoji:'✨', image_url:'', image_fit:'contain', short:'', short_en:'', short_ar:'', category_en:'', category_ar:'', badge_en:'', badge_ar:'', description:'', description_en:'', description_ar:'', category:'', accent:'', fields:[], delivery_note:'', delivery_note_en:'', delivery_note_ar:'', active:true, featured:false, variants:[] }, ...(draft||{})};
  let vars = p.variants.map(v => ({...v})); if(!vars.length) vars.push({ name:'', name_en:'', price:0, old_price:0, auto_deliver:false, active:true });
  let flds = (Array.isArray(p.fields)?p.fields:[]).map(f=>({...f}));
  const removed = [];
  const m = modal(`<div class="modal-h"><h3>${isNew?'بەرهەمی نوێ':'دەستکاریکردنی '+esc(p.name)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="ptabs seg"><button class="on" data-pt="main">سەرەکی</button><button data-pt="plans">پلان و نرخ</button><button data-pt="en">EN / AR</button></div>
    <div data-pp="main">
      <div class="row2"><div class="field"><label>ناوی بەرهەم *</label><input class="inp" id="pN" value="${esc(p.name)}"></div>
        <div class="field"><label>نیشانە (Badge)</label><input class="inp" id="pB" value="${esc(p.badge)}" placeholder="Best Seller"></div></div>
      ${imgField('pI', p.image_url, 'وێنەی بەرهەم')}
      <div class="row2"><div class="field"><label>شێوازی پیشاندانی وێنە</label><select class="inp" id="pFit"><option value="contain" ${p.image_fit!=='cover'?'selected':''}>لۆگۆ / ئایکۆن (ناوەڕاست + باکگراوندی لێڵ)</option><option value="cover" ${p.image_fit==='cover'?'selected':''}>وێنەی تەواو (هەموو بۆشاییەکە پڕدەکاتەوە)</option></select></div>
        <div class="field"><label>پێشبینین</label><div class="pv-card" id="pPrev"></div></div></div>
      <div class="row2"><div class="field"><label>ئیمۆجی (کاتێک وێنە نییە)</label><input class="inp" id="pE" value="${esc(p.emoji)}" maxlength="8"></div>
        <div class="field"><label>پۆل</label><input class="inp" id="pC" value="${esc(p.category)}" placeholder="AI، دیزاین..."></div></div>
      <div class="field"><label>کورتە</label><input class="inp" id="pS" value="${esc(p.short)}" maxlength="200"></div>
      <div class="field"><label>وەسفی تەواو</label><textarea class="inp" id="pD" rows="4">${esc(p.description)}</textarea></div>
      <button type="button" class="btn btn-ai btn-sm" id="aiDesc" style="margin:-6px 0 14px">✨ نووسینی کورتە و وەسف بە AI</button>
      <div class="row2"><div class="field"><label>ڕەنگی تایبەت</label><div class="color-row"><input type="color" id="pA" value="${safeColor(p.accent)||'#12c48b'}"><label class="check"><input type="checkbox" id="pAx" ${p.accent?'checked':''}> بەکارهێنان</label></div></div>
        <div class="field"><label>دۆخ</label><div class="sw-row"><label class="check">${sw('pAct', p.active)} چالاک</label><label class="check">${sw('pF', p.featured)} ⭐ تایبەت</label></div></div></div>
      <div class="field"><label>ڕێنمایی دوای کڕین (بۆ کڕیار دەردەکەوێت)</label><textarea class="inp" id="pDN" rows="2" placeholder="بۆ نموونە: وشەی نهێنی مەگۆڕە...">${esc(p.delivery_note||'')}</textarea></div>
    </div>
    <div data-pp="plans" class="hidden">
      <div class="panel sub-panel"><h3 class="h-row">پلان و نرخەکان <button class="btn btn-sm" id="addV">+ پلان</button></h3>
        <div class="muted small-note">ناو · نرخ · نرخی پێشوو (ئارەزوومەندانە)<br>⚡ <b>گەیاندنی خێرا:</b> کڕیار یەکسەر ئەکاونتەکە لە چاتدا وەردەگرێت (لە کۆگاوە). &nbsp;🤝 <b>گەیاندنی تایبەت:</b> داواکاری دێتە لات و خۆت دەینێریت.</div><div id="vl"></div></div>
      <div class="panel sub-panel"><h3 class="h-row">ئەو خانانەی کڕیار پڕیان دەکاتەوە <button class="btn btn-sm" id="addF">+ خانە</button></h3>
        <div class="muted small-note">بۆ نموونە: «ئیمەیڵی ئەکاونتەکەت»</div><div id="fl"></div></div>
    </div>
    <div data-pp="en" class="hidden">
      <div class="note-box" style="margin-bottom:12px">ئەم دەقانە کاتێک کڕیار زمانی ئینگلیزی یان عەرەبی هەڵدەبژێرێت دەردەکەون. ئەگەر بەتاڵ بن، دەقی کوردی پیشان دەدرێت.</div>
      <button type="button" class="btn btn-ai btn-block" id="aiTr" style="margin-bottom:14px">✨ وەرگێڕانی هەموو بە AI بۆ ئینگلیزی و عەرەبی</button>
      <div class="two-col">
        <div><div class="lbl-sm">English</div>
          <div class="row2"><div class="field"><label>Category</label><input class="inp" dir="ltr" id="pCe" value="${esc(p.category_en||'')}"></div><div class="field"><label>Badge</label><input class="inp" dir="ltr" id="pBe" value="${esc(p.badge_en||'')}"></div></div>
          <div class="field"><label>Short description</label><input class="inp" dir="ltr" id="pSe" value="${esc(p.short_en||'')}" maxlength="200"></div>
          <div class="field"><label>Full description</label><textarea class="inp" dir="ltr" id="pDe" rows="4">${esc(p.description_en||'')}</textarea></div>
          <div class="field"><label>After-purchase note</label><textarea class="inp" dir="ltr" id="pDNe" rows="2">${esc(p.delivery_note_en||'')}</textarea></div></div>
        <div><div class="lbl-sm">العربية</div>
          <div class="row2"><div class="field"><label>الفئة</label><input class="inp" dir="rtl" id="pCa" value="${esc(p.category_ar||'')}"></div><div class="field"><label>الشارة</label><input class="inp" dir="rtl" id="pBa" value="${esc(p.badge_ar||'')}"></div></div>
          <div class="field"><label>وصف قصير</label><input class="inp" dir="rtl" id="pSa" value="${esc(p.short_ar||'')}" maxlength="200"></div>
          <div class="field"><label>الوصف الكامل</label><textarea class="inp" dir="rtl" id="pDa" rows="4">${esc(p.description_ar||'')}</textarea></div>
          <div class="field"><label>ملاحظة بعد الشراء</label><textarea class="inp" dir="rtl" id="pDNa" rows="2">${esc(p.delivery_note_ar||'')}</textarea></div></div>
      </div>
      <div id="vlEn"></div>
    </div>
    <div class="row-btns sticky-save"><button class="btn btn-p btn-lg btn-block" id="pSave">پاشەکەوتکردن</button>${!isNew?`<button class="btn btn-bad btn-lg" id="pDel">سڕینەوە</button>`:''}</div>`, {wide:true, sticky:true});
  const drawPrev = () => { const x = { image_url:$('#pI', m.el).value.trim(), image_fit:$('#pFit', m.el).value, emoji:$('#pE', m.el).value || '✨' }; $('#pPrev', m.el).innerHTML = thumb(x); };
  bindImgFields(m.el, 'products', drawPrev);
  $('#pFit', m.el).onchange = drawPrev; $('#pE', m.el).oninput = drawPrev; drawPrev();
  $$('.ptabs button', m.el).forEach(b => b.onclick = () => { $$('.ptabs button', m.el).forEach(x=>x.classList.toggle('on', x===b)); $$('[data-pp]', m.el).forEach(x=>x.classList.toggle('hidden', x.dataset.pp!==b.dataset.pt)); if(b.dataset.pt==='en') drawVEn(); });
  const drawV = () => {
    $('#vl', m.el).innerHTML = vars.map((v,i) => `<div class="vedit${v.active===false?' v-off':''}"><input class="inp" data-vn="${i}" value="${esc(v.name)}" placeholder="ناوی پلان (1 مانگ)"><input class="inp num-inp" type="number" data-vp="${i}" value="${Number(v.price)||''}" placeholder="نرخ"><input class="inp num-inp" type="number" data-vo="${i}" value="${Number(v.old_price)||''}" placeholder="نرخی پێشوو">
      <div class="dmode seg" role="group"><button type="button" class="${v.auto_deliver?'on':''}" data-dm="${i}" data-auto="1">⚡ گەیاندنی خێرا<small>ئۆتۆماتیکی لە کۆگاوە</small></button><button type="button" class="${v.auto_deliver?'':'on'}" data-dm="${i}" data-auto="0">🤝 گەیاندنی تایبەت<small>خۆت دەینێریت</small></button></div><div class="vsub vprice"><span class="vs-f"><label>💰 نرخی کڕین (بۆ قازانج)</label><input class="inp num-inp vs-days" type="number" data-vc="${i}" value="${Number(v.cost)||''}" placeholder="0" style="width:110px!important"></span>
        <span class="vs-f"><label>🔥 نرخی ئۆفەر</label><input class="inp num-inp vs-days" type="number" data-vsp="${i}" value="${Number(v.sale_price)||''}" placeholder="—" style="width:110px!important"></span>
        <span class="vs-f"><label>⏳ تا</label><input class="inp" type="datetime-local" data-vsu="${i}" value="${toLocalInput(v.sale_until)}" style="width:auto;min-width:0"></span>
        <small class="vsub-sum">${Number(v.cost)>0 && Number(v.price)>0 ? `قازانج: <b class="num">${num(Number(v.sale_price)>0&&Number(v.sale_price)<Number(v.price)?Number(v.sale_price)-Number(v.cost):Number(v.price)-Number(v.cost))}</b> دینار · ` : ''}${Number(v.sale_price)>0 ? (Number(v.sale_price)<Number(v.price) ? `🔥 ئۆفەر: <b class="num">${num(v.sale_price)}</b> لە جیاتی <s class="num">${num(v.price)}</s>${v.sale_until?' تا '+dt(v.sale_until):' (بێ کۆتایی)'} — کاتژمێری پاشگەزبوونەوە لەسەر سایت پیشان دەدرێت` : '⚠️ نرخی ئۆفەر دەبێت کەمتر بێت لە نرخی ئاسایی') : 'ئۆفەری کات‌دار: نرخی ئۆفەر و کاتی کۆتایی بنووسە'}</small></div>
      <div class="vsub"><span class="vs-f"><label>📅 ماوە</label><select class="inp" data-vm="${i}">${[[0,'یەکجار (هەمووی پێکەوە)'],[2,'2 مانگ'],[3,'3 مانگ'],[4,'4 مانگ'],[6,'6 مانگ'],[9,'9 مانگ'],[12,'12 مانگ (1 ساڵ)'],[24,'24 مانگ (2 ساڵ)']].concat([0,2,3,4,6,9,12,24].includes(Number(v.months)||0)?[]:[[v.months, v.months+' مانگ']]).map(([k,l])=>`<option value="${k}" ${Number(v.months||0)===k?'selected':''}>${l}</option>`).join('')}</select></span>
        ${Number(v.months) > 1 ? `<span class="vs-f"><label>🔁 ناردن</label><select class="inp" data-ve="${i}">${[[1,'هەموو مانگێک'],[2,'هەر 2 مانگ جارێک'],[3,'هەر 3 مانگ جارێک'],[6,'هەر 6 مانگ جارێک']].filter(([k])=>k<Number(v.months)).map(([k,l])=>`<option value="${k}" ${Math.max(1,Number(v.every)||1)===k?'selected':''}>${l}</option>`).join('')}</select></span>
        <span class="vs-f"><label>🔓 دوگمەی داواکاری دوای</label><input class="inp num-inp vs-days" type="number" min="1" max="400" data-vu="${i}" value="${Number(v.unlock_days)||''}" placeholder="${Math.max(1,Number(v.every)||1)*30-5}"><label>ڕۆژ</label></span>
        <span class="vs-f"><label>📦 بەشەکانی دواتر</label><select class="inp" data-vr2="${i}"><option value="stock" ${v.renew_mode!=='admin'?'selected':''}>خۆکارانە لە کۆگاوە (ئەگەر هەبێت)</option><option value="admin" ${v.renew_mode==='admin'?'selected':''}>من خۆم دەینێرم (نوێکردنەوەی هەمان ئەکاونت)</option></select></span>
        <small class="vsub-sum">${(()=>{ const e=Math.max(1,Number(v.every)||1), mo=Number(v.months); const n=Math.ceil(mo/e); const ud=Number(v.unlock_days)||(e*30-5); return `کڕیار <b>${n}</b> جار وەریدەگرێت: ` + Array.from({length:n},(_,k)=>partLbl({sub_every:e,sub_months:mo},k+1)).join('، ') + `<br>🔓 <b>${ud}</b> ڕۆژ دوای وەرگرتنی هەر بەشێک، دوگمەی «داواکردنی بەشی داهاتوو» بۆ کڕیار دەردەکەوێت` + (v.renew_mode==='admin' ? ' و داواکارییەکە دێتە لای تۆ.' : ' و ئەکاونتێکی نوێ لە کۆگای ئەم پلانە خۆکارانە دەنێردرێت (ئەگەر کۆگا بەتاڵ بێت، دێتە لای تۆ).'); })()}</small>` : '<small class="vsub-sum">هەمووی بە یەکجار دەنێردرێت</small>'}</div>
      <div class="vsub vsrc"><span class="vs-f" style="flex:1 1 260px"><label>🛒 لینکی کڕین (Plati)</label><input class="inp ltr-inp" data-vsrc="${i}" value="${esc(v.src_url||'')}" placeholder="https://plati.market/itm/..."></span><span class="vs-f" style="flex:1 1 200px"><label>📝 تێبینی کڕین</label><input class="inp" data-vsn="${i}" value="${esc(v.src_note||'')}" placeholder="بۆ نموونە: هەرێمی Russia هەڵبژێرە"></span>${safeUrl(v.src_url)?`<a class="btn btn-sm" href="${esc(safeUrl(v.src_url))}" target="_blank" rel="noopener">🛒 کردنەوە</a>`:''}</div>
      <span class="v-acts"><button type="button" class="btn btn-sm ${v.active===false?'btn-hid':''}" data-vh="${i}" title="${v.active===false?'شاراوەیە — کلیک بکە بۆ پیشاندان':'دیارە — کلیک بکە بۆ شاردنەوە'}">${v.active===false?'🙈 شاراوە':'👁 دیار'}</button>${v.id?`<button class="btn btn-sm" data-stk="${i}" title="کۆگا">📦 ${num(A.stock[v.id]||0)}</button>`:''}<button class="btn btn-sm btn-bad" data-vr="${i}" aria-label="remove">✕</button></span></div>`).join('');
    $$('[data-vn]', m.el).forEach(e => e.oninput = () => vars[e.dataset.vn].name = e.value);
    $$('[data-vp]', m.el).forEach(e => e.oninput = () => vars[e.dataset.vp].price = Number(e.value||0));
    $$('[data-vo]', m.el).forEach(e => e.oninput = () => vars[e.dataset.vo].old_price = Number(e.value||0));
    $$('[data-vm]', m.el).forEach(e => e.onchange = () => { const v = vars[e.dataset.vm]; v.months = Number(e.value)||0; if(!(v.every >= 1 && v.every < v.months)) v.every = 1; drawV(); });
    $$('[data-ve]', m.el).forEach(e => e.onchange = () => { vars[e.dataset.ve].every = Number(e.value)||1; drawV(); });
    $$('[data-vc]', m.el).forEach(e => e.onchange = () => { vars[e.dataset.vc].cost = Math.max(0, Math.floor(Number(e.value)||0)); drawV(); });
    $$('[data-vsp]', m.el).forEach(e => e.onchange = () => { vars[e.dataset.vsp].sale_price = Math.max(0, Math.floor(Number(e.value)||0)); drawV(); });
    $$('[data-vsu]', m.el).forEach(e => e.onchange = () => { vars[e.dataset.vsu].sale_until = fromLocalInput(e.value); drawV(); });
    $$('[data-vu]', m.el).forEach(e => e.onchange = () => { vars[e.dataset.vu].unlock_days = Math.max(0, Math.min(400, Math.floor(Number(e.value)||0))); drawV(); });
    $$('[data-vr2]', m.el).forEach(e => e.onchange = () => { vars[e.dataset.vr2].renew_mode = e.value; drawV(); });
    $$('[data-vsrc]', m.el).forEach(e => e.onchange = () => { vars[e.dataset.vsrc].src_url = e.value.trim(); drawV(); });
    $$('[data-vsn]', m.el).forEach(e => e.oninput = () => { vars[e.dataset.vsn].src_note = e.value; });
    $$('[data-dm]', m.el).forEach(b => b.onclick = () => { const v = vars[+b.dataset.dm]; v.auto_deliver = b.dataset.auto === '1'; drawV(); if(v.auto_deliver && v.id && !(A.stock[v.id] > 0)) toast('📦 بۆ گەیاندنی خێرا، ئەکاونتەکان بخەرە کۆگا (دوگمەی 📦). تا کۆگا بەتاڵ بێت، داواکاری وەک گەیاندنی تایبەت دێتە لات.'); if(v.auto_deliver && !v.id) toast('دوای پاشەکەوتکردن، لە دوگمەی 📦 ئەکاونتەکان زیاد بکە'); });
    $$('[data-vh]', m.el).forEach(b => b.onclick = () => { const v = vars[+b.dataset.vh]; v.active = v.active===false; drawV(); toast(v.active ? '👁 پلانەکە دیار دەبێت — پاشەکەوتی بکە' : '🙈 پلانەکە لە سایت دەشاردرێتەوە — پاشەکەوتی بکە'); });
    $$('[data-vr]', m.el).forEach(b => b.onclick = () => { const v = vars.splice(+b.dataset.vr,1)[0]; if(v.id) removed.push(v.id); drawV(); });
    $$('[data-stk]', m.el).forEach(b => b.onclick = () => manageStock(vars[+b.dataset.stk], p.name));
  };
  const drawVEn = () => {
    $('#vlEn', m.el).innerHTML = `<div class="lbl-sm">ناوی پلانەکان — English / العربية</div>` + vars.map((v,i)=>`<div class="tr-row"><span class="tr-k">${esc(v.name||'—')}</span><input class="inp" dir="ltr" data-ven="${i}" value="${esc(v.name_en||'')}" placeholder="1 month"><input class="inp" dir="rtl" data-var="${i}" value="${esc(v.name_ar||'')}" placeholder="شهر واحد"></div>`).join('')
      + (flds.length ? `<div class="lbl-sm">خانەکانی کڕیار — English / العربية</div>` + flds.map((f,i)=>`<div class="tr-row"><span class="tr-k">${esc(f.label||'—')}</span><input class="inp" dir="ltr" data-fen="${i}" value="${esc(f.label_en||'')}"><input class="inp" dir="rtl" data-far="${i}" value="${esc(f.label_ar||'')}"></div>`).join('') : '');
    $$('[data-ven]', m.el).forEach(e => e.oninput = () => vars[e.dataset.ven].name_en = e.value);
    $$('[data-var]', m.el).forEach(e => e.oninput = () => vars[e.dataset.var].name_ar = e.value);
    $$('[data-fen]', m.el).forEach(e => e.oninput = () => flds[e.dataset.fen].label_en = e.value);
    $$('[data-far]', m.el).forEach(e => e.oninput = () => flds[e.dataset.far].label_ar = e.value);
  };
  $('#aiTr', m.el).onclick = async e => {
    const src = { name:$('#pN', m.el).value, category:$('#pC', m.el).value, badge:$('#pB', m.el).value, short:$('#pS', m.el).value, description:$('#pD', m.el).value, delivery_note:$('#pDN', m.el).value, plans:vars.map(v=>v.name), fields:flds.map(f=>f.label) };
    const btn = e.currentTarget; setBusy(btn, true);
    const j = await trProductAI(src);
    setBusy(btn, false);
    if(!j) return;
    const en = j.en, ar = j.ar;
    $('#pCe', m.el).value = en.category||''; $('#pBe', m.el).value = en.badge||''; $('#pCa', m.el).value = ar.category||''; $('#pBa', m.el).value = ar.badge||'';
    $('#pSe', m.el).value = en.short||''; $('#pDe', m.el).value = en.description||''; $('#pDNe', m.el).value = en.delivery_note||'';
    $('#pSa', m.el).value = ar.short||''; $('#pDa', m.el).value = ar.description||''; $('#pDNa', m.el).value = ar.delivery_note||'';
    vars.forEach((v,i)=>{ if(en.plans&&en.plans[i]) v.name_en = en.plans[i]; if(ar.plans&&ar.plans[i]) v.name_ar = ar.plans[i]; });
    flds.forEach((f,i)=>{ if(en.fields&&en.fields[i]) f.label_en = en.fields[i]; if(ar.fields&&ar.fields[i]) f.label_ar = ar.fields[i]; });
    drawVEn(); toast('✓ وەرگێڕدرا — پێداچوونەوەی بکە و پاشەکەوتی بکە','ok');
  };
  $('#aiDesc', m.el).onclick = async e => {
    const name = $('#pN', m.el).value.trim(); if(!name) return toast('سەرەتا ناوی بەرهەم بنووسە','bad');
    const btn = e.currentTarget; setBusy(btn, true);
    const out = await ai(`Write Kurdish (Sorani) store texts for this digital product. Return JSON {"short":"one attractive line, max 110 characters","description":"3-5 short lines explaining what the customer gets and who it is for; use line breaks; no prices"}.\nProduct: ${name}\nCategory: ${$('#pC', m.el).value}\nPlans: ${vars.map(v=>v.name+' = '+v.price+' IQD').join(', ')}\nCurrent text (improve it if present): ${$('#pS', m.el).value} / ${$('#pD', m.el).value}`, true);
    setBusy(btn, false);
    if(!out) return;
    try{ const j = parseAI(out); if(!j) throw 0; if(j.short) $('#pS', m.el).value = j.short; if(j.description) $('#pD', m.el).value = j.description; toast('✓ نووسرا — دەتوانیت دەستکاری بکەیت','ok'); }
    catch{ toast('وەڵامی AI تێکچوو، دووبارە هەوڵبدەرەوە','bad'); }
  };
  const drawF = () => {
    $('#fl', m.el).innerHTML = flds.map((f,i) => `<div class="fedit"><input class="inp" data-fl="${i}" value="${esc(f.label)}" placeholder="ناوی خانە"><label class="check">${sw('fr'+i, f.required)} پێویستە</label><button class="btn btn-sm btn-bad" data-fr="${i}" aria-label="remove">✕</button></div>`).join('') || '<div class="muted" style="font-size:13px">هیچ خانەیەک نییە</div>';
    $$('[data-fl]', m.el).forEach(e => e.oninput = () => flds[e.dataset.fl].label = e.value);
    flds.forEach((f,i) => { const c = $('#fr'+i, m.el); c.onchange = () => f.required = c.checked; });
    $$('[data-fr]', m.el).forEach(b => b.onclick = () => { flds.splice(+b.dataset.fr,1); drawF(); });
  };
  drawV(); drawF();
  $('#addV', m.el).onclick = () => { vars.push({ name:'', name_en:'', price:0, old_price:0, auto_deliver:false, active:true }); drawV(); };
  $('#addF', m.el).onclick = () => { flds.push({ label:'', required:true }); drawF(); };
  const del = $('#pDel', m.el); if(del) del.onclick = async () => {
    if(!(await confirmBox('سڕینەوەی بەرهەم', 'ئەم بەرهەمە بە تەواوی دەسڕدرێتەوە. (باشترە تەنها بیشاریتەوە)', 'سڕینەوە', true))) return;
    const { error } = await sb.from('ra_products').delete().eq('id', p.id); if(error) return toast(errMsg(error),'bad'); toast('سڕایەوە'); m.close(); products(); };
  $('#pSave', m.el).onclick = async e => {
    const name = $('#pN', m.el).value.trim(); if(!name) return toast('ناوی بەرهەم بنووسە','bad');
    const cleanVars = vars.filter(v => String(v.name||'').trim());
    if(!cleanVars.length) return toast('لانیکەم یەک پلان زیاد بکە (بەشی «پلان و نرخ»)','bad');
    if(cleanVars.some(v => !(v.price >= 0))) return toast('نرخەکە دروست نییە','bad');
    const row = { name, badge:$('#pB', m.el).value.trim(), emoji:$('#pE', m.el).value.trim()||'✨', category:$('#pC', m.el).value.trim(), image_url:$('#pI', m.el).value.trim(), image_fit:$('#pFit', m.el).value,
      short:$('#pS', m.el).value.trim(), description:$('#pD', m.el).value, accent:$('#pAx', m.el).checked ? $('#pA', m.el).value : '', active:$('#pAct', m.el).checked, featured:$('#pF', m.el).checked,
      category_en:$('#pCe', m.el).value.trim(), badge_en:$('#pBe', m.el).value.trim(), category_ar:$('#pCa', m.el).value.trim(), badge_ar:$('#pBa', m.el).value.trim(),
      short_en:$('#pSe', m.el).value.trim(), description_en:$('#pDe', m.el).value, delivery_note_en:$('#pDNe', m.el).value,
      short_ar:$('#pSa', m.el).value.trim(), description_ar:$('#pDa', m.el).value, delivery_note_ar:$('#pDNa', m.el).value,
      fields: flds.filter(f=>String(f.label||'').trim()).map(f=>({ label:f.label.trim(), label_en:String(f.label_en||'').trim(), label_ar:String(f.label_ar||'').trim(), required:!!f.required })), delivery_note:$('#pDN', m.el).value };
    const btn = e.currentTarget; setBusy(btn, true);
    try{
      let pid = p.id;
      if(isNew){ row.slug = slugify(name) + '-' + Math.random().toString(36).slice(2,5); row.sort_order = A.products.length + 1;
        const r = await sb.from('ra_products').insert(row).select('id').single(); if(r.error) throw r.error; pid = r.data.id; }
      else { const r = await sb.from('ra_products').update(row).eq('id', pid); if(r.error) throw r.error; }
      for(const id of removed){ const r = await sb.from('ra_variants').delete().eq('id', id); if(r.error) throw r.error; }
      for(const [i,v] of cleanVars.entries()){
        const vr = { product_id:pid, name:String(v.name).trim(), name_en:String(v.name_en||'').trim(), name_ar:String(v.name_ar||'').trim(), price:Math.floor(v.price), old_price:Math.floor(v.old_price||0), auto_deliver:!!v.auto_deliver, months:Math.max(0, Number(v.months)||0), every:Math.max(1, Number(v.every)||1), unlock_days:Math.max(0, Number(v.unlock_days)||0), renew_mode:v.renew_mode==='admin'?'admin':'stock', sale_price:Math.max(0, Math.floor(Number(v.sale_price)||0)), sale_until:v.sale_until||null, active:v.active!==false, sort_order:i+1 };
        const r = v.id ? await sb.from('ra_variants').update(vr).eq('id', v.id).select('id').single() : await sb.from('ra_variants').insert(vr).select('id').single();
        if(!r.error && r.data){ const cost = Math.max(0, Math.floor(Number(v.cost)||0)); if(cost || A.costs?.[r.data.id]) await sb.from('ra_variant_costs').upsert({ variant_id:r.data.id, cost, updated_at:new Date().toISOString() });
          const su = String(v.src_url||'').trim(), sn = String(v.src_note||'').trim();
          if(su || sn) await sb.from('ra_variant_sources').upsert({ variant_id:r.data.id, url:su, note:sn, usd:Number(v.src_usd)||0, updated_at:new Date().toISOString() });
          else if(A.srcs?.[r.data.id]) await sb.from('ra_variant_sources').delete().eq('variant_id', r.data.id); }
        if(r.error) throw r.error;
      }
      toast('پاشەکەوت کرا ✓','ok'); m.close(); await products();
      const saved = A.products.find(x => x.id === pid);
      if(saved && needsTr(saved)){ toast('✨ وەرگێڕانی ئۆتۆماتیکی بۆ ئینگلیزی و عەرەبی دەستی پێکرد...'); if(await autoTranslate(saved, true)){ toast('✓ بەرهەمەکە وەرگێڕدرا بۆ ئینگلیزی و عەرەبی','ok'); products(); } }
    }catch(err){ setBusy(btn, false, 'پاشەکەوتکردن'); toast(errMsg(err),'bad'); }
  };
}
function credRow(x){
  const c = RA.parseCred(x);
  if(!RA.credFound(c)) return `<div class="cred-mini"><span class="ltr mono">${esc(String(x).slice(0,140))}</span></div>`;
  return `<div class="cred-mini">${c.email?`<span>📧 <b class="ltr">${esc(c.email)}</b></span>`:''}${c.username?`<span>👤 <b class="ltr">${esc(c.username)}</b></span>`:''}<span>🔑 <b class="ltr">${esc(c.password)}</b></span>${c.extra.length?`<span class="muted">${esc(c.extra.join(' · ').slice(0,80))}</span>`:''}</div>`;
}
async function manageStock(v, pname){
  const load = async () => (await sb.from('ra_stock').select('*').eq('variant_id', v.id).order('created_at',{ascending:false}).limit(500)).data || [];
  let rows = await load();
  const m = modal(`<div class="modal-h"><h3>کۆگا — ${esc(pname)} / ${esc(v.name)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="note-box" style="margin-bottom:12px">هەر دێڕێک = یەک ئەکاونت. هەر شێوازێک بنووسیت خۆی <b>ئیمەیڵ و پاسوۆرد</b> دەدۆزێتەوە و بە جوانی بۆ کڕیار ڕێکی دەخات، بۆ نموونە:<br><span class="ltr mono" style="font-size:12px">name@gmail.com:Pass123 · name@gmail.com | Pass123 · name@gmail.com Pass123 · user:pass</span><br>ئەگەر یەک ئەکاونت چەند دێڕی هەیە (پین، پرۆفایل...)، بە <b class="ltr">---</b> لێکیان جیا بکەرەوە.</div>
    <div class="field"><textarea class="inp ltr-inp" id="stIn" rows="6" placeholder="email1@gmail.com:password1&#10;email2@gmail.com | password2"></textarea></div>
    <div class="sw-row" style="margin-bottom:10px"><label class="check"><input type="checkbox" id="stSep"> جیاکردنەوە بە --- لە جیاتی هەر دێڕێک</label><label class="check"><input type="checkbox" id="stDet" checked> دۆزینەوەی خۆکاری ئیمەیڵ و پاسوۆرد</label></div>
    <div id="stPrev" class="st-prev hidden"></div>
    <button class="btn btn-p btn-block" id="stAdd">+ زیادکردن بۆ کۆگا</button>
    <h3 style="margin:18px 0 10px;font-size:15px" id="stH"></h3><div class="list" style="max-height:300px;overflow:auto" id="stL"></div>`, {wide:true});
  const draw = () => {
    const avail = rows.filter(r=>!r.used);
    $('#stH', m.el).innerHTML = `بەردەست: <span class="num">${num(avail.length)}</span> · فرۆشراو: <span class="num">${num(rows.length-avail.length)}</span>`;
    $('#stL', m.el).innerHTML = rows.map(r => `<div class="item" style="padding:10px"><div class="grow">${credRow(r.content)}<small>${r.used?'فرۆشراوە':'بەردەستە'} · ${dt(r.created_at)}</small></div>${r.used?'<span class="st delivered">فرۆشراوە</span>':`<button class="btn btn-sm btn-bad" data-rm="${r.id}" aria-label="remove">✕</button>`}</div>`).join('') || '<div class="empty">کۆگا بەتاڵە</div>';
    $$('[data-rm]', m.el).forEach(b => b.onclick = async () => { const { error } = await sb.from('ra_stock').delete().eq('id', b.dataset.rm).eq('used', false); if(error) return toast(errMsg(error),'bad'); rows = await load(); draw(); });
  };
  draw();
  const getItems = () => { const txt = $('#stIn', m.el).value; const sep = $('#stSep', m.el).checked; const det = $('#stDet', m.el).checked;
    return (sep ? txt.split(/\n?-{3,}\n?/) : txt.split('\n')).map(s=>s.trim()).filter(Boolean).map(x => det ? RA.normCred(x) : x); };
  const prev = () => { const items = getItems(); const box = $('#stPrev', m.el); if(!items.length){ box.classList.add('hidden'); return; }
    const ok = items.filter(x => RA.credFound(RA.parseCred(x))).length;
    box.classList.remove('hidden');
    box.innerHTML = `<div class="st-prev-h">${ok ? `✓ <b class="num">${ok}</b> ئەکاونت بە ئیمەیڵ و پاسوۆرد دۆزرایەوە` : ''}${items.length-ok ? ` · <span class="muted"><b class="num">${items.length-ok}</b> وەک خۆی (کۆد، لینک...)</span>` : ''}</div>` +
      items.slice(0,5).map(x => credRow(x)).join('') + (items.length > 5 ? `<small class="muted">+${items.length-5} ی تر...</small>` : ''); };
  $('#stIn', m.el).oninput = prev; $('#stSep', m.el).onchange = prev; $('#stDet', m.el).onchange = prev;
  $('#stAdd', m.el).onclick = async e => {
    const items = getItems();
    if(!items.length) return toast('هیچ شتێک نەنووسراوە','bad');
    setBusy(e.currentTarget, true);
    const { error } = await sb.from('ra_stock').insert(items.map(c => ({ variant_id:v.id, content:c })));
    setBusy(e.currentTarget, false, '+ زیادکردن بۆ کۆگا');
    if(error) return toast(errMsg(error),'bad');
    if(!v.auto_deliver){ await sb.from('ra_variants').update({ auto_deliver:true }).eq('id', v.id); v.auto_deliver = true; }
    toast(`✓ ${items.length} بەرهەم زیادکرا`,'ok'); $('#stIn', m.el).value=''; rows = await load(); A.stock[v.id] = rows.filter(r=>!r.used).length; draw();
  };
}

/* ───── Payment methods ───── */
async function payments(){
  const { data, error } = await sb.from('ra_payment_methods').select('*').order('sort_order'); if(error) throw error;
  A.methods = data||[];
  $('#view').innerHTML = head('ڕێگاکانی پارەدان', `<button class="btn btn-p" id="addM">+ ڕێگای نوێ</button>`) + `<div class="list">${A.methods.map((m,i)=>`
    <div class="prow ${m.active?'':'off'}"><div class="th pm-th">${safeUrl(m.logo_url)?`<img src="${esc(m.logo_url)}" alt="" referrerpolicy="no-referrer">`:esc(m.name.slice(0,3))}</div>
    <div class="grow"><b>${esc(m.name)} ${m.active?'':'<span class="st cancelled">ناچالاک</span>'}</b><small class="muted"><span class="ltr">${esc(m.account||'⚠️ ژمارە دانەنراوە')}</span> · کەمترین: <span class="num">${num(m.min_amount)}</span> ${m.currency!=='IQD'?`· 1 ${esc(m.currency)} = <span class="num">${num(m.rate)}</span> دینار`:''}</small></div>
    <div class="acts"><button class="btn btn-sm" data-tg="${i}">${m.active?'ناچالاککردن':'چالاککردن'}</button><button class="btn btn-sm btn-p" data-ed="${i}">دەستکاری</button></div></div>`).join('') || '<div class="empty">هیچ نییە</div>'}</div>`;
  $('#addM').onclick = () => editMethod(null);
  $$('[data-ed]').forEach(b => b.onclick = () => editMethod(A.methods[b.dataset.ed]));
  $$('[data-tg]').forEach(b => b.onclick = async () => { const x = A.methods[b.dataset.tg]; await sb.from('ra_payment_methods').update({ active:!x.active }).eq('id', x.id); payments(); });
}
function editMethod(x){
  const isNew = !x; x = x || { name:'', kind:'wallet', account:'', holder:'', instructions:'', logo_url:'', qr_url:'', color:'#12c48b', currency:'IQD', rate:1, min_amount:1000, needs_receipt:true, needs_code:false, active:true };
  const m = modal(`<div class="modal-h"><h3>${isNew?'ڕێگای نوێ':esc(x.name)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="row2"><div class="field"><label>ناو *</label><input class="inp" id="mN" value="${esc(x.name)}"></div>
      <div class="field"><label>جۆر</label><select class="inp" id="mK">${[['fib','FIB'],['fastpay','FastPay'],['superqi','SuperQi'],['asia','کارتی ئاسیاسێل'],['crypto','کریپتۆ'],['wallet','جزدانی تر'],['other','هیتر']].map(([k,l])=>`<option value="${k}" ${x.kind===k?'selected':''}>${l}</option>`).join('')}</select></div></div>
    <div class="row2"><div class="field"><label>ژمارە / ناونیشانی وەرگرتن</label><input class="inp ltr-inp" id="mAc" value="${esc(x.account)}"></div>
      <div class="field"><label>ناوی خاوەن / تۆڕ</label><input class="inp" id="mH" value="${esc(x.holder)}"></div></div>
    <div class="field"><label>ڕێنمایی بۆ کڕیار</label><textarea class="inp" id="mI" rows="3">${esc(x.instructions)}</textarea></div>
    <div class="two-col"><div class="field"><label>Name (English)</label><input class="inp" dir="ltr" id="mNe" value="${esc(x.name_en||'')}" placeholder="بەتاڵ = هەمان ناو"></div><div class="field"><label>الاسم (العربية)</label><input class="inp" dir="rtl" id="mNa" value="${esc(x.name_ar||'')}" placeholder="بەتاڵ = هەمان ناو"></div></div>
    <div class="two-col"><div class="field"><label>Instructions (English)</label><textarea class="inp" dir="ltr" id="mIe" rows="2">${esc(x.instructions_en||'')}</textarea></div>
      <div class="field"><label>التعليمات (العربية)</label><textarea class="inp" dir="rtl" id="mIa" rows="2">${esc(x.instructions_ar||'')}</textarea></div></div>
    <button type="button" class="btn btn-ai btn-sm" id="mTr" style="margin:-6px 0 12px">✨ وەرگێڕانی ڕێنمایی بە AI</button>
    ${imgField('mL', x.logo_url, 'لۆگۆ')}
    <button type="button" class="btn btn-sm" id="mLogoAuto" style="margin:-6px 0 12px">لۆگۆی ڕەسەنی ئەپەکە دابنێ</button>
    ${imgField('mQ', x.qr_url, 'QR کۆد (ئارەزوومەندانە)')}
    <div class="row2"><div class="field"><label>ڕەنگ</label><div class="color-row"><input type="color" id="mC" value="${safeColor(x.color)||'#12c48b'}"></div></div>
      <div class="field"><label>کەمترین بڕ (دینار)</label><input class="inp num-inp" type="number" id="mMin" value="${Number(x.min_amount)}"></div></div>
    <div class="row2"><div class="field"><label>دراو</label><input class="inp ltr-inp" id="mCur" value="${esc(x.currency)}" placeholder="IQD / USDT"></div>
      <div class="field"><label>نرخی گۆڕینەوە (1 دراو = ? دینار)</label><input class="inp num-inp" type="number" id="mR" value="${Number(x.rate)}"></div></div>
    <div class="sw-row" style="margin:6px 0 16px"><label class="check">${sw('mRc', x.needs_receipt)} پسوڵە پێویستە</label><label class="check">${sw('mCd', x.needs_code)} کۆدی کارت پێویستە</label><label class="check">${sw('mAct', x.active)} چالاک</label></div>
    <div class="row-btns"><button class="btn btn-p btn-lg btn-block" id="mS">پاشەکەوتکردن</button>${!isNew?'<button class="btn btn-bad btn-lg" id="mD">سڕینەوە</button>':''}</div>`, {wide:true, sticky:true});
  bindImgFields(m.el, 'payments');
  $('#mLogoAuto', m.el).onclick = () => { const u = PAY_LOGOS[$('#mK', m.el).value]; if(!u) return toast('بۆ ئەم جۆرە لۆگۆی ئامادە نییە — وێنە باربکە','bad'); $('#mL', m.el).value = u; $('#mLPrev', m.el).innerHTML = `<img src="${esc(u)}" alt="" referrerpolicy="no-referrer">`; };
  $('#mTr', m.el).onclick = async e => {
    const src = $('#mI', m.el).value.trim(); if(!src) return toast('سەرەتا ڕێنمایی کوردی بنووسە','bad');
    const btn = e.currentTarget; setBusy(btn, true);
    const out = await ai(`Translate these Kurdish (Sorani) payment instructions for an online store into English and Arabic. Keep numbers, names and app names unchanged. Return JSON {"en":"","ar":""}.\n\n${src}`, true);
    setBusy(btn, false); if(!out) return;
    const j = parseAI(out); if(!j) return toast('وەڵامی AI تێکچوو، دووبارە هەوڵبدەرەوە','bad');
    $('#mIe', m.el).value = j.en||''; $('#mIa', m.el).value = j.ar||''; toast('✓ وەرگێڕدرا','ok');
  };
  $('#mS', m.el).onclick = async e => {
    const row = { name:$('#mN', m.el).value.trim(), kind:$('#mK', m.el).value, account:$('#mAc', m.el).value.trim(), holder:$('#mH', m.el).value.trim(), instructions:$('#mI', m.el).value, name_en:$('#mNe', m.el).value.trim(), name_ar:$('#mNa', m.el).value.trim(), instructions_en:$('#mIe', m.el).value, instructions_ar:$('#mIa', m.el).value,
      logo_url:$('#mL', m.el).value.trim() || PAY_LOGOS[$('#mK', m.el).value] || '', qr_url:$('#mQ', m.el).value.trim(), color:$('#mC', m.el).value, min_amount:Math.max(1, Math.floor(Number($('#mMin', m.el).value||1000))),
      currency:($('#mCur', m.el).value.trim()||'IQD').toUpperCase(), rate:Math.max(0.0001, Number($('#mR', m.el).value||1)), needs_receipt:$('#mRc', m.el).checked, needs_code:$('#mCd', m.el).checked, active:$('#mAct', m.el).checked };
    if(!row.name) return toast('ناو بنووسە','bad');
    if(isNew) row.sort_order = A.methods.length + 1;
    setBusy(e.currentTarget, true);
    const r = isNew ? await sb.from('ra_payment_methods').insert(row) : await sb.from('ra_payment_methods').update(row).eq('id', x.id);
    if(r.error){ setBusy(e.currentTarget,false,'پاشەکەوتکردن'); return toast(errMsg(r.error),'bad'); }
    toast('پاشەکەوت کرا ✓','ok'); m.close(); payments();
  };
  const d = $('#mD', m.el); if(d) d.onclick = async () => { if(!(await confirmBox('سڕینەوە؟', x.name, 'سڕینەوە', true))) return; const r = await sb.from('ra_payment_methods').delete().eq('id', x.id); if(r.error) return toast(errMsg(r.error),'bad'); m.close(); payments(); };
}

/* ───── Customers ───── */
let cusQ = '';
async function customers(){
  let q = sb.from('ra_customers').select('*').order('created_at',{ascending:false}).limit(300);
  const clean = cusQ.replace(/[%,()*]/g,'');
  if(clean) q = q.or(`email.ilike.%${clean}%,full_name.ilike.%${clean}%,phone.ilike.%${clean}%`);
  const { data, error } = await q; if(error) throw error;
  const ids = (data||[]).map(c=>c.id); const { data:nts } = ids.length ? await sb.from('ra_customer_notes').select('*').in('user_id', ids) : { data:[] };
  const ntm = Object.fromEntries((nts||[]).map(x=>[x.user_id, x])); (data||[]).forEach(c => { c.tags = ntm[c.id]?.tags || []; c.admin_note = ntm[c.id]?.note || ''; });
  $('#view').innerHTML = head('کڕیارەکان و باڵانس', `<button class="btn btn-p" id="cAdd">+ زیادکردنی باڵانس بە ئیمەیڵ</button>`) + `
    <label class="search wide">${I.search}<input id="cq" placeholder="گەڕان بە ئیمەیڵ، ناو یان ژمارە..." value="${esc(cusQ)}"></label>
    <div class="tbl-wrap"><table class="tbl rtbl"><thead><tr><th>کڕیار</th><th>مۆبایل</th><th>باڵانس</th><th>چوونەژوورەوە</th><th>تۆمارکردن</th><th>دوایین سەردان</th><th></th></tr></thead><tbody>
    ${(data||[]).map(c=>`<tr class="${c.blocked?'off':''}">${td('کڕیار',`<b>${esc(c.full_name||'—')}</b> ${c.blocked?'<span class="st cancelled">ڕاگیراوە</span>':''} ${(c.tags||[]).map(t=>`<span class="sub-pill">${esc(t)}</span>`).join(' ')}<br><small class="muted ltr">${esc(c.email||'')}</small>${c.admin_note?`<br><small class="muted">📝 ${esc(c.admin_note.slice(0,60))}</small>`:''}`)}${td('مۆبایل',`<span class="ltr">${esc(c.phone||'—')}</span>`)}${td('باڵانس',`<b class="num">${num(c.balance)}</b>`)}${td('چوونەژوورەوە',esc(c.provider==='google'?'Google':'ئیمەیڵ'))}${td('تۆمارکردن',`<small>${dt(c.created_at)}</small>`)}${td('دوایین سەردان',`<small>${ago(c.last_seen)}</small>`)}${td('',`<span class="row-acts"><button class="btn btn-sm" data-b="${esc(c.email)}">± باڵانس</button><button class="btn btn-sm btn-p" data-c="${c.id}">بینین</button></span>`,'act')}</tr>`).join('') || `<tr class="empty-row"><td colspan="7"><div class="empty">هیچ کڕیارێک نییە</div></td></tr>`}
    </tbody></table></div>`;
  $('#cAdd').onclick = () => balanceDialog();
  $('#cq').oninput = e => { cusQ = e.target.value.trim(); clearTimeout(A.t); A.t = setTimeout(()=>customers().then(()=>{ const i=$('#cq'); i.focus(); i.setSelectionRange(i.value.length,i.value.length); }), 400); };
  $$('[data-b]').forEach(b => b.onclick = () => balanceDialog(b.dataset.b));
  $$('[data-c]').forEach(b => b.onclick = () => openCustomer((data||[]).find(x=>x.id===b.dataset.c)));
}
const TX_LBL = {deposit:'زیادکردنی باڵانس',purchase:'کڕین',refund:'گەڕاندنەوە',adjust:'ڕێکخستنی دەستی',gift:'کۆدی دیاری',points:'گۆڕینەوەی خاڵ'};
const TIER_LBL = { bronze:'🥉 بڕۆنز', silver:'🥈 زیو', gold:'🥇 زێڕ' };
async function openCustomer(c){
  const [o, tx, dp, tk, cf, nt] = await Promise.all([
    sb.from('ra_orders').select('*').eq('user_id', c.id).order('created_at',{ascending:false}).limit(100),
    sb.from('ra_wallet_tx').select('*').eq('user_id', c.id).order('created_at',{ascending:false}).limit(60),
    sb.from('ra_deposits').select('*').eq('user_id', c.id).order('created_at',{ascending:false}).limit(40),
    sb.from('ra_tickets').select('*').eq('user_id', c.id).order('updated_at',{ascending:false}).limit(20),
    sb.from('ra_customers').select('*').eq('id', c.id).maybeSingle(),
    sb.from('ra_customer_notes').select('*').eq('user_id', c.id).maybeSingle()
  ]);
  c = { ...(cf.data || c), admin_note: nt.data?.note || '', tags: nt.data?.tags || [] };
  const oids = (o.data||[]).map(x=>x.id); const { data:oc } = oids.length ? await sb.from('ra_order_costs').select('order_id,cost').in('order_id', oids) : { data:[] };
  const ocm = Object.fromEntries((oc||[]).map(x=>[x.order_id, Number(x.cost)]));
  const ok = (o.data||[]).filter(x=>['processing','delivered'].includes(x.status));
  const spent = ok.reduce((a,x)=>a+Number(x.price),0), profit = ok.reduce((a,x)=>a+Number(x.price)-(ocm[x.id]||0),0);
  const dep = (dp.data||[]).filter(x=>x.status==='approved').reduce((a,x)=>a+Number(x.approved_amount||0),0);
  const { data:st } = await sb.from('ra_settings').select('value').eq('key','site').maybeSingle();
  const tiers = (st?.value?.tiers && st.value.tiers.length ? st.value.tiers : [{key:'bronze',min:0,pct:0},{key:'silver',min:100000,pct:2},{key:'gold',min:300000,pct:5}]).slice().sort((a,b)=>a.min-b.min);
  const tier = tiers.filter(t=>spent>=t.min).pop() || tiers[0];
  const TAGS = ['⭐ VIP','⚠️ ئاگاداربە','🔁 کڕیاری بەردەوام','🆕 نوێ','🚫 کێشەدار'];
  let tags = Array.isArray(c.tags) ? [...c.tags] : [];
  const m = modal(`<div class="modal-h"><h3>${esc(c.full_name||c.email)} <small class="muted">${TIER_LBL[tier.key]||tier.key}</small></h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="kpis k3"><div class="kpi"><small>باڵانس</small><b class="num">${num(c.balance)}</b></div><div class="kpi"><small>کۆی کڕین</small><b class="num">${num(spent)}</b></div><div class="kpi"><small>قازانج لەم کڕیارە</small><b class="num">${num(profit)}</b></div>
      <div class="kpi"><small>ژمارەی کڕین</small><b class="num">${num(ok.length)}</b></div><div class="kpi"><small>کۆی پارەی زیادکراو</small><b class="num">${num(dep)}</b></div><div class="kpi"><small>⭐ خاڵ</small><b class="num">${num(c.points||0)}</b></div></div>
    <dl class="kv"><dt>ئیمەیڵ</dt><dd class="ltr">${esc(c.email||'')} <button class="btn btn-sm" data-cp="${esc(c.email||'')}">${I.copy}</button></dd><dt>مۆبایل</dt><dd class="ltr">${esc(c.phone||'—')}</dd><dt>تۆمارکردن</dt><dd>${dt(c.created_at)}</dd><dt>دوایین سەردان</dt><dd>${ago(c.last_seen)}</dd></dl>
    <div class="panel sub-panel"><h3>📝 تێبینی و تاگ (تەنها تۆ دەیبینیت)</h3>
      <div class="pal-row" id="cTags">${TAGS.map(t=>`<button type="button" class="chip ${tags.includes(t)?'on':''}" data-tg="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <div class="field" style="margin-top:10px"><textarea class="inp" id="cNote" rows="3" placeholder="بۆ نموونە: هەمیشە بە FIB دەدات، پێی خۆشە بە عەرەبی قسەی لەگەڵ بکەیت...">${esc(c.admin_note||'')}</textarea></div>
      <button class="btn btn-p btn-sm" id="cNoteS">پاشەکەوتکردنی تێبینی</button></div>
    <div class="row-btns" style="margin:14px 0"><button class="btn btn-p btn-block" id="cChat">💬 چات</button><button class="btn btn-block" id="cAdj">± باڵانس</button><button class="btn ${c.blocked?'btn-ok':'btn-bad'} btn-block" id="blk">${c.blocked?'لابردنی ڕاگرتن':'ڕاگرتن'}</button></div>
    <div class="seg" id="cTabs"><button class="on" data-ct="o">کڕینەکان (${(o.data||[]).length})</button><button data-ct="d">پارەدانەکان (${(dp.data||[]).length})</button><button data-ct="t">مامەڵەکان</button></div>
    <div class="list" style="max-height:320px;overflow:auto" id="cList"></div>`, {wide:true});
  const lists = {
    o: (o.data||[]).map(x=>`<div class="item" style="padding:10px"><div class="grow"><b>${esc(x.product_name)} — ${esc(x.variant_name)} <span class="num muted">#${x.order_no}</span></b><small>${dt(x.created_at)}${x.discount?` · داشکاندن ${num(x.discount)}${x.coupon_code?' ('+esc(x.coupon_code)+')':''}`:''}${x.sub_parts>1?` · 📅 ${x.parts_done}/${x.sub_parts}`:''}</small></div><b class="num">${num(x.price)}</b><span class="st ${x.status}">${stOrd[x.status]}</span></div>`).join('') || '<div class="empty">هیچ کڕینێک نییە</div>',
    d: (dp.data||[]).map(x=>`<button class="item item-btn" style="padding:10px" data-dp="${x.id}"><div class="grow"><b>${esc(x.method_name)} — <span class="num">${num(x.approved_amount||x.amount)}</span></b><small>${dt(x.created_at)}</small></div><span class="st ${x.status}">${stDep[x.status]}</span></button>`).join('') || '<div class="empty">هیچ پارەدانێک نییە</div>',
    t: (tx.data||[]).map(x=>`<div class="item" style="padding:10px"><div class="grow"><b>${esc(TX_LBL[x.kind]||x.kind)}${x.note?' · '+esc(x.note):''}</b><small>${dt(x.created_at)}</small></div><b class="num ${x.amount>0?'amt-pos':''}">${x.amount>0?'+':''}${num(x.amount)}</b></div>`).join('') || '<div class="empty">هیچ مامەڵەیەک نییە</div>',
    k: (tk.data||[]).map(x=>`<button class="item item-btn" style="padding:10px" data-tko="${x.id}"><div class="grow"><b>#${x.ticket_no} · ${esc(x.subject)}</b><small>${ago(x.updated_at)}</small></div><span class="st ${TST[x.status][1]}">${TST[x.status][0]}</span></button>`).join('') || '<div class="empty">هیچ تیکێتێک نییە</div>'
  };
  const show = k => { $('#cList', m.el).innerHTML = lists[k]; $$('[data-ct]', m.el).forEach(b=>b.classList.toggle('on', b.dataset.ct===k));
    $$('[data-dp]', m.el).forEach(b => b.onclick = () => { m.close(); openDeposit((dp.data||[]).find(x=>x.id===b.dataset.dp), c); });
    $$('[data-tko]', m.el).forEach(b => b.onclick = () => { m.close(); openTicket((tk.data||[]).find(x=>x.id===b.dataset.tko), c); }); };
  $$('[data-ct]', m.el).forEach(b => b.onclick = () => show(b.dataset.ct)); show('o');
  $$('[data-cp]', m.el).forEach(b => b.onclick = () => copyText(b.dataset.cp));
  $$('[data-tg]', m.el).forEach(b => b.onclick = () => { const t = b.dataset.tg; tags = tags.includes(t) ? tags.filter(x=>x!==t) : [...tags, t]; b.classList.toggle('on', tags.includes(t)); });
  $('#cNoteS', m.el).onclick = async e => { setBusy(e.currentTarget, true); const { error } = await sb.rpc('ra_admin_customer_note', { p_user:c.id, p_note:$('#cNote', m.el).value, p_tags:tags }); setBusy(e.currentTarget, false, 'پاشەکەوتکردنی تێبینی'); if(error) return toast(errMsg(error),'bad'); toast('✓ پاشەکەوت کرا','ok'); };
  $('#cChat', m.el).onclick = () => { m.close(); chatSel = c.id; location.hash = '#chat'; if(A.tab === 'chat') go(); };
  $('#cAdj', m.el).onclick = () => { m.close(); balanceDialog(c.email); };
  $('#blk', m.el).onclick = async () => { const { error } = await sb.rpc('ra_admin_set_blocked', { p_user:c.id, p_blocked:!c.blocked }); if(error) return toast(errMsg(error),'bad'); toast('✓'); m.close(); if(A.tab==='customers') customers(); };
}

/* ───── Visitors ───── */
let visDays = 7;
async function visitors(){
  const { data:r, error } = await sb.rpc('ra_admin_visit_report', { p_days: visDays }); if(error) throw error;
  const bar = (arr, key) => { const max = Math.max(1, ...arr.map(x=>x.c)); return arr.map(x => `<div class="hbar"><div class="hbar-t"><span class="ltr">${esc(x[key])}</span><b class="num">${num(x.c)}</b></div><div class="hbar-b"><i style="width:${x.c/max*100}%"></i></div></div>`).join('') || '<div class="muted">هیچ</div>'; };
  $('#view').innerHTML = head('سەردانیکەران', `<div class="tabs2" style="margin:0">${[[1,'ئەمڕۆ'],[7,'7 ڕۆژ'],[30,'30 ڕۆژ'],[90,'90 ڕۆژ']].map(([d,l])=>`<button class="chip ${visDays===d?'on':''}" data-d="${d}">${l}</button>`).join('')}</div>`) + `
    <div class="kpis"><div class="kpi"><span class="ico">🟢</span><small>ئێستا لەسەر سایتن</small><b class="num">${num(r.online_now)}</b></div><div class="kpi"><span class="ico">👤</span><small>سەردانیکەری جیاواز</small><b class="num">${num(r.visitors)}</b></div><div class="kpi"><span class="ico">📄</span><small>بینینی پەڕە</small><b class="num">${num(r.visits)}</b></div><div class="kpi"><span class="ico">🔐</span><small>ئەندامانی چووەژوورەوە</small><b class="num">${num(r.members)}</b></div></div>
    <div class="panel" style="margin-bottom:16px"><h3>سەردانیکەران بەپێی ڕۆژ</h3>${bars((r.daily||[]).slice(-30), 'visitors', 'gold')}</div>
    <div class="three"><div class="panel"><h3>پەڕەکان</h3>${bar(r.pages||[],'path')}</div><div class="panel"><h3>لە کوێوە هاتوون</h3>${bar(r.refs||[],'ref')}</div><div class="panel"><h3>ئامێر و وێبگەڕ</h3>${bar(r.devices||[],'device')}<hr class="hr">${bar(r.browsers||[],'browser')}</div></div>
    <div class="panel" style="margin-top:16px"><h3>دوایین سەردانەکان</h3><div class="tbl-wrap flat"><table class="tbl rtbl"><thead><tr><th>کات</th><th>پەڕە</th><th>ئامێر</th><th>سەرچاوە</th><th>بەکارهێنەر</th></tr></thead><tbody>
    ${(r.recent||[]).map(v=>`<tr>${td('کات',`<small>${ago(v.created_at)}</small>`)}${td('پەڕە',`<span class="ltr">${esc(v.path)}</span>`)}${td('ئامێر',`${esc(v.device)} · ${esc(v.browser)}`)}${td('سەرچاوە',`<span class="ltr">${esc(v.referrer||'ڕاستەوخۆ')}</span>`)}${td('بەکارهێنەر',`<small class="ltr">${esc(v.email || ('میوان ' + String(v.visitor_id).slice(0,6)))}</small>`)}</tr>`).join('')}
    </tbody></table></div></div>`;
  $$('[data-d]').forEach(b => b.onclick = () => { visDays = +b.dataset.d; visitors(); });
}

/* ───── Site texts (Kurdish + English) ───── */
const TEXT_GROUPS = [
  ['پەڕەی سەرەکی', ['announcement','hero_pill','hero_title','hero_text','hero_cta_products','hero_cta_wallet','trust_fast','trust_safe','trust_support','step1_title','step1_text','step2_title','step2_text','step3_title','step3_text','products_title','search_ph','price_from','stock_instant','stock_available']],
  ['پەڕەی بەرهەم و کڕین', ['about_product','choose_plan','delivery_instant','delivery_manual','buy_btn','insufficient_title','insufficient_text','confirm_title','success_title','success_processing']],
  ['پارەدان و جزدان', ['manual_notice','add_title','add_sub','step_method','amount_label','request_sent_title','request_sent_text','wallet_title','wallet_sub']],
  ['لۆگین', ['login_title','login_sub','register_title','register_sub','google_btn','auth_art_title','auth_art_text','terms_note','email_domain_bad']],
  ['گشتی', ['nav_home','nav_wallet','nav_orders','nav_account','nav_login','currency','footer','install_title','install_text','privacy','terms']]
];
let textLang = 'ku';
async function texts(){
  const { data } = await sb.from('ra_settings').select('value').eq('key','site').maybeSingle();
  const s = data?.value || {}; const ov = s.texts || { ku:{}, en:{}, ar:{} };
  ov.ku = ov.ku || {}; ov.en = ov.en || {}; ov.ar = ov.ar || {};
  const D = window.RA_TEXTS;
  $('#view').innerHTML = head('دەقەکانی سایت', `<button class="btn btn-p" id="tSave">پاشەکەوتکردن</button>`) + `
    <div class="note-box" style="margin-bottom:14px">هەر دەقێکی سایتەکە لێرە بگۆڕە. ئەگەر خانەیەک بەتاڵ بهێڵیتەوە، دەقە بنەڕەتییەکە (کە بە کاڵی دەردەکەوێت) بەکاردێت. بۆ ڕەنگکردنی وشەیەک لە سەردێڕدا بیخەرە نێوان <b class="ltr">**  **</b>. بۆ شاردنەوەی شریتی ڕاگەیاندن تەنها بنووسە <b>-</b>.</div>
    <div class="seg" id="tl" style="max-width:320px"><button data-l="ku" class="${textLang==='ku'?'on':''}">کوردی</button><button data-l="en" class="${textLang==='en'?'on':''}">English</button><button data-l="ar" class="${textLang==='ar'?'on':''}">العربية</button></div>
    <button class="btn btn-ai btn-sm" id="tAi" style="margin:-4px 0 14px">✨ وەرگێڕانی دەقە گۆڕدراوە کوردییەکان بۆ ئینگلیزی و عەرەبی بە AI</button>
    <div id="tForm"></div>`;
  const draw = () => {
    const dir = textLang === 'en' ? 'ltr' : 'rtl';
    $('#tForm').innerHTML = TEXT_GROUPS.map(([g, keys]) => `<div class="panel" style="margin-bottom:14px"><h3>${g}</h3>${keys.map(k => {
      const def = (D[textLang]||{})[k] || ''; const val = ov[textLang][k] || ''; const long = def.length > 60;
      return `<div class="field"><label class="muted" style="font-weight:600">${esc((D.ku[k]||k).slice(0,70))}</label>${long ? `<textarea class="inp" dir="${dir}" data-k="${k}" rows="2" placeholder="${esc(def)}">${esc(val)}</textarea>` : `<input class="inp" dir="${dir}" data-k="${k}" value="${esc(val)}" placeholder="${esc(def)}">`}</div>`; }).join('')}</div>`).join('');
    $$('#tForm [data-k]').forEach(i => i.oninput = () => { const v = i.value; if(v.trim()) ov[textLang][i.dataset.k] = v; else delete ov[textLang][i.dataset.k]; });
  };
  draw();
  $$('#tl button').forEach(b => b.onclick = () => { textLang = b.dataset.l; $$('#tl button').forEach(x=>x.classList.toggle('on', x===b)); draw(); });
  $('#tAi').onclick = async e => {
    const src = ov.ku; const keys = Object.keys(src); if(!keys.length) return toast('هێشتا هیچ دەقێکی کوردیت نەگۆڕیوە','bad');
    const btn = e.currentTarget; setBusy(btn, true);
    const out = await ai(`Translate these Kurdish (Sorani) website texts to English and Arabic. Keep **...** markers, {placeholders} and emojis. Return JSON {"en":{key:text},"ar":{key:text}} with the same keys.\n${JSON.stringify(src)}`, true);
    setBusy(btn, false); if(!out) return;
    try{ const j = parseAI(out); if(!j) throw 0; ['en','ar'].forEach(l => Object.entries(j[l]||{}).forEach(([k,v]) => { if(keys.includes(k) && v) ov[l][k] = String(v); })); draw(); toast('✓ وەرگێڕدرا — پاشەکەوتی بکە','ok'); }
    catch{ toast('وەڵامی AI تێکچوو، دووبارە هەوڵبدەرەوە','bad'); }
  };
  $('#tSave').onclick = async e => {
    const v = {...s, texts: ov};
    setBusy(e.currentTarget, true);
    const { error } = await sb.from('ra_settings').upsert({ key:'site', value:v, updated_at:new Date().toISOString() });
    setBusy(e.currentTarget, false, 'پاشەکەوتکردن');
    if(error) return toast(errMsg(error),'bad');
    try{ localStorage.removeItem('ra_settings'); }catch{}
    RA.applySettings(v); toast('✓ پاشەکەوت کرا — سایتەکە نوێ بووەوە','ok');
  };
}

/* ───── Settings ───── */
async function settings(){
  const { data } = await sb.from('ra_settings').select('value').eq('key','site').maybeSingle();
  const s = data?.value || {};
  const f = (k, l, ph='') => `<div class="field"><label>${l}</label><input class="inp" data-k="${k}" value="${esc(s[k]||'')}" placeholder="${esc(ph)}"></div>`;
  const domains = Array.isArray(s.allowed_domains) ? s.allowed_domains.join('\n') : '';
  $('#view').innerHTML = head('ڕێکخستنی سایت', `<a class="btn" href="/" target="_blank">بینینی سایت ↗</a><button class="btn btn-p" id="sS">پاشەکەوتکردن</button>`) + `
    <div class="two">
      <div class="panel"><h3>ناسنامە</h3>${f('name','ناوی سایت','Realm Academy')}${f('tagline','دروشم (لە ناونیشانی تابدا دەردەکەوێت)')}${imgField('sLogo', s.logo, 'لۆگۆ (بەتاڵی بهێڵە بۆ لۆگۆی R)')}
        <h3 style="margin-top:20px">ڕەنگەکان</h3><div class="row2"><div class="field"><label>ڕەنگی سەرەکی</label><div class="color-row"><input type="color" id="cP" value="${safeColor(s.primary)||'#12c48b'}"><span class="muted ltr" id="cPv">${esc(s.primary||'#12c48b')}</span></div></div>
        <div class="field"><label>ڕەنگی دووەم (زێڕین)</label><div class="color-row"><input type="color" id="cA" value="${safeColor(s.accent)||'#e9c46a'}"><span class="muted ltr" id="cAv">${esc(s.accent||'#e9c46a')}</span></div></div></div>
        <div class="field"><label>ڕەنگە ئامادەکراوەکان</label><div class="pal-row">${[['#12c48b','#e9c46a','زمرووت'],['#7c5cff','#ffb86b','مۆر'],['#2f9bff','#ffd166','شین'],['#ff4d6d','#ffd6a5','سوور'],['#f59e0b','#fde68a','زێڕ'],['#14b8a6','#f472b6','فیرۆزەیی']].map(([p,a,n])=>`<button class="btn btn-sm" data-pal="${p},${a}"><span class="dotc" style="background:${p}"></span><span class="dotc" style="background:${a}"></span>${n}</button>`).join('')}</div></div></div>
      <div class="panel"><h3>پەیوەندی و سۆشیال میدیا</h3>${f('whatsapp','ژمارەی WhatsApp','07xx...')}${f('telegram','لینکی Telegram','https://t.me/...')}${f('instagram','لینکی Instagram','https://instagram.com/...')}
        <div class="note-box" style="margin-top:6px">دەقەکانی سایت (سەردێڕ، ڕاگەیاندن، دوگمەکان...) لە بەشی <a class="link" href="#texts">«دەقەکانی سایت»</a> بە کوردی و ئینگلیزی دەگۆڕدرێن.</div></div>
      <div class="panel"><h3>🏅 ئاستی کڕیاران</h3>
        <p class="muted" style="font-size:13px;margin-bottom:10px">بە پێی کۆی کڕینی کڕیار ئاستەکەی دیاری دەکرێت و داشکاندنی خۆکاری لە هەموو کڕینێک وەردەگرێت. ئەگەر کوپۆنیشی هەبێت، تەنها داشکاندنی گەورەتر دەدرێت.</p>
        ${(() => { const T = (Array.isArray(s.tiers) && s.tiers.length ? s.tiers : [{key:'bronze',min:0,pct:0},{key:'silver',min:100000,pct:2},{key:'gold',min:300000,pct:5}]); const g = k => T.find(t=>t.key===k) || {};
          return [['silver','🥈 زیو'],['gold','🥇 زێڕ']].map(([k,l]) => `<div class="row2"><div class="field"><label>${l} — لە کۆی کڕینی (دینار)</label><input class="inp num-inp" type="number" data-tmin="${k}" value="${Number(g(k).min)||''}"></div><div class="field"><label>داشکاندن (٪)</label><input class="inp num-inp" type="number" min="0" max="50" data-tpct="${k}" value="${Number(g(k).pct)||0}"></div></div>`).join(''); })()}
        <div class="note-box">⭐ <b>خاڵ:</b> هەر ١٬٠٠٠ دینار کڕین = ١ خاڵ · ١٠٠ خاڵ = ١٬٠٠٠ دینار باڵانس (کڕیار خۆی لە جزدان دەیگۆڕێتەوە).</div></div>
      <div class="panel"><h3>ئیمەیڵە ڕێگەپێدراوەکان بۆ خۆتۆمارکردن</h3>
        <p class="muted" style="font-size:13px;margin-bottom:10px">تەنها ئەم دۆمەینانە دەتوانن بە ئیمەیڵ ئەکاونت دروست بکەن (هەر دێڕێک یەک دۆمەین). چوونەژوورەوە بە Google هەمیشە کاردەکات.</p>
        <textarea class="inp ltr-inp" id="sDom" rows="8" placeholder="gmail.com&#10;outlook.com">${esc(domains)}</textarea></div>
    </div>`;
  bindImgFields($('#view'), 'site');
  const cP = $('#cP'), cA = $('#cA');
  const live = () => { $('#cPv').textContent = cP.value; $('#cAv').textContent = cA.value; RA.applySettings({...RA.settings, primary:cP.value, accent:cA.value}); };
  cP.oninput = live; cA.oninput = live;
  $$('[data-pal]').forEach(b => b.onclick = () => { const [p,a] = b.dataset.pal.split(','); cP.value = p; cA.value = a; live(); });
  $('#sS').onclick = async e => {
    const v = {...s}; $$('[data-k]').forEach(i => v[i.dataset.k] = i.value.trim());
    v.logo = $('#sLogo').value.trim(); v.primary = cP.value; v.accent = cA.value;
    v.allowed_domains = $('#sDom').value.split(/[\s,]+/).map(x=>x.trim().toLowerCase().replace(/^@/,'')).filter(x=>/^[a-z0-9.-]+\.[a-z]{2,}$/.test(x));
    if(!v.allowed_domains.length) return toast('لانیکەم یەک دۆمەین بنووسە','bad');
    const tv = k => ({ key:k, min:Math.max(1, Math.floor(Number($(`[data-tmin="${k}"]`)?.value)||0)), pct:Math.max(0, Math.min(50, Math.floor(Number($(`[data-tpct="${k}"]`)?.value)||0))) });
    const silver = tv('silver'), gold = tv('gold');
    if(gold.min <= silver.min) return toast('کۆی کڕینی ئاستی زێڕ دەبێت زیاتر بێت لە زیو','bad');
    v.tiers = [{ key:'bronze', min:0, pct:0 }, silver, gold];
    const btn = e.currentTarget; setBusy(btn, true);
    const { error } = await sb.from('ra_settings').upsert({ key:'site', value:v, updated_at:new Date().toISOString() });
    setBusy(btn, false, 'پاشەکەوتکردن');
    if(error) return toast(errMsg(error),'bad');
    try{ localStorage.removeItem('ra_settings'); }catch{}
    RA.applySettings(v); toast('✓ پاشەکەوت کرا — سایتەکە نوێ بووەوە','ok');
  };
}

/* ───── Admins ───── */
async function admins(){
  const { data, error } = await sb.rpc('ra_admin_list_admins'); if(error) throw error;
  $('#view').innerHTML = head('ئەدمینەکان') + `<div class="panel narrow-panel">
    <h3>زیادکردنی ئەدمینی نوێ</h3>
    <p class="muted" style="font-size:13px;margin-bottom:12px">ئیمەیڵەکەی بنووسە. ئەگەر هێشتا ئەکاونتی نییە، کاتێک بە هەمان ئیمەیڵ (یان Google) دەچێتە ژوورەوە خۆکارانە دەبێتە ئەدمین.</p>
    <div class="inline-form"><input class="inp ltr-inp" id="adE" type="email" placeholder="email@gmail.com"><button class="btn btn-p" id="adB">زیادکردن</button></div>
    <h3 style="margin-top:22px">لیستی ئەدمینەکان</h3>
    <div class="list">${(data||[]).map(a=>`<div class="item"><div class="ic">${a.pending?'⏳':'🛡️'}</div><div class="grow"><b class="ltr">${esc(a.email)}</b><small>${a.pending?'چاوەڕوانی یەکەم چوونەژوورەوە':'ئەدمین'} · ${dt(a.created_at)}</small></div>${a.pending?`<button class="btn btn-sm btn-bad" data-inv="${esc(a.email)}">لابردن</button>`:(a.user_id!==A.user.id?`<button class="btn btn-sm btn-bad" data-rm="${a.user_id}">لابردن</button>`:'<span class="muted">تۆ</span>')}</div>`).join('')}</div></div>`;
  $('#adB').onclick = async e => { const em = $('#adE').value.trim(); if(!em) return; const btn = e.currentTarget; setBusy(btn,true); const { data:r, error } = await sb.rpc('ra_admin_add_admin', { p_email:em }); setBusy(btn,false,'زیادکردن'); if(error) return toast(/invalid_email/.test(error.message)?'ئیمەیڵەکە دروست نییە':errMsg(error),'bad'); toast(r==='invited'?'✓ بانگهێشت کرا — کاتێک دەچێتە ژوورەوە دەبێتە ئەدمین':'✓ ئەدمین زیادکرا','ok'); admins(); };
  $$('[data-rm]').forEach(b => b.onclick = async () => { if(!(await confirmBox('لابردنی ئەدمین؟','دەسەڵاتی ئەدمینی لێ وەردەگیرێتەوە.','لابردن',true))) return; const { error } = await sb.rpc('ra_admin_remove_admin', { p_user:b.dataset.rm }); if(error) return toast(errMsg(error),'bad'); admins(); });
  $$('[data-inv]').forEach(b => b.onclick = async () => { const { error } = await sb.rpc('ra_admin_remove_invite', { p_email:b.dataset.inv }); if(error) return toast(errMsg(error),'bad'); admins(); });
}


/* ───── AI helper (DeepSeek via Supabase Edge Function) ───── */
function parseAI(txt){
  if(!txt) return null; const t = String(txt).replace(/```json|```/g,''); const a = t.indexOf('{'), b = t.lastIndexOf('}'); if(a < 0 || b < a) return null;
  const raw = t.slice(a, b+1);
  try{ return JSON.parse(raw); }catch{}
  let out = '', inStr = false, esc2 = false;
  for(const ch of raw){ if(inStr){ if(esc2){ esc2 = false; out += ch; continue; } if(ch === '\\'){ esc2 = true; out += ch; continue; } if(ch === '"'){ inStr = false; out += ch; continue; } if(ch === '\n'){ out += '\\n'; continue; } if(ch === '\r') continue; if(ch === '\t'){ out += '\\t'; continue; } out += ch; } else { if(ch === '"') inStr = true; out += ch; } }
  try{ return JSON.parse(out); }catch{ return null; }
}
function needsTr(x){
  const miss = (k) => String(x[k]||'').trim() && !(String(x[k+'_en']||'').trim() && String(x[k+'_ar']||'').trim());
  return ['short','description','category','badge','delivery_note'].some(miss) || (x.variants||[]).some(v => String(v.name||'').trim() && !(String(v.name_en||'').trim() && String(v.name_ar||'').trim())) || (Array.isArray(x.fields)?x.fields:[]).some(f => f.label && !(f.label_en && f.label_ar));
}
async function trProductAI(src, quiet=false){
  const out = await ai(`Translate this product's Kurdish (Sorani) texts into English and Arabic for an online store that sells digital accounts. Keep product/brand names unchanged (ChatGPT, Netflix...). Translate the category and badge too (short). Return JSON exactly like {"en":{"category":"","badge":"","short":"","description":"","delivery_note":"","plans":[],"fields":[]},"ar":{"category":"","badge":"","short":"","description":"","delivery_note":"","plans":[],"fields":[]}} with plans/fields arrays in the same order and length as the input. Keep line breaks. Empty input stays empty.\n\n${JSON.stringify(src)}`, true, quiet);
  if(!out) return null;
  const j = parseAI(out);
  if(!j || !j.en || !j.ar){ if(!quiet) toast('وەڵامی AI تێکچوو، دووبارە هەوڵبدەرەوە','bad'); return null; }
  return j;
}
async function autoTranslate(x, quiet=false){
  const flds = (Array.isArray(x.fields)?x.fields:[]).map(f=>({...f}));
  const vars = x.variants || [];
  const j = await trProductAI({ name:x.name, category:x.category||'', badge:x.badge||'', short:x.short||'', description:x.description||'', delivery_note:x.delivery_note||'', plans:vars.map(v=>v.name), fields:flds.map(f=>f.label) }, quiet);
  if(!j) return false;
  const pick = (cur, v) => String(cur||'').trim() ? cur : String(v||'');
  const row = {};
  for(const k of ['category','badge','short','description','delivery_note']) for(const L2 of ['en','ar']) row[k+'_'+L2] = pick(x[k+'_'+L2], j[L2][k]);
  flds.forEach((f,i) => { f.label_en = pick(f.label_en, j.en.fields?.[i]); f.label_ar = pick(f.label_ar, j.ar.fields?.[i]); });
  row.fields = flds;
  const r = await sb.from('ra_products').update(row).eq('id', x.id); if(r.error){ toast(errMsg(r.error),'bad'); return false; }
  for(const [i,v] of vars.entries()){
    const vr = { name_en: pick(v.name_en, j.en.plans?.[i]), name_ar: pick(v.name_ar, j.ar.plans?.[i]) };
    if(vr.name_en !== (v.name_en||'') || vr.name_ar !== (v.name_ar||'')) await sb.from('ra_variants').update(vr).eq('id', v.id);
  }
  return true;
}
async function ai(prompt, asJson=false, quiet=false){
  try{
    const { data, error } = await sb.functions.invoke('ai-write', { body:{ prompt, json:asJson } });
    if(error){
      let detail = {}; try{ detail = await error.context.json(); }catch{}
      if(quiet && detail.error !== 'missing_key') return null;
      if(detail.error === 'missing_key') toast('کلیلی DeepSeek هێشتا دانەنراوە (Supabase ← Edge Functions ← Secrets ← DEEPSEEK_API_KEY)','bad');
      else if(detail.error === 'ai_error') toast('DeepSeek هەڵەی دایەوە (' + (detail.status||'') + ') — کلیلەکە یان باڵانسی DeepSeek بپشکنە','bad');
      else if(detail.error === 'forbidden') toast('تەنها ئەدمین دەتوانێت AI بەکاربهێنێت','bad');
      else toast('یاریدەدەری AI ئامادە نییە (' + (detail.error || error.message || '') + ')','bad');
      return null;
    }
    return String(data?.text || '').trim() || null;
  }catch(e){ toast(errMsg(e),'bad'); return null; }
}


/* ───── AI product builder ───── */
function storeContext(){
  return (A.products||[]).map(p => `${p.name} [${p.category||''}]: ` + (p.variants||[]).map(v => `${v.name}=${v.price}`).join(', ')).join('\n');
}
async function ensureProducts(){ if(A.products && A.products.length) return; const { data } = await sb.from('ra_products').select('*, ra_variants(*)').or(NOT_XBOX).order('sort_order'); A.products = (data||[]).map(x => ({...x, variants:(x.ra_variants||[])})); }
function aiProductDialog(prefill=''){
  const m = modal(`<div class="modal-h"><h3>✨ دروستکردنی بەرهەم بە AI</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <p class="muted" style="font-size:13px;margin-bottom:10px">بە زمانی خۆت بەرهەمەکە باس بکە: ناو، پلانەکان و نرخەکان، ئەوەی کڕیار دەبێت بنووسێت و هەر زانیارییەکی تر. AI هەمووی بە کوردی، ئینگلیزی و عەرەبی ڕێکدەخات؛ پێش پاشەکەوتکردن دەیبینیت و دەستکاری دەکەیت.</p>
    <div class="field"><textarea class="inp" id="apIn" rows="6" placeholder="نموونە: Netflix Premium، پلانی 1 مانگ 7000 دینار و 3 مانگ 18000 دینار، ئەکاونتی هاوبەش 4K، کڕیار پێویست ناکات هیچ بنووسێت.">${esc(prefill)}</textarea></div>
    <button class="btn btn-ai btn-lg btn-block" id="apGo">✨ دروستی بکە</button>
    <p class="muted" style="font-size:12px;text-align:center;margin-top:8px">بەهێزترین مۆدێلی DeepSeek بیردەکاتەوە — لەوانەیە 20 بۆ 60 چرکە بخایەنێت.</p>`);
  $('#apGo', m.el).onclick = async e => {
    const desc = $('#apIn', m.el).value.trim(); if(!desc) return toast('بەرهەمەکە باس بکە','bad');
    const btn = e.currentTarget; setBusy(btn, true); await ensureProducts();
    const out = await ai(`Create a complete product for the store from the owner's description. Use ONLY facts and prices the owner gave (prices in IQD as integers; if a price is missing use 0). Write correct Kurdish Sorani as the main language, plus English and Arabic translations.
Return JSON exactly in this shape:
{"name":"brand/product name as commonly written (Latin)","badge":"very short English badge like Best Seller / 4K / Shared or empty","emoji":"one emoji","category":"short Kurdish category e.g. AI، دیزاین، ڤیدیۆ، یاری، مۆسیقا","accent":"#hex brand color",
"short":"Kurdish one line max 110 chars","description":"Kurdish 3-5 short lines with line breaks","delivery_note":"Kurdish note shown after purchase (how to use / warnings) or empty",
"short_en":"","description_en":"","delivery_note_en":"","short_ar":"","description_ar":"","delivery_note_ar":"",
"variants":[{"name":"Kurdish plan name e.g. 1 مانگ","name_en":"","name_ar":"","price":0,"old_price":0}],
"fields":[{"label":"Kurdish label of info the customer must type, e.g. ئیمەیڵی ئەکاونتەکەت","label_en":"","label_ar":"","required":true}]}
Existing store products for style reference:
${storeContext()}

Owner's description:
${desc}`, true);
    setBusy(btn, false);
    const j = parseAI(out); if(!j || !j.name){ if(out) toast('وەڵامی AI تێکچوو، دووبارە هەوڵبدەرەوە','bad'); return; }
    m.close();
    const draft = { name:String(j.name||''), badge:String(j.badge||''), emoji:String(j.emoji||'✨').slice(0,8), category:String(j.category||''), accent:/^#[0-9a-f]{3,8}$/i.test(j.accent||'')?j.accent:'',
      short:j.short||'', description:j.description||'', delivery_note:j.delivery_note||'', short_en:j.short_en||'', description_en:j.description_en||'', delivery_note_en:j.delivery_note_en||'',
      short_ar:j.short_ar||'', description_ar:j.description_ar||'', delivery_note_ar:j.delivery_note_ar||'', image_fit:'contain',
      fields:(Array.isArray(j.fields)?j.fields:[]).filter(f=>f&&f.label).map(f=>({label:String(f.label), label_en:String(f.label_en||''), label_ar:String(f.label_ar||''), required:f.required!==false})),
      variants:(Array.isArray(j.variants)?j.variants:[]).filter(v=>v&&v.name).map(v=>({name:String(v.name), name_en:String(v.name_en||''), name_ar:String(v.name_ar||''), price:Math.max(0,Math.floor(Number(v.price)||0)), old_price:Math.max(0,Math.floor(Number(v.old_price)||0)), auto_deliver:false, active:true})) };
    toast('✓ ئامادەیە — پێداچوونەوە بکە، وێنە زیاد بکە و پاشەکەوتی بکە','ok');
    editProduct(null, draft);
  };
}

/* ───── AI assistant tab ───── */
const AI_PRESETS = [
  ['📝 وەسفی بەرهەم', 'وەسفێکی کورت و سەرنجڕاکێش بە کوردیی سۆرانی بنووسە بۆ بەرهەمی: '],
  ['📣 پۆستی ئینستاگرام', 'پۆستێکی ئینستاگرامی جوان و کورت بە کوردیی سۆرانی بنووسە (لەگەڵ ئیمۆجی و هاشتاگ) بۆ ڕیکلامی: '],
  ['💬 وەڵامی کڕیار', 'وەڵامێکی ڕێزدار و کورت بە کوردیی سۆرانی بنووسە بۆ ئەم نامەیەی کڕیار: '],
  ['🌐 وەرگێڕان', 'ئەم دەقە وەربگێڕە بۆ ئینگلیزی و عەرەبی، هەر یەکە بە جیا: '],
  ['✍️ ڕاستکردنەوەی نووسین', 'ئەم دەقە کوردییە ڕاست بکەرەوە (ڕێنووس و ڕستەسازی) و جوانتری بکە، تەنها دەقە ڕاستکراوەکە بنووسە: ']
];
async function aiTab(){
  await ensureProducts();
  $('#view').innerHTML = head('یاریدەدەری AI', '<span class="muted" style="font-size:13px">DeepSeek — تەنها بۆ تۆ، هەرگیز قسە لەگەڵ کڕیار ناکات</span>') + `
    <div class="panel ai-hero"><div><b>✨ بەرهەمی نوێ بە AI</b><p class="muted">تەنها باسی بکە — ناو، وەسف، پلان، نرخ و وەرگێڕانی ئینگلیزی و عەرەبی خۆی دروست دەکات.</p></div><button class="btn btn-ai" id="aiNewP">دەستپێبکە</button></div>
    <div class="panel ai-panel">
      <div class="pal-row" style="margin-bottom:12px">${AI_PRESETS.map((p,i)=>`<button class="chip" data-pr="${i}">${esc(p[0])}</button>`).join('')}</div>
      <div class="field"><textarea class="inp" id="aiIn" rows="5" placeholder="چی بنووسم؟ بۆ نموونە: وەسفێک بۆ Netflix Premium بنووسە..."></textarea></div>
      <button class="btn btn-ai btn-lg btn-block" id="aiGo">✨ بینووسە</button>
    </div>
    <div class="panel hidden" id="aiOutP" style="margin-top:16px"><h3 class="h-row">ئەنجام <button class="btn btn-sm" id="aiCp">${I.copy} کۆپی</button></h3><div class="ai-out" id="aiOut"></div></div>`;
  $('#aiNewP').onclick = () => aiProductDialog();
  $$('[data-pr]').forEach(b => b.onclick = () => { const i = $('#aiIn'); i.value = AI_PRESETS[b.dataset.pr][1]; i.focus(); i.setSelectionRange(i.value.length, i.value.length); });
  $('#aiGo').onclick = async e => {
    const p = $('#aiIn').value.trim(); if(!p) return toast('داواکارییەکەت بنووسە','bad');
    const btn = e.currentTarget; setBusy(btn, true); const out = await ai(`Store products and prices (for context):\n${storeContext()}\n\nOwner's request:\n${p}`); setBusy(btn, false);
    if(!out) return; $('#aiOutP').classList.remove('hidden'); $('#aiOut').textContent = out; $('#aiCp').onclick = () => copyText(out);
  };
}

/* ───── Claude admin assistant (chat that can change prices / texts after approval) ───── */
const AG = { msgs:[], view:[], busy:false, att:[] };
const agB64 = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = no; r.readAsDataURL(f); });
async function agAddFiles(files){
  for(const f of [...files]){
    if(AG.att.length >= 4){ toast('زۆرترین ٤ وێنە','bad'); break; }
    if(!/^image\/(png|jpe?g|webp|gif)$/.test(f.type)){ toast('تەنها وێنە (PNG, JPG, WEBP)','bad'); continue; }
    const c = await RA.compressImage(f, 1400, .85); const url = await agB64(c);
    const m = url.match(/^data:(image\/[\w+.-]+);base64,(.*)$/); if(!m) continue;
    if(m[2].length > 3500000){ toast('وێنەکە زۆر گەورەیە','bad'); continue; }
    AG.att.push({ type:m[1], b64:m[2], url });
  }
  agDrawAtt();
}
function agDrawAtt(){ const b = $('#agAtt'); if(!b) return; b.innerHTML = AG.att.map((a,i) => `<span class="ag-th"><img src="${a.url}" alt=""><button type="button" data-agrm="${i}" title="لابردن">×</button></span>`).join(''); b.classList.toggle('hidden', !AG.att.length); $$('[data-agrm]', b).forEach(x => x.onclick = () => { AG.att.splice(Number(x.dataset.agrm), 1); agDrawAtt(); }); }
/* keep the request small: only the latest messages keep their images */
function agSlim(){ const keep = AG.msgs.length - 6; AG.msgs.forEach((m, i) => { if(i < keep && Array.isArray(m.content)) m.content = m.content.map(b => b.type === 'image' ? { type:'text', text:'[وێنە]' } : b); }); }
const AG_WRITE = { update_variant:1, update_product:1, bulk_adjust_prices:1, set_site_text:1 };
const AG_PROD_KEYS = ['name','short','short_en','short_ar','description','description_en','description_ar','badge','badge_en','badge_ar','delivery_note','delivery_note_en','delivery_note_ar','category','category_en','category_ar','active','featured','image_url'];
const agClip = (o, n=12000) => { const s = typeof o === 'string' ? o : JSON.stringify(o); return s.length > n ? s.slice(0, n) + '…(truncated)' : s; };
const agVar = v => ({ id:v.id, name:v.name, price:v.price, sale_price:v.sale_price, sale_until:v.sale_until, active:v.active });
async function agSiteSettings(){ const { data } = await sb.from('ra_settings').select('value').eq('key','site').maybeSingle(); return data?.value || {}; }
const AG_READ = {
  async search_products({ query='', category_en, limit=20 }){
    limit = Math.max(1, Math.min(50, Number(limit)||20));
    let q = sb.from('ra_products').select('id,name,slug,category,category_en,active,ra_variants(id,name,price,sale_price,sale_until,active)').order('sort_order').limit(limit);
    const w = String(query||'').trim(); if(w) q = q.ilike('name', `%${w.replace(/[%_,()]/g,' ')}%`);
    if(category_en) q = q.eq('category_en', category_en);
    const { data, error } = await q; if(error) throw error;
    return (data||[]).map(p => ({ id:p.id, name:p.name, category:p.category, category_en:p.category_en, active:p.active, variants:(p.ra_variants||[]).map(agVar) }));
  },
  async get_product({ product_id }){
    const { data, error } = await sb.from('ra_products').select('*, ra_variants(*)').eq('id', product_id).maybeSingle(); if(error) throw error; if(!data) return { error:'not found' };
    const { ra_variants, fields, ...p } = data; return { ...p, variants:(ra_variants||[]).map(v => ({...agVar(v), name_en:v.name_en, name_ar:v.name_ar})) };
  },
  async list_categories(){
    const { data } = await sb.from('ra_products').select('category,category_en').or(NOT_XBOX);
    const m = {}; (data||[]).forEach(p => { const k = (p.category_en||'') + ' | ' + (p.category||''); m[k] = (m[k]||0) + 1; });
    const { count } = await sb.from('ra_products').select('id', { count:'exact', head:true }).eq('category_en','Xbox Games');
    if(count) m['Xbox Games | یارییەکانی Xbox'] = count;
    return Object.entries(m).map(([k,n]) => ({ category:k, products:n }));
  },
  async search_site_texts({ query }){
    const D = window.RA_TEXTS || {}; const ov = (await agSiteSettings()).texts || {}; const w = String(query||'').toLowerCase().trim();
    const out = [];
    for(const k of Object.keys(D.ku || {})){
      const vals = ['ku','en','ar'].map(l => (D[l]||{})[k] || ''); const cur = ['ku','en','ar'].map(l => (ov[l]||{})[k] || '');
      if(!w || k.toLowerCase().includes(w) || vals.concat(cur).some(v => String(v).toLowerCase().includes(w))) out.push({ key:k, default_ku:vals[0], default_en:vals[1], default_ar:vals[2], override_ku:cur[0]||undefined, override_en:cur[1]||undefined, override_ar:cur[2]||undefined });
      if(out.length >= 25) break;
    }
    return out;
  }
};
/* write tools: build a preview (shown to the owner) + an apply() that runs only after approval */
async function agPrepare(name, x){
  if(name === 'update_variant'){
    const { data:v } = await sb.from('ra_variants').select('*, ra_products(name)').eq('id', x.variant_id).maybeSingle();
    if(!v) return { error:'variant not found' };
    const ch = {}; ['price','sale_price','sale_until','name','name_en','name_ar','active'].forEach(k => { if(x[k] !== undefined) ch[k] = x[k]; });
    if(ch.price != null && !(Number(ch.price) > 0)) return { error:'bad price' };
    const lines = Object.entries(ch).map(([k,val]) => `${k}: ${v[k] ?? '—'} ← ${val ?? '—'}`);
    return { title:`${v.ra_products?.name || ''} — ${v.name}`, lines, apply: async () => { const { error } = await sb.from('ra_variants').update(ch).eq('id', v.id); if(error) throw error; return { ok:true, variant_id:v.id, changes:ch }; } };
  }
  if(name === 'update_product'){
    const { data:p } = await sb.from('ra_products').select('*').eq('id', x.product_id).maybeSingle();
    if(!p) return { error:'product not found' };
    const ch = {}; Object.entries(x.changes||{}).forEach(([k,val]) => { if(AG_PROD_KEYS.includes(k)) ch[k] = val; });
    if(!Object.keys(ch).length) return { error:'no allowed changes' };
    const lines = Object.entries(ch).map(([k,val]) => `${k}: «${String(p[k] ?? '').slice(0,120)}» ← «${String(val ?? '').slice(0,300)}»`);
    return { title:p.name, lines, apply: async () => { const { error } = await sb.from('ra_products').update(ch).eq('id', p.id); if(error) throw error; return { ok:true, product_id:p.id, changes:Object.keys(ch) }; } };
  }
  if(name === 'bulk_adjust_prices'){
    const pct = Number(x.percent); if(!isFinite(pct) || pct === 0 || Math.abs(pct) > 90) return { error:'bad percent' };
    const rnd = Math.max(1, Number(x.round_to) || 250);
    const ids = Array.isArray(x.product_ids) ? x.product_ids.filter(Boolean) : [];
    if(!x.category_en && !ids.length) return { error:'give category_en or product_ids' };
    let rows = [];
    for(let from = 0; ; from += 1000){
      let q = sb.from('ra_products').select('id,name,ra_variants(id,name,price,sale_price)').range(from, from + 999);
      if(x.category_en) q = q.eq('category_en', x.category_en); if(ids.length) q = q.in('id', ids.slice(0, 500));
      const { data, error } = await q; if(error) throw error; rows = rows.concat(data||[]); if(!data || data.length < 1000) break;
    }
    const f = v => Math.max(rnd, Math.ceil(v * (1 + pct/100) / rnd) * rnd);
    const plan = rows.flatMap(p => (p.ra_variants||[]).map(v => ({ p:p.name, v, np:f(v.price), ns: v.sale_price ? f(v.sale_price) : null })));
    if(!plan.length) return { error:'no plans matched' };
    const lines = [`${num(plan.length)} پلان لە ${num(rows.length)} بەرهەم · ${pct > 0 ? '+' : ''}${pct}% · خڕکردنەوە بۆ ${num(rnd)}`, ...plan.slice(0, 6).map(r => `${r.p} — ${num(r.v.price)} ← ${num(r.np)}`), plan.length > 6 ? '…' : ''].filter(Boolean);
    return { title:'گۆڕینی نرخی بە کۆمەڵ', lines, apply: async () => {
      let ok = 0; for(let i = 0; i < plan.length; i += 20){ await Promise.all(plan.slice(i, i+20).map(async r => { const ch = { price:r.np }; if(r.ns) ch.sale_price = r.ns; const { error } = await sb.from('ra_variants').update(ch).eq('id', r.v.id); if(!error) ok++; })); }
      return { ok:true, updated:ok, total:plan.length };
    } };
  }
  if(name === 'set_site_text'){
    const lang = ['ku','en','ar'].includes(x.lang) ? x.lang : null; if(!lang || !x.key) return { error:'bad lang/key' };
    if(!((window.RA_TEXTS||{}).ku||{}).hasOwnProperty(x.key)) return { error:'unknown key' };
    const s = await agSiteSettings(); const cur = ((s.texts||{})[lang]||{})[x.key] || ((window.RA_TEXTS[lang]||{})[x.key]) || '';
    return { title:`دەقی سایت (${lang}) — ${x.key}`, lines:[`«${String(cur).slice(0,200)}» ← «${String(x.value||'(بنەڕەتی)').slice(0,300)}»`], apply: async () => {
      const s2 = await agSiteSettings(); const tx = s2.texts || {}; tx[lang] = tx[lang] || {};
      if(String(x.value||'').trim()) tx[lang][x.key] = String(x.value); else delete tx[lang][x.key];
      const v = { ...s2, texts:tx }; const { error } = await sb.from('ra_settings').upsert({ key:'site', value:v, updated_at:new Date().toISOString() }); if(error) throw error;
      try{ localStorage.removeItem('ra_settings'); }catch{} RA.applySettings(v); return { ok:true };
    } };
  }
  return { error:'unknown tool' };
}
async function agCall(){
  agSlim();
  const { data, error } = await sb.functions.invoke('ai-agent', { body:{ messages: AG.msgs } });
  if(error){
    let j = {}; try{ j = await error.context.json(); }catch{}
    const m = j.error === 'missing_key' ? 'کلیل هێشتا دانەنراوە — لە سەرەوەی ئەم پەڕەیە کلیلەکەت دابنێ و «پاشەکەوت» دابگرە.'
      : j.error === 'missing_url' ? 'ناونیشانی API (Base URL) ـی دابینکەرەکە دانەنراوە.'
      : j.error === 'forbidden' ? 'تەنها ئەدمین دەتوانێت ئەم یاریدەدەرە بەکاربهێنێت.'
      : j.error === 'ai_error' ? 'Claude هەڵەی دایەوە' + (j.status ? ' (' + j.status + ')' : '') + ' — کلیلەکە، ناوی مۆدێل یان باڵانسی دابینکەرەکە بپشکنە.' + (j.detail ? '\n' + j.detail : '')
      : 'یاریدەدەرەکە ئامادە نییە (' + (j.error || error.message || '') + ')';
    throw new Error(m);
  }
  return data;
}
function agDraw(){
  const box = $('#agLog'); if(!box) return;
  box.innerHTML = AG.view.map(m => m.k === 'user' ? `<div class="ag-m me"><div>${(m.imgs||[]).length ? `<span class="ag-imgs">${m.imgs.map(u=>`<img src="${u}" alt="">`).join('')}</span>` : ''}${esc(m.t)}</div></div>`
    : m.k === 'ai' ? `<div class="ag-m ai"><div>${esc(m.t)}</div></div>`
    : m.k === 'tool' ? `<div class="ag-tool">🔎 ${esc(m.t)}</div>`
    : m.k === 'err' ? `<div class="ag-m err"><div>${esc(m.t)}</div></div>`
    : m.k === 'ask' ? `<div class="ag-card ${m.state||''}"><b>✏️ ${esc(m.title)}</b>${m.lines.map(l=>`<small>${esc(l)}</small>`).join('')}${m.state ? `<span class="ag-st">${m.state==='ok'?'✓ جێبەجێ کرا':m.state==='no'?'✗ ڕەتکرایەوە':'⚠ '+esc(m.err||'هەڵە')}</span>` : `<div class="ag-acts"><button class="btn btn-sm btn-p" data-agok="${m.id}">✓ پەسەند</button><button class="btn btn-sm" data-agno="${m.id}">✗ ڕەتکردنەوە</button></div>`}</div>` : '').join('')
    + (AG.busy ? `<div class="ag-m ai"><div class="ag-dots"><i></i><i></i><i></i></div></div>` : '');
  box.scrollTop = box.scrollHeight;
  $$('[data-agok],[data-agno]', box).forEach(b => b.onclick = () => { const id = b.dataset.agok || b.dataset.agno; const m = AG.view.find(x => x.id === id); if(m && m.resolve) m.resolve(!!b.dataset.agok); });
  const inp = $('#agIn'), go = $('#agGo'); if(inp) inp.disabled = AG.busy; if(go) go.disabled = AG.busy;
}
async function agRun(text, imgs = []){
  const content = imgs.length ? [...imgs.map(a => ({ type:'image', source:{ type:'base64', media_type:a.type, data:a.b64 } })), { type:'text', text: text || 'ئەم وێنەیە هەڵبسەنگێنە و بە کوردی ڕوونی بکەرەوە.' }] : text;
  AG.msgs.push({ role:'user', content }); AG.view.push({ k:'user', t:text, imgs:imgs.map(a => a.url) }); AG.busy = true; agDraw();
  try{
    for(let step = 0; step < 10; step++){
      const res = await agCall();
      AG.msgs.push({ role:'assistant', content:res.content });
      const txt = res.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim(); if(txt) AG.view.push({ k:'ai', t:txt });
      const uses = res.content.filter(b => b.type === 'tool_use');
      if(!uses.length) break;
      const results = [];
      for(const u of uses){
        let out;
        try{
          if(AG_READ[u.name]){ AG.view.push({ k:'tool', t:({search_products:'گەڕان لە بەرهەمەکان',get_product:'خوێندنەوەی بەرهەم',list_categories:'بینینی بەشەکان',search_site_texts:'گەڕان لە دەقەکانی سایت'})[u.name] + (u.input?.query ? ': ' + u.input.query : '') }); agDraw(); out = await AG_READ[u.name](u.input || {}); }
          else if(AG_WRITE[u.name]){
            const pr = await agPrepare(u.name, u.input || {});
            if(pr.error) out = { error:pr.error };
            else {
              const card = { k:'ask', id:u.id, title:pr.title, lines:pr.lines }; AG.view.push(card); AG.busy = false; agDraw();
              const yes = await new Promise(r => card.resolve = r); AG.busy = true;
              if(!yes){ card.state = 'no'; out = { rejected:true, note:'The owner rejected this change.' }; }
              else { try{ out = await pr.apply(); card.state = 'ok'; if(u.name !== 'set_site_text') A.products = []; }catch(e){ card.state = 'err'; card.err = errMsg(e); out = { error:errMsg(e) }; } }
              agDraw();
            }
          } else out = { error:'unknown tool' };
        }catch(e){ out = { error:errMsg(e) }; }
        results.push({ type:'tool_result', tool_use_id:u.id, content:agClip(out) });
      }
      AG.msgs.push({ role:'user', content:results }); agDraw();
    }
  }catch(e){ AG.view.push({ k:'err', t:e.message || String(e) }); AG.msgs.pop(); }
  AG.busy = false; agDraw();
}
const AG_MODELS = ['claude-opus-5-5','claude-sonnet-5-5','claude-haiku-4-5','deepseek-chat','deepseek-reasoner','anthropic/claude-opus-5.5','anthropic/claude-sonnet-5.5'];
const AG_URLS = ['https://api.deepseek.com','https://openrouter.ai/api/v1','https://api.perplexity.ai'];
async function agKeyPanel(adv = false){
  const box = $('#agKey'); if(!box) return;
  const { data:st, error } = await sb.rpc('ra_admin_ai_status');
  if(error){ box.innerHTML = `<div class="warn-box">ڕێکخستنی کلیل ئامادە نییە (${esc(errMsg(error))})</div>`; return; }
  const ok = !!st?.set, model = st?.model || 'claude-opus-5-5', prov = st?.provider === 'openai' ? 'openai' : 'anthropic', base = st?.base_url || '';
  const where = prov === 'openai' ? (base.replace(/^https:\/\//,'').split('/')[0] || '—') : 'Claude';
  box.innerHTML = `<div class="ag-kbar"><span>${ok ? `✅ کلیل دانراوە <b class="ltr">••••${esc(st.hint||'')}</b> <span class="muted ltr">· ${esc(where)} · ${esc(model)}</span>` : '⚠️ کلیلەکەت پەیست بکە و «پاشەکەوت» دابگرە'}</span></div>
    <div class="ag-kform"><input class="inp ltr-inp" id="agK" type="password" autocomplete="off" spellcheck="false" placeholder="${ok ? 'بۆ گۆڕینی کلیل، کلیلە تازەکە لێرە پەیست بکە' : 'کلیلەکەت لێرە پەیست بکە'}"><button class="btn btn-p" id="agKS">پاشەکەوت</button><button class="btn btn-sm" id="agKT" type="button">⚙️ ${adv ? 'شاردنەوە' : 'پێشکەوتوو'}</button></div>
    <div class="ag-kgrid ${adv ? '' : 'hidden'}" id="agAdv">
      <label>دابینکەر<select class="inp" id="agP"><option value="anthropic" ${prov==='anthropic'?'selected':''}>Claude — ڕاستەوخۆ (api.anthropic.com)</option><option value="openai" ${prov==='openai'?'selected':''}>خزمەتگوزارییەکی تر (relaymodels، OpenRouter …)</option><option value="deepseek">DeepSeek — ئامادە</option></select></label>
      <label id="agUW">ناونیشانی API (Base URL)<input class="inp ltr-inp" id="agU" list="agUL" value="${esc(base)}" placeholder="https://…/v1"><datalist id="agUL">${AG_URLS.map(u=>`<option value="${esc(u)}">`).join('')}</datalist></label>
      <label>مۆدێل<input class="inp ltr-inp" id="agM" list="agML" value="${esc(model)}" placeholder="claude-opus-5-5"><datalist id="agML">${AG_MODELS.map(m=>`<option value="${esc(m)}">`).join('')}</datalist></label>
    </div>
    <small class="muted">کلیلەکە بە پارێزراوی لە سێرڤەر هەڵدەگیرێت و هەرگیز پیشان نادرێتەوە. کلیلی <span class="ltr">sk-ant-</span> خۆی دەناسرێتەوە؛ بۆ کلیلی ماڵپەڕی تر ناونیشان و مۆدێل لە «پێشکەوتوو» دەمێننەوە.</small>`;
  const syncP = () => { const P = $('#agP'); if(P.value === 'deepseek'){ P.value = 'openai'; $('#agU').value = 'https://api.deepseek.com'; $('#agM').value = 'deepseek-chat'; } $('#agUW').classList.toggle('hidden', P.value !== 'openai'); };
  $('#agP').onchange = syncP; syncP();
  $('#agKT').onclick = () => { const a = $('#agAdv'); a.classList.toggle('hidden'); $('#agKT').textContent = '⚙️ ' + (a.classList.contains('hidden') ? 'پێشکەوتوو' : 'شاردنەوە'); };
  const save = async btn => {
    const k = $('#agK').value.trim(); let p = $('#agP').value, m = $('#agM').value.trim(); const u = $('#agU').value.trim();
    if(!ok && !k) return toast('کلیلەکە پەیست بکە','bad');
    if(k && (/\s/.test(k) || k.length < 16)) return toast('کلیلەکە دروست نییە — دڵنیابە تەواوت کۆپی کردووە','bad');
    if(/^sk-ant-/.test(k)){ p = 'anthropic'; if(!/^claude-/.test(m)) m = 'claude-opus-5-5'; }
    if(!/^[A-Za-z0-9._:\/@-]{2,100}$/.test(m)) return toast('ناوی مۆدێل دروست نییە','bad');
    if(p === 'openai' && !/^https:\/\/[^\s]+$/.test(u)){ $('#agAdv').classList.remove('hidden'); $('#agU').focus(); return toast('ئەم کلیلە هی Claude ـی فەرمی نییە — لە «پێشکەوتوو» ناونیشانی API ـی ماڵپەڕەکەی بنووسە','bad'); }
    setBusy(btn, true);
    const { error } = await sb.rpc('ra_admin_set_ai', { p_key: k || null, p_model: m, p_clear: false, p_provider: p, p_base_url: p === 'openai' ? u : '' });
    setBusy(btn, false, 'پاشەکەوت');
    if(error) return toast(/bad_key/.test(error.message) ? 'کلیلەکە دروست نییە' : /bad_url/.test(error.message) ? 'ناونیشانی API دروست نییە' : errMsg(error), 'bad');
    toast('✓ پاشەکەوت کرا — ئێستا دەتوانیت بنووسیت','ok'); agKeyPanel(false);
  };
  $('#agKS').onclick = e => save(e.currentTarget);
  $('#agK').onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); save($('#agKS')); } };
}
async function agentTab(){
  const ex = ['نرخی Netflix بکە بە ١٥٬٠٠٠ دینار','نرخی هەموو یارییەکانی Xbox ٥٪ زیاد بکە','وەسفی ChatGPT Plus جوانتر بکە','دەقی سەرەوەی پەڕەی سەرەکی بگۆڕە بۆ ...'];
  $('#view').innerHTML = head('یاریدەدەری Claude', `<button class="btn btn-sm" id="agNew">${I.plus||'+'} چاتی نوێ</button>`) + `
    <div class="panel ag-key" id="agKey"><div class="sk" style="height:40px"></div></div>
    <div class="panel ag-wrap">
      <div class="ag-log" id="agLog"></div>
      ${AG.view.length ? '' : `<div class="ag-ex" id="agEx"><p class="muted">بنووسە چی بکەم — نرخ دەگۆڕم، دەق دەگۆڕم، بەرهەم دەدۆزمەوە. هەر گۆڕانکارییەک پێش جێبەجێکردن پەسەندی تۆی دەوێت.</p>${ex.map(e=>`<button class="chip" data-agx="${esc(e)}">${esc(e)}</button>`).join('')}</div>`}
      <div class="ag-att hidden" id="agAtt"></div>
      <div class="ag-in"><label class="btn ag-clip" title="ناردنی وێنە">📎<input type="file" id="agFile" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden></label><textarea class="inp" id="agIn" rows="2" placeholder="چی بۆ بکەم؟ دەتوانیت وێنەش بنێریت (📎 یان Paste)"></textarea><button class="btn btn-p" id="agGo">ناردن</button></div>
    </div>`;
  agDraw();
  agKeyPanel();
  agDrawAtt();
  const send = () => { const i = $('#agIn'); const v = i.value.trim(); if((!v && !AG.att.length) || AG.busy) return; const imgs = AG.att.splice(0); i.value = ''; agDrawAtt(); $('#agEx')?.remove(); agRun(v, imgs); };
  $('#agFile').onchange = e => { agAddFiles(e.target.files); e.target.value = ''; };
  $('#agIn').onpaste = e => { const fs = [...(e.clipboardData?.files || [])].filter(f => /^image\//.test(f.type)); if(fs.length){ e.preventDefault(); agAddFiles(fs); } };
  const wrap = $('.ag-wrap'); wrap.ondragover = e => e.preventDefault(); wrap.ondrop = e => { e.preventDefault(); agAddFiles(e.dataTransfer.files); };
  $('#agGo').onclick = send;
  $('#agIn').onkeydown = e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send(); } };
  $$('[data-agx]').forEach(b => b.onclick = () => { const i = $('#agIn'); i.value = b.dataset.agx; i.focus(); });
  $('#agNew').onclick = () => { if(AG.busy) return; AG.msgs = []; AG.view = []; agentTab(); };
}

/* ───── Live chat (admin) ───── */
let chatSel = null, chatThreads = [], chatMsgs = [], chatCM = {}, chatQ = '', chatOrd = {}, chatSrc = {};
function orderSuggestions(o, c){
  const nm = (c.full_name || '').split(' ')[0];
  const f = Object.entries(o.fields||{}).filter(([k,v])=>v);
  const steam = /شەیرد/.test(o.variant_name||'');
  const list = [
    `سڵاو${nm?' '+nm:''} 👋 داواکارییەکەت بۆ ${o.product_name} وەرگیرا، لە ماوەیەکی کورتدا ئامادەی دەکەین و لێرە بۆت دەنێرین.`,
    f.length ? `${f.map(([k])=>k).join('، ')} ـەکەت وەرگیرا ✓ ئێستا چالاکی دەکەین.` : `تکایە ئیمەیڵی ئەکاونتەکەت بنێرە بۆ ئەوەی چالاکی بکەین.`,
    `ببورە بۆ کەمێک دواکەوتن 🙏 تا چەند خولەکێکی تر بۆت دەنێرین.`,
    steam ? `تێبینی: یارییەکە بە ئۆفلاین یاری بکە و پاسۆرد و ڕێکخستنەکان مەگۆڕە. هەر کاتێک کۆدی Steam Guard ـت پێویست بوو لێرە پێم بڵێ، بۆتی دەنێرم.` : `✅ بەرهەمەکەت ئامادەیە، زانیارییەکانت لە پەیامی داهاتوودا بۆ دەنێرم.`,
    `ئەگەر هەر پرسیارێکت هەبوو لێرە بنووسە، ئامادەین بۆ یارمەتیدان 🌟`,
  ];
  return list;
}
function orderCard(m, o){
  const s = chatSrc[o.variant_id]; const c = chatCM[o.user_id] || {};
  const f = Object.entries(o.fields||{}).filter(([k,v])=>v);
  const open = o.status === 'processing';
  return `<div class="cm them"><div class="cb sysb ordb">
    <div class="ordb-h">🛒 <b>داواکاری نوێ</b> <span class="num muted">#${o.order_no}</span> <span class="st ${o.status}">${stOrd[o.status]||o.status}</span></div>
    <div class="ordb-p"><b>${esc(o.product_name)}</b> — ${esc(o.variant_name)} · <b class="num">${num(o.price)}</b> دینار</div>
    ${f.length ? `<div class="ordb-f">${f.map(([k,v])=>`<span><small>${esc(k)}:</small> <b class="ltr">${esc(v)}</b> <button class="icon-btn xs" data-cp="${esc(v)}" title="کۆپی">${I.copy}</button></span>`).join('')}</div>` : ''}
    ${s && (safeUrl(s.url) || s.note) ? `<div class="ordb-src">💵 ${Number(s.usd)>0?`نرخی کڕین نزیکەی <b class="num">$${Number(s.usd).toFixed(2)}</b>`:''}${s.note?`<small>${esc(s.note)}</small>`:''}</div>` : ''}
    ${open ? `<div class="ordb-acts">${s && safeUrl(s.url) ? `<a class="btn btn-sm btn-p" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener">🛒 کڕین لە Plati</a>` : ''}<button class="btn btn-sm" data-odl="${o.id}">📦 ناردنی بەرهەم</button></div>
    <div class="ordb-sug"><small class="muted">💡 پێشنیاری وەڵام — کلیک بکە:</small>${orderSuggestions(o, c).map(t=>`<button class="sug" data-sug="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
  </div><span class="ct">${chatTime(m.created_at)}</span></div>`;
}
async function loadChatOrders(uid){
  const { data } = await sb.from('ra_orders').select('*').eq('user_id', uid).order('created_at',{ascending:false}).limit(40);
  chatOrd = Object.fromEntries((data||[]).map(o=>[o.id, o]));
  const vids = [...new Set((data||[]).map(o=>o.variant_id).filter(Boolean))];
  const r = vids.length ? await sb.from('ra_variant_sources').select('variant_id,url,usd,note').in('variant_id', vids) : { data:[] };
  chatSrc = Object.fromEntries((r.data||[]).map(x=>[x.variant_id, x]));
}
function chatTime(d){ const x = new Date(d); const today = new Date().toDateString() === x.toDateString(); return today ? String(x.getHours()).padStart(2,'0') + ':' + String(x.getMinutes()).padStart(2,'0') : ago(d); }
function aBubble(m){
  const linkify = txt => esc(txt).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener nofollow">$1</a>');
  const side = m.sender === 'user' ? 'them' : 'me';
  if(m.kind === 'renew'){ const mt = m.meta||{}; return `<div class="cm them"><div class="cb sysb renewb">🔔 <b>داوای ${mt.parts?partLbl(mt, Number(mt.part)):'بەشی داهاتوو'} دەکات</b><br>${linkify(m.body)}${m.order_id?`<br><button class="btn btn-p btn-sm" data-renew="${m.order_id}" style="margin-top:8px">📤 ناردنی ${mt.parts?partLbl(mt, Number(mt.part)):''}</button>`:''}</div><span class="ct">${chatTime(m.created_at)}</span></div>`; }
  if(m.kind === 'delivery' && m.meta && Number(m.meta.parts) > 1) return `<div class="cm ${side}"><div class="cb sysb">📦 <b>${partLbl(m.meta, Number(m.meta.part))} نێردرا</b> <small class="num">(${Number(m.meta.part)}/${Number(m.meta.parts)})</small><br>${linkify(m.body)}</div><span class="ct">${chatTime(m.created_at)}</span></div>`;
  if(m.kind === 'order' && m.order_id && chatOrd[m.order_id]) return orderCard(m, chatOrd[m.order_id]);
  if(m.kind === 'delivery' || m.kind === 'order') return `<div class="cm ${side}"><div class="cb sysb">${m.kind==='delivery'?'📦 <b>گەیەندرا</b>':'🛒 <b>داواکاری نوێ</b>'}<br>${linkify(m.body)}</div><span class="ct">${chatTime(m.created_at)}</span></div>`;
  if(m.kind === 'image' || m.kind === 'video' || m.kind === 'voice') return `<div class="cm ${side}"><div class="cb cbm cbm-${m.kind}">${RA.ChatMedia.html(m)}${m.uploading?'<span class="up-ov"><span class="spin"></span></span>':''}</div><span class="ct">${m.uploading?'بار دەکرێت...':chatTime(m.created_at)}</span></div>`;
  return `<div class="cm ${side} ${m.sender==='system'?'sysm':''}"><div class="cb">${linkify(m.body)}</div><span class="ct">${m.sender==='system'?'سیستەم · ':''}${chatTime(m.created_at)}</span></div>`;
}
async function chat(){
  $('#view').innerHTML = head('چاتی ڕاستەوخۆ') + `<div class="achat ${chatSel?'has-sel':''}" id="achat"><div class="ac-list"><label class="search wide" style="margin:0 0 10px">${I.search}<input id="acQ" placeholder="گەڕان..." value="${esc(chatQ)}"></label><div id="acList"><div class="sk" style="height:200px"></div></div></div><div class="ac-conv" id="acConv"><div class="empty"><div class="e">💬</div>گفتوگۆیەک هەڵبژێرە</div></div></div>`;
  $('#acQ').oninput = e => { chatQ = e.target.value; drawThreads(); };
  await loadThreads(); drawThreads(); if(chatSel) openThread(chatSel);
}
async function loadThreads(){
  const { data } = await sb.from('ra_chat_threads').select('*').order('last_at',{ascending:false}).limit(300);
  chatThreads = data || [];
  const need = chatThreads.map(t=>t.user_id).filter(id => !chatCM[id]);
  if(need.length) Object.assign(chatCM, await customerMap(need));
}
function drawThreads(){
  const box = $('#acList'); if(!box) return;
  const q = chatQ.trim().toLowerCase();
  const list = chatThreads.filter(t => { const c = chatCM[t.user_id]||{}; return !q || [c.email,c.full_name,t.last_message].join(' ').toLowerCase().includes(q); });
  box.innerHTML = list.map(t => { const c = chatCM[t.user_id]||{}; const nm = c.full_name || c.email || '—';
    return `<button class="ac-item ${chatSel===t.user_id?'on':''} ${t.unread_admin?'unread':''}" data-u="${t.user_id}"><span class="ac-av">${esc((nm[0]||'?').toUpperCase())}</span><span class="ac-mid"><b>${esc(nm)}</b><small>${t.last_sender==='admin'?'تۆ: ':''}${esc(t.last_message||'')}</small></span><span class="ac-meta"><small>${chatTime(t.last_at)}</small>${t.unread_admin?`<i>${t.unread_admin}</i>`:''}</span></button>`; }).join('') || '<div class="empty">هێشتا هیچ نامەیەک نییە</div>';
  $$('[data-u]', box).forEach(b => b.onclick = () => openThread(b.dataset.u));
}
async function openThread(uid){
  chatSel = uid; $('#achat')?.classList.add('has-sel'); drawThreads();
  const c = chatCM[uid] || (await customerMap([uid]))[uid] || {}; chatCM[uid] = c;
  const conv = $('#acConv');
  conv.innerHTML = `<div class="acc-h"><button class="icon-btn ac-back" id="acBack" aria-label="back">${I.back}</button><span class="ac-av">${esc(((c.full_name||c.email||'?')[0]||'?').toUpperCase())}</span><div class="ac-mid"><b>${esc(c.full_name||'—')}</b><small class="ltr">${esc(c.email||'')} · <span class="num">${num(c.balance)}</span> دینار</small></div><button class="btn btn-sm" id="acProf" title="پرۆفایلی کڕیار">👤</button><button class="btn btn-sm" id="acBal">± باڵانس</button></div>
    <div class="acc-b cp-b" id="accB"><div class="sk" style="height:120px"></div></div>
    <div class="cp-f acc-f"><button class="btn btn-ai btn-sm acc-ai" id="accAi" title="پێشنیاری وەڵام بە AI">✨</button><button type="button" class="cp-ic" id="accQr" title="وەڵامی ئامادە">⚡</button><button type="button" class="cp-ic" id="accAtt" title="ناردنی وێنە یان ڤیدیۆ">${RA.ChatMedia.ICON.clip}</button><textarea id="accIn" rows="1" maxlength="4000" placeholder="وەڵامەکەت بنووسە..."></textarea><button type="button" class="cp-ic" id="accMic" title="نامەی دەنگی">${RA.ChatMedia.ICON.mic}</button><button class="cp-send" id="accSend" aria-label="send">${I.send}</button></div>`;
  $('#acBack').onclick = () => { chatSel = null; $('#achat').classList.remove('has-sel'); drawThreads(); };
  $('#acBal').onclick = () => balanceDialog(c.email);
  $('#acProf').onclick = () => openCustomer({ id:uid, ...c });
  const inp = $('#accIn');
  inp.oninput = () => { inp.style.height = 'auto'; inp.style.height = Math.min(140, inp.scrollHeight) + 'px'; };
  inp.onkeydown = e => { if(e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)){ e.preventDefault(); sendAdmin(); } };
  $('#accSend').onclick = sendAdmin;
  $('#accQr').onclick = () => quickReplyPicker(body => { inp.value = (inp.value ? inp.value + '\n' : '') + body; inp.oninput(); inp.focus(); });
  $('#accAtt').onclick = () => RA.ChatMedia.pick(async file => { try{ sendAdminMedia(await RA.ChatMedia.prepare(file)); }catch(e){ toast(errMsg(e),'bad'); } });
  $('#accMic').onclick = () => RA.ChatMedia.record($('.acc-f'), prep => sendAdminMedia(prep));
  $('#accAi').onclick = async e => {
    const lastUser = chatMsgs.filter(m=>m.sender==='user').slice(-3).map(m=>m.body).join('\n');
    if(!lastUser) return toast('هیچ نامەیەکی کڕیار نییە','bad');
    const btn = e.currentTarget; setBusy(btn, true);
    const hist = chatMsgs.slice(-10).map(m => (m.sender==='user'?'Customer: ':'Store: ') + m.body).join('\n');
    const out = await ai(`You are the support agent of the store. Write a short, polite, helpful reply to the customer's last message, in the SAME language the customer used (Kurdish Sorani, Arabic or English). Do not promise things you don't know; if unsure, say we will check and reply soon. Only output the reply text.\n\nConversation:\n${hist}`);
    setBusy(btn, false, '✨'); if(out){ inp.value = out; inp.oninput(); inp.focus(); }
  };
  const [{ data }] = await Promise.all([ sb.from('ra_chat_messages').select('*').eq('user_id', uid).order('id',{ascending:false}).limit(150), loadChatSubs(uid), loadChatOrders(uid) ]);
  if(chatSel !== uid) return;
  chatMsgs = (data||[]).reverse(); drawMsgs();
  sb.rpc('ra_admin_chat_read', { p_user: uid }).then(() => { const t = chatThreads.find(x=>x.user_id===uid); if(t){ t.unread_admin = 0; drawThreads(); } refreshBadges(); });
  if(!('ontouchstart' in window)) inp.focus();
}
function drawMsgs(){ const b = $('#accB'); if(!b) return; b.innerHTML = (chatMsgs.map(aBubble).join('') || '<div class="empty">هیچ نامەیەک نییە</div>') + chatSubsHTML(); b.scrollTop = b.scrollHeight;
  RA.ChatMedia.hydrate(b).then(() => { b.scrollTop = b.scrollHeight; });
  $$('[data-renew]', b).forEach(x => x.onclick = () => openSendFor(x.dataset.renew));
  $$('[data-sug]', b).forEach(x => x.onclick = () => { const inp = $('#accIn'); if(!inp) return; inp.value = x.dataset.sug; inp.oninput(); inp.focus(); });
  $$('[data-cp]', b).forEach(x => x.onclick = () => copyText(x.dataset.cp));
  $$('[data-odl]', b).forEach(x => x.onclick = () => { const o = chatOrd[x.dataset.odl]; if(!o) return; A.osrc = { ...(A.osrc||{}), ...chatSrc }; openOrder(o, chatCM[o.user_id]||{}); }); }
let chatSubs = [];
function chatSubsHTML(){
  const act = chatSubs.filter(o => o.parts_done < o.sub_parts); if(!act.length) return '';
  return `<div class="sub-strip">${act.map(o => `<div class="ss-item"><div class="ss-t"><b>📅 ${esc(o.product_name)} — ${esc(o.variant_name)} <span class="num muted">#${o.order_no}</span></b><small class="muted">${o.parts_done}/${o.sub_parts} نێردراوە · بەشی داهاتوو: ${partLbl(o, o.parts_done+1)} · ${o.renew_requested?'<b class="req">🔔 داوای کردووە</b>':dueText(o)}</small></div>${segBar(o.sub_parts, o.parts_done)}<button class="btn btn-p btn-sm btn-block" data-renew="${o.id}">📤 ناردنی ${partLbl(o, o.parts_done+1)}</button></div>`).join('')}</div>`;
}
async function loadChatSubs(uid){
  const { data } = await sb.from('ra_orders').select('*').eq('user_id', uid).eq('status','delivered').gt('sub_parts',1).order('created_at',{ascending:false});
  chatSubs = data || [];
}
async function openSendFor(orderId){
  let o = chatSubs.find(x => x.id === orderId);
  if(!o){ const r = await sb.from('ra_orders').select('*').eq('id', orderId).maybeSingle(); o = r.data; }
  if(!o) return toast('داواکارییەکە نەدۆزرایەوە','bad');
  if(o.status !== 'delivered') return toast('سەرەتا بەشی یەکەم لە «فرۆشتنەکان» بنێرە','bad');
  if(o.parts_done >= o.sub_parts) return toast('هەموو بەشەکان نێردراون ✓','ok');
  sendPartDialog(o, chatCM[o.user_id]||{}, async () => { if(chatSel){ await loadChatSubs(chatSel); drawMsgs(); } });
}
async function sendAdminMedia(prep){
  const uid = chatSel; if(!uid) return;
  const tmp = { id:'tmp'+Date.now(), user_id:uid, sender:'admin', kind:prep.kind, body:'', meta:{ ...prep.meta, mime:prep.mime, local:URL.createObjectURL(prep.blob) }, created_at:new Date().toISOString(), uploading:true };
  chatMsgs.push(tmp); drawMsgs();
  try{
    const path = await RA.ChatMedia.upload(uid, prep);
    const { data, error } = await sb.rpc('ra_admin_chat_send_media', { p_user:uid, p_kind:prep.kind, p_path:path, p_meta:{ ...prep.meta, mime:prep.mime } });
    if(error) throw error;
    tmp.id = data; tmp.uploading = false; tmp.meta.path = path;
    chatMsgs = chatMsgs.filter(m => m === tmp || String(m.id) !== String(data));
    if(chatSel === uid) drawMsgs();
  }catch(e){ chatMsgs = chatMsgs.filter(m => m !== tmp); drawMsgs(); toast(errMsg(e),'bad'); }
}
async function sendAdmin(){
  const inp = $('#accIn'); const body = inp.value.trim(); if(!body || !chatSel) return;
  const btn = $('#accSend'); btn.disabled = true;
  const { data, error } = await sb.rpc('ra_admin_chat_send', { p_user: chatSel, p_body: body });
  btn.disabled = false;
  if(error) return toast(errMsg(error),'bad');
  inp.value = ''; inp.style.height = 'auto';
  if(!chatMsgs.some(m => String(m.id) === String(data))) chatMsgs.push({ id:data, user_id:chatSel, sender:'admin', kind:'text', body, created_at:new Date().toISOString() });
  drawMsgs();
  const t = chatThreads.find(x=>x.user_id===chatSel); if(t){ t.last_message = body.slice(0,120); t.last_sender='admin'; t.last_at = new Date().toISOString(); chatThreads.sort((a,b)=>new Date(b.last_at)-new Date(a.last_at)); drawThreads(); }
}
function adminDing(){ try{ const a = new (window.AudioContext||window.webkitAudioContext)(); const o = a.createOscillator(); const g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 740; g.gain.setValueAtTime(.15, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .4); o.start(); o.stop(a.currentTime + .41); }catch{} }
let rtTimer = null;
function adminRealtime(){
  if(A.rt) return;
  setInterval(async () => {
    if(A.tab !== 'chat' || document.visibilityState !== 'visible') return;
    await loadThreads(); drawThreads();
    if(chatSel){ const last = chatMsgs.reduce((a,m)=>Math.max(a, Number(m.id)||0), 0); const { data } = await sb.from('ra_chat_messages').select('*').eq('user_id', chatSel).gt('id', last).order('id'); if(data && data.length){ data.forEach(m => { if(!chatMsgs.some(x=>String(x.id)===String(m.id))) chatMsgs.push(m); }); drawMsgs(); } }
  }, 15000);
  A.rt = sb.channel('admin-chat').on('postgres_changes', { event:'INSERT', schema:'public', table:'ra_chat_messages' }, p => {
    const m = p.new;
    if(m.sender === 'user') customerMap([m.user_id]).then(cm => bellAdd(bellFromMsg(m, cm[m.user_id])));
    if(m.sender === 'user'){ adminDing(); if(!(A.tab === 'chat' && chatSel === m.user_id && document.visibilityState === 'visible')) toast(m.kind === 'renew' ? '🔔 کڕیارێک داوای بەشی داهاتووی بەشداربوونەکەی دەکات' : '💬 نامەی نوێ: ' + String(m.body).slice(0,60)); }
    if(m.kind === 'renew' && A.tab === 'subs') subs();
    if((m.kind === 'renew' || m.meta) && A.tab === 'chat' && chatSel === m.user_id) loadChatSubs(m.user_id).then(drawMsgs);
    if(A.tab === 'chat'){
      if(chatSel === m.user_id && !chatMsgs.some(x => String(x.id) === String(m.id) || (x.uploading && x.kind === m.kind && m.sender === 'admin'))){ chatMsgs.push(m); drawMsgs(); if(m.sender==='user') sb.rpc('ra_admin_chat_read', { p_user: m.user_id }); }
      clearTimeout(rtTimer); rtTimer = setTimeout(async () => { await loadThreads(); drawThreads(); }, 400);
    }
    clearTimeout(A.bt); A.bt = setTimeout(refreshBadges, 600);
  }).on('postgres_changes', { event:'INSERT', schema:'public', table:'ra_orders' }, p => { adminDing(); toast('🛒 فرۆشتنی نوێ!','ok');
      if(p.new.status === 'processing' && !document.querySelector('.modal-bg')){ const uid = p.new.user_id; setTimeout(async () => { chatSel = uid; if(A.tab === 'chat'){ await loadThreads(); drawThreads(); openThread(uid); } else location.hash = '#chat'; }, 900); } customerMap([p.new.user_id]).then(cm => bellAdd(bellFromOrder(p.new, cm[p.new.user_id]))); clearTimeout(A.bt); A.bt = setTimeout(refreshBadges, 600); })
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'ra_deposits' }, p => { adminDing(); toast('💳 پارەدانی نوێ هات — پشکنینی بکە','ok'); customerMap([p.new.user_id]).then(cm => bellAdd(bellFromDeposit(p.new, cm[p.new.user_id]))); if(A.tab === 'deposits') go(); clearTimeout(A.bt); A.bt = setTimeout(refreshBadges, 600); }).subscribe();
}

async function lowStock(){
  const [v, st] = await Promise.all([ sb.from('ra_variants').select('id,name,product_id,auto_deliver,active,ra_products(name,active)').eq('auto_deliver', true).eq('active', true), sb.rpc('ra_stock_counts') ]);
  const cnt = {}; (st.data||[]).forEach(r => cnt[r.variant_id] = Number(r.available));
  return (v.data||[]).filter(x => x.ra_products?.active && (cnt[x.id]||0) <= 2).map(x => ({ id:x.id, name:x.name, pname:x.ra_products?.name||'', n:cnt[x.id]||0 })).sort((a,b)=>a.n-b.n);
}
/* ───── Notifications (bell) ───── */
const Bell = { items:[], loaded:false };
const bellSeen = () => { try{ return Number(localStorage.getItem('ra_bell_seen')||0); }catch{ return 0; } };
const bellPushOn = () => { try{ return localStorage.getItem('ra_bell_push') === '1'; }catch{ return false; } };
function nameOf(c){ return c ? (c.full_name || c.email || '') : ''; }
async function bellLoad(){
  const [o, d, c, u] = await Promise.all([
    sb.from('ra_orders').select('id,order_no,user_id,product_name,variant_name,price,status,created_at').order('created_at',{ascending:false}).limit(25),
    sb.from('ra_deposits').select('id,user_id,method_name,amount,status,created_at').order('created_at',{ascending:false}).limit(25),
    sb.from('ra_chat_messages').select('id,user_id,kind,body,created_at').eq('sender','user').order('id',{ascending:false}).limit(25),
    sb.from('ra_customers').select('id,email,full_name,created_at').order('created_at',{ascending:false}).limit(15)
  ]);
  const tq = { data: [] }, low = await lowStock();
  const ids = [...new Set([...(o.data||[]), ...(d.data||[]), ...(c.data||[])].map(x=>x.user_id))];
  const cm = await customerMap(ids);
  Bell.items = [
    ...(o.data||[]).map(x => bellFromOrder(x, cm[x.user_id])),
    ...(d.data||[]).map(x => bellFromDeposit(x, cm[x.user_id])),
    ...(c.data||[]).map(x => bellFromMsg(x, cm[x.user_id])),
    ...(u.data||[]).map(x => ({ k:'cust', at:x.created_at, ic:'👤', t:'کڕیاری نوێ خۆی تۆمار کرد', s:nameOf(x), href:'#customers' })),
    ...(tq.data||[]).map(x => ({ k:'ticket', at:x.updated_at, ic:'🎫', t:`تیکێت #${x.ticket_no}: ${x.subject}`, s:x.status==='open'?'چاوەڕوانی وەڵامی تۆیە':x.status==='answered'?'وەڵامدراوە':'داخراوە', href:'#tickets', hot:x.status==='open' })),
    ...low.map(x => ({ k:'stock', at:new Date(Date.now() - 60000).toISOString(), ic:x.n?'⚠️':'🚫', t:`کۆگای کەم: ${x.pname} — ${x.name}`, s:x.n?`تەنها ${x.n} دانە ماوە`:'کۆگا بەتاڵە', href:'#products', hot:true, sticky:true }))
  ].sort((a,b) => new Date(b.at) - new Date(a.at)).slice(0, 50);
  Bell.loaded = true; bellDraw();
}
function bellFromOrder(x, c){ return { k:'order', at:x.created_at, ic:'🛒', t:`فرۆشتنی نوێ: ${x.product_name||''} — ${x.variant_name||''}`, s:`${nameOf(c)} · ${num(x.price)} دینار · #${x.order_no}${x.status==='processing'?' · چاوەڕوانی گەیاندن':''}`, href:'#orders', hot:x.status==='processing' }; }
function bellFromDeposit(x, c){ return { k:'dep', at:x.created_at, ic:'💳', t:`پارەدانی نوێ: ${x.method_name||''} — ${num(x.amount)} دینار`, s:`${nameOf(c)}${x.status==='pending'?' · چاوەڕوانی پشکنین':''}`, href:'#deposits', hot:x.status==='pending' }; }
function bellFromMsg(x, c){ return x.kind === 'renew'
  ? { k:'renew', at:x.created_at, ic:'🔔', t:'داوای بەشی داهاتووی بەشداربوون', s:`${nameOf(c)} · ${String(x.body).split('\n')[0].replace(/^🔄\s*/,'')}`, href:'#subs', hot:true, uid:x.user_id }
  : { k:'msg', at:x.created_at, ic:'💬', t:`نامە لە ${nameOf(c) || 'کڕیار'}`, s:String(x.body).slice(0,90), href:'#chat', uid:x.user_id }; }
function bellDraw(){
  const seen = bellSeen(); const n = Bell.items.filter(x => !x.sticky && new Date(x.at).getTime() > seen).length;
  const b = $('#bellN'); if(b){ b.textContent = n > 99 ? '99+' : n; b.classList.toggle('hidden', !n); }
  $('#bellBtn')?.classList.toggle('ring', n > 0);
  const pop = $('#bellPop'); if(pop) pop.querySelector('.bp-list').innerHTML = bellListHTML(seen);
  if(pop) bindBellItems(pop);
}
function bellListHTML(seen){
  return Bell.items.map((x,i) => `<button class="bp-item ${!x.sticky && new Date(x.at).getTime() > seen ? 'new' : ''} ${x.hot?'hot':''}" data-bi="${i}"><span class="bp-ic">${x.ic}</span><span class="bp-mid"><b>${esc(x.t)}</b><small>${esc(x.s||'')}</small></span><small class="bp-at">${ago(x.at)}</small></button>`).join('') || '<div class="empty">هێشتا هیچ ئاگادارکردنەوەیەک نییە</div>';
}
function bindBellItems(pop){ $$('[data-bi]', pop).forEach(el => el.onclick = () => { const x = Bell.items[+el.dataset.bi]; bellClose(); if(x.uid && x.k === 'msg') chatSel = x.uid; if(location.hash === x.href) go(); else location.hash = x.href; }); }
function bellToggle(){ if($('#bellPop')) return bellClose(); bellOpen(); }
function bellClose(){ $('#bellPop')?.remove(); }
function bellOpen(){
  const seen = bellSeen();
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const pop = document.createElement('div'); pop.id = 'bellPop'; pop.className = 'bell-pop';
  pop.innerHTML = `<div class="bp-h"><b>🔔 ئاگادارکردنەوەکان</b><button class="btn btn-sm" id="bpAll">هەمووی خوێندرایەوە ✓</button></div>
    <div class="bp-push">${perm === 'unsupported' ? '<small class="muted">ئەم وێبگەڕە ئاگادارکردنەوەی سیستەم پشتگیری ناکات</small>'
      : perm === 'granted' && bellPushOn() ? `<span>📲 ئاگادارکردنەوەی سەر ئامێر <b style="color:var(--ok)">چالاکە</b></span><button class="btn btn-sm" id="bpOff">ناچالاککردن</button>`
      : perm === 'denied' ? '<small class="muted">ئاگادارکردنەوە لە ڕێکخستنی وێبگەڕەکەت ڕاگیراوە — لە ڕێکخستنەکانی سایت ڕێگەی پێبدە.</small>'
      : `<span>📲 ئاگادارم بکەرەوە کاتێک فرۆشتن، پارەدان یان نامەی نوێ دێت</span><button class="btn btn-p btn-sm" id="bpOn">چالاککردن</button>`}</div>
    <div class="bp-list">${bellListHTML(seen)}</div>`;
  document.body.appendChild(pop); bindBellItems(pop);
  const mark = () => { try{ localStorage.setItem('ra_bell_seen', String(Date.now())); }catch{} bellDraw(); };
  $('#bpAll', pop).onclick = mark;
  setTimeout(mark, 2500);
  const on = $('#bpOn', pop); if(on) on.onclick = async () => { const r = await Notification.requestPermission(); if(r === 'granted'){ try{ localStorage.setItem('ra_bell_push','1'); }catch{} notifyDevice({ t:'✓ ئاگادارکردنەوە چالاک کرا', s:'لێرە ئاگادارت دەکەینەوە کاتێک شتێکی نوێ ڕوودەدات' }, true); } bellClose(); bellOpen(); };
  const off = $('#bpOff', pop); if(off) off.onclick = () => { try{ localStorage.removeItem('ra_bell_push'); }catch{} bellClose(); bellOpen(); };
  setTimeout(() => document.addEventListener('click', function h(e){ if(!pop.contains(e.target) && e.target.id !== 'bellBtn'){ bellClose(); document.removeEventListener('click', h); } }), 0);
}
async function notifyDevice(x, force){
  if(!('Notification' in window) || Notification.permission !== 'granted' || !bellPushOn()) return;
  if(!force && document.visibilityState === 'visible' && document.hasFocus()) return;
  const opts = { body: x.s || '', icon:'/assets/img/icon-192.png', badge:'/assets/img/icon-any-192.png', tag: x.k + (x.at||''), data:{ url: '/admin.html' + (x.href||'') }, renotify:true };
  try{ const reg = await navigator.serviceWorker?.getRegistration('/'); if(reg){ await reg.showNotification(x.t, opts); return; } }catch{}
  try{ new Notification(x.t, opts); }catch{}
}
async function bellAdd(x){ Bell.items.unshift(x); Bell.items = Bell.items.slice(0, 60); bellDraw(); notifyDevice(x); }

/* ═════════ v9 modules ═════════ */
const kvGet = async key => { const { data } = await sb.from('ra_admin_kv').select('value').eq('key', key).maybeSingle(); return data?.value; };
const kvSet = async (key, value) => sb.from('ra_admin_kv').upsert({ key, value, updated_at:new Date().toISOString() });
function toLocalInput(d){ if(!d) return ''; const x = new Date(d); const p = n => String(n).padStart(2,'0'); return `${x.getFullYear()}-${p(x.getMonth()+1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`; }
function fromLocalInput(v){ if(!v) return null; const d = new Date(v); return isNaN(d) ? null : d.toISOString(); }
function randCode(n=8){ const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const r = crypto.getRandomValues(new Uint32Array(n)); for(const x of r) s += a[x % a.length]; return s; }
async function allVariants(){
  await ensureProductsFresh();
  return A.products.flatMap(p => (p.variants||[]).map(v => ({ ...v, pname:p.name, pid:p.id, pactive:p.active })));
}
async function ensureProductsFresh(){ const { data } = await sb.from('ra_products').select('*, ra_variants(*)').or(NOT_XBOX).order('sort_order'); A.products = (data||[]).map(x => ({...x, variants:(x.ra_variants||[]).sort((a,b)=>a.sort_order-b.sort_order)})); }

/* ───── Coupons & gift codes ───── */
async function coupons(){
  const [{ data, error }] = await Promise.all([ sb.from('ra_coupons').select('*').order('created_at',{ascending:false}), ensureProductsFresh() ]);
  if(error) throw error;
  const pn = Object.fromEntries(A.products.map(p=>[p.id,p.name]));
  const st = c => !c.active ? '<span class="st cancelled">ناچالاک</span>' : c.expires_at && new Date(c.expires_at) < new Date() ? '<span class="st cancelled">بەسەرچووە</span>' : c.max_uses && c.used_count >= c.max_uses ? '<span class="st refunded">تەواوبووە</span>' : '<span class="st delivered">چالاک</span>';
  $('#view').innerHTML = head('کوپۆن و کۆدی دیاری', `<button class="btn" id="gNew">🎁 کۆدی دیاری</button><button class="btn btn-p" id="cNew">🏷️ کوپۆنی داشکاندن</button>`) + `
    <div class="note-box" style="margin-bottom:14px">🏷️ <b>کوپۆنی داشکاندن:</b> کڕیار لە کاتی کڕین یان لە جزدان دەینووسێت و داشکاندن وەردەگرێت. &nbsp; 🎁 <b>کۆدی دیاری:</b> کڕیار لە جزدان دەینووسێت و بڕەکە دەچێتە سەر باڵانسی.<br>ئەگەر کڕیار ئاستی (زیو/زێڕ) هەبێت، تەنها داشکاندنی گەورەتر دەدرێت — پێکەوە کۆ نابنەوە.</div>
    <div class="tbl-wrap"><table class="tbl rtbl"><thead><tr><th>کۆد</th><th>جۆر</th><th>بەها</th><th>بەکارهێنان</th><th>بەسەرچوون</th><th>دۆخ</th><th></th></tr></thead><tbody>
    ${(data||[]).map(c => `<tr>${td('کۆد',`<b class="ltr mono">${esc(c.code)}</b> <button class="btn btn-sm" data-cpc="${esc(c.code)}">${I.copy}</button>${c.note?`<br><small class="muted">${esc(c.note)}</small>`:''}`)}${td('جۆر', c.kind==='gift'?'🎁 دیاری':'🏷️ داشکاندن')}
      ${td('بەها', c.kind==='gift' ? `<b class="num">${num(c.amount)}</b>${cur}` : `${c.percent?`<b class="num">${c.percent}٪</b>`:''}${c.amount?` <b class="num">${num(c.amount)}</b>${cur}`:''}${c.min_total?`<br><small class="muted">کەمترین: ${num(c.min_total)}</small>`:''}${c.product_ids&&c.product_ids.length?`<br><small class="muted">${c.product_ids.map(i=>esc(pn[i]||'?')).join('، ')}</small>`:''}`)}
      ${td('بەکارهێنان',`<span class="num">${num(c.used_count)}${c.max_uses?' / '+num(c.max_uses):''}</span><br><small class="muted">هەر کەسێک ${c.per_user} جار</small>`)}${td('بەسەرچوون', c.expires_at?`<small>${dt(c.expires_at)}</small>`:'<small class="muted">بێ کۆتایی</small>')}${td('دۆخ', st(c))}
      ${td('',`<span class="row-acts"><button class="btn btn-sm" data-ce="${c.id}">دەستکاری</button></span>`,'act')}</tr>`).join('') || `<tr class="empty-row"><td colspan="7"><div class="empty"><div class="e">🏷️</div>هێشتا هیچ کۆدێک نییە</div></td></tr>`}
    </tbody></table></div>`;
  $('#cNew').onclick = () => editCoupon(null, 'discount');
  $('#gNew').onclick = () => editCoupon(null, 'gift');
  $$('[data-ce]').forEach(b => b.onclick = () => editCoupon((data||[]).find(x=>x.id===b.dataset.ce)));
  $$('[data-cpc]').forEach(b => b.onclick = () => copyText(b.dataset.cpc));
}
function editCoupon(c, kind){
  const isNew = !c; c = c || { code:randCode(8), kind, percent:kind==='gift'?0:10, amount:kind==='gift'?5000:0, min_total:0, max_uses:null, per_user:1, product_ids:null, expires_at:null, active:true, note:'' };
  const gift = c.kind === 'gift';
  const m = modal(`<div class="modal-h"><h3>${gift?'🎁 کۆدی دیاری':'🏷️ کوپۆنی داشکاندن'}${isNew?' — نوێ':''}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="field"><label>کۆد (تەنها پیت و ژمارەی ئینگلیزی)</label><div class="inline-form"><input class="inp ltr-inp mono" id="kC" value="${esc(c.code)}" maxlength="40" style="text-transform:uppercase"><button type="button" class="btn" id="kR">🎲 هەڕەمەکی</button></div></div>
    ${gift ? `<div class="field"><label>بڕی دیاری (دینار) — دەچێتە سەر باڵانسی کڕیار</label><input class="inp num-inp" type="number" id="kA" value="${Number(c.amount)||''}"></div>`
    : `<div class="row2"><div class="field"><label>داشکاندن بە ڕێژە (٪)</label><input class="inp num-inp" type="number" id="kP" min="0" max="90" value="${Number(c.percent)||''}" placeholder="10"></div>
        <div class="field"><label>یان بڕی دیاریکراو (دینار)</label><input class="inp num-inp" type="number" id="kA" value="${Number(c.amount)||''}" placeholder="0"></div></div>
      <div class="field"><label>کەمترین نرخی کڕین (ئارەزوومەندانە)</label><input class="inp num-inp" type="number" id="kMin" value="${Number(c.min_total)||''}" placeholder="0"></div>
      <div class="field"><label>تەنها بۆ ئەم بەرهەمانە (هیچ هەڵمەبژێرە = هەموو بەرهەمەکان)</label><div class="chk-grid">${A.products.map(p=>`<label class="check"><input type="checkbox" data-kp="${p.id}" ${(c.product_ids||[]).includes(p.id)?'checked':''}> ${esc(p.name)}</label>`).join('')}</div></div>`}
    <div class="row2"><div class="field"><label>کۆی ژمارەی بەکارهێنان (بەتاڵ = بێ سنوور)</label><input class="inp num-inp" type="number" id="kMax" value="${c.max_uses??''}" placeholder="∞"></div>
      <div class="field"><label>هەر کڕیارێک چەند جار</label><input class="inp num-inp" type="number" id="kPU" min="1" value="${Number(c.per_user)||1}"></div></div>
    <div class="row2"><div class="field"><label>بەرواری بەسەرچوون (ئارەزوومەندانە)</label><input class="inp" type="datetime-local" id="kE" value="${toLocalInput(c.expires_at)}"></div>
      <div class="field"><label>دۆخ</label><div class="sw-row"><label class="check">${sw('kAct', c.active)} چالاک</label></div></div></div>
    <div class="field"><label>تێبینی بۆ خۆت (ئارەزوومەندانە)</label><input class="inp" id="kN" value="${esc(c.note||'')}" placeholder="بۆ نموونە: ئۆفەری جەژن"></div>
    <div class="row-btns"><button class="btn btn-p btn-lg btn-block" id="kS">پاشەکەوتکردن</button>${!isNew?'<button class="btn btn-bad btn-lg" id="kD">سڕینەوە</button>':''}</div>`, {wide:true, sticky:true});
  $('#kR', m.el).onclick = () => $('#kC', m.el).value = randCode(8);
  $('#kS', m.el).onclick = async e => {
    const code = $('#kC', m.el).value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'');
    if(code.length < 3) return toast('کۆدەکە لانیکەم ٣ پیت بێت','bad');
    const row = { code, kind:c.kind, amount:Math.max(0, Math.floor(Number($('#kA', m.el).value||0))), per_user:Math.max(1, Math.floor(Number($('#kPU', m.el).value||1))),
      max_uses: $('#kMax', m.el).value ? Math.max(1, Math.floor(Number($('#kMax', m.el).value))) : null, expires_at: fromLocalInput($('#kE', m.el).value), active:$('#kAct', m.el).checked, note:$('#kN', m.el).value.trim() };
    if(gift){ row.percent = 0; if(!row.amount) return toast('بڕی دیاری بنووسە','bad'); }
    else { row.percent = Math.max(0, Math.min(90, Math.floor(Number($('#kP', m.el).value||0)))); row.min_total = Math.max(0, Math.floor(Number($('#kMin', m.el).value||0)));
      const ids = $$('[data-kp]', m.el).filter(x=>x.checked).map(x=>x.dataset.kp); row.product_ids = ids.length ? ids : null;
      if(!row.percent && !row.amount) return toast('ڕێژە یان بڕی داشکاندن بنووسە','bad'); }
    setBusy(e.currentTarget, true);
    const r = isNew ? await sb.from('ra_coupons').insert(row) : await sb.from('ra_coupons').update(row).eq('id', c.id);
    setBusy(e.currentTarget, false, 'پاشەکەوتکردن');
    if(r.error) return toast(/duplicate|unique/i.test(r.error.message) ? 'ئەم کۆدە پێشتر هەیە' : errMsg(r.error),'bad');
    copyText(code); toast(`✓ پاشەکەوت کرا — کۆدی ${code} کۆپی کرا`,'ok'); m.close(); coupons();
  };
  const d = $('#kD', m.el); if(d) d.onclick = async () => { if(!(await confirmBox('سڕینەوە؟', c.code, 'سڕینەوە', true))) return; const r = await sb.from('ra_coupons').delete().eq('id', c.id); if(r.error) return toast(errMsg(r.error),'bad'); m.close(); coupons(); };
}

/* ───── Bundles ───── */
async function bundles(){
  const [{ data, error }, vars] = await Promise.all([ sb.from('ra_bundles').select('*').order('sort_order'), allVariants() ]);
  if(error) throw error;
  const vm = Object.fromEntries(vars.map(v=>[v.id,v]));
  const totals = b => { const items = (b.items||[]).map(id=>vm[id]).filter(Boolean); const full = items.reduce((a,v)=>a+Number(v.price),0); const paid = items.reduce((a,v)=>a+(Number(v.price)-Math.floor(Number(v.price)*b.percent/100)),0); return { items, full, paid }; };
  $('#view').innerHTML = head('پاکێجەکان', `<button class="btn btn-p" id="bNew">+ پاکێجی نوێ</button>`) + `
    <div class="note-box" style="margin-bottom:14px">چەند پلانێک لە بەرهەمە جیاوازەکان پێکەوە بە داشکاندنێک کە خۆت دیاری دەکەیت. کڕیار بە یەک کلیک هەموویان دەکڕێت و هەر یەکێکیان جیا دەگەیەنرێت (ئەوەی لە کۆگا هەیە خۆکارانە).</div>
    <div class="list">${(data||[]).map(b => { const t = totals(b); return `<div class="prow ${b.active?'':'off'}"><div class="th">${safeUrl(b.image_url)?`<img src="${esc(b.image_url)}" alt="">`:esc(b.emoji||'🎁')}</div>
      <div class="grow"><b>${esc(b.name)} <span class="sub-pill num">−${b.percent}٪</span> ${b.active?'':'<span class="st cancelled">شاراوە</span>'}</b><small class="muted">${t.items.map(v=>esc(v.pname+' — '+v.name)).join(' + ') || '⚠️ هیچ پلانێک نییە'}</small>
      <small><s class="muted num">${num(t.full)}</s> → <b class="num">${num(t.paid)}</b>${cur}</small></div>
      <div class="acts"><button class="btn btn-sm btn-p" data-be="${b.id}">دەستکاری</button></div></div>`; }).join('') || '<div class="empty"><div class="e">🎁</div>هێشتا هیچ پاکێجێک نییە</div>'}</div>`;
  $('#bNew').onclick = () => editBundle(null, vars);
  $$('[data-be]').forEach(x => x.onclick = () => editBundle((data||[]).find(b=>b.id===x.dataset.be), vars));
}
function editBundle(b, vars){
  const isNew = !b; b = b || { name:'', name_en:'', name_ar:'', short:'', short_en:'', short_ar:'', image_url:'', emoji:'🎁', percent:15, items:[], active:true };
  let items = [...(b.items||[])];
  const vm = Object.fromEntries(vars.map(v=>[v.id,v]));
  const m = modal(`<div class="modal-h"><h3>${isNew?'پاکێجی نوێ':'دەستکاری — '+esc(b.name)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="row2"><div class="field"><label>ناوی پاکێج *</label><input class="inp" id="bN" value="${esc(b.name)}" placeholder="پاکێجی دیزاینەر"></div>
      <div class="field"><label>ڕێژەی داشکاندن (٪)</label><input class="inp num-inp" type="number" id="bP" min="0" max="90" value="${Number(b.percent)||0}"></div></div>
    <div class="field"><label>کورتە</label><input class="inp" id="bS" value="${esc(b.short||'')}" placeholder="بۆ نموونە: Canva + CapCut بە نرخێکی تایبەت"></div>
    <div class="row2"><div class="field"><label>Name (English)</label><input class="inp" dir="ltr" id="bNe" value="${esc(b.name_en||'')}"></div><div class="field"><label>الاسم (العربية)</label><input class="inp" dir="rtl" id="bNa" value="${esc(b.name_ar||'')}"></div></div>
    <div class="row2"><div class="field"><label>Short (English)</label><input class="inp" dir="ltr" id="bSe" value="${esc(b.short_en||'')}"></div><div class="field"><label>وصف قصير (العربية)</label><input class="inp" dir="rtl" id="bSa" value="${esc(b.short_ar||'')}"></div></div>
    <button type="button" class="btn btn-ai btn-sm" id="bTr" style="margin:-6px 0 12px">✨ وەرگێڕان بە AI</button>
    ${imgField('bI', b.image_url, 'وێنە (ئارەزوومەندانە)')}
    <div class="row2"><div class="field"><label>ئیمۆجی</label><input class="inp" id="bE" value="${esc(b.emoji||'🎁')}" maxlength="8"></div><div class="field"><label>دۆخ</label><div class="sw-row"><label class="check">${sw('bAct', b.active)} چالاک</label></div></div></div>
    <div class="field"><label>پلانەکانی ناو پاکێج (لانیکەم ٢)</label><select class="inp" id="bAdd"><option value="">+ زیادکردنی پلان...</option>${vars.filter(v=>v.active).map(v=>`<option value="${v.id}">${esc(v.pname)} — ${esc(v.name)} (${num(v.price)})</option>`).join('')}</select></div>
    <div id="bItems"></div><div class="sub-sum" id="bSum"></div>
    <div class="row-btns"><button class="btn btn-p btn-lg btn-block" id="bSave">پاشەکەوتکردن</button>${!isNew?'<button class="btn btn-bad btn-lg" id="bDel">سڕینەوە</button>':''}</div>`, {wide:true, sticky:true});
  bindImgFields(m.el, 'products');
  const draw = () => {
    const pct = Math.max(0, Math.min(90, Number($('#bP', m.el).value)||0));
    $('#bItems', m.el).innerHTML = items.map((id,i) => { const v = vm[id]; return `<div class="item" style="padding:8px 10px"><div class="grow"><b>${esc(v?v.pname:'?')} — ${esc(v?v.name:'')}</b><small><s class="muted num">${num(v?.price)}</s> → <b class="num">${num(v?Number(v.price)-Math.floor(Number(v.price)*pct/100):0)}</b></small></div><button class="btn btn-sm btn-bad" data-bi="${i}">✕</button></div>`; }).join('') || '<div class="muted" style="font-size:13px;margin-bottom:10px">هیچ پلانێک زیاد نەکراوە</div>';
    const full = items.reduce((a,id)=>a+Number(vm[id]?.price||0),0), paid = items.reduce((a,id)=>{ const p = Number(vm[id]?.price||0); return a + p - Math.floor(p*pct/100); },0);
    $('#bSum', m.el).innerHTML = `<span>کۆی نرخی ئاسایی: <s class="num">${num(full)}</s>${cur}</span><b style="font-size:16px">نرخی پاکێج: <span class="num">${num(paid)}</span>${cur} <span class="sub-pill">کڕیار ${num(full-paid)} دینار دەپارێزێت</span></b>`;
    $$('[data-bi]', m.el).forEach(x => x.onclick = () => { items.splice(+x.dataset.bi, 1); draw(); });
  };
  $('#bAdd', m.el).onchange = e => { const v = e.target.value; if(v && !items.includes(v)) items.push(v); e.target.value = ''; draw(); };
  $('#bP', m.el).oninput = draw; draw();
  $('#bTr', m.el).onclick = async e => { const btn = e.currentTarget; setBusy(btn, true);
    const out = await ai(`Translate this Kurdish (Sorani) bundle name and short text for an online store into English and Arabic. Keep brand names. Return JSON {"en":{"name":"","short":""},"ar":{"name":"","short":""}}.\n\n${JSON.stringify({ name:$('#bN', m.el).value, short:$('#bS', m.el).value })}`, true);
    setBusy(btn, false); if(!out) return; const j = parseAI(out); if(!j) return toast('وەڵامی AI تێکچوو','bad');
    $('#bNe', m.el).value = j.en?.name||''; $('#bSe', m.el).value = j.en?.short||''; $('#bNa', m.el).value = j.ar?.name||''; $('#bSa', m.el).value = j.ar?.short||''; toast('✓ وەرگێڕدرا','ok'); };
  $('#bSave', m.el).onclick = async e => {
    const row = { name:$('#bN', m.el).value.trim(), short:$('#bS', m.el).value.trim(), name_en:$('#bNe', m.el).value.trim(), name_ar:$('#bNa', m.el).value.trim(), short_en:$('#bSe', m.el).value.trim(), short_ar:$('#bSa', m.el).value.trim(),
      image_url:$('#bI', m.el).value.trim(), emoji:$('#bE', m.el).value.trim()||'🎁', percent:Math.max(0, Math.min(90, Math.floor(Number($('#bP', m.el).value)||0))), items, active:$('#bAct', m.el).checked };
    if(!row.name) return toast('ناوی پاکێج بنووسە','bad');
    if(items.length < 2) return toast('لانیکەم ٢ پلان زیاد بکە','bad');
    setBusy(e.currentTarget, true);
    const r = isNew ? await sb.from('ra_bundles').insert(row) : await sb.from('ra_bundles').update(row).eq('id', b.id);
    setBusy(e.currentTarget, false, 'پاشەکەوتکردن'); if(r.error) return toast(errMsg(r.error),'bad');
    toast('✓ پاشەکەوت کرا','ok'); m.close(); bundles();
  };
  const d = $('#bDel', m.el); if(d) d.onclick = async () => { if(!(await confirmBox('سڕینەوە؟', b.name, 'سڕینەوە', true))) return; const r = await sb.from('ra_bundles').delete().eq('id', b.id); if(r.error) return toast(errMsg(r.error),'bad'); m.close(); bundles(); };
}

/* ───── Tickets ───── */
const TCAT = { order:'📦 داواکاری', payment:'💳 پارەدان', account:'👤 ئەکاونت', other:'💬 هیتر' };
const TST = { open:['کراوە','pending'], answered:['وەڵامدراوە','delivered'], closed:['داخراوە','cancelled'] };
let tkFilter = 'open';
async function tickets(){
  let q = sb.from('ra_tickets').select('*').order('updated_at',{ascending:false}).limit(300);
  if(tkFilter !== 'all') q = q.eq('status', tkFilter);
  const { data, error } = await q; if(error) throw error;
  const cm = await customerMap([...new Set((data||[]).map(x=>x.user_id))]);
  $('#view').innerHTML = head('تیکێتەکانی پشتگیری') + `
    <div class="tabs2">${[['open','کراوە'],['answered','وەڵامدراوە'],['closed','داخراوە'],['all','هەمووی']].map(([k,l])=>`<button class="chip ${tkFilter===k?'on':''}" data-tf="${k}">${l}</button>`).join('')}</div>
    <div class="list">${(data||[]).map(x => { const c = cm[x.user_id]||{}; return `<button class="item item-btn ${x.unread_admin?'unread-row':''}" data-tk="${x.id}"><div class="ic">🎫</div><div class="grow"><b>#${x.ticket_no} · ${esc(x.subject)}</b><small>${esc(c.full_name||c.email||'')} · ${TCAT[x.category]||''} · ${ago(x.updated_at)}</small></div><span class="st ${TST[x.status][1]}">${TST[x.status][0]}</span></button>`; }).join('') || '<div class="empty"><div class="e">🎫</div>هیچ تیکێتێک نییە</div>'}</div>`;
  $$('[data-tf]').forEach(b => b.onclick = () => { tkFilter = b.dataset.tf; tickets(); });
  $$('[data-tk]').forEach(b => b.onclick = () => { const x = data.find(t=>t.id===b.dataset.tk); openTicket(x, cm[x.user_id]||{}); });
}
async function openTicket(tk, c){
  const [{ data:msgs }, ord, qr] = await Promise.all([ sb.from('ra_ticket_msgs').select('*').eq('ticket_id', tk.id).order('id'), tk.order_id ? sb.from('ra_orders').select('order_no,product_name,variant_name,status').eq('id', tk.order_id).maybeSingle() : Promise.resolve({data:null}), quickReplies() ]);
  const o = ord.data;
  const m = modal(`<div class="modal-h"><h3>🎫 #${tk.ticket_no} · ${esc(tk.subject)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="sub-sum"><b>${esc(c.full_name||'—')} <span class="muted ltr">${esc(c.email||'')}</span></b><small>${TCAT[tk.category]||''} · ${dt(tk.created_at)} · <span class="st ${TST[tk.status][1]}">${TST[tk.status][0]}</span>${o?` · 📦 #${o.order_no} ${esc(o.product_name)} — ${esc(o.variant_name)}`:''}</small></div>
    <div class="tk-msgs">${(msgs||[]).map(x=>`<div class="cm ${x.sender==='admin'?'me':'them'}"><div class="cb">${esc(x.body)}</div><span class="ct">${dt(x.created_at)}</span></div>`).join('')}</div>
    ${qr.length?`<div class="pal-row" style="margin:10px 0">${qr.map((q,i)=>`<button class="chip" data-qr="${i}">⚡ ${esc(q.title)}</button>`).join('')}</div>`:''}
    <div class="field"><textarea class="inp" id="tkR" rows="4" placeholder="وەڵامەکەت بنووسە..."></textarea></div>
    <div class="row-btns"><button class="btn btn-ai" id="tkAi">✨</button><button class="btn btn-p btn-block" id="tkS">ناردنی وەڵام</button><button class="btn btn-block" id="tkSC">ناردن و داخستن</button>${tk.status!=='closed'?'<button class="btn btn-bad" id="tkC">داخستن</button>':''}</div>
    <button class="btn btn-sm" id="tkChat" style="margin-top:10px">💬 کردنەوەی چاتی ئەم کڕیارە</button>`, {wide:true});
  const box = $('.tk-msgs', m.el); box.scrollTop = box.scrollHeight;
  if(tk.unread_admin) sb.rpc('ra_admin_ticket_reply', { p_ticket:tk.id, p_body:'', p_close:false }).then(()=>refreshBadges());
  $$('[data-qr]', m.el).forEach(b => b.onclick = () => { const t = $('#tkR', m.el); t.value = (t.value ? t.value + '\n' : '') + qr[+b.dataset.qr].body; t.focus(); });
  const send = async (close, btn) => { const body = $('#tkR', m.el).value.trim(); if(!body && !close) return toast('وەڵامەکە بنووسە','bad'); setBusy(btn, true);
    const { error } = await sb.rpc('ra_admin_ticket_reply', { p_ticket:tk.id, p_body:body, p_close:close }); setBusy(btn, false, btn.dataset.l || '✓');
    if(error) return toast(errMsg(error),'bad'); toast(body ? '✓ وەڵام نێردرا — کڕیار لە چاتیش ئاگادار کرایەوە' : '✓ داخرا','ok'); m.close(); refreshBadges(); if(A.tab==='tickets') tickets(); };
  $('#tkS', m.el).onclick = e => send(false, e.currentTarget);
  $('#tkSC', m.el).onclick = e => send(true, e.currentTarget);
  const cl = $('#tkC', m.el); if(cl) cl.onclick = e => send(true, e.currentTarget);
  $('#tkChat', m.el).onclick = () => { m.close(); chatSel = tk.user_id; location.hash = '#chat'; };
  $('#tkAi', m.el).onclick = async e => { const btn = e.currentTarget; setBusy(btn, true);
    const hist = (msgs||[]).map(x => (x.sender==='user'?'Customer: ':'Store: ') + x.body).join('\n');
    const out = await ai(`You are the store's support agent. Write a short, polite, helpful reply to this support ticket in the SAME language the customer used. Subject: ${tk.subject}. ${o?`Order: ${o.product_name} — ${o.variant_name} (status ${o.status}).`:''} Do not promise things you don't know. Only output the reply.\n\n${hist}`);
    setBusy(btn, false, '✨'); if(out){ $('#tkR', m.el).value = out; } };
}

/* ───── Quick replies ───── */
async function quickReplies(){ const v = await kvGet('quick_replies'); return Array.isArray(v) ? v : []; }
async function manageQuickReplies(after){
  let list = await quickReplies(); if(!list.length) list = [{ title:'سڵاو', body:'سڵاو گیان، بەخێربێیت 🌷 چۆن دەتوانین یارمەتیت بدەین؟' },{ title:'پارەدان وەرگیرا', body:'پارەکەت وەرگیرا ✓ باڵانسەکەت زیادکرا، ئێستا دەتوانیت بکڕیت.' },{ title:'کەمێک چاوەڕێ بە', body:'تکایە کەمێک چاوەڕێ بە، ئێستا بۆت دەنێرین 🙏' }];
  const m = modal(`<div class="modal-h"><h3>⚡ وەڵامە ئامادەکان</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="note-box" style="margin-bottom:12px">ئەو وەڵامانەی زۆر دووبارەیان دەکەیتەوە لێرە بنووسە. لە چات و تیکێت بە یەک کلیک دەینێریت.</div>
    <div id="qrL"></div><button class="btn btn-block" id="qrAdd" style="margin:10px 0">+ وەڵامی نوێ</button><button class="btn btn-p btn-lg btn-block" id="qrS">پاشەکەوتکردن</button>`, {wide:true, sticky:true});
  const draw = () => { $('#qrL', m.el).innerHTML = list.map((q,i)=>`<div class="qr-row"><input class="inp" data-qt="${i}" value="${esc(q.title)}" placeholder="ناونیشان" maxlength="40"><textarea class="inp" data-qb="${i}" rows="2" placeholder="دەقی وەڵام">${esc(q.body)}</textarea><button class="btn btn-sm btn-bad" data-qd="${i}">✕</button></div>`).join('');
    $$('[data-qt]', m.el).forEach(x => x.oninput = () => list[x.dataset.qt].title = x.value);
    $$('[data-qb]', m.el).forEach(x => x.oninput = () => list[x.dataset.qb].body = x.value);
    $$('[data-qd]', m.el).forEach(x => x.onclick = () => { list.splice(+x.dataset.qd,1); draw(); }); };
  draw();
  $('#qrAdd', m.el).onclick = () => { list.push({ title:'', body:'' }); draw(); };
  $('#qrS', m.el).onclick = async e => { setBusy(e.currentTarget, true); const clean = list.filter(q=>q.title.trim() && q.body.trim()).map(q=>({ title:q.title.trim(), body:q.body.trim() }));
    const { error } = await kvSet('quick_replies', clean); setBusy(e.currentTarget, false, 'پاشەکەوتکردن'); if(error) return toast(errMsg(error),'bad'); toast('✓ پاشەکەوت کرا','ok'); m.close(); if(after) after(); };
}
async function quickReplyPicker(onPick){
  const list = await quickReplies();
  const m = modal(`<div class="modal-h"><h3>⚡ وەڵامی ئامادە</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="list">${list.map((q,i)=>`<button class="item item-btn" data-qp="${i}"><div class="grow"><b>${esc(q.title)}</b><small>${esc(q.body.slice(0,120))}</small></div></button>`).join('') || '<div class="empty">هێشتا هیچ وەڵامێکی ئامادە نییە</div>'}</div>
    <button class="btn btn-block" id="qpM" style="margin-top:12px">✏️ ڕێکخستنی وەڵامەکان</button>`, {wide:true});
  $$('[data-qp]', m.el).forEach(b => b.onclick = () => { m.close(); onPick(list[+b.dataset.qp].body); });
  $('#qpM', m.el).onclick = () => { m.close(); manageQuickReplies(); };
}

/* ───── Writer (AI) + message to customers ───── */
const WR_TOOLS = [
  ['fix','✅ ڕاستکردنەوەی ڕێنووس','Correct the spelling, grammar and punctuation of this text. Keep the same language (usually Kurdish Sorani) and the same meaning and tone. Use proper Kurdish letters (ڕ ڵ ۆ ێ ە). Only output the corrected text.'],
  ['nice','✨ جوانکردن و ڕێکخستن','Rewrite this text so it reads more professional, friendly and clear for customers of an online store. Keep the same language and meaning, keep it concise, you may add a few fitting emojis. Only output the new text.'],
  ['short','✂️ کورتکردنەوە','Make this text shorter and punchier while keeping the key information. Same language. Only output the text.'],
  ['promo','📣 کردن بە ڕیکلام','Turn this into an attractive promotional message for customers (social-media style, clear call to action, fitting emojis). Same language. Only output the message.'],
  ['ar','🇮🇶 وەرگێڕان بۆ عەرەبی','Translate this text into natural Modern Standard Arabic suitable for customers. Keep brand names. Only output the translation.'],
  ['en','🇬🇧 وەرگێڕان بۆ ئینگلیزی','Translate this text into natural, simple English suitable for customers. Keep brand names. Only output the translation.'],
  ['ku','🟡 وەرگێڕان بۆ کوردی','Translate this text into correct Central Kurdish (Sorani) in Arabic script with proper Kurdish letters. Keep brand names. Only output the translation.']
];
async function writer(){
  await ensureProductsFresh();
  $('#view').innerHTML = head('نووسین و ناردن', '<span class="muted" style="font-size:13px">یاریدەدەری AI — تەنها بۆ تۆ</span>') + `
    <div class="two">
      <div class="panel"><h3>✍️ دەقەکەت بنووسە</h3>
        <div class="field"><textarea class="inp" id="wIn" rows="9" placeholder="هەر شتێک بنووسە — نامە بۆ کڕیار، ڕیکلام، وەسفی بەرهەم... پاشان AI ڕاستی دەکاتەوە و جوانی دەکات."></textarea></div>
        <div class="wr-tools">${WR_TOOLS.map(([k,l])=>`<button class="btn btn-sm" data-wt="${k}">${l}</button>`).join('')}</div>
        <div class="field" style="margin-top:12px"><label>یان داواکاری تایبەت بنووسە</label><div class="inline-form"><input class="inp" id="wAsk" placeholder="بۆ نموونە: بە شێوەیەکی گاڵتەئامێز بینووسە"><button class="btn btn-ai" id="wGo">✨</button></div></div></div>
      <div class="panel"><h3 class="h-row">ئەنجام <span class="row-acts"><button class="btn btn-sm" id="wCp">${I.copy} کۆپی</button><button class="btn btn-sm" id="wUse">⬅ بیگوازەوە بۆ نووسین</button></span></h3>
        <div class="ai-out" id="wOut" style="min-height:180px"><span class="muted">ئەنجامی AI لێرە دەردەکەوێت</span></div>
        <h3 style="margin-top:18px">📤 ناردن بۆ کڕیاران (لە چات)</h3>
        <div class="row2"><div class="field"><label>بۆ کێ؟</label><select class="inp" id="wTo"><option value="all">هەموو کڕیاران</option><option value="product">ئەوانەی بەرهەمێکی دیاریکراویان کڕیوە</option><option value="tier">بە پێی ئاست</option></select></div>
          <div class="field" id="wToX"></div></div>
        <label class="check" style="margin:4px 0 12px"><input type="checkbox" id="wUseOut" checked> ئەنجامی AI بنێرە (ئەگەر نا، دەقی لای ڕاست)</label>
        <button class="btn btn-p btn-lg btn-block" id="wSend">📤 ناردن</button></div>
    </div>`;
  let last = '';
  const run = async (instr, btn) => { const txt = $('#wIn').value.trim(); if(!txt) return toast('سەرەتا دەقێک بنووسە','bad'); setBusy(btn, true);
    const out = await ai(`${instr}\n\nText:\n${txt}`); setBusy(btn, false, btn.dataset.l || btn.textContent);
    if(out){ last = out; $('#wOut').textContent = out; } };
  $$('[data-wt]').forEach(b => { b.dataset.l = b.textContent; b.onclick = () => run(WR_TOOLS.find(x=>x[0]===b.dataset.wt)[2], b); });
  $('#wGo').onclick = e => { const a = $('#wAsk').value.trim(); if(!a) return toast('داواکارییەکەت بنووسە','bad'); e.currentTarget.dataset.l = '✨'; run(`Follow this instruction from the store owner about the text below. Instruction: ${a}\nOnly output the resulting text.`, e.currentTarget); };
  $('#wCp').onclick = () => last ? copyText(last) : toast('هێشتا ئەنجامێک نییە','bad');
  $('#wUse').onclick = () => { if(last){ $('#wIn').value = last; toast('✓'); } };
  const drawTo = () => { const v = $('#wTo').value; $('#wToX').innerHTML = v === 'product' ? `<label>بەرهەم</label><select class="inp" id="wP">${A.products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>`
    : v === 'tier' ? `<label>ئاست</label><select class="inp" id="wT"><option value="bronze">🥉 بڕۆنز</option><option value="silver">🥈 زیو</option><option value="gold">🥇 زێڕ</option></select>` : ''; };
  $('#wTo').onchange = drawTo; drawTo();
  $('#wSend').onclick = async e => {
    const body = ($('#wUseOut').checked && last ? last : $('#wIn').value).trim(); if(!body) return toast('دەقی نامەکە بەتاڵە','bad');
    const to = $('#wTo').value; const p_product = to === 'product' ? $('#wP').value : null; const p_tier = to === 'tier' ? $('#wT').value : null;
    const who = to === 'all' ? 'هەموو کڕیاران' : to === 'product' ? 'کڕیارانی ' + (A.products.find(p=>p.id===p_product)?.name||'') : 'ئاستی ' + ({bronze:'بڕۆنز',silver:'زیو',gold:'زێڕ'})[p_tier];
    if(!(await confirmBox('ناردن بۆ ' + who + '؟', body.slice(0, 300), 'ناردن'))) return;
    const btn = e.currentTarget; setBusy(btn, true);
    const { data, error } = await sb.rpc('ra_admin_broadcast', { p_body:body, p_product, p_tier });
    setBusy(btn, false, '📤 ناردن'); if(error) return toast(errMsg(error),'bad');
    toast(`✓ بۆ ${num(data)} کڕیار نێردرا`,'ok');
  };
}

/* ───── Backups ───── */
async function backups(){
  const { data, error } = await sb.from('ra_backups').select('id,created_at,size').order('created_at',{ascending:false}).limit(30);
  if(error) throw error;
  $('#view').innerHTML = head('باکئەپ', `<button class="btn btn-p" id="bkNow">💾 باکئەپی ئێستا</button>`) + `
    <div class="note-box" style="margin-bottom:14px">هەموو شەوێک کاتژمێر ٣ی بەیانی (کاتی عێراق) باکئەپێکی تەواو خۆکارانە دروست دەکرێت: بەرهەم، پلان، کۆگا، کڕیار، باڵانس، فرۆشتن، پارەدان، کوپۆن، تیکێت و ڕێکخستنەکان. دوایین ١٤ ڕۆژ هەڵدەگیرێن. دەتوانیت هەر کاتێک دایبگریت و لە کۆمپیوتەرەکەت هەڵیبگریت.</div>
    <div class="list">${(data||[]).map(b=>`<div class="item"><div class="ic">💾</div><div class="grow"><b>${dt(b.created_at)}</b><small class="num">${(b.size/1024).toFixed(1)} KB</small></div><button class="btn btn-sm btn-p" data-bk="${b.id}">⬇ داگرتن</button></div>`).join('') || '<div class="empty"><div class="e">💾</div>هێشتا هیچ باکئەپێک نییە — «باکئەپی ئێستا» دابگرە</div>'}</div>`;
  $('#bkNow').onclick = async e => { setBusy(e.currentTarget, true); const { error } = await sb.rpc('ra_admin_backup_now'); setBusy(e.currentTarget, false, '💾 باکئەپی ئێستا'); if(error) return toast(errMsg(error),'bad'); toast('✓ باکئەپ دروست کرا','ok'); backups(); };
  $$('[data-bk]').forEach(b => b.onclick = async () => { setBusy(b, true); const { data:row, error } = await sb.from('ra_backups').select('created_at,data').eq('id', b.dataset.bk).single(); setBusy(b, false, '⬇ داگرتن');
    if(error) return toast(errMsg(error),'bad');
    const blob = new Blob([JSON.stringify(row.data, null, 1)], { type:'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'realm-academy-backup-' + String(row.created_at).slice(0,10) + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 5000); });
}

/* ───── Bulk price change ───── */
async function bulkPrice(){
  await ensureProductsFresh();
  const m = modal(`<div class="modal-h"><h3>💲 گۆڕینی نرخ بە کۆمەڵ</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="field"><label>بەرهەمەکان</label><div class="chk-grid"><label class="check"><input type="checkbox" id="bpAll" checked> <b>هەموو بەرهەمەکان</b></label>${A.products.map(p=>`<label class="check"><input type="checkbox" data-bp="${p.id}" checked> ${esc(p.name)}</label>`).join('')}</div></div>
    <div class="row2"><div class="field"><label>گۆڕین</label><select class="inp" id="bpDir"><option value="up">⬆ زیادکردن</option><option value="down">⬇ کەمکردنەوە</option></select></div>
      <div class="field"><label>بە</label><div class="inline-form"><input class="inp num-inp" type="number" id="bpVal" value="10"><select class="inp" id="bpMode" style="max-width:120px"><option value="pct">٪</option><option value="amt">دینار</option></select></div></div></div>
    <label class="check" style="margin-bottom:10px"><input type="checkbox" id="bpRound" checked> خڕکردنەوە بۆ نزیکترین ٢٥٠ دینار</label>
    <label class="check" style="margin-bottom:12px"><input type="checkbox" id="bpOld"> نرخی ئێستا بکە بە «نرخی پێشوو» (بۆ پیشاندانی داشکاندن کاتێک نرخ کەم دەکەیتەوە)</label>
    <div class="tbl-wrap" style="max-height:300px;overflow:auto"><table class="tbl"><thead><tr><th>پلان</th><th>ئێستا</th><th>نوێ</th></tr></thead><tbody id="bpPrev"></tbody></table></div>
    <button class="btn btn-p btn-lg btn-block" id="bpGo" style="margin-top:12px">✓ جێبەجێکردن</button>`, {wide:true, sticky:true});
  const calc = () => { const dir = $('#bpDir', m.el).value, val = Number($('#bpVal', m.el).value)||0, mode = $('#bpMode', m.el).value, round = $('#bpRound', m.el).checked;
    const ids = $$('[data-bp]', m.el).filter(x=>x.checked).map(x=>x.dataset.bp);
    return A.products.filter(p=>ids.includes(p.id)).flatMap(p => (p.variants||[]).map(v => { let n = mode==='pct' ? Number(v.price) * (1 + (dir==='up'?1:-1) * val/100) : Number(v.price) + (dir==='up'?1:-1) * val;
      n = round ? Math.round(n/250)*250 : Math.round(n); n = Math.max(0, n); return { v, p, n }; })); };
  const draw = () => { $('#bpPrev', m.el).innerHTML = calc().map(({v,p,n}) => `<tr><td>${esc(p.name)} — ${esc(v.name)}</td><td><span class="num">${num(v.price)}</span></td><td><b class="num" style="color:${n>v.price?'var(--ok)':n<v.price?'var(--bad)':'inherit'}">${num(n)}</b></td></tr>`).join(''); };
  $('#bpAll', m.el).onchange = e => { $$('[data-bp]', m.el).forEach(x => x.checked = e.target.checked); draw(); };
  $$('input,select', m.el).forEach(x => { x.addEventListener('input', draw); x.addEventListener('change', draw); }); draw();
  $('#bpGo', m.el).onclick = async e => { const rows = calc().filter(r => r.n !== Number(r.v.price)); if(!rows.length) return toast('هیچ نرخێک ناگۆڕێت','bad');
    if(!(await confirmBox('گۆڕینی نرخ', `${rows.length} پلان دەگۆڕێت. دڵنیایت؟`, 'بەڵێ، بیگۆڕە'))) return;
    const keepOld = $('#bpOld', m.el).checked; const btn = e.currentTarget; setBusy(btn, true); let ok = 0;
    for(const r of rows){ const upd = { price:r.n }; if(keepOld && r.n < Number(r.v.price)) upd.old_price = Number(r.v.price); const { error } = await sb.from('ra_variants').update(upd).eq('id', r.v.id); if(!error) ok++; }
    setBusy(btn, false, '✓ جێبەجێکردن'); toast(`✓ نرخی ${ok} پلان گۆڕدرا`,'ok'); m.close(); products(); };
}

/* ───── Receipt reading with AI (Gemini) ───── */
async function readReceipt(d){
  try{
    const { data, error } = await sb.functions.invoke('ai-vision', { body:{ path:d.receipt_path } });
    if(error){ let det = {}; try{ det = await error.context.json(); }catch{}
      if(det.error === 'missing_key') toast('کلیلی Gemini هێشتا دانەنراوە (Supabase ← Edge Functions ← Secrets ← GEMINI_API_KEY)','bad');
      else toast('خوێندنەوەی پسوڵە سەرکەوتوو نەبوو (' + (det.error || error.message || '') + ')','bad');
      return null; }
    return data;
  }catch(e){ toast(errMsg(e),'bad'); return null; }
}

/* ───── Boot ───── */
sb.auth.onAuthStateChange((ev, session) => { if(A.booting) return; const id = session?.user?.id || null; if(ev === 'SIGNED_OUT' || (ev === 'SIGNED_IN' && id !== (A.user?.id||null))) check(); });
(async () => { A.booting = true; try{ await RA.loadSettings(); }catch{} await check(); A.booting = false; if(location.search.includes('code=')) history.replaceState(null,'',location.pathname+location.hash); })();
})();
