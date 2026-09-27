// Realm Academy — server-rendered SEO pages for Google (product pages + sitemap).
// The page is the normal app shell with real title/description/structured data and crawlable content injected.
const SB = 'https://mqvfnerqrlzpnfvpstok.supabase.co';
const KEY = 'sb_publishable_F8Eh68QLO5KPRjYOt_lLAQ_Z97KkIZ4'; // public (read-only via RLS)
const LANGS = ['ku', 'ar', 'en'];
const HL = { ku: 'ckb', ar: 'ar', en: 'en' };
const T = {
  ku: { cur: 'دینار', plans: 'پلانەکان و نرخ', from: 'لە', back: 'هەموو بەرهەمەکان', tag: 'ئەکاونتی پریمیەمی ڕەسەن بە گەیاندنی خێرا', buy: 'کڕین لە Realm Academy' },
  ar: { cur: 'دينار', plans: 'الباقات والأسعار', from: 'من', back: 'جميع المنتجات', tag: 'حسابات بريميوم أصلية مع تسليم سريع', buy: 'اشترِ من Realm Academy' },
  en: { cur: 'IQD', plans: 'Plans & prices', from: 'from', back: 'All products', tag: 'Genuine premium accounts, delivered fast', buy: 'Buy at Realm Academy' }
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const L = (o, f, lang) => { if (lang !== 'ku') { const v = o[f + '_' + lang]; if (v && String(v).trim()) return String(v); } return String(o[f] || ''); };
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const fmt = n => Number(n || 0).toLocaleString('en-US');

async function sb(path) {
  const r = await fetch(SB + '/rest/v1/' + path, { headers: { apikey: KEY, Accept: 'application/json' } });
  if (!r.ok) throw new Error('supabase ' + r.status);
  return r.json();
}
async function shell(origin) {
  const r = await fetch(origin + '/index.html', { headers: { 'x-seo-shell': '1' } });
  if (!r.ok) throw new Error('shell ' + r.status);
  return r.text();
}
function setHead(html, { lang, title, desc, url, image, alternates, jsonld, type }) {
  html = html.replace(/<html[^>]*>/, `<html lang="${HL[lang]}" dir="${lang === 'en' ? 'ltr' : 'rtl'}" data-theme="dark">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}">`);
  html = html.replace(/<link rel="canonical"[^>]*>\s*/g, '').replace(/<link rel="alternate" hreflang[^>]*>\s*/g, '');
  html = html.replace(/<meta property="og:[^>]*>\s*/g, '').replace(/<meta name="twitter:[^>]*>\s*/g, '');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  const head = [
    `<link rel="canonical" href="${esc(url)}">`,
    ...alternates.map(a => `<link rel="alternate" hreflang="${a.hl}" href="${esc(a.href)}">`),
    `<meta property="og:type" content="${type || 'website'}">`,
    `<meta property="og:site_name" content="Realm Academy">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>`
  ].join('\n');
  return html.replace('</head>', head + '\n</head>');
}
function setMain(html, inner) {
  return html.replace(/<main id="app"([^>]*)>[\s\S]*?<\/main>/, `<main id="app"$1>${inner}</main>`);
}

module.exports = async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'realmacademy.vercel.app';
  const origin = 'https://' + host;
  const q = new URL(req.url, origin).searchParams;
  const path = new URL(req.url, origin).pathname;
  let page = q.get('page');
  if (!page && /^\/p\/[^/]+/.test(path)) page = 'product';
  if (!page && path === '/sitemap.xml') page = 'sitemap';
  if (page === 'product' && !q.get('slug')) { const m = path.match(/^\/p\/([^/?#]+)/); if (m) q.set('slug', decodeURIComponent(m[1])); }
  const lang = LANGS.includes(q.get('lang')) ? q.get('lang') : 'ku';
  try {
    if (page === 'sitemap') {
      const rows = await sb('ra_products?active=eq.true&select=slug,created_at&order=sort_order');
      const today = new Date().toISOString().slice(0, 10);
      const alt = path => LANGS.map(l => `<xhtml:link rel="alternate" hreflang="${HL[l]}" href="${origin}${path}${l === 'ku' ? '' : (path.includes('?') ? '&' : '?') + 'lang=' + l}"/>`).join('');
      const urls = [{ loc: '/', pri: '1.0', freq: 'daily' }, ...rows.map(r => ({ loc: '/p/' + encodeURIComponent(r.slug), pri: '0.9', freq: 'weekly' }))];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
        urls.flatMap(u => LANGS.map(l => `<url><loc>${origin}${u.loc}${l === 'ku' ? '' : '?lang=' + l}</loc>${alt(u.loc)}<lastmod>${today}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`)).join('\n') + '\n</urlset>';
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
      return res.status(200).send(xml);
    }

    if (page === 'product') {
      const slug = String(q.get('slug') || '').slice(0, 120);
      const [rows, html0] = await Promise.all([
        sb('ra_products?slug=eq.' + encodeURIComponent(slug) + '&active=eq.true&select=*,ra_variants(name,name_en,name_ar,price,active,sort_order)&limit=1'),
        shell(origin)
      ]);
      const p = rows[0];
      if (!p) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=60');
        return res.status(404).send(html0.replace('</head>', '<meta name="robots" content="noindex">\n</head>'));
      }
      const t = T[lang];
      const vars = (p.ra_variants || []).filter(v => v.active).sort((a, b) => (a.sort_order - b.sort_order) || (a.price - b.price));
      const prices = vars.map(v => Number(v.price)).filter(n => n >= 0);
      const lo = prices.length ? Math.min(...prices) : 0, hi = prices.length ? Math.max(...prices) : 0;
      const name = String(p.name || '');
      const short = L(p, 'short', lang), descFull = L(p, 'description', lang) || short;
      const qs = lang === 'ku' ? '' : '?lang=' + lang;
      const url = origin + '/p/' + encodeURIComponent(p.slug) + qs;
      const image = /^https:\/\//.test(p.image_url || '') ? p.image_url : origin + '/assets/img/og.png';
      const title = clip(`${name}${short ? ' — ' + short : ''}`, 58) + ' | Realm Academy';
      const desc = clip(`${name}: ${short ? short + ' · ' : ''}${lo ? t.from + ' ' + fmt(lo) + ' ' + t.cur + ' · ' : ''}${descFull}`, 158);
      const alternates = [...LANGS.map(l => ({ hl: HL[l], href: origin + '/p/' + encodeURIComponent(p.slug) + (l === 'ku' ? '' : '?lang=' + l) })), { hl: 'x-default', href: origin + '/p/' + encodeURIComponent(p.slug) }];
      const jsonld = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Product', name, description: clip(descFull, 500), image: [image], sku: p.slug, category: L(p, 'category', lang) || undefined,
            brand: { '@type': 'Brand', name: name.split(' ')[0] },
            offers: { '@type': 'AggregateOffer', priceCurrency: 'IQD', lowPrice: lo, highPrice: hi, offerCount: vars.length || 1, availability: 'https://schema.org/InStock', url, seller: { '@type': 'Organization', name: 'Realm Academy' } }
          },
          { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Realm Academy', item: origin + '/' + qs }, { '@type': 'ListItem', position: 2, name, item: url }] }
        ]
      };
      let html = setHead(html0, { lang, title, desc, url, image, alternates, jsonld, type: 'product' });
      const body = `<article class="seo-pre" style="max-width:760px;margin:40px auto;padding:0 16px;line-height:1.9">
<nav><a href="/${qs}">${esc(t.back)}</a></nav>
<h1>${esc(name)}</h1>
${short ? `<p><strong>${esc(short)}</strong></p>` : ''}
${image ? `<img src="${esc(image)}" alt="${esc(name)}" width="240" height="240" style="max-width:240px;height:auto">` : ''}
<div>${esc(descFull).replace(/\n/g, '<br>')}</div>
${vars.length ? `<h2>${esc(t.plans)}</h2><ul>${vars.map(v => `<li>${esc(L(v, 'name', lang))} — ${fmt(v.price)} ${esc(t.cur)}</li>`).join('')}</ul>` : ''}
<p>${esc(t.buy)} · ${esc(t.tag)}</p>
</article>`;
      html = setMain(html, body);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
      return res.status(200).send(html);
    }
    res.statusCode = 302; res.setHeader('Location', '/'); return res.end();
  } catch (e) {
    try {
      const html = await shell(origin);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(html);
    } catch { res.statusCode = 302; res.setHeader('Location', '/'); return res.end(); }
  }
};
