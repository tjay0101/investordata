// Turns raw OCR text from a visiting card into fields. Heuristic: user reviews/edits before saving.
// ponytail: keyword/regex heuristics, swap for an AI/vision API if accuracy on odd layouts isn't enough.
function parseCard(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  const all = lines.join(' ');

  const email = (all.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [''])[0];
  const website = (all.replace(email, '').match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:co\.in|com|in|co|net|org|io|vc|capital)\b/i) || [''])[0];
  const phones = (all.match(/\+?\d[\d\s().-]{8,}\d/g) || []).map(p => p.replace(/\s+/g, ' ').trim());

  const isContact = l => /@|www\.|https?:|\d{8,}|\+\d/.test(l.replace(/\s/g, ''));
  const desigRe = /\b(ceo|cfo|cto|coo|founder|co-founder|director|partner|manager|president|vp|vice president|head|analyst|associate|principal|chairman|md|managing|investor|advisor|consultant|officer|executive|lead)\b/i;
  const companyRe = /\b(pvt|ltd|limited|llp|llc|inc|corp|capital|ventures|partners|fund|investments?|holdings|group|technologies|solutions|associates|bank|securities|advisors|enterprises)\b/i;
  const addrRe = /\b(road|rd|street|st\.|floor|nagar|sector|lane|marg|tower|building|plot|block|avenue|city|pin|india)\b|\d{6}/i;

  const designation = lines.find(l => desigRe.test(l) && !isContact(l)) || '';
  const company = lines.find(l => companyRe.test(l) && l !== designation && !isContact(l)) || '';
  const address = lines.filter(l => addrRe.test(l) && !isContact(l) && l !== company).join(', ');
  const name = lines.find(l =>
    l !== designation && l !== company && !isContact(l) && !addrRe.test(l) &&
    /^[A-Za-z.\s]+$/.test(l) && l.split(/\s+/).length >= 2 && l.split(/\s+/).length <= 4
  ) || '';

  return { name, designation, company, email, phone: phones.join(' / '), website, address };
}

if (typeof module !== 'undefined') module.exports = { parseCard };
