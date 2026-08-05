import { hmacSign, hmacVerify, id, isoDaysFromNow, isoMinutesFromNow, nowIso, token } from "./crypto.js";
import { err } from "./http.js";

const COOKIE = "krgc_session";
const SESSION_DAYS = 90;

export function getCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  const parts = raw.split(/;\s*/);
  for (const p of parts) {
    const i = p.indexOf("=");
    if (i > 0 && p.slice(0, i) === name) return decodeURIComponent(p.slice(i + 1));
  }
  return null;
}

export function sessionCookie(value, maxAgeSec = SESSION_DAYS * 86400) {
  const parts = [
    `${COOKIE}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`
  ];
  return parts.join("; ");
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function sealSession(env, sessionToken) {
  const sig = await hmacSign(env.SESSION_SECRET || "dev-insecure", sessionToken);
  return `${sessionToken}.${sig}`;
}

export async function openSession(env, sealed) {
  if (!sealed || !sealed.includes(".")) return null;
  const i = sealed.lastIndexOf(".");
  const sessionToken = sealed.slice(0, i);
  const sig = sealed.slice(i + 1);
  const good = await hmacVerify(env.SESSION_SECRET || "dev-insecure", sessionToken, sig);
  if (!good) return null;
  return sessionToken;
}

export async function getMember(env, request) {
  const sealed = getCookie(request, COOKIE);
  if (!sealed) return null;
  const sessionToken = await openSession(env, sealed);
  if (!sessionToken) return null;
  const row = await env.DB.prepare(
    `SELECT m.*, s.via, s.expires_at AS session_expires
     FROM sessions s JOIN members m ON m.id = s.member_id
     WHERE s.token = ? AND s.expires_at > ? AND m.status = 'active'`
  ).bind(sessionToken, nowIso()).first();
  return row || null;
}

export function requireMember(member, roles) {
  if (!member) return err(401, "Sign in required");
  if (roles && roles.length && !roles.includes(member.role)) {
    return err(403, "Insufficient role");
  }
  return null;
}

export async function createSession(env, memberId, via = "magic") {
  const t = token(32);
  const expires = isoDaysFromNow(SESSION_DAYS);
  await env.DB.prepare(
    `INSERT INTO sessions (token, member_id, expires_at, via) VALUES (?, ?, ?, ?)`
  ).bind(t, memberId, expires, via).run();
  const sealed = await sealSession(env, t);
  return { token: t, sealed, expires };
}

export async function createMagicLink(env, email) {
  const t = token(24);
  const expires = isoMinutesFromNow(30);
  await env.DB.prepare(
    `INSERT INTO magic_links (token, email, expires_at) VALUES (?, ?, ?)`
  ).bind(t, email.toLowerCase(), expires).run();
  return t;
}

export async function consumeMagicLink(env, linkToken) {
  const row = await env.DB.prepare(
    `SELECT * FROM magic_links WHERE token = ?`
  ).bind(linkToken).first();
  if (!row) return { error: "Invalid or expired link" };
  if (row.used_at) return { error: "Link already used" };
  if (row.expires_at < nowIso()) return { error: "Link expired" };
  await env.DB.prepare(
    `UPDATE magic_links SET used_at = ? WHERE token = ?`
  ).bind(nowIso(), linkToken).run();
  let member = await env.DB.prepare(
    `SELECT * FROM members WHERE email = ? COLLATE NOCASE`
  ).bind(row.email).first();
  if (!member) {
    const mid = id("m");
    const slug = row.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await env.DB.prepare(
      `INSERT INTO members (id, email, name, slug, role, status, joined_on)
       VALUES (?, ?, ?, ?, 'member', 'pending', ?)`
    ).bind(mid, row.email, row.email, `${slug}-${mid.slice(-4)}`, nowIso().slice(0, 10)).run();
    member = await env.DB.prepare(`SELECT * FROM members WHERE id = ?`).bind(mid).first();
  }
  if (member.status !== "active" && member.role === "member") {
    /* pending members can still verify — officers activate them */
  }
  return { member };
}

export async function sendMagicEmail(env, email, link) {
  if (env.RESEND_API_KEY) {
    const from = env.MAGIC_LINK_FROM || "noreply@ketchikanrodandgun.org";
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: "Your KRGC sign-in link",
        text: `Sign in to Ketchikan Rod & Gun Club:\n\n${link}\n\nThis link expires in 30 minutes. If you did not request it, ignore this email.`
      })
    });
    return { sent: true };
  }
  return { sent: false, devLink: env.ALLOW_DEV_LINKS === "1" ? link : undefined };
}

export { COOKIE, SESSION_DAYS, id, nowIso, token, isoDaysFromNow };
