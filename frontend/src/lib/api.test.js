import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const json = (status, body) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const unauthorized = () =>
  json(401, { error: { code: 'UNAUTHORIZED', message: 'Session expired' } });

describe('api client', () => {
  let api;
  let setAccessToken;
  let onSessionEnd;
  let fetchMock;

  beforeEach(async () => {
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    ({ api, setAccessToken, onSessionEnd } = await import('./api'));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('sends the in-memory access token and parses JSON', async () => {
    setAccessToken('abc');
    fetchMock.mockResolvedValueOnce(json(200, [{ id: 1 }]));
    await expect(api.get('/expenses')).resolves.toEqual([{ id: 1 }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/expenses$/);
    expect(init.headers.Authorization).toBe('Bearer abc');
    expect(init.credentials).toBe('same-origin');
  });

  it('refreshes once and retries when the session expired', async () => {
    setAccessToken('old');
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(json(200, { accessToken: 'new', user: {} }))
      .mockResolvedValueOnce(json(200, { ok: true }));

    await expect(api.get('/budget')).resolves.toEqual({ ok: true });
    const [refreshUrl, refreshInit] = fetchMock.mock.calls[1];
    expect(refreshUrl).toMatch(/\/auth\/refresh$/);
    expect(refreshInit.credentials).toBe('include');
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new');
  });

  it('shares a single refresh between concurrent requests', async () => {
    fetchMock.mockImplementation(async (url, init) => {
      if (url.endsWith('/auth/refresh'))
        return json(200, { accessToken: 'new', user: {} });
      return init.headers.Authorization === 'Bearer new'
        ? json(200, { ok: true })
        : unauthorized();
    });
    await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);
    const refreshes = fetchMock.mock.calls.filter(([url]) =>
      url.endsWith('/auth/refresh')
    );
    expect(refreshes).toHaveLength(1);
  });

  it('ends the session when refreshing fails', async () => {
    const ended = vi.fn();
    onSessionEnd(ended);
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(unauthorized());
    await expect(api.get('/expenses')).rejects.toMatchObject({ status: 401 });
    expect(ended).toHaveBeenCalledOnce();
  });

  it('does not treat a wrong current password (403) as an expired session', async () => {
    fetchMock.mockResolvedValueOnce(
      json(403, {
        error: { code: 'FORBIDDEN', message: 'Current password is incorrect.' },
      })
    );
    await expect(api.put('/users/me/email', {})).rejects.toMatchObject({
      status: 403,
      message: 'Current password is incorrect.',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('reports network failures with a friendly message', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(api.get('/expenses')).rejects.toMatchObject({
      code: 'NETWORK',
    });
  });
});
