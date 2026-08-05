import { clientIp } from "./http.js";

export async function verifyTurnstile(env, request, token) {
  if (!env.TURNSTILE_SECRET_KEY) {
    /* Dev / unset: allow when explicitly opted in */
    return env.ALLOW_DEV_LINKS === "1";
  }
  if (!token) return false;
  const body = new URLSearchParams();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  body.set("remoteip", clientIp(request));
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body
  });
  const data = await res.json().catch(() => ({}));
  return !!data.success;
}
