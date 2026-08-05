import { id, nowIso, requireMember, token } from "../_lib/auth.js";
import { broadcastClosure } from "../_lib/alerts.js";
import { clientIp, err, ok, rateLimit, readJson } from "../_lib/http.js";
import { verifyTurnstile } from "../_lib/turnstile.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return err(503, "Database not configured");
  const url = new URL(request.url);
  const unsub = url.searchParams.get("unsubscribe");
  const verify = url.searchParams.get("verify");

  if (unsub) {
    await env.DB.prepare(
      `UPDATE alerts SET unsubscribed_at = ? WHERE id = ?`
    ).bind(nowIso(), unsub).run();
    return new Response("You are unsubscribed from KRGC closure alerts.", {
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  if (verify) {
    await env.DB.prepare(
      `UPDATE alerts SET verified = 1, verify_token = NULL WHERE verify_token = ?`
    ).bind(verify).run();
    return new Response("Subscription verified. You will get closure alerts only — never marketing.", {
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  return ok({
    message: "POST to subscribe. Closures and safety only; STOP / unsubscribe honored immediately."
  });
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  if (!env.DB) return err(503, "Database not configured");
  const body = await readJson(request) || {};
  const ip = clientIp(request);

  if (body.action === "broadcast") {
    const denied = requireMember(data.member, ["officer"]);
    if (denied) return denied;
    const status = await env.DB.prepare(`SELECT * FROM range_status WHERE id = 1`).first();
    const results = await broadcastClosure(env, {
      open: !!status.open,
      detail: status.detail,
      notice: status.notice
    });
    return ok({ results });
  }

  if (body.action === "status") {
    const denied = requireMember(data.member, ["officer"]);
    if (denied) return denied;
    const open = body.open !== false && body.open !== 0;
    await env.DB.prepare(
      `UPDATE range_status SET open = ?, detail = ?, notice = ?, updated_at = ?, updated_by = ? WHERE id = 1`
    ).bind(open ? 1 : 0, body.detail || "", body.notice || "", nowIso(), data.member.id).run();
    const results = await broadcastClosure(env, {
      open,
      detail: body.detail || "",
      notice: body.notice || ""
    });
    return ok({
      status: { open, detail: body.detail || "", notice: body.notice || "" },
      alerts: results
    });
  }

  /* subscribe */
  if (!rateLimit(`alerts:${ip}`, 10, 600000)) return err(429, "Too many requests");
  const tsOk = await verifyTurnstile(env, request, body.turnstileToken);
  if (!tsOk && env.TURNSTILE_SECRET_KEY) return err(403, "Turnstile verification failed");

  const channel = body.channel === "sms" ? "sms" : "email";
  const address = String(body.address || "").trim();
  if (!address) return err(400, "address required");
  if (channel === "email" && !address.includes("@")) return err(400, "Valid email required");
  if (channel === "sms" && address.replace(/\D/g, "").length < 10) return err(400, "Valid phone required");

  const aid = id("a");
  const verifyToken = token(16);
  try {
    await env.DB.prepare(
      `INSERT INTO alerts (id, channel, address, verified, verify_token)
       VALUES (?, ?, ?, 0, ?)
       ON CONFLICT(channel, address) DO UPDATE SET
         unsubscribed_at = NULL,
         verify_token = excluded.verify_token,
         verified = 0`
    ).bind(aid, channel, address, verifyToken).run();
  } catch {
    return err(400, "Could not save subscription");
  }

  const origin = env.SITE_URL || new URL(request.url).origin;
  return ok({
    message: "Check your email/SMS to verify. Closures and safety only — never marketing. One-tap unsubscribe in every message.",
    verifyUrl: channel === "email" ? `${origin}/api/alerts?verify=${verifyToken}` : undefined
  });
}
