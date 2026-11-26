// Account security: every user's data is encrypted with AES-256-GCM.
//  - A random data key (DEK) encrypts the data.
//  - The DEK is wrapped twice: with a key derived from the password (PBKDF2-SHA256, 310,000 iterations)
//    and with a key derived from a one-time recovery code (to reset a forgotten password).
//  - On Android the DEK can also be wrapped by the hardware-backed Keystore ("stay signed in", Google login).
//  - A separate verifier (other half of the PBKDF2 output) checks the password; comparison is constant-time.
(function () {
  const enc = new TextEncoder(), dec = new TextDecoder();
  const ITER = 310000;
  const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const hex = (u8) => [...u8].map((b) => b.toString(16).padStart(2, '0')).join('');
  const rand = (n) => crypto.getRandomValues(new Uint8Array(n));

  async function pbkdf2(secret, salt, iter = ITER, bits = 512) {
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: iter, hash: 'SHA-256' }, key, bits));
  }
  // -> { verifier (hex), kek (CryptoKey) }
  async function fromSecret(secret, salt, iter = ITER) {
    const bits = await pbkdf2(secret, salt, iter);
    const kek = await crypto.subtle.importKey('raw', bits.slice(32), 'AES-GCM', false, ['encrypt', 'decrypt']);
    return { verifier: hex(bits.slice(0, 32)), kek };
  }
  const aesKey = (raw, usages = ['encrypt', 'decrypt']) => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, usages);

  async function seal(key, bytes) {
    const iv = rand(12);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
    const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12);
    return b64(out);
  }
  async function open(key, str) {
    const all = unb64(str);
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, key, all.slice(12)));
  }
  const encryptJSON = async (key, obj) => 'v2:' + (await seal(key, enc.encode(JSON.stringify(obj))));
  const decryptJSON = async (key, str) => JSON.parse(dec.decode(await open(key, str.slice(3))));

  function same(a, b) { // constant-time string comparison
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let r = 0;
    for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return r === 0;
  }

  // recovery code: 16 chars from an unambiguous alphabet, shown once, e.g. "K7PM-2QXH-9TWD-4FRB"
  function recoveryCode() {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const r = rand(16);
    let s = '';
    for (let i = 0; i < 16; i++) s += A[r[i] % A.length] + (i % 4 === 3 && i < 15 ? '-' : '');
    return s;
  }
  const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{4})(?=.)/g, '$1-');

  const COMMON = ['123456', '12345678', '123456789', 'password', 'motdepasse', 'azerty', 'azertyuiop', 'qwerty', '111111', '000000', '123123', 'abc123', 'password1', 'iloveyou', 'tunisie', 'tunisia', 'admin123', 'welcome1', '1q2w3e4r', 'football'];
  // 0..4 and a list of problems (i18n keys)
  function strength(pw, user) {
    const issues = [];
    if (pw.length < 8) issues.push('pw_len');
    if (!/[a-zA-Z؀-ۿ]/.test(pw) || !/\d/.test(pw)) issues.push('pw_mix');
    const low = pw.toLowerCase();
    if (COMMON.includes(low) || (user && low.includes(String(user).toLowerCase().split('@')[0]) && user.length >= 3)) issues.push('pw_common');
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;
    if (issues.length) score = Math.min(score, 1);
    return { score, issues };
  }

  const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

  window.Sec = { ITER, b64, unb64, rand, fromSecret, aesKey, seal, open, encryptJSON, decryptJSON, same, recoveryCode, normCode, strength, EMAIL, pbkdf2 };
})();
