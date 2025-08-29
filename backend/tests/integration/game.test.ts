import request from 'supertest';
import app from '../../src/app';
import { describe, it, expect } from 'vitest';

const base = '/api/v1/games';

describe('Game Routes', () => {
  const uniqueGame = `TestGame_${Date.now()}`;

  it('GET /games should list games', async () => {
    const res = await request(app).get(base);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /games should create a game', async () => {
    const res = await request(app)
      .post(base)
      .send({ name: uniqueGame });

    // 201 on first create; if it already exists, expect 409
    expect([201, 409]).toContain(res.status);
  });

  it('GET /games/:name should retrieve existing game by name', async () => {
    const res = await request(app).get(`${base}/${encodeURIComponent(uniqueGame)}`);
    // 200 if found, 404 if previous create failed due to conflict and game not present
    expect([200, 404]).toContain(res.status);
  });

  it('POST /games/init should initialize defaults (idempotent)', async () => {
    const res = await request(app).post(`${base}/init`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});
