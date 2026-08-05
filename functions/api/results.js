import { requireMember } from "../_lib/auth.js";
import { err, ok, readJson } from "../_lib/http.js";

/**
 * GET — results.json shape (for Phase 1 standings clients).
 * POST action=publish — officer closes a live match into published standings shape (D1).
 */
export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) {
    return err(503, "Database not configured — use /data/results.json");
  }

  const closed = await env.DB.prepare(
    `SELECT * FROM matches WHERE status = 'closed' ORDER BY date DESC`
  ).all();

  const matches = [];
  for (const m of closed.results || []) {
    const scores = await env.DB.prepare(
      `SELECT s.member_id, s.value, s.sights, m.name, m.slug, m.hidden,
              SUM(s.value) AS total
       FROM scores s JOIN members m ON m.id = s.member_id
       WHERE s.match_id = ?
       GROUP BY s.member_id
       ORDER BY total DESC`
    ).bind(m.id).all();

    /* Also support single-stage rows without SUM quirks */
    const ranked = await env.DB.prepare(
      `SELECT member_id, SUM(value) AS score, MAX(sights) AS sights
       FROM scores WHERE match_id = ?
       GROUP BY member_id
       ORDER BY score DESC`
    ).bind(m.id).all();

    const scoreRows = [];
    for (const r of ranked.results || []) {
      const mem = await env.DB.prepare(`SELECT * FROM members WHERE id = ?`).bind(r.member_id).first();
      scoreRows.push({
        shooter: mem ? mem.name : r.member_id,
        slug: mem ? mem.slug : r.member_id,
        score: Number(r.score),
        sights: r.sights || undefined,
        hidden: mem ? !!mem.hidden : false
      });
    }

    matches.push({
      id: m.id,
      season: m.season || String(m.date).slice(0, 4),
      date: m.date,
      discipline: m.discipline,
      name: m.name,
      weather: m.weather || undefined,
      shooters: scoreRows.length,
      scores: scoreRows
    });
  }

  return ok({
    _comment: "Published from D1. Phase 1 standings consume matches[].",
    matches
  });
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  if (!env.DB) return err(503, "Database not configured");
  const denied = requireMember(data.member, ["officer"]);
  if (denied) return denied;

  const body = await readJson(request) || {};
  if (body.action !== "publish" || !body.matchId) {
    return err(400, "action=publish and matchId required");
  }

  const match = await env.DB.prepare(`SELECT * FROM matches WHERE id = ?`).bind(body.matchId).first();
  if (!match) return err(404, "Match not found");

  await env.DB.prepare(
    `UPDATE matches SET status = 'closed', weather = COALESCE(?, weather) WHERE id = ?`
  ).bind(body.weather || null, body.matchId).run();

  return ok({ message: "Match published into results feed", matchId: body.matchId });
}
