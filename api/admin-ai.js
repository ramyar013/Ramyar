// Realm Academy — admin AI assistant (Claude). Server-side proxy only:
// - verifies the caller is a logged-in admin (Supabase rpc ra_is_admin with the caller's own token)
// - forwards the chat to the Claude API with the store tools; the API key never reaches the browser
// - tools are executed in the admin panel (under the admin's own permissions) after the admin approves changes
const SB = 'https://mqvfnerqrlzpnfvpstok.supabase.co';
const KEY = 'sb_publishable_F8Eh68QLO5KPRjYOt_lLAQ_Z97KkIZ4'; // public key; access is decided by the user token + RLS

const SYSTEM = `You are the private admin assistant of "Realm Academy" (realmacademy.site), an online store in Iraqi Kurdistan that sells premium digital accounts/subscriptions, Steam games and Xbox game keys. You talk ONLY with the store owner (Ramyar) inside his admin panel.

Language: always reply in Kurdish Sorani, short and clear. Ramyar does not read English.

What you can do with tools:
- Find products and their plans (variants) and prices, read full product details.
- Change prices (price, sale price, sale end date), plan names, activate/deactivate plans.
- Change product texts (name, short text, description, badge, delivery note, category) in Kurdish, English (_en) and Arabic (_ar).
- Raise/lower prices of many products at once by percent.
- Change the texts shown on the public website (site texts overrides per language).

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

function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }

async function isAdmin(token) {
  try {
    const r = await fetch(SB + '/rest/v1/rpc/ra_is_admin', { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: '{}' });
    if (!r.ok) return false;
    return (await r.json()) === true;
  } catch { return false; }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token || !(await isAdmin(token))) return send(res, 403, { error: 'forbidden' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return send(res, 500, { error: 'missing_key' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  let messages = Array.isArray(body && body.messages) ? body.messages : [];
  if (!messages.length) return send(res, 400, { error: 'empty' });
  if (JSON.stringify(messages).length > 400000) return send(res, 413, { error: 'too_long' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 2048, system: SYSTEM, tools: TOOLS, messages })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return send(res, 502, { error: 'ai_error', status: r.status, detail: (j && j.error && j.error.message) || '' });
    return send(res, 200, { content: j.content || [], stop_reason: j.stop_reason });
  } catch (e) {
    return send(res, 502, { error: 'ai_error', detail: String(e && e.message || e) });
  }
};
