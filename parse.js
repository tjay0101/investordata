// Turns raw OCR text from a visiting card into fields. Heuristic: user reviews/edits before saving.
// ponytail: keyword/regex heuristics, swap for an AI/vision API if accuracy on odd layouts isn't enough.
function parseCard(text) {
  const lines = text
    .replace(/\s*[@©]\s*(?=[\w-]+\.)/g, '@')          // OCR: "name @ x.com" / "name©x.com"
    .split('\n')
    .map(l => l.replace(/[|_~`'"“”‘’«»*•·]+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(l => /[a-z0-9]{2,}/i.test(l));

  const all = lines.join('\n');
  const email = (all.match(/[\w.+-]+@[\w-]+(\.[a-z]{2,})+/i) || [''])[0].toLowerCase();
  const website = ((all.replace(email, '').match(/\b(?:https?:\/\/)?(?:www\.[\w-]+(?:\.[a-z]{2,})+|[\w-]+\.(?:co\.in|com|in|co|net|org|io|vc|capital|ai|biz))\b/i) || [''])[0]).toLowerCase();

  // Phones: per line so numbers on adjacent lines never merge; 10-13 digits
  const phones = [];
  for (const l of lines) for (const m of l.match(/\+?\d[\d ().-]{7,}\d/g) || []) {
    const digits = m.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 13 && !/^\d{6}$/.test(digits)) phones.push(m.trim());
  }

  const isContact = l => /@|www\.|https?:|\.(com|in|vc|co|net|org|io)\b/i.test(l) || l.replace(/\D/g, '').length >= 8;
  const desigRe = /\b(ceo|cfo|cto|coo|cio|founder|co-?founder|director|partner|manager|president|vp|vice president|head|analyst|associate|principal|chairman|chairperson|md|managing|investor|advisor|adviser|consultant|officer|executive|lead|owner|proprietor|general partner|gp|venture|angel)\b/i;
  const companyRe = /\b(pvt|private|ltd|limited|llp|llc|inc|corp|corporation|capital|ventures|partners|fund|investments?|holdings|group|technologies|tech|solutions|associates|bank|securities|advisors|advisory|enterprises|industries|global|labs|equity|finance|financial|wealth|asset|assets|angels|network|family office|vc|ventures?|trust|management|consulting|company)\b/i;
  const addrRe = /\b(road|rd|street|st|floor|flr|nagar|sector|lane|marg|tower|building|bldg|plot|block|avenue|ave|suite|park|complex|chowk|colony|opp|near|east|west|mumbai|delhi|bengaluru|bangalore|pune|hyderabad|chennai|kolkata|gurgaon|gurugram|noida|ahmedabad|india|usa|singapore|dubai)\b|\b\d{6}\b|\b\d{3} ?\d{3}\b/i;
  const looksName = l => /^[A-Za-z][A-Za-z. ]+$/.test(l) && l.split(' ').length >= 2 && l.split(' ').length <= 4 && !desigRe.test(l) && !companyRe.test(l) && !addrRe.test(l);

  const di = lines.findIndex(l => desigRe.test(l) && !isContact(l) && !companyRe.test(l));
  const designation = di >= 0 ? lines[di] : '';
  // Name is usually right above the designation; otherwise the first name-looking line
  const name = (di > 0 && looksName(lines[di - 1]) ? lines[di - 1] : lines.find(l => looksName(l) && !isContact(l))) || '';

  let company = lines.find(l => companyRe.test(l) && l !== designation && !isContact(l)) || '';
  if (!company && email && !/@(gmail|yahoo|outlook|hotmail|rediffmail|icloud|live)\./.test(email)) {
    const d = email.split('@')[1].split('.')[0];
    company = d.charAt(0).toUpperCase() + d.slice(1);   // fallback: company from email domain
  }

  const address = lines.filter(l => addrRe.test(l) && !/@|www\./i.test(l) && l !== company && l !== name && l !== designation
    && l.replace(/\D/g, '').length < 10).join(', ');

  return { name: titleCase(name), designation, company, email, phone: [...new Set(phones)].join(' / '), website, address };
}

// "RAHUL SHARMA" -> "Rahul Sharma"; leaves mixed case alone
function titleCase(s) {
  return s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : s;
}

if (typeof module !== 'undefined') module.exports = { parseCard };
