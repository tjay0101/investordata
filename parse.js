// Turns raw OCR text from a visiting card into fields. Heuristic: user reviews/edits before saving.
// ponytail: keyword/regex heuristics, swap for an AI/vision API if accuracy on odd layouts isn't enough.
const TLD = 'com|net|org|info|biz|in|co|io|vc|ai|app|dev|tech|xyz|me|capital|gov|edu|uk|us|ca|au|nz|de|fr|es|it|nl|be|ch|at|eu|se|no|dk|fi|pl|pt|ie|ru|ua|sk|cz|br|mx|ar|jp|cn|kr|tw|hk|sg|my|vn|th|id|ph|ae|sa|pk|lk|bd|np|za';
const desigRe = new RegExp('\\b(' + [
  'ceo', 'cfo', 'cto', 'coo', 'cio', 'cmo', 'founder', 'co-?founder', 'director', 'partner', 'manager', 'president', 'vp',
  'vice president', 'head', 'analyst', 'associate', 'principal', 'chairman', 'chairperson', 'chairwoman', 'md', 'managing',
  'investor', 'advisor', 'adviser', 'consultant', 'officer', 'executive', 'lead', 'owner', 'proprietor', 'general partner', 'gp',
  'venture', 'angel', 'engineer', 'marketing', 'strategy', 'product', 'sales', 'operations', 'business development',
  'developer', 'designer', 'specialist', 'coordinator', 'representatives?', 'accountant', 'secretary', 'trustee', 'professor',
  'scientist', 'architect', 'intern', 'supervisor', 'administrator', 'admin', 'hr', 'member', 'candidate', 'journalist',
  'author', 'writer', 'editor', 'reporter', 'photographer', 'artist', 'lawyer', 'advocate', 'attorney', 'doctor', 'physician',
  'surgeon', 'coach', 'scout', 'chef', 'teacher', 'lecturer', 'broker', 'agent', 'trainer', 'mentor', 'ambassador', 'minister',
  'mayor', 'counsel', 'auditor', 'treasurer', 'producer', 'manageress',
  // French / Spanish / German / Italian titles
  'directeur', 'directrice', 'président', 'présidente', 'gérant', 'gérante', 'responsable', 'ingénieur', 'chargée?',
  'conseill[eè]re?', 'directora', 'gerente', 'presidente', 'geschäftsführer(in)?', 'leiter(in)?', 'vorstand', 'inhaber(in)?',
  'berater(in)?', 'direttore', 'amministratore'
].join('|') + ')\\b', 'i');
const companyRe = new RegExp('\\b(' + [
  'pvt', 'private', 'ltd', 'limited', 'llp', 'llc', 'inc', 'incorporated', 'corp', 'corporation', 'capital', 'ventures?',
  'partners', 'fund', 'investments?', 'holdings', 'group', 'technologies', 'tech', 'solutions', 'associates', 'bank',
  'securities', 'advisors', 'advisory', 'enterprises?', 'industries', 'global', 'labs', 'equity', 'finance', 'financial',
  'wealth', 'assets?', 'angels', 'network', 'family office', 'vc', 'trust', 'management', 'consulting', 'company', 'embassy',
  'consulate', 'ministry', 'government', 'university', 'institute', 'college', 'school', 'academy', 'hospital', 'clinic',
  'foundation', 'association', 'society', 'council', 'restaurant', 'hotel', 'studio', 'agency', 'media', 'entertainment',
  'organi[sz]ation', 'federation', 'club', 'team', 'gmbh', 'ag', 'sarl', 'srl', 'bv', 'pty',
  'pharma', 'motors', 'systems', 'services', 'traders', 'exports?', 'imports?'
].join('|') + ')\\b', 'i');
const addrRe = /\b(road|rd|street|st|str|strasse|straße|rue|via|calle|floor|flr|nagar|sector|lane|marg|tower|building|bldg|plot|block|avenue|ave|av|suite|park|complex|chowk|colony|opp|near|east|west|mumbai|delhi|bengaluru|bangalore|pune|hyderabad|chennai|kolkata|gurgaon|gurugram|noida|ahmedabad|india|usa|singapore|dubai|postfach|cedex)\b|\b\d{5,6}\b|\b\d{3} ?\d{3}\b/i;
const PARTICLES = /^(de|da|di|du|del|della|van|von|der|den|bin|binti|al|el|la|le|y|e|of)$/i;

function parseCard(text) {
  const lines = [];
  for (let l of text.replace(/\s*[@©]\s*(?=[\w-]+\.)/g, '@').split('\n')) {    // OCR: "name @ x.com"
    // email/website lines: OCR adds spaces around dots ("siddharth. kinagi@x. com") and stray "_"
    if (/@|www\s*\./i.test(l)) l = l.replace(/\s*([.@])\s*_?/g, '$1');
    if (l.includes('@')) {
      l = l.replace(/@([\w-]+)\s+(com|net|org|in|co|es|de|fr|uk|io|au|br)\b/i, '@$1.$2');      // "@terra es" -> "@terra.es"
      l = l.replace(/^(\p{L}{2,})\s+(\p{L}{2,}@\S+)$/u, '$1.$2');                              // "Tim Shea@x.es" -> "Tim.Shea@x.es"
    }
    // "www thunders co kr" -> "www.thunders.co.kr" (short www line with spaces for dots)
    if (/^\W*www\s+[a-z0-9-]+(\s+[a-z]{2,4}){1,2}\W*$/i.test(l.trim())) l = l.trim().replace(/\s+/g, '.');
    l = l.replace(/[|~`'"“”‘’«»*•·]+|_(?![\w.-]*@)/g, ' ').replace(/\s+/g, ' ').trim();
    if (!/[\p{L}0-9]{2,}/u.test(l)) continue;
    // "MANAGING DIRECTOR, INTERNATIONAL MONETARY FUND" -> title line + company line
    const parts = l.split(/\s*,\s*/);
    if (parts.length === 2 && desigRe.test(parts[0]) && companyRe.test(parts[1]) && !companyRe.test(parts[0])) lines.push(...parts);
    else lines.push(l);
  }

  const all = lines.join('\n');
  const email = (all.match(/[\w.+-]+@[\w-]+(\.[a-z]{2,})+/i) || [''])[0].toLowerCase();
  const webRe = new RegExp('(?:https?://)?(?:www\\.[\\w-]+(?:\\.[a-z]{2,})+|\\b[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.(?:' + TLD + ')(?:\\.[a-z]{2})?\\b)', 'i');
  // (every email removed first, so "x@hotmail.com" on a card never becomes the website)
  let website = ((all.replace(/[\w.+-]+@[\w.-]+/g, ' ').match(webRe) || [''])[0]).toLowerCase();

  // "lgreenleaf.co.in" -> "www.greenleaf.co.in" when it ends with the email's domain (misread "www.")
  const domain = email.split('@')[1] || '';
  if (domain && website !== domain && website.endsWith(domain) && !/^(www\.|https?:)/.test(website)) website = 'www.' + domain;

  // Phones: per line so numbers on adjacent lines never merge; 10-13 digits
  const phones = [];
  for (const l of lines) for (const m of l.match(/\+?\(?\d[\d ().-]{7,}\d/g) || []) {
    const digits = m.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 13) phones.push(m.trim());
  }

  const isContact = l => /@|www\.|https?:/i.test(l) || webRe.test(l) || l.replace(/\D/g, '').length >= 8;
  // A name: 2-4 words of letters, each starting with a capital (or a lowercase particle like "de", "van")
  const looksName = l => /^\p{Lu}[\p{L}.' -]+$/u.test(l) && l.split(' ').length >= 2 && l.split(' ').length <= 4
    && l.split(' ').every((w, i) => /^\p{Lu}/u.test(w) || (i > 0 && PARTICLES.test(w)))
    && !desigRe.test(l) && !companyRe.test(l) && !addrRe.test(l);
  const isDesig = l => desigRe.test(l) && !isContact(l) && !companyRe.test(l);
  const plain = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Name, strongest clue first: the email usually holds the person's name ("siddharth.kinagi@").
  // Background patterns and logos produce junk that can look like a name, so this beats position.
  const nameParts = (email.split('@')[0] || '').toLowerCase().split(/[._\-+0-9]+/).filter(p => p.length >= 3);
  const byEmail = nameParts.length && lines.find(l => !isContact(l) && /^\p{L}[\p{L}. ]+$/u.test(l)
    && l.split(' ').length <= 5 && nameParts.some(p => plain(l).split(/[ .]+/).includes(p)));
  let ni = byEmail ? lines.indexOf(byEmail) : -1;

  // Job title: the line right under the name; else one under any name-looking line; else the first match
  let di = ni >= 0 && ni + 1 < lines.length && isDesig(lines[ni + 1]) ? ni + 1 : -1;
  if (di < 0) di = lines.findIndex((l, i) => isDesig(l) && i > 0 && looksName(lines[i - 1]));
  if (di < 0) di = lines.findIndex(isDesig);
  const designation = di >= 0 ? lines[di] : '';
  // Otherwise the name sits next to the job title (1-2 lines above, or just below); else the first name-looking line
  if (ni < 0 && di >= 0) ni = [di - 1, di - 2, di + 1].find(i => i >= 0 && i < lines.length && looksName(lines[i])) ?? -1;
  if (ni < 0) ni = lines.findIndex(l => looksName(l) && !isContact(l));
  const name = ni >= 0 ? lines[ni] : '';

  let ci = lines.findIndex(l => companyRe.test(l) && l !== designation && !isContact(l));
  let company = ci >= 0 ? lines[ci] : '';
  // "GROUP" / "LTD" alone on a line: the company name is on the line above ("BMW" + "GROUP")
  if (ci > 0 && company.split(' ').every(w => companyRe.test(w)) && !isContact(lines[ci - 1]) && ci - 1 !== ni && ci - 1 !== di) company = lines[ci - 1] + ' ' + company;
  const companyGuess = !company && !!email;
  if (!company && email && !/@(gmail|yahoo|outlook|hotmail|rediffmail|icloud|live)\./.test(email)) {
    const d = email.split('@')[1].split('.')[0];
    company = d.charAt(0).toUpperCase() + d.slice(1);   // fallback: company from email domain
  }

  const address = lines.filter(l => addrRe.test(l) && !/@|www\./i.test(l) && l !== company && l !== name && l !== designation
    && l.replace(/\D/g, '').length < 10).join(', ');

  // companyGuess: company was only guessed from the email domain (a real company line should replace it)
  return { name: titleCase(name), designation, company, email, phone: [...new Set(phones)].join(' / '), website, address, companyGuess };
}

// "RAHUL SHARMA" -> "Rahul Sharma"; leaves mixed case alone
function titleCase(s) {
  return s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s.'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()) : s;
}

// Find the card in a photo ({data,width,height} RGBA, same as canvas ImageData).
// Start from the biggest paper-white blob, then grow into neighbouring grey areas, so a part of
// the card in shadow is kept (shadowed paper is grey; cloth/tables are coloured or dark).
function findCard({ data, width: W, height: H }) {
  const C = 8;                                   // work on 8x8 pixel cells
  const cw = Math.floor(W / C), ch = Math.floor(H / C), N = cw * ch;
  const white = new Uint8Array(N), grey = new Uint8Array(N);
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    let nw = 0, ng = 0;
    for (let y = cy * C; y < cy * C + C; y += 2) for (let x = cx * C; x < cx * C + C; x += 2) {
      const i = (y * W + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mn > 165 && mx - mn < 40) nw++;
      if (mn > 95 && mx - mn < 20) ng++;  // neutral grey only: beige cloth is excluded
    }
    white[cy * cw + cx] = nw >= 8 ? 1 : 0;       // >= half the samples are paper-white
    grey[cy * cw + cx] = ng >= 8 ? 1 : 0;        // ... or paper in shadow
  }
  // close small holes (text, logos) so the card is one blob
  const dilate = (m, times) => {
    for (let k = 0; k < times; k++) {
      const d = new Uint8Array(N);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        let v = 0;
        for (let dy = -1; dy <= 1 && !v; dy++) for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy, xx = x + dx;
          if (yy >= 0 && yy < ch && xx >= 0 && xx < cw && m[yy * cw + xx]) { v = 1; break; }
        }
        d[y * cw + x] = v;
      }
      m = d;
    }
    return m;
  };
  // flood fill from seed cells through cells allowed by mask; returns cell list
  const fill = (seeds, mask, seen) => {
    const st = [...seeds], out = [];
    for (const s of seeds) seen[s] = 1;
    while (st.length) {
      const p = st.pop(), x = p % cw; out.push(p);
      for (const q of [x > 0 ? p - 1 : -1, x < cw - 1 ? p + 1 : -1, p - cw, p + cw]) {
        if (q < 0 || q >= N || seen[q] || !mask[q]) continue;
        seen[q] = 1; st.push(q);
      }
    }
    return out;
  };
  const m = dilate(white, 2), seen = new Uint8Array(N);
  let blob = null;
  for (let s = 0; s < N; s++) {
    if (!m[s] || seen[s]) continue;
    const cells = fill([s], m, seen);
    if (!blob || cells.length > blob.length) blob = cells;
  }
  // too small to be a card, or the whole photo is white: don't crop
  if (!blob || blob.length < N * 0.06 || blob.length > N * 0.92) return null;
  const grown = fill(blob, dilate(grey, 1), new Uint8Array(N));
  let x0 = cw, y0 = ch, x1 = 0, y1 = 0;
  for (const p of grown) { const x = p % cw, y = (p - x) / cw; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x: x0 * C, y: y0 * C, w: (x1 - x0 + 1) * C, h: (y1 - y0 + 1) * C };
}

// How good is a reading? Found fields count most; confidence breaks ties.
function scoreReading(fields, confidence) {
  return (fields.email ? 3 : 0) + (fields.phone ? 3 : 0) + (fields.name ? 2 : 0) + (fields.designation ? 1 : 0)
    + (fields.company ? 1 : 0) + (fields.website ? 1 : 0)
    + confidence / 20;   // 0-5: a wrong rotation reads junk with low confidence, even if the junk looks like a name
}

if (typeof module !== 'undefined') module.exports = { parseCard, findCard, scoreReading };
