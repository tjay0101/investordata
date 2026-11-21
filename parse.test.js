// Run: node parse.test.js
const assert = require('assert');
const { parseCard } = require('./parse.js');

// 1. Clean card
let r = parseCard(`Rahul Sharma
Managing Partner
Blue Ocean Ventures Pvt Ltd
+91 98765 43210
rahul@blueocean.vc
www.blueocean.vc
5th Floor, MG Road, Bengaluru 560001`);
assert.strictEqual(r.name, 'Rahul Sharma');
assert.strictEqual(r.designation, 'Managing Partner');
assert.strictEqual(r.company, 'Blue Ocean Ventures Pvt Ltd');
assert.strictEqual(r.email, 'rahul@blueocean.vc');
assert.strictEqual(r.phone, '+91 98765 43210');
assert.strictEqual(r.website, 'www.blueocean.vc');
assert.ok(r.address.includes('MG Road'));

// 2. Messy OCR: company first, caps name, noise chars, spaced @, two phones on adjacent lines
r = parseCard(`| SUNRISE CAPITAL
PRIYA MEHTA
Co-Founder & CEO
M: +91 99887 76655
T: 022 4567 8901
priya @ sunrisecap.com
Unit 4, Tower B, Bandra Kurla Complex, Mumbai 400051`);
assert.strictEqual(r.name, 'Priya Mehta');
assert.strictEqual(r.designation, 'Co-Founder & CEO');
assert.strictEqual(r.company, 'SUNRISE CAPITAL');
assert.strictEqual(r.email, 'priya@sunrisecap.com');
assert.strictEqual(r.phone, '+91 99887 76655 / 022 4567 8901');
assert.ok(r.address.includes('Bandra'));

// 3. No company line: falls back to email domain, gmail ignored
r = parseCard(`Amit Verma\nDirector\namit@greenleaf.in`);
assert.strictEqual(r.company, 'Greenleaf');
assert.strictEqual(parseCard(`Amit Verma\nAngel Investor\namit@gmail.com`).company, '');

// 4. OCR noise: stray "Lead" before the real title; misread "www." in website
r = parseCard(`Horizon Capital\nLead\na0\nVikram Nair\nManaging Director\nM: +91 98200 11223\nvikram.nair@horizoncap.in\nlhorizoncap.in`);
assert.strictEqual(r.designation, 'Managing Director');
assert.strictEqual(r.name, 'Vikram Nair');
assert.strictEqual(r.website, 'www.horizoncap.in');
assert.strictEqual(parseCard(`A B\nx@greenleaf.in\ngreenleaf.in`).website, 'greenleaf.in'); // already clean: untouched

// 5. Real-photo style: junk from a patterned background above the name; name found via the email.
//    (Made-up person; mirrors how real cards came out of the reader.)
r = parseCard(`Cl\nAR VAR\nSASL\nWOOL CRU cd SERA\nRohan Deshmukh\n+91 9876501234\nProduct Strategy and Marketing\nrohan.deshmukh@freshfoods.com\nAl,\nvaler\nnutrition`);
assert.strictEqual(r.name, 'Rohan Deshmukh');
assert.strictEqual(r.designation, 'Product Strategy and Marketing');
assert.strictEqual(r.phone, '+91 9876501234');
assert.strictEqual(r.company, 'Freshfoods');
// 6. Name with an initial/abbreviation, email uses only part of it
r = parseCard(`Aran\nLh)\nMohd. Imran Shaikh\nExecutive Engineer\n+91 9123456780\nimran.shaikh@freshfoods.com`);
assert.strictEqual(r.name, 'Mohd. Imran Shaikh');
assert.strictEqual(r.designation, 'Executive Engineer');

// 7. Spaces/underscore inside the email from OCR; real underscores in emails survive
assert.strictEqual(parseCard(`Rohan Deshmukh\n~ rohan. _deshmukh@freshfoods. com`).email, 'rohan.deshmukh@freshfoods.com');
assert.strictEqual(parseCard(`Rohan Deshmukh\nrohan_d@freshfoods.com`).email, 'rohan_d@freshfoods.com');
assert.strictEqual(parseCard(`Mohd. Imran Shaikh\nx`).name, 'Mohd. Imran Shaikh'); // dots in names untouched

console.log('ok');
