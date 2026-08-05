const te = new TextEncoder();

export function id(prefix = "") {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return prefix ? `${prefix}_${hex}` : hex;
}

export function token(bytes = 32) {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hmacSign(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    te.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, te.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hmacVerify(secret, payload, signature) {
  const expected = await hmacSign(secret, payload);
  if (expected.length !== signature.length) return false;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return ok === 0;
}

export function isoDaysFromNow(days) {
  return new Date(Date.now() + days * 864e5).toISOString();
}

export function isoMinutesFromNow(mins) {
  return new Date(Date.now() + mins * 6e4).toISOString();
}

export function nowIso() {
  return new Date().toISOString();
}
