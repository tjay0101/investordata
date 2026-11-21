// Turns raw OCR text from a visiting card into fields. Heuristic: user reviews/edits before saving.
// ponytail: keyword/regex heuristics, swap for an AI/vision API if accuracy on odd layouts isn't enough.
function parseCard(text) {
  const lines = text
    .replace(/\s*[@©]\s*(?=[\w-]+\.)/g, '@')          // OCR: "name @ x.com" / "name©x.com"
    .split('\n')
    // email/website lines: OCR adds spaces around dots ("siddharth. kinagi@x. com") and stray "_"
    .map(l => /@|www\s*\./i.test(l) ? l.replace(/\s*([.@])\s*_?/g, '$1') : l)
    .map(l => l.replace(/[|~`'"“”‘’«»*•·]+|_(?![\w.-]*@)/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(l => /[a-z0-9]{2,}/i.test(l));

  const all = lines.join('\n');
  const email = (all.match(/[\w.+-]+@[\w-]+(\.[a-z]{2,})+/i) || [''])[0].toLowerCase();
  let website = ((all.replace(email, '').match(/\b(?:https?:\/\/)?(?:www\.[\w-]+(?:\.[a-z]{2,})+|[\w-]+\.(?:co\.in|com|in|co|net|org|io|vc|capital|ai|biz))\b/i) || [''])[0]).toLowerCase();

  // "lgreenleaf.co.in" -> "www.greenleaf.co.in" when it ends with the email's domain (misread "www.")
  const domain = email.split('@')[1] || '';
  if (domain && website !== domain && website.endsWith(domain) && !/^(www\.|https?:)/.test(website)) website = 'www.' + domain;

  // Phones: per line so numbers on adjacent lines never merge; 10-13 digits
  const phones = [];
  for (const l of lines) for (const m of l.match(/\+?\d[\d ().-]{7,}\d/g) || []) {
    const digits = m.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 13 && !/^\d{6}$/.test(digits)) phones.push(m.trim());
  }

  const isContact = l => /@|www\.|https?:|\.(com|in|vc|co|net|org|io)\b/i.test(l) || l.replace(/\D/g, '').length >= 8;
  const desigRe = /\b(ceo|cfo|cto|coo|cio|cmo|founder|co-?founder|director|partner|manager|president|vp|vice president|head|analyst|associate|principal|chairman|chairperson|md|managing|investor|advisor|adviser|consultant|officer|executive|lead|owner|proprietor|general partner|gp|venture|angel|engineer|marketing|strategy|product|sales|operations|business development|developer|designer|specialist|coordinator|representative|accountant|secretary|trustee|professor|scientist|architect|intern|supervisor|administrator|admin|hr)\b/i;
  const companyRe = /\b(pvt|private|ltd|limited|llp|llc|inc|corp|corporation|capital|ventures|partners|fund|investments?|holdings|group|technologies|tech|solutions|associates|bank|securities|advisors|advisory|enterprises|industries|global|labs|equity|finance|financial|wealth|asset|assets|angels|network|family office|vc|ventures?|trust|management|consulting|company)\b/i;
  const addrRe = /\b(road|rd|street|st|floor|flr|nagar|sector|lane|marg|tower|building|bldg|plot|block|avenue|ave|suite|park|complex|chowk|colony|opp|near|east|west|mumbai|delhi|bengaluru|bangalore|pune|hyderabad|chennai|kolkata|gurgaon|gurugram|noida|ahmedabad|india|usa|singapore|dubai)\b|\b\d{6}\b|\b\d{3} ?\d{3}\b/i;
  const looksName = l => /^[A-Za-z][A-Za-z. ]+$/.test(l) && l.split(' ').length >= 2 && l.split(' ').length <= 4 && !desigRe.test(l) && !companyRe.test(l) && !addrRe.test(l);

  const isDesig = l => desigRe.test(l) && !isContact(l) && !companyRe.test(l);

  // Name, strongest clue first: the email usually holds the person's name ("siddharth.kinagi@").
  // Background patterns and logos produce junk that can look like a name, so this beats position.
  const nameParts = (email.split('@')[0] || '').toLowerCase().split(/[._\-+0-9]+/).filter(p => p.length >= 3);
  const byEmail = nameParts.length && lines.find(l => !isContact(l) && /^[A-Za-z][A-Za-z. ]+$/.test(l)
    && l.split(' ').length <= 5 && nameParts.some(p => l.toLowerCase().split(/[ .]+/).includes(p)));
  let ni = byEmail ? lines.indexOf(byEmail) : -1;

  // Job title: the line right under the name; else one under any name-looking line; else the first match
  let di = ni >= 0 && ni + 1 < lines.length && isDesig(lines[ni + 1]) ? ni + 1 : -1;
  if (di < 0) di = lines.findIndex((l, i) => isDesig(l) && i > 0 && looksName(lines[i - 1]));
  if (di < 0) di = lines.findIndex(isDesig);
  const designation = di >= 0 ? lines[di] : '';
  // Otherwise the name is right above the designation, or the first name-looking line
  if (ni < 0) ni = di > 0 && looksName(lines[di - 1]) ? di - 1 : lines.findIndex(l => looksName(l) && !isContact(l));
  const name = ni >= 0 ? lines[ni] : '';

  let company = lines.find(l => companyRe.test(l) && l !== designation && !isContact(l)) || '';
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
  return s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : s;
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
    + (fields.company ? 1 : 0) + (fields.website ? 1 : 0) + confidence / 100;
}

if (typeof module !== 'undefined') module.exports = { parseCard, findCard, scoreReading };
