import { id, nowIso, requireMember } from "../_lib/auth.js";
import { err, ok, readJson } from "../_lib/http.js";

/**
 * RO score entry — offline-tolerant clients POST batches with client_id for idempotency.
 */
export async function onRequestPost(context) {
  const { request, env, data } = context;
  if (!env.DB) return err(503, "Database not configured");
  const denied = requireMember(data.member, ["ro", "officer"]);
  if (denied) return denied;

  const body = await readJson(request) || {};
  const scores = Array.isArray(body.scores) ? body.scores : [body];
  const saved = [];

  for (const s of scores) {
    if (!s.matchId || !s.memberId || s.value == null) continue;
    const sid = s.id || id("sc");
    if (s.client_id) {
      const exists = await env.DB.prepare(
        `SELECT id FROM scores WHERE client_id = ?`
      ).bind(s.client_id).first();
      if (exists) {
        saved.push(exists.id);
        continue;
      }
    }
    await env.DB.prepare(
      `INSERT INTO scores (id, match_id, member_id, stage, value, sights, entered_by, entered_at, client_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(match_id, member_id, stage) DO UPDATE SET
         value = excluded.value,
         sights = excluded.sights,
         entered_by = excluded.entered_by,
         entered_at = excluded.entered_at,
         client_id = COALESCE(excluded.client_id, scores.client_id)`
    ).bind(
      sid,
      s.matchId,
      s.memberId,
      Number(s.stage) || 1,
      Number(s.value),
      s.sights || null,
      data.member.id,
      nowIso(),
      s.client_id || null
    ).run();
    saved.push(sid);
  }

  if (body.setLive && body.matchId) {
    await env.DB.prepare(
      `UPDATE matches SET status = 'live' WHERE id = ? AND status IN ('open','live')`
    ).bind(body.matchId).run();
  }

  return ok({ saved: saved.length, ids: saved });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!env.DB) return err(503, "Database not configured");
  const url = new URL(request.url);
  const matchId = url.searchParams.get("matchId");
  if (!matchId) return err(400, "matchId required");

  const match = await env.DB.prepare(`SELECT * FROM matches WHERE id = ?`).bind(matchId).first();
  if (!match) return err(404, "Match not found");

  const scores = await env.DB.prepare(
    `SELECT s.*, m.name, m.slug FROM scores s
     JOIN members m ON m.id = s.member_id
     WHERE s.match_id = ?
     ORDER BY s.stage ASC, s.value DESC`
  ).bind(matchId).all();

  /* Provisional standings: sum stages, higher better */
  const byMember = {};
  for (const row of scores.results || []) {
    if (!byMember[row.member_id]) {
      byMember[row.member_id] = {
        memberId: row.member_id,
        name: row.name,
        slug: row.slug,
        total: 0,
        stages: {}
      };
    }
    byMember[row.member_id].total += Number(row.value);
    byMember[row.member_id].stages[row.stage] = Number(row.value);
  }
  const provisional = Object.values(byMember).sort((a, b) => b.total - a.total);

  return ok({
    match,
    scores: scores.results || [],
    provisional,
    live: match.status === "live"
  });
}
