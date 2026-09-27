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
const dt = d => { if(!d) return ''; const x = new Date(d); return x.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) + ' · ' + x.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); };
const ago = d => { const s = (Date.now() - new Date(d).getTime())/1000; if(s<60) return 'ئێستا'; if(s<3600) return Math.floor(s/60)+' خولەک لەمەوبەر'; if(s<86400) return Math.floor(s/3600)+' کاتژمێر لەمەوبەر'; return Math.floor(s/86400)+' ڕۆژ لەمەوبەر'; };

const I = {
  logo:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 18V9l4 3 4-6 4 6 4-3v9H4Z" fill="#03130d" opacity=".9"/><circle cx="12" cy="5" r="1.6" fill="#03130d"/><rect x="4" y="19" width="16" height="2" rx="1" fill="#03130d"/></svg>',
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
  x:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  upload:'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/></svg>',
  logout:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"/></svg>',
  tg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.4-.1-.6-.6-.2L6.6 13.2l-4.7-1.5c-1-.3-1-1 .2-1.5L20.5 3c.9-.3 1.6.2 1.4 1.3Z"/></svg>',
  ig:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  google:'<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>'
};

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
function confirmBox(title, text, okText='بەڵێ', danger=false){
  return new Promise(res => {
    const m = modal(`<div class="modal-h"><h3>${esc(title)}</h3><button class="icon-btn" data-close>${I.x}</button></div>
      <p class="t2" style="margin-bottom:20px;white-space:pre-line">${esc(text)}</p>
      <div style="display:flex;gap:10px"><button class="btn ${danger?'btn-bad':'btn-p'} btn-block" data-ok>${esc(okText)}</button><button class="btn btn-block" data-close>پاشگەزبوونەوە</button></div>`, {onClose:()=>res(false)});
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
  try{ await navigator.clipboard.writeText(String(t)); toast('کۆپی کرا ✓','ok'); }
  catch{ const a=document.createElement('textarea'); a.value=t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); toast('کۆپی کرا ✓','ok'); }
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

/* Settings */
let SETTINGS = {};
function applySettings(s){
  SETTINGS = s || {};
  const r = document.documentElement.style;
  const p = safeColor(s.primary), a = safeColor(s.accent);
  if(p){ r.setProperty('--p', p); r.setProperty('--p2', `color-mix(in srgb, ${p} 70%, #0b6f86)`); }
  if(a) r.setProperty('--gold', a);
  if(s.name) document.title = s.name + (s.tagline ? ' — ' + s.tagline : '');
}
async function loadSettings(){
  try{
    const cached = sessionStorage.getItem('ra_settings'); if(cached) applySettings(JSON.parse(cached));
  }catch{}
  const { data } = await sb.from('ra_settings').select('value').eq('key','site').maybeSingle();
  if(data && data.value){ applySettings(data.value); try{ sessionStorage.setItem('ra_settings', JSON.stringify(data.value)); }catch{} }
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

/* Errors → Kurdish */
function errMsg(e){
  const m = String(e && (e.message || e.error_description || e) || '');
  const map = {
    'insufficient_balance':'باڵانسەکەت بەش ناکات. تکایە سەرەتا پارە زیاد بکە.',
    'not_authenticated':'تکایە سەرەتا بچۆ ژوورەوە.',
    'blocked':'ئەکاونتەکەت ڕاگیراوە. پەیوەندی بە سەپۆرتەوە بکە.',
    'invalid_amount':'بڕی پارە دروست نییە.',
    'invalid_method':'ڕێگای پارەدان بەردەست نییە.',
    'too_many_pending':'5 داواکاری چاوەڕوانت هەیە. چاوەڕێ بکە تا پشکنین دەکرێن.',
    'code_required':'تکایە کۆدی کارتەکە بنووسە.',
    'receipt_required':'تکایە وێنەی پسوڵە یان ژمارەی مامەڵە بنێرە.',
    'invalid_variant':'ئەم پلانە بەردەست نییە.',
    'invalid_product':'ئەم بەرهەمە بەردەست نییە.',
    'Invalid login credentials':'ئیمەیڵ یان وشەی نهێنی هەڵەیە.',
    'Email not confirmed':'ئیمەیڵەکەت پشتڕاست نەکراوەتەوە. سەیری ئینبۆکسەکەت بکە.',
    'User already registered':'ئەم ئیمەیڵە پێشتر تۆمارکراوە. بچۆ ژوورەوە.',
    'Password should be at least':'وشەی نهێنی لانیکەم 6 پیت بێت.',
    'rate limit':'داواکاری زۆرە، تکایە کەمێک چاوەڕێ بکە.',
    'forbidden':'دەسەڵاتت نییە.',
    'already_reviewed':'ئەم داواکارییە پێشتر پشکنراوە.',
    'user_not_found':'ئەم ئیمەیڵە تۆمار نەکراوە.',
    'balance_check':'باڵانس ناتوانێت لە سفر کەمتر بێت.',
    'Failed to fetch':'پەیوەندی ئینتەرنێت نییە.'
  };
  for(const k in map) if(m.toLowerCase().includes(k.toLowerCase())) return map[k];
  if(m.startsWith('field_required:')) return 'تکایە ئەم خانەیە پڕبکەرەوە: ' + m.split(':').slice(1).join(':').split('\n')[0];
  return m || 'هەڵەیەک ڕوویدا، دووبارە هەوڵبدەرەوە.';
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

window.RA = { sb, $, $$, esc, num, dt, ago, I, toast, modal, confirmBox, confetti, copyText, toggleTheme, loadSettings, applySettings, get settings(){ return SETTINGS; }, logVisit, errMsg, setBusy, compressImage, safeUrl, safeColor, waLink, SUPABASE_URL };
})();
