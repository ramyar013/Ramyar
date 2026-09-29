// Realm Academy — admin assistant (Claude). Supabase Edge Function "ai-agent".
// Secret: ANTHROPIC_API_KEY (Edge Functions -> Secrets). Only admins (rpc ra_is_admin) may use it.
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (code: number, obj: unknown) => new Response(JSON.stringify(obj), { status: code, headers: { ...CORS, 'Content-Type': 'application/json' } });

const SYSTEM = `You are the private admin assistant of "Realm Academy" (realmacademy.site), an online store in Iraqi Kurdistan that sells premium digital accounts/subscriptions, Steam games and Xbox game keys. You talk ONLY with the store owner (Ramyar) inside his admin panel.

Language: always reply in Kurdish Sorani, short and clear. Ramyar does not read English.

What you can do with tools:
- Find products and their plans (variants) and prices, read full product details.
- Change prices (price, sale price, sale end date), plan names, activate/deactivate plans.
- Change product texts (name, short text, description, badge, delivery note, category) in Kurdish, English (_en) and Arabic (_ar).
- Raise/lower prices of many products at once by percent.
- Change the texts shown on the public website (site texts overrides per language).
- Look at images Ramyar sends (screenshots, payment receipts, product pictures, designs) and explain or evaluate them; if an image shows a price list or text he wants on the site, you can use it for changes.

Rules:
- Before changing anything, look it up with a search/read tool so you use the correct ids. Never guess ids.
- Prices are in Iraqi dinar (IQD), whole numbers, normally rounded to 250.
- Every change tool is shown to Ramyar for approval before it is applied. After a change is applied or rejected, tell him briefly what happened.
- If a request is ambiguous (e.g. several products match), ask one short question instead of guessing.
- When you change a Kurdish text, also update the English and Arabic versions if they exist, unless told otherwise.
- Keep answers short. Use numbers with thousands separators (e.g. 12,500 دینار).`;

const TOOLS = [
  { name: 'search_products', description: 'Search products by name (partial, case-insensitive). Returns products with their plans (variants) and prices. Leave query empty to list products of a category.',
    input_schema: { type: 'object', properties: { query: { type: 'string' }, category_en: { type: 'string', description: 'Optional exact English category, e.g. "Xbox Games", "Steam Games"' }, limit: { type: 'integer', description: 'max results, default 20, max 50' } } } },
  { name: 'get_product', description: 'Read one product with all texts (ku/en/ar) and all plans.',
    input_schema: { type: 'object', properties: { product_id: { type: 'string' } }, required: ['product_id'] } },
  { name: 'list_categories', description: 'List product categories with how many products each has.', input_schema: { type: 'object', properties: {} } },
  { name: 'search_site_texts', description: 'Search the public website texts (headings, buttons, notices...) by words in Kurdish/English/Arabic or by key. Returns key, default texts and current override.',
    input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'update_variant', description: 'CHANGE a plan (variant): price, sale_price (discounted price, null to remove), sale_until (ISO date or null), name, active. Needs approval.',
    input_schema: { type: 'object', properties: { variant_id: { type: 'string' }, price: { type: 'integer' }, sale_price: { type: ['integer', 'null'] }, sale_until: { type: ['string', 'null'] }, name: { type: 'string' }, name_en: { type: 'string' }, name_ar: { type: 'string' }, active: { type: 'boolean' } }, required: ['variant_id'] } },
  { name: 'update_product', description: 'CHANGE product fields. Allowed keys in changes: name, short, short_en, short_ar, description, description_en, description_ar, badge, badge_en, badge_ar, delivery_note, delivery_note_en, delivery_note_ar, category, category_en, category_ar, active, featured, image_url. Needs approval.',
    input_schema: { type: 'object', properties: { product_id: { type: 'string' }, changes: { type: 'object' } }, required: ['product_id', 'changes'] } },
  { name: 'bulk_adjust_prices', description: 'CHANGE prices of many plans at once by a percent (e.g. 10 = +10%, -5 = -5%), rounded up to round_to (default 250). Target by category_en and/or product_ids. Needs approval.',
    input_schema: { type: 'object', properties: { category_en: { type: 'string' }, product_ids: { type: 'array', items: { type: 'string' } }, percent: { type: 'number' }, round_to: { type: 'integer' } }, required: ['percent'] } },
  { name: 'set_site_text', description: 'CHANGE a public website text for one language (ku, en or ar). Use a key from search_site_texts. Empty value restores the default. Needs approval.',
    input_schema: { type: 'object', properties: { lang: { type: 'string', enum: ['ku', 'en', 'ar'] }, key: { type: 'string' }, value: { type: 'string' } }, required: ['lang', 'key', 'value'] } }
];


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method' });
  const auth = req.headers.get('Authorization') || '';
  const SB = Deno.env.get('SUPABASE_URL') || 'https://mqvfnerqrlzpnfvpstok.supabase.co';
  const ANON = Deno.env.get('SUPABASE_ANON_KEY') || 'sb_publishable_F8Eh68QLO5KPRjYOt_lLAQ_Z97KkIZ4';
  try {
    const r = await fetch(SB + '/rest/v1/rpc/ra_is_admin', { method: 'POST', headers: { apikey: ANON, Authorization: auth, 'Content-Type': 'application/json' }, body: '{}' });
    if (!r.ok || (await r.json()) !== true) return json(403, { error: 'forbidden' });
  } catch { return json(403, { error: 'forbidden' }); }
  // key + model saved from the admin panel (table ra_secrets, readable only with the service role); env secret is the fallback
  let apiKey = '', model = '';
  const SR = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (SR) {
    try {
      const h: Record<string, string> = { apikey: SR };
      if (!SR.startsWith('sb_')) h.Authorization = 'Bearer ' + SR;
      const r = await fetch(SB + '/rest/v1/ra_secrets?select=key,value&key=in.(anthropic_api_key,anthropic_model)', { headers: h });
      if (r.ok) for (const x of await r.json()) { if (x.key === 'anthropic_api_key') apiKey = String(x.value || '').trim(); if (x.key === 'anthropic_model') model = String(x.value || '').trim(); }
    } catch { /* fall back to env */ }
  }
  if (!apiKey) apiKey = (Deno.env.get('ANTHROPIC_API_KEY') || '').trim();
  if (!model) model = Deno.env.get('ANTHROPIC_MODEL') || 'claude-opus-5-5';
  if (!apiKey) return json(500, { error: 'missing_key' });
  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (!messages.length) return json(400, { error: 'empty' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 2048, system: SYSTEM, tools: TOOLS, messages })
    });
    const j: any = await r.json().catch(() => ({}));
    if (!r.ok) return json(502, { error: 'ai_error', status: r.status, detail: j?.error?.message || '' });
    return json(200, { content: j.content || [], stop_reason: j.stop_reason });
  } catch (e) {
    return json(502, { error: 'ai_error', detail: String((e as Error)?.message || e) });
  }
});
