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
  ai: svg('<path d="M12 3l1.9 4.8L19 9.7l-4.8 1.9L12 16.4l-1.9-4.8L5 9.7l5.1-1.9Z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9Z"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
  admins: I.shield
};
const TABS = [['dash','داشبۆرد'],['chat','چاتی ڕاستەوخۆ'],['deposits','پارەدانەکان'],['orders','فرۆشتنەکان'],['products','بەرهەمەکان'],['customers','کڕیارەکان و باڵانس'],['payments','ڕێگاکانی پارەدان'],['visitors','سەردانیکەران'],['ai','یاریدەدەری AI'],['texts','دەقەکانی سایت'],['settings','ڕێکخستنی سایت'],['admins','ئەدمینەکان']];
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
      <main class="mainA" id="view"></main></div></div>`;
  $$('[data-t]').forEach(a => a.onclick = () => { location.hash = a.dataset.t; closeSide(); });
  $('#out').onclick = async () => { await sb.auth.signOut(); location.reload(); };
  $('#thm').onclick = () => RA.toggleTheme();
  $('#menuBtn').onclick = () => { $('#side').classList.add('open'); $('#sideBg').classList.add('open'); };
  $('#sideBg').onclick = closeSide;
  if(!A.hc){ window.addEventListener('hashchange', go); A.hc = true; }
  go(); refreshBadges(); if(!A.iv) A.iv = setInterval(refreshBadges, 45000);
  adminRealtime();
}
function closeSide(){ $('#side')?.classList.remove('open'); $('#sideBg')?.classList.remove('open'); }
async function refreshBadges(){
  const [d, o, c] = await Promise.all([
    sb.from('ra_deposits').select('id',{count:'exact',head:true}).eq('status','pending'),
    sb.from('ra_orders').select('id',{count:'exact',head:true}).eq('status','processing'),
    sb.rpc('ra_admin_unread_chats')
  ]);
  const set = (k, n) => $$(`[data-c="${k}"]`).forEach(e => { e.textContent = n; e.classList.toggle('hidden', !n); });
  set('deposits', d.count||0); set('orders', o.count||0); set('chat', Number(c.data)||0);
  const tot = (d.count||0) + (o.count||0) + (Number(c.data)||0);
  const mb = $('#mBadge'); if(mb){ mb.textContent = tot; mb.classList.toggle('hidden', !tot); }
  document.title = (tot ? `(${tot}) ` : '') + 'پانێڵی ئەدمین';
}
function go(){
  const tkey = (location.hash.slice(1) || 'dash'); A.tab = TABS.some(x=>x[0]===tkey) ? tkey : 'dash';
  $$('[data-t]').forEach(a => a.classList.toggle('on', a.dataset.t === A.tab));
  const tl = TABS.find(x=>x[0]===A.tab); if($('#mTitle')) $('#mTitle').textContent = tl[1];
  const v = $('#view'); v.innerHTML = '<div class="sk" style="height:200px"></div>'; window.scrollTo(0,0);
  ({dash, chat, deposits, orders, products, payments, customers, visitors, ai:aiTab, texts, settings, admins})[A.tab]().catch(e => { v.innerHTML = `<div class="warn-box">${esc(errMsg(e))}</div>`; });
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
  const [dq, oq] = await Promise.all([
    sb.from('ra_deposits').select('*').eq('status','pending').order('created_at',{ascending:false}).limit(5),
    sb.from('ra_orders').select('*').order('created_at',{ascending:false}).limit(8)
  ]);
  const k = (ic, l, v, cls='', href='') => `<${href?`a href="${href}"`:'div'} class="kpi ${cls}"><span class="ico">${ic}</span><small>${l}</small><b class="num">${v}</b></${href?'a':'div'}>`;
  $('#view').innerHTML = head('داشبۆرد', `<button class="btn btn-p" id="qAdd">+ زیادکردنی باڵانس بۆ کڕیار</button>`) + `
    <div class="kpis">
      ${k('💰','فرۆشتنی ئەمڕۆ', num(s.sales_today)+cur)}
      ${k('📈','فرۆشتنی ئەم مانگە', num(s.sales_month)+cur)}
      ${k('🏦','کۆی فرۆشتن', num(s.sales_total)+cur)}
      ${k('⏳','پارەدانی چاوەڕوان', num(s.pending_deposits), s.pending_deposits?'hot':'', '#deposits')}
      ${k('📦','داواکاری بۆ گەیاندن', num(s.processing_orders), s.processing_orders?'hot':'', '#orders')}
      ${k('👥','کڕیاران', num(s.customers) + (s.customers_today?` <small class="up">+${num(s.customers_today)}</small>`:''), '', '#customers')}
      ${k('👁️','سەردانیکەرانی ئەمڕۆ', num(s.visitors_today), '', '#visitors')}
      ${k('🟢','ئێستا لەسەر سایتن', num(s.online_now), '', '#visitors')}
      ${k('👛','کۆی باڵانسی کڕیاران', num(s.balance_total)+cur)}
      ${k('⬇️','پارەی زیادکراو (ئەم مانگە)', num(s.deposits_month)+cur)}
    </div>
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
  $('#view').innerHTML = head('پارەدانەکان') + `
    <div class="tabs2">${[['pending','چاوەڕوان'],['approved','پەسەندکراو'],['rejected','ڕەتکراوە'],['all','هەمووی']].map(([k,l])=>`<button class="chip ${depFilter===k?'on':''}" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="tbl-wrap"><table class="tbl rtbl"><thead><tr><th>کڕیار</th><th>ڕێگا</th><th>بڕ</th><th>زانیاری</th><th>کات</th><th>دۆخ</th><th></th></tr></thead><tbody>
    ${(data||[]).map(d => { const c = cm[d.user_id]||{}; return `<tr>${td('کڕیار',`<b>${esc(c.full_name||'—')}</b><br><small class="muted ltr">${esc(c.email||'')}</small>`)}${td('ڕێگا',esc(d.method_name))}${td('بڕ',`<b class="num">${num(d.approved_amount||d.amount)}</b>${d.sent_amount?`<br><small class="muted num">${esc(d.sent_amount)}</small>`:''}`)}
      ${td('زانیاری',`<small>${d.card_code?`🔢 <span class="ltr num">${esc(d.card_code)}</span><br>`:''}${d.reference?`🧾 <span class="ltr">${esc(d.reference)}</span><br>`:''}${d.sender?`👤 ${esc(d.sender)}<br>`:''}${d.receipt_path?'🖼️ پسوڵەی هەیە':''}</small>`)}
      ${td('کات',`<small>${dt(d.created_at)}</small>`)}${td('دۆخ',`<span class="st ${d.status}">${stDep[d.status]}</span>`)}${td('',`<button class="btn btn-sm ${d.status==='pending'?'btn-p':''}" data-o="${d.id}">${d.status==='pending'?'پشکنین':'بینین'}</button>`,'act')}</tr>`; }).join('') || `<tr class="empty-row"><td colspan="7"><div class="empty">هیچ شتێک نییە</div></td></tr>`}
    </tbody></table></div>`;
  $$('[data-f]').forEach(b => b.onclick = () => { depFilter = b.dataset.f; deposits(); });
  $$('[data-o]').forEach(b => b.onclick = () => { const d = data.find(x=>x.id===b.dataset.o); openDeposit(d, cm[d.user_id]); });
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
    ${img ? `<a href="${esc(img)}" target="_blank" rel="noopener"><img class="rcpt" src="${esc(img)}" alt="receipt"></a>` : '<div class="note-box">وێنەی پسوڵە نییە</div>'}
    ${pend ? `<div style="margin-top:16px"><div class="field"><label>ئەو بڕەی دەخرێتە سەر باڵانس (دینار)</label><input class="inp num-inp" id="apAmt" type="number" value="${d.amount}"></div>
      <div class="field"><label>تێبینی بۆ کڕیار (ئارەزوومەندانە)</label><input class="inp" id="apNote" maxlength="300" placeholder="بۆ نموونە: کۆدەکە هەڵەیە"></div>
      <div class="row-btns"><button class="btn btn-ok btn-block btn-lg" id="apOk">✓ پەسەندکردن</button><button class="btn btn-bad btn-block btn-lg" id="apNo">✕ ڕەتکردنەوە</button></div></div>` : ''}`, {wide:true});
  $$('[data-cp]', m.el).forEach(b => b.onclick = () => copyText(b.dataset.cp));
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
  const draw = () => {
    const list = (data||[]).filter(o => !ordQ || JSON.stringify([o.product_name,o.variant_name,o.order_no,cm[o.user_id]?.email,cm[o.user_id]?.full_name,o.fields]).toLowerCase().includes(ordQ.toLowerCase()));
    const total = list.filter(o=>['processing','delivered'].includes(o.status)).reduce((a,o)=>a+Number(o.price),0);
    $('#oSum').innerHTML = `${num(list.length)} داواکاری · <b class="num">${num(total)}</b>${cur}`;
    $('#oBody').innerHTML = list.map(o => { const c = cm[o.user_id]||{}; const f = Object.entries(o.fields||{}).filter(([k,v])=>v).map(([k,v])=>`<b>${esc(k)}:</b> ${esc(v)}`).join('<br>');
      return `<tr>${td('#',`<span class="num">${o.order_no}</span>`)}${td('بەرهەم',`<b>${esc(o.product_name)}</b><br><small class="muted">${esc(o.variant_name)}</small>`)}${td('کڕیار',`${esc(c.full_name||'—')}<br><small class="muted ltr">${esc(c.email||'')}</small>`)}${td('زانیاری کڕیار',`<small>${f||'—'}</small>`)}${td('نرخ',`<span class="num">${num(o.price)}</span>`)}${td('کات',`<small>${dt(o.created_at)}</small>`)}${td('دۆخ',`<span class="st ${o.status}">${stOrd[o.status]}</span>`)}
      ${td('',`<button class="btn btn-sm ${o.status==='processing'?'btn-p':''}" data-o="${o.id}">${o.status==='processing'?'گەیاندن':'بینین'}</button>`,'act')}</tr>`; }).join('') || `<tr class="empty-row"><td colspan="8"><div class="empty">هیچ شتێک نییە</div></td></tr>`;
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
    ${['processing','delivered'].includes(o.status) ? `<div class="field"><label>ئەوەی کڕیار وەریدەگرێت (ئەکاونت، کۆد، لینک...)</label><textarea class="inp ltr-inp" id="dl" rows="5" placeholder="Email: ...&#10;Password: ...">${esc(o.delivery||'')}</textarea></div>
      <div class="field"><label>تێبینی (ئارەزوومەندانە)</label><input class="inp" id="dn" value="${esc(o.admin_note||'')}"></div>
      <div class="row-btns"><button class="btn btn-p btn-lg btn-block" id="dlOk">${o.status==='processing'?'✓ ناردن بۆ کڕیار (لە چاتیش)':'پاشەکەوتکردن و ناردنەوە لە چات'}</button><button class="btn btn-bad btn-lg btn-block" id="rf">↩ گەڕاندنەوەی پارە</button></div>`
      : `<div class="note-box">${esc(o.admin_note||'')}</div>`}`, {wide:true});
  $$('[data-cp]', m.el).forEach(b => b.onclick = () => copyText(b.dataset.cp));
  const ok = $('#dlOk', m.el); if(!ok) return;
  ok.onclick = async e => { const d = $('#dl', m.el).value.trim(); if(!d) return toast('زانیاری بەرهەمەکە بنووسە','bad'); setBusy(e.currentTarget,true);
    const { error } = await sb.rpc('ra_admin_deliver', { p_order:o.id, p_delivery:d, p_note:$('#dn', m.el).value }); if(error){ setBusy(ok,false); return toast(errMsg(error),'bad'); }
    toast('✓ نێردرا — کڕیار ئێستا دەیبینێت','ok'); m.close(); refreshBadges(); go(); };
  $('#rf', m.el).onclick = async () => { if(!(await confirmBox('گەڕاندنەوەی پارە', `${num(o.price)}${cur} دەگەڕێتەوە بۆ باڵانسی کڕیار.`, 'گەڕاندنەوە', true))) return;
    const { error } = await sb.rpc('ra_admin_refund', { p_order:o.id, p_note:$('#dn', m.el).value || 'گەڕاندنەوە' }); if(error) return toast(errMsg(error),'bad'); toast('پارەکە گەڕێنرایەوە','ok'); m.close(); refreshBadges(); go(); };
}

/* ───── Products ───── */
function thumb(x){
  const u = safeUrl(x.image_url); if(!u) return esc(x.emoji||'✨');
  return x.image_fit === 'cover' ? `<img src="${esc(u)}" alt="">` : `<img class="tb-bg" src="${esc(u)}" alt=""><img class="tb-fg" src="${esc(u)}" alt="">`;
}
async function products(){
  const [p, st] = await Promise.all([ sb.from('ra_products').select('*, ra_variants(*)').order('sort_order'), sb.rpc('ra_stock_counts') ]);
  if(p.error) throw p.error;
  A.products = (p.data||[]).map(x => ({...x, variants:(x.ra_variants||[]).sort((a,b)=>a.sort_order-b.sort_order)}));
  A.stock = {}; (st.data||[]).forEach(r => A.stock[r.variant_id] = Number(r.available));
  $('#view').innerHTML = head('بەرهەمەکان', `<button class="btn" id="trAll">🌐 وەرگێڕانی هەموو</button><button class="btn btn-ai" id="addPAi">✨ بەرهەمی نوێ بە AI</button><button class="btn btn-p" id="addP">+ بەرهەمی نوێ</button>`) + `<div class="list" id="pl">${A.products.map((x,i) => `
    <div class="prow ${x.active?'':'off'}"><div class="th">${thumb(x)}</div>
      <div class="grow"><b>${esc(x.name)} ${x.featured?'⭐':''} ${x.active?'':'<span class="st cancelled">شاراوە</span>'}</b>
      <small class="muted">${x.variants.map(v=>`${esc(v.name)}: <span class="num">${num(v.price)}</span>${v.auto_deliver?` <span style="color:var(--ok)">⚡${num(A.stock[v.id]||0)}</span>`:''}`).join(' · ') || 'هیچ پلانێک نییە'}</small></div>
      <div class="acts"><button class="btn btn-sm" data-up="${i}" ${i===0?'disabled':''} aria-label="up">▲</button><button class="btn btn-sm" data-dn="${i}" ${i===A.products.length-1?'disabled':''} aria-label="down">▼</button>
      <button class="btn btn-sm" data-tg="${i}">${x.active?'شاردنەوە':'پیشاندان'}</button><button class="btn btn-sm btn-p" data-ed="${i}">دەستکاری</button></div></div>`).join('') || '<div class="empty">هیچ بەرهەمێک نییە</div>'}</div>`;
  $('#addP').onclick = () => editProduct(null);
  $('#addPAi').onclick = () => aiProductDialog();
  $('#trAll').onclick = async e => {
    const todo = A.products.filter(needsTr);
    if(!todo.length) return toast('✓ هەموو بەرهەمەکان پێشتر وەرگێڕدراون','ok');
    const btn = e.currentTarget; btn.disabled = true; let ok = 0;
    for(const [i,x] of todo.entries()){ btn.textContent = `🌐 ${i+1}/${todo.length}...`; if(await autoTranslate(x, i>0)) ok++; else if(i===0) break; }
    toast(`✓ ${ok} بەرهەم وەرگێڕدرا`, ok?'ok':'bad'); products();
  };
  $$('[data-ed]').forEach(b => b.onclick = () => editProduct(A.products[b.dataset.ed]));
  $$('[data-tg]').forEach(b => b.onclick = async () => { const x = A.products[b.dataset.tg]; const { error } = await sb.from('ra_products').update({ active:!x.active }).eq('id', x.id); if(error) return toast(errMsg(error),'bad'); products(); });
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
    $('#vl', m.el).innerHTML = vars.map((v,i) => `<div class="vedit"><input class="inp" data-vn="${i}" value="${esc(v.name)}" placeholder="ناوی پلان (1 مانگ)"><input class="inp num-inp" type="number" data-vp="${i}" value="${Number(v.price)||''}" placeholder="نرخ"><input class="inp num-inp" type="number" data-vo="${i}" value="${Number(v.old_price)||''}" placeholder="نرخی پێشوو">
      <div class="dmode seg" role="group"><button type="button" class="${v.auto_deliver?'on':''}" data-dm="${i}" data-auto="1">⚡ گەیاندنی خێرا<small>ئۆتۆماتیکی لە کۆگاوە</small></button><button type="button" class="${v.auto_deliver?'':'on'}" data-dm="${i}" data-auto="0">🤝 گەیاندنی تایبەت<small>خۆت دەینێریت</small></button></div><span class="v-acts">${v.id?`<button class="btn btn-sm" data-stk="${i}" title="کۆگا">📦 ${num(A.stock[v.id]||0)}</button>`:''}<button class="btn btn-sm btn-bad" data-vr="${i}" aria-label="remove">✕</button></span></div>`).join('');
    $$('[data-vn]', m.el).forEach(e => e.oninput = () => vars[e.dataset.vn].name = e.value);
    $$('[data-vp]', m.el).forEach(e => e.oninput = () => vars[e.dataset.vp].price = Number(e.value||0));
    $$('[data-vo]', m.el).forEach(e => e.oninput = () => vars[e.dataset.vo].old_price = Number(e.value||0));
    $$('[data-dm]', m.el).forEach(b => b.onclick = () => { const v = vars[+b.dataset.dm]; v.auto_deliver = b.dataset.auto === '1'; drawV(); if(v.auto_deliver && v.id && !(A.stock[v.id] > 0)) toast('📦 بۆ گەیاندنی خێرا، ئەکاونتەکان بخەرە کۆگا (دوگمەی 📦). تا کۆگا بەتاڵ بێت، داواکاری وەک گەیاندنی تایبەت دێتە لات.'); if(v.auto_deliver && !v.id) toast('دوای پاشەکەوتکردن، لە دوگمەی 📦 ئەکاونتەکان زیاد بکە'); });
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
        const vr = { product_id:pid, name:String(v.name).trim(), name_en:String(v.name_en||'').trim(), name_ar:String(v.name_ar||'').trim(), price:Math.floor(v.price), old_price:Math.floor(v.old_price||0), auto_deliver:!!v.auto_deliver, active:true, sort_order:i+1 };
        const r = v.id ? await sb.from('ra_variants').update(vr).eq('id', v.id) : await sb.from('ra_variants').insert(vr);
        if(r.error) throw r.error;
      }
      toast('پاشەکەوت کرا ✓','ok'); m.close(); await products();
      const saved = A.products.find(x => x.id === pid);
      if(saved && needsTr(saved)){ toast('✨ وەرگێڕانی ئۆتۆماتیکی بۆ ئینگلیزی و عەرەبی دەستی پێکرد...'); if(await autoTranslate(saved, true)){ toast('✓ بەرهەمەکە وەرگێڕدرا بۆ ئینگلیزی و عەرەبی','ok'); products(); } }
    }catch(err){ setBusy(btn, false, 'پاشەکەوتکردن'); toast(errMsg(err),'bad'); }
  };
}
async function manageStock(v, pname){
  const load = async () => (await sb.from('ra_stock').select('*').eq('variant_id', v.id).order('created_at',{ascending:false}).limit(500)).data || [];
  let rows = await load();
  const m = modal(`<div class="modal-h"><h3>کۆگا — ${esc(pname)} / ${esc(v.name)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="note-box" style="margin-bottom:12px">هەر دێڕێک = یەک بەرهەم (ئەکاونت، کۆد...). کاتێک کڕیار دەیکڕێت، یەکسەر یەکێکیان بۆ دەنێردرێت. ئەگەر یەک بەرهەم چەند دێڕی هەیە، بە <b class="ltr">---</b> لێکیان جیا بکەرەوە.</div>
    <div class="field"><textarea class="inp ltr-inp" id="stIn" rows="6" placeholder="email1@x.com | pass1&#10;email2@x.com | pass2"></textarea></div>
    <label class="check" style="margin-bottom:10px"><input type="checkbox" id="stSep"> جیاکردنەوە بە --- لە جیاتی هەر دێڕێک</label>
    <button class="btn btn-p btn-block" id="stAdd">+ زیادکردن بۆ کۆگا</button>
    <h3 style="margin:18px 0 10px;font-size:15px" id="stH"></h3><div class="list" style="max-height:300px;overflow:auto" id="stL"></div>`, {wide:true});
  const draw = () => {
    const avail = rows.filter(r=>!r.used);
    $('#stH', m.el).innerHTML = `بەردەست: <span class="num">${num(avail.length)}</span> · فرۆشراو: <span class="num">${num(rows.length-avail.length)}</span>`;
    $('#stL', m.el).innerHTML = rows.map(r => `<div class="item" style="padding:10px"><div class="grow"><b class="ltr mono">${esc(r.content.slice(0,120))}</b><small>${r.used?'فرۆشراوە':'بەردەستە'} · ${dt(r.created_at)}</small></div>${r.used?'<span class="st delivered">فرۆشراوە</span>':`<button class="btn btn-sm btn-bad" data-rm="${r.id}" aria-label="remove">✕</button>`}</div>`).join('') || '<div class="empty">کۆگا بەتاڵە</div>';
    $$('[data-rm]', m.el).forEach(b => b.onclick = async () => { const { error } = await sb.from('ra_stock').delete().eq('id', b.dataset.rm).eq('used', false); if(error) return toast(errMsg(error),'bad'); rows = await load(); draw(); });
  };
  draw();
  $('#stAdd', m.el).onclick = async e => {
    const txt = $('#stIn', m.el).value; const sep = $('#stSep', m.el).checked;
    const items = (sep ? txt.split(/\n?-{3,}\n?/) : txt.split('\n')).map(s=>s.trim()).filter(Boolean);
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
  $('#view').innerHTML = head('کڕیارەکان و باڵانس', `<button class="btn btn-p" id="cAdd">+ زیادکردنی باڵانس بە ئیمەیڵ</button>`) + `
    <label class="search wide">${I.search}<input id="cq" placeholder="گەڕان بە ئیمەیڵ، ناو یان ژمارە..." value="${esc(cusQ)}"></label>
    <div class="tbl-wrap"><table class="tbl rtbl"><thead><tr><th>کڕیار</th><th>مۆبایل</th><th>باڵانس</th><th>چوونەژوورەوە</th><th>تۆمارکردن</th><th>دوایین سەردان</th><th></th></tr></thead><tbody>
    ${(data||[]).map(c=>`<tr class="${c.blocked?'off':''}">${td('کڕیار',`<b>${esc(c.full_name||'—')}</b> ${c.blocked?'<span class="st cancelled">ڕاگیراوە</span>':''}<br><small class="muted ltr">${esc(c.email||'')}</small>`)}${td('مۆبایل',`<span class="ltr">${esc(c.phone||'—')}</span>`)}${td('باڵانس',`<b class="num">${num(c.balance)}</b>`)}${td('چوونەژوورەوە',esc(c.provider==='google'?'Google':'ئیمەیڵ'))}${td('تۆمارکردن',`<small>${dt(c.created_at)}</small>`)}${td('دوایین سەردان',`<small>${ago(c.last_seen)}</small>`)}${td('',`<span class="row-acts"><button class="btn btn-sm" data-b="${esc(c.email)}">± باڵانس</button><button class="btn btn-sm btn-p" data-c="${c.id}">بینین</button></span>`,'act')}</tr>`).join('') || `<tr class="empty-row"><td colspan="7"><div class="empty">هیچ کڕیارێک نییە</div></td></tr>`}
    </tbody></table></div>`;
  $('#cAdd').onclick = () => balanceDialog();
  $('#cq').oninput = e => { cusQ = e.target.value.trim(); clearTimeout(A.t); A.t = setTimeout(()=>customers().then(()=>{ const i=$('#cq'); i.focus(); i.setSelectionRange(i.value.length,i.value.length); }), 400); };
  $$('[data-b]').forEach(b => b.onclick = () => balanceDialog(b.dataset.b));
  $$('[data-c]').forEach(b => b.onclick = () => openCustomer((data||[]).find(x=>x.id===b.dataset.c)));
}
async function openCustomer(c){
  const [o, tx] = await Promise.all([ sb.from('ra_orders').select('*').eq('user_id', c.id).order('created_at',{ascending:false}).limit(50), sb.from('ra_wallet_tx').select('*').eq('user_id', c.id).order('created_at',{ascending:false}).limit(50) ]);
  const spent = (o.data||[]).filter(x=>['processing','delivered'].includes(x.status)).reduce((a,x)=>a+Number(x.price),0);
  const m = modal(`<div class="modal-h"><h3>${esc(c.full_name||c.email)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="kpis k3"><div class="kpi"><small>باڵانس</small><b class="num" id="cBal">${num(c.balance)}</b></div><div class="kpi"><small>کۆی کڕین</small><b class="num">${num(spent)}</b></div><div class="kpi"><small>ژمارەی کڕین</small><b class="num">${num((o.data||[]).length)}</b></div></div>
    <dl class="kv"><dt>ئیمەیڵ</dt><dd class="ltr">${esc(c.email||'')}</dd><dt>مۆبایل</dt><dd class="ltr">${esc(c.phone||'—')}</dd><dt>تۆمارکردن</dt><dd>${dt(c.created_at)}</dd></dl>
    <div class="row-btns" style="margin-bottom:14px"><button class="btn btn-p btn-block" id="cAdj">± گۆڕینی باڵانس</button><button class="btn ${c.blocked?'btn-ok':'btn-bad'} btn-block" id="blk">${c.blocked?'لابردنی ڕاگرتن':'ڕاگرتنی ئەکاونت'}</button></div>
    <h3 style="margin:8px 0 10px;font-size:15px">مامەڵەکان</h3><div class="list" style="max-height:280px;overflow:auto">${(tx.data||[]).map(x=>`<div class="item" style="padding:10px"><div class="grow"><b>${esc({deposit:'زیادکردنی باڵانس',purchase:'کڕین',refund:'گەڕاندنەوە',adjust:'ڕێکخستنی دەستی'}[x.kind])}${x.note?' · '+esc(x.note):''}</b><small>${dt(x.created_at)}</small></div><b class="num ${x.amount>0?'amt-pos':''}">${x.amount>0?'+':''}${num(x.amount)}</b></div>`).join('') || '<div class="empty">هیچ مامەڵەیەک نییە</div>'}</div>`, {wide:true});
  $('#cAdj', m.el).onclick = () => { m.close(); balanceDialog(c.email); };
  $('#blk', m.el).onclick = async () => { const { error } = await sb.rpc('ra_admin_set_blocked', { p_user:c.id, p_blocked:!c.blocked }); if(error) return toast(errMsg(error),'bad'); toast('✓'); m.close(); customers(); };
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
async function ensureProducts(){ if(A.products && A.products.length) return; const { data } = await sb.from('ra_products').select('*, ra_variants(*)').order('sort_order'); A.products = (data||[]).map(x => ({...x, variants:(x.ra_variants||[])})); }
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

/* ───── Live chat (admin) ───── */
let chatSel = null, chatThreads = [], chatMsgs = [], chatCM = {}, chatQ = '';
function chatTime(d){ const x = new Date(d); const today = new Date().toDateString() === x.toDateString(); return today ? String(x.getHours()).padStart(2,'0') + ':' + String(x.getMinutes()).padStart(2,'0') : ago(d); }
function aBubble(m){
  const linkify = txt => esc(txt).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener nofollow">$1</a>');
  const side = m.sender === 'user' ? 'them' : 'me';
  if(m.kind === 'delivery' || m.kind === 'order') return `<div class="cm ${side}"><div class="cb sysb">${m.kind==='delivery'?'📦 <b>گەیەندرا</b>':'🛒 <b>داواکاری نوێ</b>'}<br>${linkify(m.body)}</div><span class="ct">${chatTime(m.created_at)}</span></div>`;
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
  conv.innerHTML = `<div class="acc-h"><button class="icon-btn ac-back" id="acBack" aria-label="back">${I.back}</button><span class="ac-av">${esc(((c.full_name||c.email||'?')[0]||'?').toUpperCase())}</span><div class="ac-mid"><b>${esc(c.full_name||'—')}</b><small class="ltr">${esc(c.email||'')} · <span class="num">${num(c.balance)}</span> دینار</small></div><button class="btn btn-sm" id="acBal">± باڵانس</button></div>
    <div class="acc-b cp-b" id="accB"><div class="sk" style="height:120px"></div></div>
    <div class="cp-f acc-f"><button class="btn btn-ai btn-sm acc-ai" id="accAi" title="پێشنیاری وەڵام بە AI">✨</button><textarea id="accIn" rows="1" maxlength="4000" placeholder="وەڵامەکەت بنووسە..."></textarea><button class="cp-send" id="accSend" aria-label="send">${I.send}</button></div>`;
  $('#acBack').onclick = () => { chatSel = null; $('#achat').classList.remove('has-sel'); drawThreads(); };
  $('#acBal').onclick = () => balanceDialog(c.email);
  const inp = $('#accIn');
  inp.oninput = () => { inp.style.height = 'auto'; inp.style.height = Math.min(140, inp.scrollHeight) + 'px'; };
  inp.onkeydown = e => { if(e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)){ e.preventDefault(); sendAdmin(); } };
  $('#accSend').onclick = sendAdmin;
  $('#accAi').onclick = async e => {
    const lastUser = chatMsgs.filter(m=>m.sender==='user').slice(-3).map(m=>m.body).join('\n');
    if(!lastUser) return toast('هیچ نامەیەکی کڕیار نییە','bad');
    const btn = e.currentTarget; setBusy(btn, true);
    const hist = chatMsgs.slice(-10).map(m => (m.sender==='user'?'Customer: ':'Store: ') + m.body).join('\n');
    const out = await ai(`You are the support agent of the store. Write a short, polite, helpful reply to the customer's last message, in the SAME language the customer used (Kurdish Sorani, Arabic or English). Do not promise things you don't know; if unsure, say we will check and reply soon. Only output the reply text.\n\nConversation:\n${hist}`);
    setBusy(btn, false, '✨'); if(out){ inp.value = out; inp.oninput(); inp.focus(); }
  };
  const { data } = await sb.from('ra_chat_messages').select('*').eq('user_id', uid).order('id',{ascending:false}).limit(150);
  if(chatSel !== uid) return;
  chatMsgs = (data||[]).reverse(); drawMsgs();
  sb.rpc('ra_admin_chat_read', { p_user: uid }).then(() => { const t = chatThreads.find(x=>x.user_id===uid); if(t){ t.unread_admin = 0; drawThreads(); } refreshBadges(); });
  if(!('ontouchstart' in window)) inp.focus();
}
function drawMsgs(){ const b = $('#accB'); if(!b) return; b.innerHTML = chatMsgs.map(aBubble).join('') || '<div class="empty">هیچ نامەیەک نییە</div>'; b.scrollTop = b.scrollHeight; }
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
    if(m.sender === 'user'){ adminDing(); if(!(A.tab === 'chat' && chatSel === m.user_id && document.visibilityState === 'visible')) toast('💬 نامەی نوێ: ' + String(m.body).slice(0,60)); }
    if(A.tab === 'chat'){
      if(chatSel === m.user_id && !chatMsgs.some(x => String(x.id) === String(m.id))){ chatMsgs.push(m); drawMsgs(); if(m.sender==='user') sb.rpc('ra_admin_chat_read', { p_user: m.user_id }); }
      clearTimeout(rtTimer); rtTimer = setTimeout(async () => { await loadThreads(); drawThreads(); }, 400);
    }
    clearTimeout(A.bt); A.bt = setTimeout(refreshBadges, 600);
  }).on('postgres_changes', { event:'INSERT', schema:'public', table:'ra_orders' }, () => { adminDing(); toast('🛒 فرۆشتنی نوێ!','ok'); clearTimeout(A.bt); A.bt = setTimeout(refreshBadges, 600); }).subscribe();
}

/* ───── Boot ───── */
sb.auth.onAuthStateChange((ev, session) => { if(A.booting) return; const id = session?.user?.id || null; if(ev === 'SIGNED_OUT' || (ev === 'SIGNED_IN' && id !== (A.user?.id||null))) check(); });
(async () => { A.booting = true; try{ await RA.loadSettings(); }catch{} await check(); A.booting = false; if(location.search.includes('code=')) history.replaceState(null,'',location.pathname+location.hash); })();
})();
