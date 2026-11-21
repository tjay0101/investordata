// Run: node parse.test.js
const assert = require('assert');
const { parseCard } = require('./parse.js');

const r = parseCard(`Rahul Sharma
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
console.log('ok', r);
