import request from 'supertest';
import app from '../app';

describe('GET /api/ping', () => {
  it('returns ok: true with a timestamp', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.time).toBe('string');
  });
});
