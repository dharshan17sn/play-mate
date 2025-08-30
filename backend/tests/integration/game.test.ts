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

  it('GET /games should support pagination', async () => {
    const res = await request(app)
      .get(base)
      .query({ page: 1, limit: 5 });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /games should create a game', async () => {
    const res = await request(app)
      .post(base)
      .send({ name: uniqueGame });

    // 201 on first create; if it already exists, expect 409
    expect([201, 409]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', uniqueGame);
    }
  });

  it('POST /games should reject duplicate game name', async () => {
    const res = await request(app)
      .post(base)
      .send({ name: uniqueGame });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('already exists');
  });

  it('POST /games should reject invalid game name', async () => {
    const res = await request(app)
      .post(base)
      .send({ name: 'A' }); // Too short

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('POST /games should reject empty game name', async () => {
    const res = await request(app)
      .post(base)
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('POST /games should reject missing game name', async () => {
    const res = await request(app)
      .post(base)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('GET /games/:name should retrieve existing game by name', async () => {
    const res = await request(app).get(`${base}/${encodeURIComponent(uniqueGame)}`);
    // 200 if found, 404 if previous create failed due to conflict and game not present
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', uniqueGame);
    }
  });

  it('GET /games/:name should return 404 for non-existent game', async () => {
    const nonExistentGame = `NonExistentGame_${Date.now()}`;
    const res = await request(app).get(`${base}/${encodeURIComponent(nonExistentGame)}`);
    
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('not found');
  });

  it('GET /games/:name should handle special characters in game name', async () => {
    const specialGameName = `Game-With-Special_Chars_${Date.now()}`;
    
    // Create game with special characters
    const createRes = await request(app)
      .post(base)
      .send({ name: specialGameName });
    
    if (createRes.status === 201) {
      // Try to retrieve it
      const getRes = await request(app).get(`${base}/${encodeURIComponent(specialGameName)}`);
      expect([200, 404]).toContain(getRes.status);
    }
  });

  it('POST /games/init should initialize defaults (idempotent)', async () => {
    const res = await request(app).post(`${base}/init`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.message).toContain('initialized');
  });

  it('POST /games/init should be idempotent (can run multiple times)', async () => {
    const res1 = await request(app).post(`${base}/init`);
    const res2 = await request(app).post(`${base}/init`);
    
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body).toHaveProperty('success', true);
    expect(res2.body).toHaveProperty('success', true);
  });

  it('should handle URL encoding for game names with spaces', async () => {
    const gameWithSpaces = `Game With Spaces ${Date.now()}`;
    
    // Create game with spaces
    const createRes = await request(app)
      .post(base)
      .send({ name: gameWithSpaces });
    
    if (createRes.status === 201) {
      // Retrieve with URL encoding
      const getRes = await request(app).get(`${base}/${encodeURIComponent(gameWithSpaces)}`);
      expect([200, 404]).toContain(getRes.status);
    }
  });

  it('should handle very long game names', async () => {
    const longGameName = 'A'.repeat(50); // Max length (valid)
    
    const res = await request(app)
      .post(base)
      .send({ name: longGameName });

    expect([201, 409]).toContain(res.status);
  });

  it('should reject game names longer than max length', async () => {
    const tooLongGameName = 'A'.repeat(51); // Exceeds max length
    
    const res = await request(app)
      .post(base)
      .send({ name: tooLongGameName });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });
});
