/* Realm Academy — admin panel */
(function(){
'use strict';
const { sb, $, $$, esc, num, dt, ago, I, toast, modal, confirmBox, copyText, errMsg, setBusy, safeUrl, safeColor } = RA;
const root = $('#root');
const A = { user:null, tab:'dash', badges:{}, products:[], methods:[], stock:{} };

const IC = {
  dash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>',
  deposits:I.wallet, orders:I.bag,
  products:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg>',
  payments:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/></svg>',
  customers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/></svg>',
  visitors:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  admins:I.shield
};
const TABS = [['dash','داشبۆرد'],['deposits','پارەدانەکان'],['orders','فرۆشتنەکان'],['products','بەرهەمەکان'],['payments','ڕێگاکانی پارەدان'],['customers','کڕیارەکان'],['visitors','سەردانیکەران'],['settings','ڕێکخستنی سایت'],['admins','ئەدمینەکان']];
const stDep = {pending:'چاوەڕوان',approved:'پەسەندکرا',rejected:'ڕەتکرایەوە'};
const stOrd = {processing:'چاوەڕوانی گەیاندن',delivered:'گەیەندرا',cancelled:'هەڵوەشێنرا',refunded:'پارە گەڕێنرایەوە'};
const sw = (id, on) => `<label class="sw"><input type="checkbox" id="${id}" ${on?'checked':''}><span></span></label>`;

/* ───── Gate ───── */
function gate(msg){
  root.innerHTML = `<div class="gate"><div class="panel" style="max-width:420px;width:100%;padding:30px;text-align:center">
    <div class="brand" style="justify-content:center;margin-bottom:14px"><span class="mark">${I.logo}</span>پانێڵی ئەدمین</div>
    ${msg ? `<div class="warn-box" style="margin-bottom:16px">${esc(msg)}</div>` : ''}
    <button class="g-btn" id="gIn">${I.google} چوونەژوورەوە بە Google</button>
    <div class="or">یان</div>
    <form id="aF" style="text-align:start">
      <div class="field"><label>ئیمەیڵ</label><input class="inp ltr" name="email" type="email" autocomplete="email" required style="text-align:right"></div>
      <div class="field"><label>وشەی نهێنی</label><input class="inp" name="password" type="password" autocomplete="current-password" required></div>
      <button class="btn btn-p btn-block btn-lg" id="aB">چوونەژوورەوە</button></form>
    <a href="/" class="muted" style="display:block;margin-top:16px;font-size:13px">← گەڕانەوە بۆ سایت</a></div></div>`;
  $('#gIn').onclick = () => sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: location.origin + '/admin.html' } });
  $('#aF').onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target); const b=$('#aB'); setBusy(b,true);
    const { error } = await sb.auth.signInWithPassword({ email:String(f.get('email')).trim(), password:String(f.get('password')) }); setBusy(b,false,'چوونەژوورەوە');
    if(error) toast(errMsg(error),'bad'); };
}
async function check(){
  const { data } = await sb.auth.getSession(); A.user = data.session?.user || null;
  if(!A.user) return gate();
  const r = await sb.rpc('ra_is_admin');
  if(!r.data) { gate('ئەم ئەکاونتە (' + (A.user.email||'') + ') دەسەڵاتی ئەدمینی نییە.'); root.querySelector('.panel').insertAdjacentHTML('beforeend', `<button class="btn btn-block" style="margin-top:10px" id="so">چوونەدەرەوە</button>`); $('#so').onclick = () => sb.auth.signOut(); return; }
  shell();
}

/* ───── Shell ───── */
function shell(){
  const s = RA.settings;
  root.innerHTML = `<div class="adm">
    <aside class="side"><a class="brand" href="/" target="_blank"><span class="mark">${safeUrl(s.logo)?`<img src="${esc(s.logo)}" alt="">`:I.logo}</span>${esc(s.name||'Realm Academy')}</a>
      ${TABS.map(([k,l]) => `<a data-t="${k}">${IC[k]}<span>${l}</span><span class="cnt hidden" data-c="${k}"></span></a>`).join('')}
      <div class="grow"></div>
      <a id="thm">${I.sun}<span>دۆخی ڕووناک/تاریک</span></a>
      <a href="/" target="_blank">${I.home}<span>بینینی سایت</span></a>
      <a id="out">${I.logout}<span>چوونەدەرەوە</span></a>
      <div class="muted" style="font-size:11px;padding:8px 14px;direction:ltr;text-align:right">${esc(A.user.email||'')}</div></aside>
    <div style="min-width:0"><nav class="mtabs">${TABS.map(([k,l]) => `<a data-t="${k}">${l}</a>`).join('')}<a href="/">سایت</a></nav>
      <main class="mainA" id="view"></main></div></div>`;
  $$('[data-t]').forEach(a => a.onclick = () => { location.hash = a.dataset.t; });
  $('#out').onclick = async () => { await sb.auth.signOut(); location.reload(); };
  $('#thm').onclick = () => RA.toggleTheme();
  if(!A.hc){ window.addEventListener('hashchange', go); A.hc = true; }
  go(); refreshBadges(); if(!A.iv) A.iv = setInterval(refreshBadges, 45000);
}
async function refreshBadges(){
  const [d, o] = await Promise.all([
    sb.from('ra_deposits').select('id',{count:'exact',head:true}).eq('status','pending'),
    sb.from('ra_orders').select('id',{count:'exact',head:true}).eq('status','processing')
  ]);
  const set = (k, n) => $$(`[data-c="${k}"]`).forEach(e => { e.textContent = n; e.classList.toggle('hidden', !n); });
  set('deposits', d.count||0); set('orders', o.count||0);
  const tot = (d.count||0) + (o.count||0);
  document.title = (tot ? `(${tot}) ` : '') + 'پانێڵی ئەدمین';
}
function go(){
  const t = (location.hash.slice(1) || 'dash'); A.tab = TABS.some(x=>x[0]===t) ? t : 'dash';
  $$('[data-t]').forEach(a => a.classList.toggle('on', a.dataset.t === A.tab));
  const v = $('#view'); v.innerHTML = '<div class="sk" style="height:200px"></div>';
  ({dash, deposits, orders, products, payments, customers, visitors, settings, admins})[A.tab]().catch(e => { v.innerHTML = `<div class="warn-box">${esc(errMsg(e))}</div>`; });
}
const head = (title, extra='') => `<div class="topA"><h1>${title}</h1>${extra}</div>`;
function bars(arr, key, cls=''){
  const max = Math.max(1, ...arr.map(x=>Number(x[key]||0)));
  return `<div class="bars ${cls}">${arr.map(x => `<div class="b" title="${esc(x.day)}: ${num(x[key])}"><i style="height:${Math.max(2, Number(x[key]||0)/max*100)}%"></i><span>${esc(String(x.day).slice(3))}</span></div>`).join('')}</div>`;
}

/* ───── Dashboard ───── */
async function dash(){
  const { data:s, error } = await sb.rpc('ra_admin_stats'); if(error) throw error;
  const [dq, oq] = await Promise.all([
    sb.from('ra_deposits').select('*').eq('status','pending').order('created_at',{ascending:false}).limit(5),
    sb.from('ra_orders').select('*').order('created_at',{ascending:false}).limit(8)
  ]);
  const k = (ic, l, v, cls='') => `<div class="kpi ${cls}"><span class="ico">${ic}</span><small>${l}</small><b class="num">${v}</b></div>`;
  $('#view').innerHTML = head('داشبۆرد', `<span class="muted">${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</span>`) + `
    <div class="kpis">
      ${k('💰','فرۆشتنی ئەمڕۆ', num(s.sales_today)+' IQD')}
      ${k('📈','فرۆشتنی ئەم مانگە', num(s.sales_month)+' IQD')}
      ${k('🏦','کۆی فرۆشتن', num(s.sales_total)+' IQD')}
      ${k('⏳','پارەدانی چاوەڕوان', num(s.pending_deposits), s.pending_deposits?'hot':'')}
      ${k('📦','داواکاری بۆ گەیاندن', num(s.processing_orders), s.processing_orders?'hot':'')}
      ${k('👥','کڕیاران', num(s.customers) + (s.customers_today?` <small style="font-size:12px;color:var(--ok)">+${num(s.customers_today)}</small>`:''))}
      ${k('👁️','سەردانیکەرانی ئەمڕۆ', num(s.visitors_today))}
      ${k('🟢','ئێستا ئۆنلاین', num(s.online_now))}
      ${k('👛','کۆی باڵانسی کڕیاران', num(s.balance_total)+' IQD')}
      ${k('⬇️','پارەی زیادکراو (مانگ)', num(s.deposits_month)+' IQD')}
    </div>
    <div class="two">
      <div class="panel"><h3>فرۆشتن — 14 ڕۆژی ڕابردوو</h3>${bars(s.daily||[], 'sales')}</div>
      <div class="panel"><h3>سەردانیکەران — 14 ڕۆژ</h3>${bars(s.daily||[], 'visitors', 'gold')}</div>
    </div>
    <div class="two" style="margin-top:16px">
      <div class="panel"><h3 style="display:flex;justify-content:space-between">دوایین فرۆشتنەکان <a class="link" href="#orders">هەمووی</a></h3><div class="list">${(oq.data||[]).map(o=>`<div class="item"><div class="ic">📦</div><div class="grow"><b>${esc(o.product_name)} — ${esc(o.variant_name)}</b><small><span class="num">#${o.order_no}</span> · ${ago(o.created_at)}</small></div><b class="num">${num(o.price)}</b><span class="st ${o.status}">${stOrd[o.status]}</span></div>`).join('') || '<div class="empty">هیچ فرۆشتنێک نییە</div>'}</div></div>
      <div class="panel"><h3 style="display:flex;justify-content:space-between">پارەدانی چاوەڕوان <a class="link" href="#deposits">هەمووی</a></h3><div class="list">${(dq.data||[]).map(d=>`<div class="item" style="cursor:pointer" data-dep="${d.id}"><div class="ic">💳</div><div class="grow"><b>${esc(d.method_name)} — <span class="num">${num(d.amount)}</span></b><small>${ago(d.created_at)}</small></div><span class="st pending">پشکنین</span></div>`).join('') || '<div class="empty">✓ هیچ پارەدانێکی چاوەڕوان نییە</div>'}</div></div>
    </div>`;
  $$('[data-dep]').forEach(el => el.onclick = () => openDeposit((dq.data||[]).find(x=>x.id===el.dataset.dep)));
}

/* ───── Deposits ───── */
let depFilter = 'pending';
async function deposits(){
  let q = sb.from('ra_deposits').select('*').order('created_at',{ascending:false}).limit(200);
  if(depFilter !== 'all') q = q.eq('status', depFilter);
  const { data, error } = await q; if(error) throw error;
  const ids = [...new Set((data||[]).map(d=>d.user_id))];
  const cm = await customerMap(ids);
  $('#view').innerHTML = head('پارەدانەکان (زیادکردنی باڵانس)') + `
    <div class="tabs2">${[['pending','چاوەڕوان'],['approved','پەسەندکراو'],['rejected','ڕەتکراو'],['all','هەمووی']].map(([k,l])=>`<button class="chip ${depFilter===k?'on':''}" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>کڕیار</th><th>ڕێگا</th><th>بڕ</th><th>زانیاری</th><th>کات</th><th>دۆخ</th><th></th></tr></thead><tbody>
    ${(data||[]).map(d => { const c = cm[d.user_id]||{}; return `<tr><td><b>${esc(c.full_name||'—')}</b><br><small class="muted ltr">${esc(c.email||'')}</small></td><td>${esc(d.method_name)}</td><td><b class="num">${num(d.approved_amount||d.amount)}</b>${d.sent_amount?`<br><small class="muted num">${esc(d.sent_amount)}</small>`:''}</td>
      <td style="max-width:220px"><small>${d.card_code?`🔢 <span class="ltr num">${esc(d.card_code)}</span><br>`:''}${d.reference?`🧾 <span class="ltr">${esc(d.reference)}</span><br>`:''}${d.sender?`👤 ${esc(d.sender)}<br>`:''}${d.receipt_path?'🖼️ پسوڵە هەیە':''}</small></td>
      <td><small>${dt(d.created_at)}</small></td><td><span class="st ${d.status}">${stDep[d.status]}</span></td><td><button class="btn btn-sm ${d.status==='pending'?'btn-p':''}" data-o="${d.id}">${d.status==='pending'?'پشکنین':'بینین'}</button></td></tr>`; }).join('') || `<tr><td colspan="7"><div class="empty">هیچ نییە</div></td></tr>`}
    </tbody></table></div>`;
  $$('[data-f]').forEach(b => b.onclick = () => { depFilter = b.dataset.f; deposits(); });
  $$('[data-o]').forEach(b => b.onclick = () => openDeposit(data.find(x=>x.id===b.dataset.o), cm[data.find(x=>x.id===b.dataset.o).user_id]));
}
async function customerMap(ids){
  if(!ids.length) return {};
  const { data } = await sb.from('ra_customers').select('id,email,full_name,phone,balance').in('id', ids);
  return Object.fromEntries((data||[]).map(c=>[c.id,c]));
}
async function openDeposit(d, c){
  if(!d) return;
  if(!c){ c = (await customerMap([d.user_id]))[d.user_id] || {}; }
  let img = '';
  if(d.receipt_path){ const { data } = await sb.storage.from('receipts').createSignedUrl(d.receipt_path, 600); img = data?.signedUrl || ''; }
  const pend = d.status === 'pending';
  const m = modal(`<div class="modal-h"><h3>پارەدان — ${esc(d.method_name)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <dl class="kv"><dt>کڕیار</dt><dd>${esc(c.full_name||'—')} <span class="muted ltr">${esc(c.email||'')}</span></dd>
      <dt>مۆبایل</dt><dd class="ltr" style="text-align:right">${esc(c.phone||'—')}</dd>
      <dt>باڵانسی ئێستا</dt><dd class="num">${num(c.balance)} IQD</dd>
      <dt>بڕی داواکراو</dt><dd><b class="num">${num(d.amount)} IQD</b> ${d.sent_amount?`<span class="muted">(${esc(d.sent_amount)})</span>`:''}</dd>
      ${d.card_code?`<dt>کۆدی کارت</dt><dd><b class="ltr num">${esc(d.card_code)}</b> <button class="btn btn-sm" data-cp="${esc(d.card_code)}">${I.copy}</button></dd>`:''}
      ${d.reference?`<dt>ژمارەی مامەڵە</dt><dd class="ltr" style="text-align:right">${esc(d.reference)}</dd>`:''}
      ${d.sender?`<dt>نێرەر</dt><dd>${esc(d.sender)}</dd>`:''}
      <dt>کات</dt><dd>${dt(d.created_at)}</dd>
      ${!pend?`<dt>دۆخ</dt><dd><span class="st ${d.status}">${stDep[d.status]}</span> ${esc(d.admin_note||'')}</dd>`:''}</dl>
    ${img ? `<a href="${esc(img)}" target="_blank" rel="noopener"><img class="rcpt" src="${esc(img)}" alt="receipt"></a>` : '<div class="note-box">وێنەی پسوڵە نییە</div>'}
    ${pend ? `<div style="margin-top:16px"><div class="field"><label>بڕی زیادکردن بۆ باڵانس (IQD)</label><input class="inp num" id="apAmt" type="number" value="${d.amount}" style="text-align:right"></div>
      <div class="field"><label>تێبینی بۆ کڕیار (ئارەزوومەندانە)</label><input class="inp" id="apNote" maxlength="300" placeholder="بۆ نموونە: کۆدەکە هەڵەیە"></div>
      <div style="display:flex;gap:10px"><button class="btn btn-ok btn-block btn-lg" id="apOk">✓ پەسەندکردن و زیادکردن</button><button class="btn btn-bad btn-block btn-lg" id="apNo">✕ ڕەتکردنەوە</button></div></div>` : ''}`, {wide:true});
  $$('[data-cp]', m.el).forEach(b => b.onclick = () => copyText(b.dataset.cp));
  if(!pend) return;
  const act = async (approve, btn) => {
    const amount = Math.floor(Number($('#apAmt', m.el).value||0)); const note = $('#apNote', m.el).value;
    if(approve && amount <= 0) return toast('بڕ دروست نییە','bad');
    if(!approve && !(await confirmBox('ڕەتکردنەوە؟','ئەم پارەدانە ڕەتدەکرێتەوە.','ڕەتکردنەوە',true))) return;
    setBusy(btn, true);
    const { error } = await sb.rpc('ra_admin_review_deposit', { p_id:d.id, p_approve:approve, p_amount:amount, p_note:note });
    setBusy(btn, false);
    if(error) return toast(errMsg(error),'bad');
    toast(approve ? `✓ ${num(amount)} IQD زیادکرا بۆ باڵانسی کڕیار` : 'ڕەتکرایەوە', approve?'ok':''); m.close(); refreshBadges(); go();
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
  const list = (data||[]).filter(o => !ordQ || JSON.stringify([o.product_name,o.variant_name,o.order_no,cm[o.user_id]?.email,cm[o.user_id]?.full_name,o.fields]).toLowerCase().includes(ordQ.toLowerCase()));
  const total = list.filter(o=>['processing','delivered'].includes(o.status)).reduce((a,o)=>a+Number(o.price),0);
  $('#view').innerHTML = head('فرۆشتنەکان', `<label class="search">${I.search}<input id="oq" placeholder="گەڕان..." value="${esc(ordQ)}"></label>`) + `
    <div class="tabs2">${[['processing','چاوەڕوانی گەیاندن'],['delivered','گەیەندراو'],['refunded','گەڕێنراوە'],['all','هەمووی']].map(([k,l])=>`<button class="chip ${ordFilter===k?'on':''}" data-f="${k}">${l}</button>`).join('')}<span class="muted" style="margin-inline-start:auto;align-self:center">${num(list.length)} داواکاری · <b class="num">${num(total)}</b> IQD</span></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>بەرهەم</th><th>کڕیار</th><th>زانیاری کڕیار</th><th>نرخ</th><th>کات</th><th>دۆخ</th><th></th></tr></thead><tbody>
    ${list.map(o => { const c = cm[o.user_id]||{}; const f = Object.entries(o.fields||{}).filter(([k,v])=>v).map(([k,v])=>`<b>${esc(k)}:</b> ${esc(v)}`).join('<br>');
      return `<tr><td class="num">${o.order_no}</td><td><b>${esc(o.product_name)}</b><br><small class="muted">${esc(o.variant_name)}</small></td><td>${esc(c.full_name||'—')}<br><small class="muted ltr">${esc(c.email||'')}</small></td><td style="max-width:240px"><small>${f||'—'}</small></td><td class="num">${num(o.price)}</td><td><small>${dt(o.created_at)}</small></td><td><span class="st ${o.status}">${stOrd[o.status]}</span></td>
      <td><button class="btn btn-sm ${o.status==='processing'?'btn-p':''}" data-o="${o.id}">${o.status==='processing'?'گەیاندن':'بینین'}</button></td></tr>`; }).join('') || `<tr><td colspan="8"><div class="empty">هیچ نییە</div></td></tr>`}
    </tbody></table></div>`;
  $('#oq').oninput = e => { ordQ = e.target.value; clearTimeout(A.t); A.t = setTimeout(()=>{ orders().then(()=>{ const i=$('#oq'); i.focus(); i.setSelectionRange(i.value.length,i.value.length); }); }, 350); };
  $$('[data-f]').forEach(b => b.onclick = () => { ordFilter = b.dataset.f; orders(); });
  $$('[data-o]').forEach(b => b.onclick = () => { const o = data.find(x=>x.id===b.dataset.o); openOrder(o, cm[o.user_id]||{}); });
}
function openOrder(o, c){
  const f = Object.entries(o.fields||{}).filter(([k,v])=>v);
  const m = modal(`<div class="modal-h"><h3>داواکاری #${o.order_no}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <dl class="kv"><dt>بەرهەم</dt><dd><b>${esc(o.product_name)}</b> — ${esc(o.variant_name)}</dd><dt>نرخ</dt><dd class="num">${num(o.price)} IQD</dd>
    <dt>کڕیار</dt><dd>${esc(c.full_name||'—')} <span class="muted ltr">${esc(c.email||'')}</span> ${c.phone?`· <span class="ltr">${esc(c.phone)}</span>`:''}</dd>
    ${f.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)} <button class="btn btn-sm" data-cp="${esc(v)}">${I.copy}</button></dd>`).join('')}
    <dt>کات</dt><dd>${dt(o.created_at)}</dd><dt>دۆخ</dt><dd><span class="st ${o.status}">${stOrd[o.status]}</span></dd></dl>
    ${['processing','delivered'].includes(o.status) ? `<div class="field"><label>ئەوەی کڕیار وەریدەگرێت (ئەکاونت، کۆد، لینک...)</label><textarea class="inp ltr" id="dl" rows="5" style="text-align:left" placeholder="Email: ...&#10;Password: ...">${esc(o.delivery||'')}</textarea></div>
      <div class="field"><label>تێبینی (ئارەزوومەندانە)</label><input class="inp" id="dn" value="${esc(o.admin_note||'')}"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-p btn-lg" style="flex:2" id="dlOk">${o.status==='processing'?'✓ گەیاندن بە کڕیار':'پاشەکەوتکردنی گۆڕانکاری'}</button><button class="btn btn-bad btn-lg" style="flex:1" id="rf">↩ گەڕاندنەوەی پارە</button></div>`
      : `<div class="note-box">${esc(o.admin_note||'')}</div>`}`, {wide:true});
  $$('[data-cp]', m.el).forEach(b => b.onclick = () => copyText(b.dataset.cp));
  const ok = $('#dlOk', m.el); if(!ok) return;
  ok.onclick = async e => { const d = $('#dl', m.el).value.trim(); if(!d) return toast('زانیاری گەیاندن بنووسە','bad'); setBusy(e.currentTarget,true);
    const { error } = await sb.rpc('ra_admin_deliver', { p_order:o.id, p_delivery:d, p_note:$('#dn', m.el).value }); if(error){ setBusy(ok,false); return toast(errMsg(error),'bad'); }
    toast('✓ گەیەندرا — کڕیار ئێستا دەیبینێت','ok'); m.close(); refreshBadges(); go(); };
  $('#rf', m.el).onclick = async e => { if(!(await confirmBox('گەڕاندنەوەی پارە', `${num(o.price)} IQD دەگەڕێتەوە بۆ باڵانسی کڕیار.`, 'گەڕاندنەوە', true))) return;
    const { error } = await sb.rpc('ra_admin_refund', { p_order:o.id, p_note:$('#dn', m.el).value || 'گەڕاندنەوە' }); if(error) return toast(errMsg(error),'bad'); toast('پارە گەڕێنرایەوە','ok'); m.close(); refreshBadges(); go(); };
}

/* ───── Products ───── */
async function products(){
  const [p, st] = await Promise.all([ sb.from('ra_products').select('*, ra_variants(*)').order('sort_order'), sb.rpc('ra_stock_counts') ]);
  if(p.error) throw p.error;
  A.products = (p.data||[]).map(x => ({...x, variants:(x.ra_variants||[]).sort((a,b)=>a.sort_order-b.sort_order)}));
  A.stock = {}; (st.data||[]).forEach(r => A.stock[r.variant_id] = Number(r.available));
  $('#view').innerHTML = head('بەرهەمەکان', `<button class="btn btn-p" id="addP">+ بەرهەمی نوێ</button>`) + `<div class="list" id="pl">${A.products.map((x,i) => `
    <div class="prow ${x.active?'':'off'}"><div class="th">${safeUrl(x.image_url)?`<img src="${esc(x.image_url)}" alt="">`:esc(x.emoji||'✨')}</div>
      <div class="grow"><b>${esc(x.name)} ${x.featured?'⭐':''} ${x.active?'':'<span class="st cancelled">شاراوە</span>'}</b>
      <small class="muted">${x.variants.map(v=>`${esc(v.name)}: <span class="num">${num(v.price)}</span>${v.auto_deliver?` <span style="color:var(--ok)">⚡${num(A.stock[v.id]||0)}</span>`:''}`).join(' · ') || 'هیچ پلانێک نییە'}</small></div>
      <div class="acts"><button class="btn btn-sm" data-up="${i}" ${i===0?'disabled':''}>▲</button><button class="btn btn-sm" data-dn="${i}" ${i===A.products.length-1?'disabled':''}>▼</button>
      <button class="btn btn-sm" data-tg="${i}">${x.active?'شاردنەوە':'پیشاندان'}</button><button class="btn btn-sm btn-p" data-ed="${i}">دەستکاری</button></div></div>`).join('') || '<div class="empty">هیچ بەرهەمێک نییە</div>'}</div>`;
  $('#addP').onclick = () => editProduct(null);
  $$('[data-ed]').forEach(b => b.onclick = () => editProduct(A.products[b.dataset.ed]));
  $$('[data-tg]').forEach(b => b.onclick = async () => { const x = A.products[b.dataset.tg]; const { error } = await sb.from('ra_products').update({ active:!x.active }).eq('id', x.id); if(error) return toast(errMsg(error),'bad'); products(); });
  const move = async (i, d) => { const arr = A.products; const j = i+d; [arr[i],arr[j]] = [arr[j],arr[i]];
    await Promise.all(arr.map((x,k) => x.sort_order===k+1 ? null : sb.from('ra_products').update({ sort_order:k+1 }).eq('id', x.id))); products(); };
  $$('[data-up]').forEach(b => b.onclick = () => move(+b.dataset.up, -1));
  $$('[data-dn]').forEach(b => b.onclick = () => move(+b.dataset.dn, 1));
}
async function uploadMedia(file, folder){
  const f = await RA.compressImage(file, 1400, .88);
  const ext = f.type === 'image/svg+xml' ? 'svg' : (f.type.split('/')[1]||'png').replace('jpeg','jpg');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, f, { contentType:f.type, upsert:false, cacheControl:'31536000' });
  if(error) throw error;
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}
function imgField(id, val, label){
  return `<div class="field"><label>${label}</label><div style="display:flex;gap:10px;align-items:center">
    <div class="th" id="${id}Prev" style="width:64px;height:64px;border-radius:14px;overflow:hidden;background:var(--s3);display:grid;place-items:center;flex-shrink:0">${safeUrl(val)?`<img src="${esc(val)}" style="width:100%;height:100%;object-fit:cover" alt="">`:'🖼️'}</div>
    <input class="inp ltr" id="${id}" value="${esc(val||'')}" placeholder="https://... یان وێنە باربکە" style="text-align:left">
    <label class="btn btn-sm" style="flex-shrink:0">باربکە<input type="file" accept="image/*" hidden data-upl="${id}"></label>
    <button type="button" class="btn btn-sm" data-clr="${id}">✕</button></div></div>`;
}
function bindImgFields(scope, folder){
  $$('[data-upl]', scope).forEach(inp => inp.onchange = async () => {
    const f = inp.files[0]; if(!f) return; const id = inp.dataset.upl; const lbl = inp.parentElement; lbl.firstChild.textContent = '...';
    try{ const url = await uploadMedia(f, folder); $('#'+id, scope).value = url; $('#'+id+'Prev', scope).innerHTML = `<img src="${esc(url)}" style="width:100%;height:100%;object-fit:cover" alt="">`; toast('وێنە بارکرا ✓','ok'); }
    catch(e){ toast(errMsg(e),'bad'); } lbl.firstChild.textContent = 'باربکە';
  });
  $$('[data-clr]', scope).forEach(b => b.onclick = () => { $('#'+b.dataset.clr, scope).value=''; $('#'+b.dataset.clr+'Prev', scope).innerHTML='🖼️'; });
}
function slugify(t){ return String(t||'').toLowerCase().trim().replace(/[^\w؀-ۿ]+/g,'-').replace(/^-+|-+$/g,'') || ('p-'+Date.now()); }

function editProduct(p){
  const isNew = !p;
  p = p || { name:'', slug:'', badge:'', emoji:'✨', image_url:'', short:'', description:'', category:'', accent:'', fields:[], delivery_note:'', active:true, featured:false, variants:[] };
  let vars = p.variants.map(v => ({...v})); if(!vars.length) vars.push({ name:'', price:0, old_price:0, auto_deliver:false, active:true });
  let flds = (Array.isArray(p.fields)?p.fields:[]).map(f=>({...f}));
  const removed = [];
  const m = modal(`<div class="modal-h"><h3>${isNew?'بەرهەمی نوێ':'دەستکاریکردنی '+esc(p.name)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="row2"><div class="field"><label>ناوی بەرهەم *</label><input class="inp" id="pN" value="${esc(p.name)}"></div>
      <div class="field"><label>باج (Badge)</label><input class="inp" id="pB" value="${esc(p.badge)}" placeholder="Best Seller"></div></div>
    <div class="row2"><div class="field"><label>ئیمۆجی (کاتێک وێنە نییە)</label><input class="inp" id="pE" value="${esc(p.emoji)}" maxlength="8"></div>
      <div class="field"><label>پۆل (Category)</label><input class="inp" id="pC" value="${esc(p.category)}" placeholder="AI، دیزاین..."></div></div>
    ${imgField('pI', p.image_url, 'وێنەی بەرهەم')}
    <div class="field"><label>کورتە</label><input class="inp" id="pS" value="${esc(p.short)}" maxlength="200"></div>
    <div class="field"><label>وەسفی تەواو</label><textarea class="inp" id="pD" rows="4">${esc(p.description)}</textarea></div>
    <div class="row2"><div class="field"><label>ڕەنگی تایبەت</label><div class="color-row"><input type="color" id="pA" value="${safeColor(p.accent)||'#12c48b'}"><label class="check"><input type="checkbox" id="pAx" ${p.accent?'checked':''}> بەکارهێنان</label></div></div>
      <div class="field"><label>دۆخ</label><div style="display:flex;gap:18px;padding-top:10px"><label class="check">${sw('pAct', p.active)} چالاک</label><label class="check">${sw('pF', p.featured)} ⭐ تایبەت</label></div></div></div>
    <div class="panel" style="padding:14px;margin-bottom:14px"><h3 style="font-size:15px;display:flex;justify-content:space-between">پلان و نرخەکان <button class="btn btn-sm" id="addV">+ پلان</button></h3>
      <div class="muted" style="font-size:12px;margin-bottom:8px">ناو · نرخ · نرخی کۆن (ئارەزوومەندانە) · ⚡ = گەیاندنی ئۆتۆماتیکی لە کۆگا</div><div id="vl"></div></div>
    <div class="panel" style="padding:14px;margin-bottom:14px"><h3 style="font-size:15px;display:flex;justify-content:space-between">خانەکان کە کڕیار پڕی دەکاتەوە <button class="btn btn-sm" id="addF">+ خانە</button></h3>
      <div class="muted" style="font-size:12px;margin-bottom:8px">بۆ نموونە: «ئیمەیڵی ئەکاونتەکەت»</div><div id="fl"></div></div>
    <div class="field"><label>ڕێنمایی دوای کڕین (بۆ کڕیار دەردەکەوێت)</label><textarea class="inp" id="pDN" rows="2" placeholder="بۆ نموونە: پاسۆردەکە مەگۆڕە...">${esc(p.delivery_note||'')}</textarea></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-p btn-lg" style="flex:2" id="pSave">پاشەکەوتکردن</button>${!isNew?`<button class="btn btn-bad btn-lg" id="pDel">سڕینەوە</button>`:''}</div>`, {wide:true, sticky:true});
  bindImgFields(m.el, 'products');
  const drawV = () => {
    $('#vl', m.el).innerHTML = vars.map((v,i) => `<div class="vedit"><input class="inp" data-vn="${i}" value="${esc(v.name)}" placeholder="ناوی پلان (1 مانگ)"><input class="inp num" type="number" data-vp="${i}" value="${Number(v.price)||''}" placeholder="نرخ"><input class="inp num" type="number" data-vo="${i}" value="${Number(v.old_price)||''}" placeholder="نرخی کۆن">
      <label class="check" title="گەیاندنی ئۆتۆماتیکی">${sw('va'+i, v.auto_deliver)} ⚡</label><span style="display:flex;gap:4px">${v.id?`<button class="btn btn-sm" data-stk="${i}" title="کۆگا">📦 ${num(A.stock[v.id]||0)}</button>`:''}<button class="btn btn-sm btn-bad" data-vr="${i}">✕</button></span></div>`).join('');
    $$('[data-vn]', m.el).forEach(e => e.oninput = () => vars[e.dataset.vn].name = e.value);
    $$('[data-vp]', m.el).forEach(e => e.oninput = () => vars[e.dataset.vp].price = Number(e.value||0));
    $$('[data-vo]', m.el).forEach(e => e.oninput = () => vars[e.dataset.vo].old_price = Number(e.value||0));
    vars.forEach((v,i) => { const c = $('#va'+i, m.el); c.onchange = () => v.auto_deliver = c.checked; });
    $$('[data-vr]', m.el).forEach(b => b.onclick = () => { const v = vars.splice(+b.dataset.vr,1)[0]; if(v.id) removed.push(v.id); drawV(); });
    $$('[data-stk]', m.el).forEach(b => b.onclick = () => manageStock(vars[+b.dataset.stk], p.name));
  };
  const drawF = () => {
    $('#fl', m.el).innerHTML = flds.map((f,i) => `<div class="fedit"><input class="inp" data-fl="${i}" value="${esc(f.label)}" placeholder="ناوی خانە"><label class="check">${sw('fr'+i, f.required)} پێویست</label><button class="btn btn-sm btn-bad" data-fr="${i}">✕</button></div>`).join('') || '<div class="muted" style="font-size:13px">هیچ خانەیەک نییە</div>';
    $$('[data-fl]', m.el).forEach(e => e.oninput = () => flds[e.dataset.fl].label = e.value);
    flds.forEach((f,i) => { const c = $('#fr'+i, m.el); c.onchange = () => f.required = c.checked; });
    $$('[data-fr]', m.el).forEach(b => b.onclick = () => { flds.splice(+b.dataset.fr,1); drawF(); });
  };
  drawV(); drawF();
  $('#addV', m.el).onclick = () => { vars.push({ name:'', price:0, old_price:0, auto_deliver:false, active:true }); drawV(); };
  $('#addF', m.el).onclick = () => { flds.push({ label:'', required:true }); drawF(); };
  const del = $('#pDel', m.el); if(del) del.onclick = async () => {
    if(!(await confirmBox('سڕینەوەی بەرهەم', 'ئەم بەرهەمە بە تەواوی دەسڕدرێتەوە. (باشترە تەنها بیشاریتەوە)', 'سڕینەوە', true))) return;
    const { error } = await sb.from('ra_products').delete().eq('id', p.id); if(error) return toast(errMsg(error),'bad'); toast('سڕایەوە'); m.close(); products(); };
  $('#pSave', m.el).onclick = async e => {
    const name = $('#pN', m.el).value.trim(); if(!name) return toast('ناوی بەرهەم بنووسە','bad');
    const cleanVars = vars.filter(v => v.name.trim());
    if(!cleanVars.length) return toast('لانیکەم یەک پلان زیاد بکە','bad');
    if(cleanVars.some(v => !(v.price >= 0))) return toast('نرخ دروست نییە','bad');
    const row = { name, badge:$('#pB', m.el).value.trim(), emoji:$('#pE', m.el).value.trim()||'✨', category:$('#pC', m.el).value.trim(), image_url:$('#pI', m.el).value.trim(),
      short:$('#pS', m.el).value.trim(), description:$('#pD', m.el).value, accent:$('#pAx', m.el).checked ? $('#pA', m.el).value : '', active:$('#pAct', m.el).checked, featured:$('#pF', m.el).checked,
      fields: flds.filter(f=>f.label.trim()).map(f=>({ label:f.label.trim(), required:!!f.required })), delivery_note:$('#pDN', m.el).value };
    const btn = e.currentTarget; setBusy(btn, true);
    try{
      let pid = p.id;
      if(isNew){ row.slug = slugify(name) + '-' + Math.random().toString(36).slice(2,5); row.sort_order = A.products.length + 1;
        const r = await sb.from('ra_products').insert(row).select('id').single(); if(r.error) throw r.error; pid = r.data.id; }
      else { const r = await sb.from('ra_products').update(row).eq('id', pid); if(r.error) throw r.error; }
      for(const id of removed){ const r = await sb.from('ra_variants').delete().eq('id', id); if(r.error) throw r.error; }
      for(const [i,v] of cleanVars.entries()){
        const vr = { product_id:pid, name:v.name.trim(), price:Math.floor(v.price), old_price:Math.floor(v.old_price||0), auto_deliver:!!v.auto_deliver, active:true, sort_order:i+1 };
        const r = v.id ? await sb.from('ra_variants').update(vr).eq('id', v.id) : await sb.from('ra_variants').insert(vr);
        if(r.error) throw r.error;
      }
      toast('پاشەکەوت کرا ✓','ok'); m.close(); products();
    }catch(err){ setBusy(btn, false, 'پاشەکەوتکردن'); toast(errMsg(err),'bad'); }
  };
}
async function manageStock(v, pname){
  const load = async () => (await sb.from('ra_stock').select('*').eq('variant_id', v.id).order('created_at',{ascending:false}).limit(500)).data || [];
  let rows = await load();
  const m = modal(`<div class="modal-h"><h3>کۆگا — ${esc(pname)} / ${esc(v.name)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="note-box" style="margin-bottom:12px">هەر دێڕێک = یەک بەرهەم (ئەکاونت، کۆد...). کاتێک کڕیار دەکڕێت، یەکسەر یەکێکی بۆ دەنێردرێت. ئەگەر یەک بەرهەم چەند دێڕی هەیە، بە <b class="ltr">---</b> جیایان بکەرەوە.</div>
    <div class="field"><textarea class="inp ltr" id="stIn" rows="6" style="text-align:left" placeholder="email1@x.com | pass1&#10;email2@x.com | pass2"></textarea></div>
    <label class="check" style="margin-bottom:10px"><input type="checkbox" id="stSep"> جیاکردنەوە بە --- لە جیاتی هەر دێڕێک</label>
    <button class="btn btn-p btn-block" id="stAdd">+ زیادکردن بۆ کۆگا</button>
    <h3 style="margin:18px 0 10px;font-size:15px" id="stH"></h3><div class="list" id="stL" style="max-height:300px;overflow:auto"></div>`, {wide:true});
  const draw = () => {
    const avail = rows.filter(r=>!r.used);
    $('#stH', m.el).innerHTML = `بەردەست: <span class="num">${num(avail.length)}</span> · فرۆشراو: <span class="num">${num(rows.length-avail.length)}</span>`;
    $('#stL', m.el).innerHTML = rows.map(r => `<div class="item" style="padding:10px"><div class="grow"><b class="ltr" style="text-align:left;font-family:monospace;font-size:13px">${esc(r.content.slice(0,120))}</b><small>${r.used?'فرۆشرا':'بەردەستە'} · ${dt(r.created_at)}</small></div>${r.used?'<span class="st delivered">فرۆشرا</span>':`<button class="btn btn-sm btn-bad" data-rm="${r.id}">✕</button>`}</div>`).join('') || '<div class="empty">کۆگا بەتاڵە</div>';
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
    <div class="prow ${m.active?'':'off'}"><div class="th" style="background:${safeColor(m.color)||'var(--s3)'};color:#fff;font-weight:900;font-size:14px">${safeUrl(m.logo_url)?`<img src="${esc(m.logo_url)}" alt="">`:esc(m.name.slice(0,3))}</div>
    <div class="grow"><b>${esc(m.name)} ${m.active?'':'<span class="st cancelled">ناچالاک</span>'}</b><small class="muted"><span class="ltr">${esc(m.account||'—')}</span> · کەمترین: <span class="num">${num(m.min_amount)}</span> ${m.currency!=='IQD'?`· 1 ${esc(m.currency)} = <span class="num">${num(m.rate)}</span> IQD`:''}</small></div>
    <div class="acts"><button class="btn btn-sm" data-tg="${i}">${m.active?'ناچالاککردن':'چالاککردن'}</button><button class="btn btn-sm btn-p" data-ed="${i}">دەستکاری</button></div></div>`).join('') || '<div class="empty">هیچ نییە</div>'}</div>`;
  $('#addM').onclick = () => editMethod(null);
  $$('[data-ed]').forEach(b => b.onclick = () => editMethod(A.methods[b.dataset.ed]));
  $$('[data-tg]').forEach(b => b.onclick = async () => { const x = A.methods[b.dataset.tg]; await sb.from('ra_payment_methods').update({ active:!x.active }).eq('id', x.id); payments(); });
}
function editMethod(x){
  const isNew = !x; x = x || { name:'', kind:'wallet', account:'', holder:'', instructions:'', logo_url:'', qr_url:'', color:'#12c48b', currency:'IQD', rate:1, min_amount:1000, needs_receipt:true, needs_code:false, active:true };
  const m = modal(`<div class="modal-h"><h3>${isNew?'ڕێگای نوێ':esc(x.name)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="row2"><div class="field"><label>ناو *</label><input class="inp" id="mN" value="${esc(x.name)}"></div>
      <div class="field"><label>جۆر</label><select class="inp" id="mK">${[['fib','FIB'],['fastpay','FastPay'],['superqi','SuperQi'],['asia','کارتی ئاسیا'],['crypto','کریپتۆ'],['wallet','جزدانی تر'],['other','هیتر']].map(([k,l])=>`<option value="${k}" ${x.kind===k?'selected':''}>${l}</option>`).join('')}</select></div></div>
    <div class="row2"><div class="field"><label>ژمارە / ئەدرەسی وەرگرتن</label><input class="inp ltr" id="mAc" value="${esc(x.account)}" style="text-align:left"></div>
      <div class="field"><label>ناوی خاوەن / تۆڕ</label><input class="inp" id="mH" value="${esc(x.holder)}"></div></div>
    <div class="field"><label>ڕێنمایی بۆ کڕیار</label><textarea class="inp" id="mI" rows="3">${esc(x.instructions)}</textarea></div>
    ${imgField('mL', x.logo_url, 'لۆگۆ')}
    ${imgField('mQ', x.qr_url, 'QR کۆد (ئارەزوومەندانە)')}
    <div class="row2"><div class="field"><label>ڕەنگ</label><div class="color-row"><input type="color" id="mC" value="${safeColor(x.color)||'#12c48b'}"></div></div>
      <div class="field"><label>کەمترین بڕ (IQD)</label><input class="inp num" type="number" id="mMin" value="${Number(x.min_amount)}"></div></div>
    <div class="row2"><div class="field"><label>دراو</label><input class="inp ltr" id="mCur" value="${esc(x.currency)}" placeholder="IQD / USDT"></div>
      <div class="field"><label>نرخی گۆڕینەوە (1 دراو = ? IQD)</label><input class="inp num" type="number" id="mR" value="${Number(x.rate)}"></div></div>
    <div style="display:flex;gap:20px;flex-wrap:wrap;margin:6px 0 16px"><label class="check">${sw('mRc', x.needs_receipt)} پسوڵە پێویستە</label><label class="check">${sw('mCd', x.needs_code)} کۆدی کارت پێویستە</label><label class="check">${sw('mAct', x.active)} چالاک</label></div>
    <div style="display:flex;gap:10px"><button class="btn btn-p btn-lg" style="flex:2" id="mS">پاشەکەوتکردن</button>${!isNew?'<button class="btn btn-bad btn-lg" id="mD">سڕینەوە</button>':''}</div>`, {wide:true, sticky:true});
  bindImgFields(m.el, 'payments');
  $('#mS', m.el).onclick = async e => {
    const row = { name:$('#mN', m.el).value.trim(), kind:$('#mK', m.el).value, account:$('#mAc', m.el).value.trim(), holder:$('#mH', m.el).value.trim(), instructions:$('#mI', m.el).value,
      logo_url:$('#mL', m.el).value.trim(), qr_url:$('#mQ', m.el).value.trim(), color:$('#mC', m.el).value, min_amount:Math.max(1, Math.floor(Number($('#mMin', m.el).value||1000))),
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
  if(cusQ) q = q.or(`email.ilike.%${cusQ.replace(/[%,()]/g,'')}%,full_name.ilike.%${cusQ.replace(/[%,()]/g,'')}%,phone.ilike.%${cusQ.replace(/[%,()]/g,'')}%`);
  const { data, error } = await q; if(error) throw error;
  $('#view').innerHTML = head('کڕیارەکان', `<label class="search">${I.search}<input id="cq" placeholder="ئیمەیڵ، ناو، ژمارە..." value="${esc(cusQ)}"></label>`) + `
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>کڕیار</th><th>مۆبایل</th><th>باڵانس</th><th>چوونەژوورەوە</th><th>تۆمارکردن</th><th>دوایین سەردان</th><th></th></tr></thead><tbody>
    ${(data||[]).map(c=>`<tr class="${c.blocked?'off':''}"><td><b>${esc(c.full_name||'—')}</b> ${c.blocked?'<span class="st cancelled">ڕاگیراو</span>':''}<br><small class="muted ltr">${esc(c.email||'')}</small></td><td class="ltr" style="text-align:right">${esc(c.phone||'—')}</td><td><b class="num">${num(c.balance)}</b></td><td>${esc(c.provider==='google'?'Google':'ئیمەیڵ')}</td><td><small>${dt(c.created_at)}</small></td><td><small>${ago(c.last_seen)}</small></td><td><button class="btn btn-sm btn-p" data-c="${c.id}">بینین</button></td></tr>`).join('') || `<tr><td colspan="7"><div class="empty">هیچ نییە</div></td></tr>`}
    </tbody></table></div>`;
  $('#cq').oninput = e => { cusQ = e.target.value.trim(); clearTimeout(A.t); A.t = setTimeout(()=>customers().then(()=>{ const i=$('#cq'); i.focus(); i.setSelectionRange(i.value.length,i.value.length); }), 400); };
  $$('[data-c]').forEach(b => b.onclick = () => openCustomer((data||[]).find(x=>x.id===b.dataset.c)));
}
async function openCustomer(c){
  const [o, t] = await Promise.all([ sb.from('ra_orders').select('*').eq('user_id', c.id).order('created_at',{ascending:false}).limit(50), sb.from('ra_wallet_tx').select('*').eq('user_id', c.id).order('created_at',{ascending:false}).limit(50) ]);
  const spent = (o.data||[]).filter(x=>['processing','delivered'].includes(x.status)).reduce((a,x)=>a+Number(x.price),0);
  const m = modal(`<div class="modal-h"><h3>${esc(c.full_name||c.email)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)"><div class="kpi"><small>باڵانس</small><b class="num" id="cBal">${num(c.balance)}</b></div><div class="kpi"><small>کۆی کڕین</small><b class="num">${num(spent)}</b></div><div class="kpi"><small>ژمارەی کڕین</small><b class="num">${num((o.data||[]).length)}</b></div></div>
    <dl class="kv"><dt>ئیمەیڵ</dt><dd class="ltr" style="text-align:right">${esc(c.email||'')}</dd><dt>مۆبایل</dt><dd class="ltr" style="text-align:right">${esc(c.phone||'—')}</dd><dt>تۆمارکردن</dt><dd>${dt(c.created_at)}</dd></dl>
    <div class="panel" style="padding:14px;margin-bottom:14px"><h3 style="font-size:15px">گۆڕینی باڵانس بە دەست</h3>
      <div class="row2"><input class="inp num" type="number" id="adj" placeholder="+5000 یان -5000"><input class="inp" id="adjN" placeholder="هۆکار"></div>
      <button class="btn btn-p btn-block" style="margin-top:10px" id="adjB">جێبەجێکردن</button></div>
    <button class="btn ${c.blocked?'btn-ok':'btn-bad'} btn-block" id="blk">${c.blocked?'لابردنی ڕاگرتن':'ڕاگرتنی ئەکاونت'}</button>
    <h3 style="margin:18px 0 10px;font-size:15px">مامەڵەکان</h3><div class="list" style="max-height:280px;overflow:auto">${(t.data||[]).map(x=>`<div class="item" style="padding:10px"><div class="grow"><b>${esc({deposit:'زیادکردن',purchase:'کڕین',refund:'گەڕاندنەوە',adjust:'ڕێکخستن'}[x.kind])} · ${esc(x.note||'')}</b><small>${dt(x.created_at)}</small></div><b class="num ${x.amount>0?'amt-pos':''}">${x.amount>0?'+':''}${num(x.amount)}</b></div>`).join('') || '<div class="empty">هیچ نییە</div>'}</div>`, {wide:true});
  $('#adjB', m.el).onclick = async e => { const d = Math.trunc(Number($('#adj', m.el).value||0)); if(!d) return toast('بڕ بنووسە','bad');
    if(!(await confirmBox('دڵنیایت؟', `${d>0?'+':''}${num(d)} IQD بۆ باڵانسی ${c.email}`))) return;
    const { data, error } = await sb.rpc('ra_admin_adjust_balance', { p_user:c.id, p_delta:d, p_note:$('#adjN', m.el).value }); if(error) return toast(errMsg(error),'bad');
    $('#cBal', m.el).textContent = num(data); c.balance = data; toast('✓ باڵانس نوێکرایەوە','ok'); $('#adj', m.el).value=''; };
  $('#blk', m.el).onclick = async () => { const { error } = await sb.rpc('ra_admin_set_blocked', { p_user:c.id, p_blocked:!c.blocked }); if(error) return toast(errMsg(error),'bad'); toast('✓'); m.close(); customers(); };
}

/* ───── Visitors ───── */
let visDays = 7;
async function visitors(){
  const { data:r, error } = await sb.rpc('ra_admin_visit_report', { p_days: visDays }); if(error) throw error;
  const bar = (arr, key, label) => { const max = Math.max(1, ...arr.map(x=>x.c)); return arr.map(x => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span class="ltr" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:75%">${esc(x[key])}</span><b class="num">${num(x.c)}</b></div><div style="height:8px;border-radius:99px;background:var(--s3)"><div style="height:100%;width:${x.c/max*100}%;border-radius:99px;background:linear-gradient(90deg,var(--p),var(--gold))"></div></div></div>`).join('') || '<div class="muted">هیچ</div>'; };
  $('#view').innerHTML = head('سەردانیکەران', `<div class="tabs2" style="margin:0">${[[1,'ئەمڕۆ'],[7,'7 ڕۆژ'],[30,'30 ڕۆژ'],[90,'90 ڕۆژ']].map(([d,l])=>`<button class="chip ${visDays===d?'on':''}" data-d="${d}">${l}</button>`).join('')}</div>`) + `
    <div class="kpis"><div class="kpi"><span class="ico">🟢</span><small>ئێستا ئۆنلاین</small><b class="num">${num(r.online_now)}</b></div><div class="kpi"><span class="ico">👤</span><small>سەردانیکەری جیاواز</small><b class="num">${num(r.visitors)}</b></div><div class="kpi"><span class="ico">📄</span><small>بینینی پەڕە</small><b class="num">${num(r.visits)}</b></div><div class="kpi"><span class="ico">🔐</span><small>ئەندامی چووەژوورەوە</small><b class="num">${num(r.members)}</b></div></div>
    <div class="panel" style="margin-bottom:16px"><h3>سەردانیکەران بە ڕۆژ</h3>${bars((r.daily||[]).slice(-30), 'visitors', 'gold')}</div>
    <div class="two" style="grid-template-columns:1fr 1fr 1fr"><div class="panel"><h3>پەڕەکان</h3>${bar(r.pages||[],'path')}</div><div class="panel"><h3>لە کوێوە هاتوون</h3>${bar(r.refs||[],'ref')}</div><div class="panel"><h3>ئامێر و بڕاوزەر</h3>${bar(r.devices||[],'device')}<hr style="border:0;border-top:1px solid var(--line);margin:12px 0">${bar(r.browsers||[],'browser')}</div></div>
    <div class="panel" style="margin-top:16px"><h3>دوایین سەردانەکان</h3><div class="tbl-wrap" style="border:0"><table class="tbl"><thead><tr><th>کات</th><th>پەڕە</th><th>ئامێر</th><th>سەرچاوە</th><th>بەکارهێنەر</th></tr></thead><tbody>
    ${(r.recent||[]).map(v=>`<tr><td><small>${ago(v.created_at)}</small></td><td class="ltr" style="text-align:right">${esc(v.path)}</td><td>${esc(v.device)} · ${esc(v.browser)}</td><td class="ltr" style="text-align:right">${esc(v.referrer||'ڕاستەوخۆ')}</td><td class="ltr" style="text-align:right"><small>${esc(v.email || ('میوان ' + String(v.visitor_id).slice(0,6)))}</small></td></tr>`).join('')}
    </tbody></table></div></div>`;
  $$('[data-d]').forEach(b => b.onclick = () => { visDays = +b.dataset.d; visitors(); });
}

/* ───── Settings ───── */
async function settings(){
  const { data } = await sb.from('ra_settings').select('value').eq('key','site').maybeSingle();
  const s = data?.value || {};
  const f = (k, l, ph='', type='input') => `<div class="field"><label>${l}</label>${type==='ta' ? `<textarea class="inp" data-k="${k}" rows="3" placeholder="${esc(ph)}">${esc(s[k]||'')}</textarea>` : `<input class="inp" data-k="${k}" value="${esc(s[k]||'')}" placeholder="${esc(ph)}">`}</div>`;
  $('#view').innerHTML = head('ڕێکخستنی سایت', `<a class="btn" href="/" target="_blank">بینینی سایت ↗</a><button class="btn btn-p" id="sS">پاشەکەوتکردن</button>`) + `
    <div class="two" style="grid-template-columns:1fr 1fr">
      <div class="panel"><h3>ناسنامە</h3>${f('name','ناوی سایت','Realm Academy')}${f('tagline','دروشم')}${imgField('sLogo', s.logo, 'لۆگۆ')}
        <h3 style="margin-top:20px">ڕەنگەکان</h3><div class="row2"><div class="field"><label>ڕەنگی سەرەکی</label><div class="color-row"><input type="color" id="cP" value="${safeColor(s.primary)||'#12c48b'}"><span class="muted ltr" id="cPv">${esc(s.primary||'#12c48b')}</span></div></div>
        <div class="field"><label>ڕەنگی دووەم (زێڕین)</label><div class="color-row"><input type="color" id="cA" value="${safeColor(s.accent)||'#e9c46a'}"><span class="muted ltr" id="cAv">${esc(s.accent||'#e9c46a')}</span></div></div></div>
        <div class="field"><label>ڕەنگە ئامادەکراوەکان</label><div style="display:flex;gap:8px;flex-wrap:wrap">${[['#12c48b','#e9c46a','زمرووت'],['#7c5cff','#ffb86b','مۆر'],['#2f9bff','#ffd166','شین'],['#ff4d6d','#ffd6a5','سوور'],['#f59e0b','#fde68a','زێڕ'],['#14b8a6','#f472b6','فیرۆزە']].map(([p,a,n])=>`<button class="btn btn-sm" data-pal="${p},${a}"><span style="width:14px;height:14px;border-radius:50%;background:${p}"></span><span style="width:14px;height:14px;border-radius:50%;background:${a}"></span>${n}</button>`).join('')}</div></div></div>
      <div class="panel"><h3>ناوەڕۆکی پەڕەی سەرەکی</h3>${f('announcement','شریتی ڕاگەیاندن (سەرەوە)','بەتاڵی بهێڵە بۆ شاردنەوە')}${f('hero_title','سەردێڕی گەورە')}${f('hero_text','دەقی ناساندن','','ta')}${f('deposit_note','تێبینی لە پەڕەی زیادکردنی پارە','','ta')}</div>
      <div class="panel"><h3>پەیوەندی و سۆشیال</h3>${f('whatsapp','ژمارەی WhatsApp','07xx...')}${f('telegram','لینکی Telegram','https://t.me/...')}${f('instagram','لینکی Instagram','https://instagram.com/...')}${f('footer','دەقی خوارەوە')}</div>
    </div>`;
  bindImgFields($('#view'), 'site');
  const cP = $('#cP'), cA = $('#cA');
  const live = () => { $('#cPv').textContent = cP.value; $('#cAv').textContent = cA.value; RA.applySettings({...RA.settings, primary:cP.value, accent:cA.value}); };
  cP.oninput = live; cA.oninput = live;
  $$('[data-pal]').forEach(b => b.onclick = () => { const [p,a] = b.dataset.pal.split(','); cP.value = p; cA.value = a; live(); });
  $('#sS').onclick = async e => {
    const v = {...s}; $$('[data-k]').forEach(i => v[i.dataset.k] = i.value.trim());
    v.logo = $('#sLogo').value.trim(); v.primary = cP.value; v.accent = cA.value;
    setBusy(e.currentTarget, true);
    const { error } = await sb.from('ra_settings').upsert({ key:'site', value:v, updated_at:new Date().toISOString() });
    setBusy(e.currentTarget, false, 'پاشەکەوتکردن');
    if(error) return toast(errMsg(error),'bad');
    try{ sessionStorage.removeItem('ra_settings'); }catch{}
    RA.applySettings(v); toast('✓ پاشەکەوت کرا — سایت نوێ بووەوە','ok');
  };
}

/* ───── Admins ───── */
async function admins(){
  const { data, error } = await sb.rpc('ra_admin_list_admins'); if(error) throw error;
  $('#view').innerHTML = head('ئەدمینەکان') + `<div class="panel" style="max-width:640px">
    <div class="note-box" style="margin-bottom:14px">کەسەکە دەبێت سەرەتا لە سایتەکە ئەکاونتی دروست کردبێت، پاشان ئیمەیڵەکەی لێرە زیاد بکە.</div>
    <div style="display:flex;gap:10px;margin-bottom:18px"><input class="inp ltr" id="adE" placeholder="email@gmail.com" style="text-align:right"><button class="btn btn-p" id="adB">زیادکردن</button></div>
    <div class="list">${(data||[]).map(a=>`<div class="item"><div class="ic">🛡️</div><div class="grow"><b class="ltr" style="text-align:right">${esc(a.email)}</b><small>${dt(a.created_at)}</small></div>${a.user_id!==A.user.id?`<button class="btn btn-sm btn-bad" data-rm="${a.user_id}">لابردن</button>`:'<span class="muted">تۆ</span>'}</div>`).join('')}</div></div>`;
  $('#adB').onclick = async () => { const e = $('#adE').value.trim(); if(!e) return; const { error } = await sb.rpc('ra_admin_add_admin', { p_email:e }); if(error) return toast(errMsg(error),'bad'); toast('✓ زیادکرا','ok'); admins(); };
  $$('[data-rm]').forEach(b => b.onclick = async () => { if(!(await confirmBox('لابردنی ئەدمین؟','','لابردن',true))) return; const { error } = await sb.rpc('ra_admin_remove_admin', { p_user:b.dataset.rm }); if(error) return toast(errMsg(error),'bad'); admins(); });
}

/* ───── Boot ───── */
sb.auth.onAuthStateChange((ev, session) => { if(A.booting) return; const id = session?.user?.id || null; if(ev === 'SIGNED_OUT' || (ev === 'SIGNED_IN' && id !== (A.user?.id||null))) check(); });
(async () => { A.booting = true; try{ await RA.loadSettings(); }catch{} await check(); A.booting = false; if(location.search.includes('code=')) history.replaceState(null,'',location.pathname+location.hash); })();
})();
