import { nowIso } from "../_lib/auth.js";
import { err, ok } from "../_lib/http.js";

/**
 * Public: count only. Never names.
 */
export async function onRequestGet(context) {
  const { env, data } = context;
  if (!env.DB) {
    return ok({ count: 0, authenticated: false });
  }

  const AUTO_HOURS = 6;
  const cutoff = new Date(Date.now() - AUTO_HOURS * 3600e3).toISOString();
  await env.DB.prepare(
    `UPDATE checkins SET checked_out_at = ?
     WHERE checked_out_at IS NULL AND checked_in_at < ?`
  ).bind(nowIso(), cutoff).run();

  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM checkins WHERE checked_out_at IS NULL`
  ).first();

  const count = row ? Number(row.n) : 0;

  /* Harden: even if somehow a JOIN sneaks in later, only return count for anon */
  if (!data.member) {
    return ok({ count, authenticated: false });
  }

  return ok({ count, authenticated: true });
}
