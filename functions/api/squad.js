import { id, nowIso, requireMember } from "../_lib/auth.js";
import { err, ok, readJson } from "../_lib/http.js";

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!env.DB) return err(503, "Database not configured");
  const url = new URL(request.url);
  const matchId = url.searchParams.get("matchId");

  if (matchId) {
    const match = await env.DB.prepare(`SELECT * FROM matches WHERE id = ?`).bind(matchId).first();
    if (!match) return err(404, "Match not found");
    const squad = await env.DB.prepare(
      `SELECT s.*, m.name, m.slug FROM squads s
       JOIN members m ON m.id = s.member_id
       WHERE s.match_id = ? ORDER BY s.waitlisted ASC, s.position ASC, s.created_at ASC`
    ).bind(matchId).all();
    return ok({ match, squad: squad.results || [] });
  }

  const matches = await env.DB.prepare(
    `SELECT * FROM matches WHERE status IN ('open','live') ORDER BY date ASC`
  ).all();
  return ok({ matches: matches.results || [] });
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  if (!env.DB) return err(503, "Database not configured");
  const body = await readJson(request) || {};
  const action = body.action || "signup";

  if (action === "create") {
    const denied = requireMember(data.member, ["officer", "ro"]);
    if (denied) return denied;
    const mid = body.id || id("match");
    await env.DB.prepare(
      `INSERT INTO matches (id, date, discipline, name, capacity, status, weather, season)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      mid,
      body.date,
      body.discipline || "rimfire",
      body.name,
      Number(body.capacity) || 24,
      body.status || "open",
      body.weather || null,
      body.season || String(body.date || "").slice(0, 4)
    ).run();
    return ok({ matchId: mid });
  }

  const denied = requireMember(data.member);
  if (denied) return denied;

  const matchId = body.matchId;
  if (!matchId) return err(400, "matchId required");
  const match = await env.DB.prepare(`SELECT * FROM matches WHERE id = ?`).bind(matchId).first();
  if (!match) return err(404, "Match not found");
  if (match.status === "closed") return err(400, "Match is closed");

  if (action === "cancel") {
    const row = await env.DB.prepare(
      `SELECT * FROM squads WHERE match_id = ? AND member_id = ?`
    ).bind(matchId, data.member.id).first();
    if (!row) return ok({ message: "Not signed up" });
    await env.DB.prepare(
      `DELETE FROM squads WHERE match_id = ? AND member_id = ?`
    ).bind(matchId, data.member.id).run();
    if (!row.waitlisted) {
      await promoteWaitlist(env, matchId);
    }
    return ok({ message: "Cancelled", promoted: true });
  }

  /* signup */
  const existing = await env.DB.prepare(
    `SELECT * FROM squads WHERE match_id = ? AND member_id = ?`
  ).bind(matchId, data.member.id).first();
  if (existing) return ok({ squad: existing, message: "Already signed up" });

  const seated = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM squads WHERE match_id = ? AND waitlisted = 0`
  ).bind(matchId).first();
  const count = Number(seated.n || 0);
  const waitlisted = count >= match.capacity ? 1 : 0;
  const position = waitlisted
    ? null
    : count + 1;

  await env.DB.prepare(
    `INSERT INTO squads (match_id, member_id, position, waitlisted, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(matchId, data.member.id, position, waitlisted, nowIso()).run();

  return ok({
    waitlisted: !!waitlisted,
    position,
    message: waitlisted ? "Added to waitlist" : "Signed up"
  });
}

async function promoteWaitlist(env, matchId) {
  const next = await env.DB.prepare(
    `SELECT * FROM squads WHERE match_id = ? AND waitlisted = 1
     ORDER BY created_at ASC LIMIT 1`
  ).bind(matchId).first();
  if (!next) return;
  const seated = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM squads WHERE match_id = ? AND waitlisted = 0`
  ).bind(matchId).first();
  const position = Number(seated.n || 0) + 1;
  await env.DB.prepare(
    `UPDATE squads SET waitlisted = 0, position = ? WHERE match_id = ? AND member_id = ?`
  ).bind(position, matchId, next.member_id).run();
}
