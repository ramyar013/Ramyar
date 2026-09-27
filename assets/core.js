/* Realm Academy — shared core */
(function(){
'use strict';
const SUPABASE_URL = 'https://mqvfnerqrlzpnfvpstok.supabase.co';
const SUPABASE_KEY = 'sb_publishable_F8Eh68QLO5KPRjYOt_lLAQ_Z97KkIZ4';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true, flowType:'pkce' }
});

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = v => String(v ?? '').replace(/[&<>"'`]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
const num = n => Number(n || 0).toLocaleString('en-US');
const safeUrl = u => { u = String(u||'').trim(); if(!u) return ''; if(/^(https:\/\/|data:image\/(png|jpe?g|webp|gif);base64,)/i.test(u)) return u; return ''; };
const safeColor = c => /^#[0-9a-f]{3,8}$/i.test(String(c||'').trim()) ? String(c).trim() : '';
const dt = d => { if(!d) return ''; const x = new Date(d); const p = n => String(n).padStart(2,'0'); return '\u2066' + p(x.getDate()) + '/' + p(x.getMonth()+1) + '/' + x.getFullYear() + ' · ' + p(x.getHours()) + ':' + p(x.getMinutes()) + '\u2069'; };
const ago = d => { const s = (Date.now() - new Date(d).getTime())/1000; if(s<60) return 'ئێستا'; if(s<3600) return Math.floor(s/60)+' خولەک لەمەوبەر'; if(s<86400) return Math.floor(s/3600)+' کاتژمێر لەمەوبەر'; return Math.floor(s/86400)+' ڕۆژ لەمەوبەر'; };

const I = {
  logo:'<img src="/assets/img/logo.svg" alt="Realm Academy" class="logo-img">',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z"/></svg>',
  wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><circle cx="16" cy="14" r="1.5"/></svg>',
  bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9Z"/></svg>',
  headset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 16a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2ZM3 16a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2Z"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  copy:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  share:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
  globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  download:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>',
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>',
  send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg>',
  x:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  upload:'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/></svg>',
  logout:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"/></svg>',
  tg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.4-.1-.6-.6-.2L6.6 13.2l-4.7-1.5c-1-.3-1-1 .2-1.5L20.5 3c.9-.3 1.6.2 1.4 1.3Z"/></svg>',
  ig:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  google:'<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>'
};


/* Language */
let LANG = 'ku';
try{ LANG = localStorage.getItem('ra_lang') || 'ku'; }catch{}
try{ const ql = new URLSearchParams(location.search).get('lang'); if(['ku','en','ar'].includes(ql)){ LANG = ql; localStorage.setItem('ra_lang', ql); } }catch{}
if(!['ku','en','ar'].includes(LANG) || document.documentElement.hasAttribute('data-admin')) LANG = 'ku';
function applyLang(){
  const h = document.documentElement;
  h.lang = LANG === 'ku' ? 'ckb' : LANG;
  h.dir = LANG === 'en' ? 'ltr' : 'rtl';
}
applyLang();
function setLang(l){ LANG = ['en','ar'].includes(l) ? l : 'ku'; try{ localStorage.setItem('ra_lang', LANG); }catch{} applyLang(); }
function t(key, vars){
  const ov = (SETTINGS.texts && SETTINGS.texts[LANG] && SETTINGS.texts[LANG][key]);
  let s = (ov != null && String(ov).trim() !== '') ? String(ov) : ((window.RA_TEXTS[LANG]||{})[key] ?? (window.RA_TEXTS.ku[key] ?? key));
  if(vars) s = s.replace(/\{(\w+)\}/g, (m,k) => vars[k] != null ? vars[k] : m);
  return s;
}
function money(n){ return num(n) + ' ' + t('currency'); }
/* Pick localized DB field: obj.field_en when English and present */
function L(obj, field){ if(!obj) return ''; if(LANG !== 'ku'){ const v = obj[field + '_' + LANG]; if(v && String(v).trim()) return v; } return obj[field] || ''; }

/* Toasts */
function toast(msg, type=''){
  let box = $('.toasts'); if(!box){ box = document.createElement('div'); box.className='toasts'; document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; box.appendChild(t);
  setTimeout(()=>{ t.style.transition='.3s'; t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, 3400);
}

/* Modal */
function modal(html, opts={}){
  const bg = document.createElement('div'); bg.className='modal-bg';
  bg.innerHTML = `<div class="modal ${opts.wide?'wide':''}" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); opts.onClose && opts.onClose(); };
  const onKey = e => { if(e.key==='Escape') close(); };
  bg.addEventListener('click', e => { if(e.target===bg && !opts.sticky) close(); if(e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(bg);
  return { el: bg.firstElementChild, close };
}
function confirmBox(title, text, okText, danger=false){ okText = okText || t('yes');
  return new Promise(res => {
    const m = modal(`<div class="modal-h"><h3>${esc(title)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
      <p class="t2" style="margin-bottom:20px;white-space:pre-line">${esc(text)}</p>
      <div style="display:flex;gap:10px"><button class="btn ${danger?'btn-bad':'btn-p'} btn-block" data-ok>${esc(okText)}</button><button class="btn btn-block" data-close>${esc(t('cancel'))}</button></div>`, {onClose:()=>res(false)});
    m.el.querySelector('[data-ok]').onclick = () => { res(true); m.close(); };
  });
}

function confetti(){
  const c = document.createElement('div'); c.className='confetti';
  const colors = ['#12c48b','#e9c46a','#5aa9ff','#f0616d','#ffffff'];
  for(let i=0;i<70;i++){ const p=document.createElement('i'); p.style.left=Math.random()*100+'%'; p.style.background=colors[i%colors.length]; p.style.animationDelay=(Math.random()*.8)+'s'; p.style.animationDuration=(2+Math.random()*1.6)+'s'; c.appendChild(p); }
  document.body.appendChild(c); setTimeout(()=>c.remove(), 4200);
}

async function copyText(t){
  try{ await navigator.clipboard.writeText(String(t)); toast(t('copied'),'ok'); }
  catch{ const a=document.createElement('textarea'); a.value=t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); toast(t('copied'),'ok'); }
}

/* Theme */
function applyTheme(){
  let t = 'dark'; try{ t = localStorage.getItem('ra_theme') || 'dark'; }catch{}
  document.documentElement.setAttribute('data-theme', t);
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  try{ localStorage.setItem('ra_theme', cur); }catch{}
  document.documentElement.setAttribute('data-theme', cur);
  return cur;
}
applyTheme();


/* Credentials: detect e-mail / username / password in stock items and deliveries */
const CRED_EMAIL = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/;
function credKind(label){
  const l = String(label).toLowerCase().trim();
  if(/^(e-?mail|mail|gmail|ئیمەیڵ|ایمەیڵ|ايميل|إيميل|البريد.*)$/.test(l)) return 'email';
  if(/^(pass(word)?|pwd|pw|pass ?code|پاسوۆرد|پاسۆرد|وشەی نهێنی|كلمة (السر|المرور)|الرمز|رمز)$/.test(l)) return 'password';
  if(/^(user(name)?|login|id|یوزەر(نەیم)?|ناوی بەکارهێنەر|اسم المستخدم|المستخدم)$/.test(l)) return 'username';
  return '';
}
function parseCred(text){
  const src = String(text || '').replace(/\r/g, '').trim(); const out = { email:'', username:'', password:'', extra:[] };
  if(!src) return out;
  const lines = src.split('\n').map(x => x.trim()).filter(Boolean);
  let labeled = 0;
  for(const ln of lines){
    const m = ln.match(/^([^:=：]{1,24})\s*[:=：]\s*(.+)$/);
    const k = m ? credKind(m[1]) : '';
    if(k && !out[k]){ out[k] = m[2].trim(); labeled++; } else out.extra.push(ln);
  }
  if(labeled) return out;
  // one-line formats: "email:pass", "email | pass", "email pass", "user:pass"
  out.extra = [];
  const first = lines[0]; const rest = lines.slice(1);
  const em = first.match(CRED_EMAIL);
  if(em){
    out.email = em[0];
    const after = first.slice(first.indexOf(em[0]) + em[0].length).replace(/^[\s|:;,\/\t\-–—]+/, '').replace(/^(pass(word)?|pwd|pw|پاسوۆرد|وشەی نهێنی)\s*[:=]\s*/i, '');
    let before = first.slice(0, first.indexOf(em[0])).replace(/[\s|:;,\/\t\-–—]+$/, ''); if(credKind(before) === 'email') before = '';
    const toks = after.split(/\s*[|;\t]\s*|\s+/).filter(Boolean);
    if(toks.length) out.password = toks.shift();
    else if(rest.length && /^\S{2,128}$/.test(rest[0])) out.password = rest.shift();
    if(before) out.extra.push(before);
    if(toks.length) out.extra.push(toks.join(' '));
  } else {
    const mm = first.match(/^([^\s|:;]{2,64})\s*(?:\||:|;|\t|\s)\s*([^\s|;]{2,128})(?:\s*[|;\t]\s*(.+))?$/);
    if(mm && !/:\/\//.test(first) && rest.length <= 3){ out.username = mm[1]; out.password = mm[2]; if(mm[3]) out.extra.push(mm[3]); }
    else { out.extra.push(first); }
  }
  out.extra.push(...rest);
  return out;
}
function credFound(c){ return !!((c.email || c.username) && c.password); }
function normCred(text){
  const c = parseCred(text); if(!credFound(c)) return String(text || '').trim();
  return [c.email ? 'Email: ' + c.email : '', c.username ? 'Username: ' + c.username : '', 'Password: ' + c.password, ...c.extra].filter(Boolean).join('\n');
}

/* Settings */
let SETTINGS = {};
function applySettings(s){
  s = s || {}; SETTINGS = s;
  const r = document.documentElement.style;
  const p = safeColor(s.primary), a = safeColor(s.accent);
  if(p){ r.setProperty('--p', p); r.setProperty('--p2', `color-mix(in srgb, ${p} 70%, #0b6f86)`); }
  if(a) r.setProperty('--gold', a);
  if(s.name && s.name !== 'Realm Academy' && !document.documentElement.hasAttribute('data-admin')) document.title = document.title.replace('Realm Academy', s.name);
}
async function loadSettings(){
  try{
    const cached = localStorage.getItem('ra_settings'); if(cached) applySettings(JSON.parse(cached));
  }catch{}
  const { data } = await sb.from('ra_settings').select('value').eq('key','site').maybeSingle();
  if(data && data.value){ let same = false; try{ const j = JSON.stringify(data.value); same = localStorage.getItem('ra_settings') === j; localStorage.setItem('ra_settings', j); }catch{} if(!same) applySettings(data.value); SETTINGS._changed = !same; }
  return SETTINGS;
}

/* Visitor tracking */
function visitorId(){
  let v=''; try{ v = localStorage.getItem('ra_vid') || ''; if(!v){ v = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)+Date.now()); localStorage.setItem('ra_vid', v); } }catch{ v = 'anon-' + Date.now(); }
  return v;
}
function deviceInfo(){
  const ua = navigator.userAgent;
  const device = /iPad|Tablet/i.test(ua) ? 'تابلێت' : /Mobi|Android|iPhone/i.test(ua) ? 'مۆبایل' : 'کۆمپیوتەر';
  const browser = /Edg\//.test(ua)?'Edge':/OPR\//.test(ua)?'Opera':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':/Firefox\//.test(ua)?'Firefox':'Other';
  return { device, browser };
}
let lastLogged = '';
function logVisit(path){
  if(path === lastLogged) return; lastLogged = path;
  const d = deviceInfo();
  let ref = ''; try{ if(document.referrer && new URL(document.referrer).host !== location.host) ref = new URL(document.referrer).host; }catch{}
  sb.rpc('ra_log_visit', { p_visitor: visitorId(), p_path: path, p_ref: ref, p_device: d.device, p_browser: d.browser, p_lang: navigator.language||'', p_screen: screen.width+'x'+screen.height }).then(()=>{}, ()=>{});
}

/* Errors */
const ERR = {
  ar:{ insufficient_balance:'رصيدك غير كافٍ. يرجى شحن الرصيد أولاً.', not_authenticated:'يرجى تسجيل الدخول أولاً.', blocked:'تم إيقاف حسابك. تواصل مع الدعم.',
    invalid_amount:'المبلغ غير صحيح.', invalid_method:'طريقة الدفع هذه غير متاحة.', too_many_pending:'لديك 5 طلبات قيد الانتظار. يرجى الانتظار حتى تتم مراجعتها.',
    code_required:'يرجى كتابة رمز البطاقة.', receipt_required:'يرجى رفع الإيصال أو كتابة رقم العملية.', invalid_variant:'هذه الباقة غير متاحة.', invalid_product:'هذا المنتج غير متاح.',
    'invalid login credentials':'البريد أو كلمة المرور غير صحيحة.', 'email not confirmed':'لم يتم تأكيد بريدك بعد.', 'user already registered':'هذا البريد مسجّل مسبقاً، يرجى تسجيل الدخول.',
    'password should be at least':'يجب أن تكون كلمة المرور 6 أحرف على الأقل.', 'rate limit':'طلبات كثيرة، يرجى الانتظار قليلاً.', forbidden:'غير مسموح.',
    already_reviewed:'تمت مراجعة هذا الطلب مسبقاً.', user_not_found:'لا يوجد حساب بهذا البريد.', balance_check:'لا يمكن أن يكون الرصيد أقل من صفر.',
    not_due_yet:'لم يحن موعد الجزء التالي بعد.', already_requested:'تم إرسال طلبك بالفعل، سنرسله لك قريباً.', nothing_due:'لا يوجد جزء متبقٍ لهذا الاشتراك.', all_parts_delivered:'تم إرسال جميع الأجزاء.', not_delivered:'لم يتم تسليم الجزء الأول بعد.', empty_content:'اكتب المحتوى.', email_domain_not_allowed:'يرجى استخدام بريد حقيقي (Gmail، Outlook، Yahoo، iCloud).', 'database error saving new user':'يرجى استخدام بريد حقيقي (Gmail، Outlook، Yahoo، iCloud).',
    empty_message:'الرسالة فارغة.', message_too_long:'الرسالة طويلة جداً.',
    'failed to fetch':'لا يوجد اتصال بالإنترنت.', field_required:'يرجى ملء: ' },
  ku:{ insufficient_balance:'باڵانسەکەت بەش ناکات. تکایە سەرەتا باڵانس زیاد بکە.', not_authenticated:'تکایە سەرەتا بچۆ ژوورەوە.', blocked:'ئەکاونتەکەت ڕاگیراوە. پەیوەندی بە پشتگیرییەوە بکە.',
    invalid_amount:'بڕی پارە دروست نییە.', invalid_method:'ئەم ڕێگای پارەدانە بەردەست نییە.', too_many_pending:'5 داواکاری چاوەڕوانت هەیە. تکایە چاوەڕێ بکە تا پشکنین دەکرێن.',
    code_required:'تکایە کۆدی کارتەکە بنووسە.', receipt_required:'تکایە وێنەی پسوڵە یان ژمارەی مامەڵە بنێرە.', invalid_variant:'ئەم پلانە بەردەست نییە.', invalid_product:'ئەم بەرهەمە بەردەست نییە.',
    'invalid login credentials':'ئیمەیڵ یان وشەی نهێنی هەڵەیە.', 'email not confirmed':'ئیمەیڵەکەت هێشتا پشتڕاست نەکراوەتەوە.', 'user already registered':'ئەم ئیمەیڵە پێشتر تۆمارکراوە، تکایە بچۆ ژوورەوە.',
    'password should be at least':'وشەی نهێنی دەبێت لانیکەم 6 پیت بێت.', 'rate limit':'داواکاری زۆرە، تکایە کەمێک چاوەڕێ بکە.', forbidden:'دەسەڵاتت نییە.',
    already_reviewed:'ئەم داواکارییە پێشتر پشکنراوە.', user_not_found:'ئەم ئیمەیڵە تۆمار نەکراوە.', balance_check:'باڵانس ناتوانێت لە سفر کەمتر بێت.',
    not_due_yet:'هێشتا کاتی بەشی داهاتوو نەهاتووە.', already_requested:'داواکارییەکەت پێشتر نێردراوە، بەم زووانە بۆت دەنێرین.', nothing_due:'هیچ بەشێکی تر بۆ ئەم بەشداربوونە نەماوە.', all_parts_delivered:'هەموو بەشەکان نێردراون.', not_delivered:'هێشتا بەشی یەکەم نەنێردراوە — سەرەتا لە «فرۆشتنەکان» بینێرە.', empty_content:'ناوەڕۆکەکە بنووسە.', email_domain_not_allowed:'تکایە ئیمەیڵێکی ڕاستەقینە بەکاربهێنە (وەک Gmail، Outlook، Yahoo، iCloud).', 'database error saving new user':'تکایە ئیمەیڵێکی ڕاستەقینە بەکاربهێنە (وەک Gmail، Outlook، Yahoo، iCloud).',
    empty_message:'نامەکە بەتاڵە.', message_too_long:'نامەکە زۆر درێژە.',
    'failed to fetch':'پەیوەندی ئینتەرنێت نییە.', field_required:'تکایە ئەم خانەیە پڕبکەرەوە: ' },
  en:{ insufficient_balance:'Not enough balance. Please top up first.', not_authenticated:'Please sign in first.', blocked:'Your account is suspended. Please contact support.',
    invalid_amount:'Invalid amount.', invalid_method:'This payment method is not available.', too_many_pending:'You already have 5 pending requests. Please wait for review.',
    code_required:'Please enter the card code.', receipt_required:'Please upload a receipt or enter the transaction number.', invalid_variant:'This plan is not available.', invalid_product:'This product is not available.',
    'invalid login credentials':'Wrong email or password.', 'email not confirmed':'Your email is not confirmed yet.', 'user already registered':'This email is already registered — please sign in.',
    'password should be at least':'Password must be at least 6 characters.', 'rate limit':'Too many requests, please wait a moment.', forbidden:'Not allowed.',
    already_reviewed:'This request was already reviewed.', user_not_found:'No account with this email.', balance_check:'Balance cannot go below zero.',
    not_due_yet:'The next part is not due yet.', already_requested:'Your request was already sent — we’ll deliver it soon.', nothing_due:'Nothing left to deliver for this subscription.', all_parts_delivered:'All parts have been delivered.', not_delivered:'The first part hasn’t been delivered yet.', empty_content:'Please write the content.', email_domain_not_allowed:'Please use a real email provider (Gmail, Outlook, Yahoo, iCloud…).', 'database error saving new user':'Please use a real email provider (Gmail, Outlook, Yahoo, iCloud…).',
    empty_message:'Message is empty.', message_too_long:'Message is too long.',
    'failed to fetch':'No internet connection.', field_required:'Please fill in: ' }
};
function errMsg(e){
  const m = String(e && (e.message || e.error_description || e) || '');
  const map = ERR[LANG] || ERR.ku; const low = m.toLowerCase();
  if(low.startsWith('field_required:')) return map.field_required + m.split(':').slice(1).join(':').split('\n')[0];
  for(const k in map) if(k !== 'field_required' && low.includes(k)) return map[k];
  return m || t('err_generic');
}

function setBusy(btn, busy, label){
  if(!btn) return;
  if(busy){ btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>'; }
  else { btn.disabled = false; btn.innerHTML = label || btn.dataset.label || ''; }
}

async function compressImage(file, maxW=1400, q=.85){
  if(!file || !/^image\//.test(file.type) || file.type==='image/gif' || file.type==='image/svg+xml') return file;
  try{
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, maxW / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width*s); c.height = Math.round(bmp.height*s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/webp', q));
    return blob ? new File([blob], (file.name||'img').replace(/\.\w+$/,'')+'.webp', {type:'image/webp'}) : file;
  }catch{ return file; }
}

function waLink(num){ let d = String(num||'').replace(/\D/g,''); if(d.startsWith('0')) d='964'+d.slice(1); return d ? 'https://wa.me/'+d : ''; }

window.RA = { parseCred, credFound, normCred, t, money, L, setLang, get lang(){ return LANG; }, sb, $, $$, esc, num, dt, ago, I, toast, modal, confirmBox, confetti, copyText, toggleTheme, loadSettings, applySettings, get settings(){ return SETTINGS; }, logVisit, errMsg, setBusy, compressImage, safeUrl, safeColor, waLink, SUPABASE_URL };
})();
