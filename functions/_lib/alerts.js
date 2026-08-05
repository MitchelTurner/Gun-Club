import { id, nowIso } from "./crypto.js";

export async function broadcastClosure(env, status) {
  const msg = status.open
    ? `KRGC range is OPEN again.${status.detail ? " " + status.detail : ""}`
    : `KRGC range CLOSED.${status.notice ? " " + status.notice : ""}${status.detail ? " " + status.detail : ""} Reply STOP to opt out of SMS.`;

  const rows = await env.DB.prepare(
    `SELECT * FROM alerts WHERE verified = 1 AND unsubscribed_at IS NULL`
  ).all();

  const results = { email: 0, sms: 0, errors: [] };
  for (const a of rows.results || []) {
    try {
      if (a.channel === "email") {
        await sendEmail(env, a.address, "KRGC range status", msg + `\n\nUnsubscribe: ${originFromEnv(env)}/api/alerts?unsubscribe=${a.id}`);
        results.email += 1;
      } else if (a.channel === "sms") {
        await sendSms(env, a.address, msg);
        results.sms += 1;
      }
    } catch (e) {
      results.errors.push(String(e.message || e));
    }
  }
  return results;
}

function originFromEnv(env) {
  return env.SITE_URL || "https://ketchikanrodandgun.org";
}

async function sendEmail(env, to, subject, text) {
  if (!env.RESEND_API_KEY) return;
  const from = env.MAGIC_LINK_FROM || "noreply@ketchikanrodandgun.org";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ from, to, subject, text })
  });
}

async function sendSms(env, to, body) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) return;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const data = new URLSearchParams({
    To: to,
    From: env.TWILIO_FROM_NUMBER,
    Body: body
  });
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: data
  });
}

export async function purgeOldCheckins(env) {
  const cutoff = new Date(Date.now() - 90 * 864e5).toISOString();
  await env.DB.prepare(
    `DELETE FROM checkins WHERE checked_in_at < ?`
  ).bind(cutoff).run();
}

export { id, nowIso };
