import { getMember } from "./_lib/auth.js";
import { purgeOldCheckins } from "./_lib/alerts.js";

/**
 * Attach member (if any) to context for API routes.
 * Also opportunistically purge check-ins older than 90 days.
 */
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/")) {
    context.data = context.data || {};
    try {
      context.data.member = env.DB ? await getMember(env, request) : null;
    } catch {
      context.data.member = null;
    }

    /* Cheap scheduled-ish purge: ~1% of API requests */
    if (env.DB && Math.random() < 0.01) {
      context.waitUntil(purgeOldCheckins(env).catch(() => {}));
    }
  }

  return next();
}
