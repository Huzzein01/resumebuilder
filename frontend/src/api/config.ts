// In local dev, requests to "/api" are proxied to the backend by Vite (see
// vite.config.ts). There's no such proxy once the frontend is deployed
// standalone (e.g. Vercel), so production needs an absolute URL to the
// deployed backend, supplied via VITE_API_URL at build time.
const configuredBase = import.meta.env.VITE_API_URL as string | undefined;

export const API_BASE_URL = configuredBase ? configuredBase.replace(/\/$/, "") : "/api";
