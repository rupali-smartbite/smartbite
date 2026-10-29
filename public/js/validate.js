// Checks for the "Partner with SmartBite" enquiry form.
// The same file runs in the browser (instant feedback) and on the server
// (netlify/functions/sponsor.mjs), so nobody can skip the checks.

const DISPOSABLE = new Set([
  'mailinator.com', 'yopmail.com', 'guerrillamail.com', 'guerrillamail.info', 'sharklasers.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'tempmail.net', 'throwawaymail.com', 'trashmail.com', 'getnada.com', 'dispostable.com', 'maildrop.cc', 'fakeinbox.com', 'mintemail.com',
  'mohmal.com', 'emailondeck.com', 'tempr.email', 'discard.email', 'spamgourmet.com', 'mailnesia.com', 'burnermail.io', 'moakt.com', 'tmail.ws',
]);
const PLACEHOLDER_DOMAINS = new Set(['example.com', 'example.org', 'example.net', 'test.com', 'test.in', 'abc.com', 'xyz.com', 'email.com', 'domain.com', 'mail.com', 'company.com', 'sample.com', 'asdf.com', 'qwerty.com']);
const TYPOS = { 'gmial.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmaill.com': 'gmail.com', 'gnail.com': 'gmail.com',
  'yaho.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'yahoo.con': 'yahoo.com', 'hotmial.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.co': 'outlook.com', 'rediffmial.com': 'rediffmail.com' };
const MASH = /(qwert|asdf|zxcv|hjkl|uiop|wasd|abcd|xyz|1234|test|dummy|fake|random|sample|aaaa|nnnn)/i;

const EMAIL_MASH = /(qwert|asdf|zxcv|hjkl|test|dummy|fake|random|sample)/i;
const vowelRatio = (s) => { const l = s.replace(/[^a-z]/gi, ''); return l ? (l.match(/[aeiouy]/gi) || []).length / l.length : 1; };
const looksRandom = (s) => {
  const w = s.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length < 2) return false;
  if (/(.)\1{3,}/.test(w)) return true;                       // aaaa
  if (w.length >= 5 && vowelRatio(w) < 0.12) return true;     // xkcdqwrt
  if (/[bcdfghjklmnpqrstvwxz]{6,}/.test(w)) return true;      // 6 consonants in a row
  return false;
};

export function checkName(v) {
  const s = String(v || '').trim().replace(/\s+/g, ' ');
  if (!s) return 'Please enter the contact person\'s full name.';
  if (s.length < 4 || s.length > 60) return 'Please enter a real full name (first and last name).';
  if (/[0-9@#$%^&*_=+<>{}[\]\\/|~`!?]/.test(s)) return 'A name cannot contain numbers or symbols.';
  if (!/^[\p{L}][\p{L}\p{M} .'-]*$/u.test(s)) return 'Please use letters only in the name.';
  const parts = s.split(' ').filter((p) => p.replace(/[.'-]/g, '').length >= 1);
  if (parts.length < 2) return 'Please enter first and last name, for example "Priya Sharma".';
  if (MASH.test(s.replace(/\s/g, '')) || parts.some((p) => /^[a-z]/i.test(p) && looksRandom(p))) return 'This does not look like a real name. Please enter the contact person\'s actual name.';
  return '';
}

export function checkCompany(v) {
  const s = String(v || '').trim();
  if (!s) return 'Please enter your brand or company name.';
  if (s.length < 2 || s.length > 100) return 'Please enter the full brand or company name.';
  if (!/\p{L}/u.test(s)) return 'Company name must contain letters.';
  if (/^(test|testing|abc|xyz|asdf|qwerty|na|n\/a|none|company|brand)$/i.test(s) || MASH.test(s.replace(/\s/g, '')) || looksRandom(s.replace(/\s/g, ''))) return 'Please enter your real brand or company name.';
  return '';
}

export function checkEmail(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return { error: 'Please enter your work email.' };
  if (s.length > 120 || !/^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/.test(s) || s.includes('..')) return { error: 'Please enter a valid email address, like name@company.com.' };
  const [local, domain] = s.split('@');
  if (TYPOS[domain]) return { error: `Did you mean ${local}@${TYPOS[domain]}? Please check the spelling.`, fix: `${local}@${TYPOS[domain]}` };
  if (DISPOSABLE.has(domain)) return { error: 'Temporary or throwaway email addresses are not accepted. Please use your real email.' };
  if (PLACEHOLDER_DOMAINS.has(domain)) return { error: 'This looks like a sample email. Please enter your real email address.' };
  if (/^(test|testing|abc|xyz|asdf|qwerty|admin123|noreply|no-reply|null|none|fake|dummy|sample|user|email|mail)\d*$/.test(local) || EMAIL_MASH.test(local) && local.length <= 12 || looksRandom(local.replace(/[0-9._%+-]/g, ''))) return { error: 'This email looks random. Please enter the email you actually use.' };
  return { error: '', email: s };
}

// Indian numbers all use country code +91.
//  mobile   : 10 digits starting 6, 7, 8 or 9
//  landline : area (STD) code + number = 10 digits after the leading 0 (e.g. 022 2345 6789 for Mumbai)
//  tollfree : 1800 followed by 6 or 7 digits
export const PHONE_TYPES = { mobile: 'Mobile', landline: 'Business landline', tollfree: 'Toll-free (1800)' };
export function checkPhone(type, v) {
  if (!PHONE_TYPES[type]) return { error: 'Please choose the type of phone number.' };
  let d = String(v || '').replace(/[\s()-]/g, '');
  if (!d) return { error: 'Please enter a phone number.' };
  if (!/^\+?\d+$/.test(d)) return { error: 'A phone number can only have digits.' };
  if (type === 'tollfree') {
    d = d.replace(/^\+?91/, '');
    if (!/^1800\d{6,7}$/.test(d)) return { error: 'A toll-free number starts with 1800 and has 10 or 11 digits, for example 1800 123 4567.' };
    return { error: '', phone: `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` };
  }
  d = d.replace(/^\+91/, '').replace(/^0091/, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length !== 10) return { error: type === 'mobile' ? 'An Indian mobile number has 10 digits, for example 98201 23456.' : 'A landline number is the area code plus the number, 10 digits in total, for example 022 2345 6789.' };
  if (/^(\d)\1{9}$/.test(d) || d === '1234567890' || d === '0123456789' || d === '9876543210') return { error: 'This number looks made up. Please enter a real number.' };
  if (type === 'mobile' && !/^[6-9]/.test(d)) return { error: 'An Indian mobile number starts with 6, 7, 8 or 9. For an office number choose "Business landline".' };
  if (type === 'landline' && !/^[1-8]/.test(d)) return { error: 'Please check the area code. Landline numbers start with an area code like 022 (Mumbai) or 011 (Delhi).' };
  return { error: '', phone: type === 'mobile' ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : `+91 ${d}` };
}

export const BUDGETS = ['Under ₹25,000', '₹25,000 – ₹1,00,000', '₹1,00,000 – ₹5,00,000', 'Above ₹5,00,000'];
export function checkMessage(v) {
  const s = String(v || '').trim();
  if (s.length < 20) return 'Please tell us a little about your brand and products (at least 20 characters).';
  if (s.length > 2000) return 'Please keep the message under 2000 characters.';
  const words = s.split(/\s+/).filter((w) => /\p{L}{2,}/u.test(w));
  const uniq = new Set(words.map((w) => w.toLowerCase()));
  const odd = (w) => looksRandom(w) || MASH.test(w) || /[a-z][A-Z]{2,}|[A-Z]{2,}[a-z]{2,}[A-Z]/.test(w) || /[bcdfghjklmnpqrstvwxz]{4,}/i.test(w.replace(/ngths?|tchs?|nchs?|rths?|ngst/gi, ''));
  const oddCount = words.filter(odd).length;
  if (oddCount > 1 || (words.length < 12 && oddCount >= 1 && oddCount / words.length > 0.12)) return 'Some words look like random letters. Please write a clear message about your brand.';
  if (words.length < 4 || uniq.size < Math.min(4, words.length) || words.filter((w) => MASH.test(w) || looksRandom(w)).length > words.length / 3 || looksRandom(s.replace(/\s/g, '').slice(0, 40)) && vowelRatio(s) < 0.2) return 'Please write a real message about your brand, in a few words.';
  return '';
}

// Checks every field. Returns { ok, errors: {field: message}, clean: {...} }
export function checkEnquiry(b) {
  const errors = {};
  const set = (k, m) => { if (m) errors[k] = m; };
  set('company', checkCompany(b.company));
  set('contact_name', checkName(b.contact_name));
  const em = checkEmail(b.email); set('email', em.error);
  const ph = checkPhone(b.phone_type, b.phone); set('phone', ph.error);
  set('budget', BUDGETS.includes(b.budget) ? '' : 'Please choose a budget range.');
  set('message', checkMessage(b.message));
  const clean = {
    company: String(b.company || '').trim().slice(0, 100), contact_name: String(b.contact_name || '').trim().replace(/\s+/g, ' ').slice(0, 60),
    email: em.email || '', phone_type: PHONE_TYPES[b.phone_type] || '', phone: ph.phone || '', budget: b.budget, message: String(b.message || '').trim().slice(0, 2000),
  };
  return { ok: !Object.keys(errors).length, errors, clean };
}
