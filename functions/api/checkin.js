import { id, nowIso, requireMember } from "../_lib/auth.js";
import { clientIp, err, ok, rateLimit, readJson } from "../_lib/http.js";

const AUTO_HOURS = 6;

export async function onRequestPost(context) {
  const { request, env, data } = context;
  if (!env.DB) return err(503, "Database not configured");
  const denied = requireMember(data.member);
  if (denied) return denied;

  const body = await readJson(request) || {};
  const ip = clientIp(request);
  if (!rateLimit(`checkin:${data.member.id}:${ip}`, 30, 600000)) {
    return err(429, "Too many check-in attempts");
  }

  const location = String(body.location || "gate").slice(0, 40);
  const action = body.action || "checkin";

  /* Auto check-out stale open visits (> 6h) for this member */
  const cutoff = new Date(Date.now() - AUTO_HOURS * 3600e3).toISOString();
  await env.DB.prepare(
    `UPDATE checkins SET checked_out_at = ?
     WHERE member_id = ? AND checked_out_at IS NULL AND checked_in_at < ?`
  ).bind(nowIso(), data.member.id, cutoff).run();

  if (action === "checkout") {
    await env.DB.prepare(
      `UPDATE checkins SET checked_out_at = ?
       WHERE member_id = ? AND checked_out_at IS NULL`
    ).bind(nowIso(), data.member.id).run();
    return ok({ checkedIn: false });
  }

  const open = await env.DB.prepare(
    `SELECT * FROM checkins WHERE member_id = ? AND checked_out_at IS NULL
     ORDER BY checked_in_at DESC LIMIT 1`
  ).bind(data.member.id).first();

  if (open) {
    return ok({
      checkedIn: true,
      checkin: open,
      message: "Already checked in"
    });
  }

  const cid = id("c");
  const at = nowIso();
  await env.DB.prepare(
    `INSERT INTO checkins (id, member_id, checked_in_at, location) VALUES (?, ?, ?, ?)`
  ).bind(cid, data.member.id, at, location).run();

  return ok({
    checkedIn: true,
    checkin: { id: cid, member_id: data.member.id, checked_in_at: at, location },
    privacy: "Check-in records purge after 90 days."
  });
}

export async function onRequestGet(context) {
  const { env, data } = context;
  if (!env.DB) return err(503, "Database not configured");
  const denied = requireMember(data.member);
  if (denied) return denied;

  /* Auto check-out stale */
  const cutoff = new Date(Date.now() - AUTO_HOURS * 3600e3).toISOString();
  await env.DB.prepare(
    `UPDATE checkins SET checked_out_at = ?
     WHERE checked_out_at IS NULL AND checked_in_at < ?`
  ).bind(nowIso(), cutoff).run();

  const mine = await env.DB.prepare(
    `SELECT * FROM checkins WHERE member_id = ? AND checked_out_at IS NULL LIMIT 1`
  ).bind(data.member.id).first();

  const payload = {
    checkedIn: !!mine,
    checkin: mine || null,
    privacy: "Check-in records purge after 90 days."
  };

  if (data.member.role === "member" || data.member.role === "ro" || data.member.role === "officer") {
    const names = await env.DB.prepare(
      `SELECT m.name, m.slug, c.checked_in_at, c.location
       FROM checkins c JOIN members m ON m.id = c.member_id
       WHERE c.checked_out_at IS NULL
       ORDER BY c.checked_in_at ASC`
    ).all();
    payload.onRange = names.results || [];
  }

  if (data.member.role === "officer") {
    const month = new Date().toISOString().slice(0, 7);
    const usage = await env.DB.prepare(
      `SELECT m.name, m.email, c.checked_in_at, c.checked_out_at, c.location
       FROM checkins c JOIN members m ON m.id = c.member_id
       WHERE c.checked_in_at LIKE ?
       ORDER BY c.checked_in_at DESC`
    ).bind(`${month}%`).all();
    payload.monthlyCsv = toCsv(usage.results || []);
  }

  return ok(payload);
}

function toCsv(rows) {
  const header = "name,email,checked_in_at,checked_out_at,location";
  const lines = rows.map((r) =>
    [r.name, r.email, r.checked_in_at, r.checked_out_at || "", r.location]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header].concat(lines).join("\n");
}
