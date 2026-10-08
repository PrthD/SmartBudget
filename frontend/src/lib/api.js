/**
 * The single HTTP client.
 *
 * - The access token lives only in memory (never localStorage), so an XSS bug
 *   can't exfiltrate a long-lived credential.
 * - The refresh token is an httpOnly cookie the browser sends to /auth only.
 * - A 401 triggers one shared ("single-flight") refresh, then the request is
 *   retried once. If refreshing fails, listeners are told the session ended.
 */

// Empty/unset → same origin ("/api/v1"). In development the Vite server
// proxies that to the API, so the browser never makes a cross-port request
// (no CORS, no third-party cookie rules, nothing for blockers to intercept).
// Production builds set VITE_API_URL (or the v1 name REACT_APP_API_URL).
const API_ORIGIN = (
  import.meta.env.VITE_API_URL ??
  import.meta.env.REACT_APP_API_URL ??
  ''
).replace(/\/+$/, '');
const BASE_URL = `${API_ORIGIN}/api/v1`;

export class ApiError extends Error {
  constructor(status, { message, code, details } = {}) {
    super(message || 'Something went wrong. Please try again.');
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Endpoints that establish/end sessions: a 401 here must not trigger refresh.
const SESSION_ENDPOINTS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
]);

let accessToken = null;
let refreshPromise = null;
const sessionListeners = new Set();

export const setAccessToken = (token) => {
  accessToken = token;
};

/** Subscribe to "session ended" (refresh failed). Returns an unsubscribe fn. */
export function onSessionEnd(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const type = response.headers.get('content-type') ?? '';
  if (type.includes('application/json')) return response.json();
  return response.blob();
}

async function send(path, { method = 'GET', body, signal, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      credentials: path.startsWith('/auth') ? 'include' : 'same-origin',
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, {
      code: 'NETWORK',
      message: import.meta.env.DEV
        ? `Cannot reach the API (${BASE_URL}). Is \`make dev-api\` running?`
        : 'Cannot reach the server. Check your connection and try again.',
    });
  }

  const data = await parseResponse(response).catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data?.error);
  return data;
}

/** Exchanges the refresh cookie for a new access token (single-flight). */
export function refreshSession() {
  refreshPromise ??= send('/auth/refresh', { method: 'POST', auth: false })
    .then((session) => {
      setAccessToken(session.accessToken);
      return session;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export async function api(path, options = {}) {
  try {
    return await send(path, options);
  } catch (error) {
    // Only an expired/invalid session is worth a refresh (not, e.g., a wrong
    // password on a re-authentication endpoint, which is a 403).
    const canRetry =
      error instanceof ApiError &&
      error.status === 401 &&
      error.code === 'UNAUTHORIZED' &&
      !SESSION_ENDPOINTS.has(path);
    if (!canRetry) throw error;

    try {
      await refreshSession();
    } catch {
      setAccessToken(null);
      sessionListeners.forEach((listener) => listener());
      throw error;
    }
    return send(path, options);
  }
}

api.get = (path, options) => api(path, { ...options, method: 'GET' });
api.post = (path, body, options) =>
  api(path, { ...options, method: 'POST', body });
api.patch = (path, body, options) =>
  api(path, { ...options, method: 'PATCH', body });
api.put = (path, body, options) =>
  api(path, { ...options, method: 'PUT', body });
api.delete = (path, body, options) =>
  api(path, { ...options, method: 'DELETE', body });
