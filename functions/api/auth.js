import {
  clearSessionCookie,
  createMagicLink,
  createSession,
  consumeMagicLink,
  requireMember,
  sendMagicEmail,
  sessionCookie
} from "../_lib/auth.js";
import { clientIp, err, ok, rateLimit, readJson } from "../_lib/http.js";
import { verifyTurnstile } from "../_lib/turnstile.js";

export async function onRequestPost(context) {
  const { request, env, data } = context;
  if (!env.DB) return err(503, "Database not configured");

  const body = await readJson(request);
  if (!body || !body.action) return err(400, "Missing action");

  const ip = clientIp(request);

  if (body.action === "request") {
    if (!rateLimit(`auth:req:${ip}`, 8, 600000)) return err(429, "Too many requests");
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return err(400, "Valid email required");
    const tsOk = await verifyTurnstile(env, request, body.turnstileToken);
    if (!tsOk) return err(403, "Turnstile verification failed");

    const linkToken = await createMagicLink(env, email);
    const origin = env.SITE_URL || new URL(request.url).origin;
    const link = `${origin}/members.html?magic=${linkToken}`;
    const sent = await sendMagicEmail(env, email, link);
    return ok({
      message: "If that email is on the roster, a sign-in link is on its way.",
      devLink: sent.devLink
    });
  }

  if (body.action === "verify") {
    if (!rateLimit(`auth:verify:${ip}`, 20, 600000)) return err(429, "Too many requests");
    const result = await consumeMagicLink(env, String(body.token || ""));
    if (result.error) return err(400, result.error);
    if (result.member.status === "inactive") return err(403, "Membership inactive");
    const session = await createSession(env, result.member.id, "magic");
    return ok(
      {
        member: publicMember(result.member)
      },
      200,
      { "set-cookie": sessionCookie(session.sealed) }
    );
  }

  if (body.action === "passcode") {
    /* Fallback for one full season — do not remove until board says so */
    if (!rateLimit(`auth:pass:${ip}`, 10, 600000)) return err(429, "Too many requests");
    const tsOk = await verifyTurnstile(env, request, body.turnstileToken);
    if (!tsOk && env.TURNSTILE_SECRET_KEY) return err(403, "Turnstile verification failed");

    const pass = String(body.passcode || "");
    const expected = env.PASSCODE_FALLBACK || "tongass";
    if (!pass || pass !== expected) return err(401, "Incorrect passcode");

    /* Shared passcode maps to a synthetic guest member record */
    let guest = await env.DB.prepare(
      `SELECT * FROM members WHERE id = 'm_passcode_guest'`
    ).first();
    if (!guest) {
      await env.DB.prepare(
        `INSERT INTO members (id, email, name, slug, role, status, joined_on)
         VALUES ('m_passcode_guest', 'passcode@local', 'Passcode guest', 'passcode-guest', 'member', 'active', date('now'))`
      ).run();
      guest = await env.DB.prepare(`SELECT * FROM members WHERE id = 'm_passcode_guest'`).first();
    }
    const session = await createSession(env, guest.id, "passcode");
    return ok(
      { member: publicMember(guest), via: "passcode" },
      200,
      { "set-cookie": sessionCookie(session.sealed) }
    );
  }

  if (body.action === "logout") {
    return ok({ message: "Signed out" }, 200, { "set-cookie": clearSessionCookie() });
  }

  if (body.action === "me") {
    const denied = requireMember(data.member);
    if (denied) return denied;
    return ok({ member: publicMember(data.member) });
  }

  return err(400, "Unknown action");
}

export async function onRequestGet(context) {
  const { data, env } = context;
  if (!env.DB) return err(503, "Database not configured");
  if (!data.member) return ok({ member: null });
  return ok({ member: publicMember(data.member) });
}

function publicMember(m) {
  return {
    id: m.id,
    email: m.email,
    name: m.name,
    slug: m.slug,
    role: m.role,
    status: m.status,
    hidden: !!m.hidden,
    via: m.via || null
  };
}
