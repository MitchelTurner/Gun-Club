import { err, ok } from "../_lib/http.js";

/** Public range status (replaces / complements data/status.json). */
export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) {
    return ok({ open: true, detail: "", notice: "", source: "default" });
  }
  const row = await env.DB.prepare(`SELECT * FROM range_status WHERE id = 1`).first();
  if (!row) return ok({ open: true, detail: "", notice: "", source: "default" });
  return ok({
    open: !!row.open,
    detail: row.detail || "",
    notice: row.notice || "",
    updated_at: row.updated_at,
    source: "d1"
  });
}
