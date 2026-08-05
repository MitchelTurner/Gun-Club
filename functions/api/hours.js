import { id, nowIso, requireMember } from "../_lib/auth.js";
import { err, ok, readJson } from "../_lib/http.js";

export async function onRequestGet(context) {
  const { env, data, request } = context;
  if (!env.DB) return err(503, "Database not configured");

  const url = new URL(request.url);
  const season = url.searchParams.get("season") || String(new Date().getFullYear());
  const mine = url.searchParams.get("mine") === "1";

  if (mine) {
    const denied = requireMember(data.member);
    if (denied) return denied;
    const rows = await env.DB.prepare(
      `SELECT * FROM hours WHERE member_id = ? AND event_date LIKE ? ORDER BY event_date DESC`
    ).bind(data.member.id, `${season}%`).all();
    const total = (rows.results || []).reduce((s, r) => s + Number(r.hours), 0);
    const creditPerHour = Number(env.HOURS_CREDIT_PER_HOUR || 0);
    const maxCredit = Number(env.HOURS_MAX_CREDIT || 0);
    const credit = maxCredit > 0
      ? Math.min(maxCredit, total * creditPerHour)
      : total * creditPerHour;
    return ok({
      hours: rows.results || [],
      total,
      credit,
      creditPerHour: creditPerHour || null,
      maxCredit: maxCredit || null
    });
  }

  /* Public season leaderboard — visible contribution */
  const board = await env.DB.prepare(
    `SELECT m.name, m.slug, m.hidden, SUM(h.hours) AS hours
     FROM hours h JOIN members m ON m.id = h.member_id
     WHERE h.event_date LIKE ?
     GROUP BY h.member_id
     ORDER BY hours DESC`
  ).bind(`${season}%`).all();

  const leaderboard = (board.results || []).map((r) => ({
    name: r.hidden ? "Anonymous" : r.name,
    slug: r.slug,
    hours: Number(r.hours)
  }));

  return ok({ season, leaderboard });
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  if (!env.DB) return err(503, "Database not configured");
  const denied = requireMember(data.member, ["officer"]);
  if (denied) return denied;

  const body = await readJson(request) || {};
  if (!body.memberId || !body.eventDate || body.hours == null) {
    return err(400, "memberId, eventDate, and hours required");
  }

  const hid = id("h");
  await env.DB.prepare(
    `INSERT INTO hours (id, member_id, event_date, hours, note, logged_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    hid,
    body.memberId,
    body.eventDate,
    Number(body.hours),
    body.note || null,
    data.member.id,
    nowIso()
  ).run();

  return ok({ id: hid });
}
