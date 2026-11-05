process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');

describe('App Root, Health & 404 Tests', () => {
  it('harus merespons GET / dengan status 200 dan pesan selamat datang', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Welcome to BLUVERIROLL API/i);
    expect(res.body).toHaveProperty('version', '1.0.0');
  });

  it('harus merespons GET /api/health dengan status 200 dan status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'BLUVERIROLL API');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('harus merespons request ke endpoint yang tidak ada dengan status 404', async () => {
    const res = await request(app).get('/api/non-existent-endpoint-xyz');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('statusCode', 404);
    expect(res.body.message).toMatch(/Cannot GET \/api\/non-existent-endpoint-xyz/i);
  });
});

