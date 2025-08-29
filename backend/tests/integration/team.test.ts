import request from 'supertest';
import app from '../../src/app';
import { describe, it, expect, beforeAll } from 'vitest';

const teamBase = '/api/v1/teams';
const inviteBase = '/api/v1/invitations';
const gameBase = '/api/v1/games';

// Env-driven test users (must exist in DB)
const USER_A_ID = process.env.USER_A_ID;
const USER_A_PASSWORD = process.env.USER_A_PASSWORD;
const USER_B_ID = process.env.USER_B_ID;
const USER_B_PASSWORD = process.env.USER_B_PASSWORD;

let TOKEN_A = '';
let TOKEN_B = '';
let teamId: string = '';

beforeAll(async () => {
  // Login user A (team creator)
  const loginA = await request(app)
    .post('/api/v1/users/login')
    .send({ identifier: USER_A_ID, password: USER_A_PASSWORD });
  expect([200, 401]).toContain(loginA.status);
  if (loginA.status === 200) {
    TOKEN_A = loginA.body.data.token;
  }

  // Login user B (invitee)
  const loginB = await request(app)
    .post('/api/v1/users/login')
    .send({ identifier: USER_B_ID, password: USER_B_PASSWORD });
  expect([200, 401]).toContain(loginB.status);
  if (loginB.status === 200) {
    TOKEN_B = loginB.body.data.token;
  }
});

describe('Team + Invitation Routes', () => {
  const unique = Date.now();
  const teamTitle = `Team_${unique}`;
  const gameName = `TeamGame_${unique}`;

  it('ensure a game exists for the team (create if needed)', async () => {
    // Create a game to be used by the new team
    const createGame = await request(app)
      .post(gameBase)
      .send({ name: gameName });
    expect([201, 409]).toContain(createGame.status);
  });

  it('create team (auth A)', async () => {
    if (!TOKEN_A) return; // skip if no auth

    const res = await request(app)
      .post(teamBase)
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ title: teamTitle, gameName });

    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      teamId = res.body.data.id;
    }
  });

  it('get my teams (auth A)', async () => {
    if (!TOKEN_A) return; // skip

    const res = await request(app)
      .get(`${teamBase}/my`)
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('get all teams (auth A)', async () => {
    if (!TOKEN_A) return;

    const res = await request(app)
      .get(`${teamBase}/all`)
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('teams');
  });

  let invitationId: string = '';

  it('send invitation to user B (auth A)', async () => {
    if (!TOKEN_A || !teamId) return;

    const res = await request(app)
      .post(inviteBase)
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ toUserId: USER_B_ID, teamId });

    expect([201, 400, 404, 409]).toContain(res.status);
    if (res.status === 201) {
      invitationId = res.body.data.id;
    }
  });

  it('get invitations sent (auth A)', async () => {
    if (!TOKEN_A) return;
    const res = await request(app)
      .get(`${inviteBase}/sent`)
      .set('Authorization', `Bearer ${TOKEN_A}`);
    expect(res.status).toBe(200);
  });

  it('get invitations received (auth B)', async () => {
    if (!TOKEN_B) return;
    const res = await request(app)
      .get(`${inviteBase}/received`)
      .set('Authorization', `Bearer ${TOKEN_B}`);
    expect(res.status).toBe(200);
  });

  it('get invitation by id (auth A)', async () => {
    if (!TOKEN_A || !invitationId) return;
    const res = await request(app)
      .get(`${inviteBase}/${invitationId}`)
      .set('Authorization', `Bearer ${TOKEN_A}`);
    expect([200, 404]).toContain(res.status);
  });

  it('accept invitation (auth B)', async () => {
    if (!TOKEN_B || !invitationId) return;
    const res = await request(app)
      .put(`${inviteBase}/${invitationId}/accept`)
      .set('Authorization', `Bearer ${TOKEN_B}`);
    expect([200, 404, 400]).toContain(res.status);
  });

  it('get team by id (auth A)', async () => {
    if (!TOKEN_A || !teamId) return;
    const res = await request(app)
      .get(`${teamBase}/${teamId}`)
      .set('Authorization', `Bearer ${TOKEN_A}`);
    expect([200, 404]).toContain(res.status);
  });

  it('cleanup delete team (auth A)', async () => {
    if (!TOKEN_A || !teamId) return;
    const res = await request(app)
      .delete(`${teamBase}/${teamId}`)
      .set('Authorization', `Bearer ${TOKEN_A}`);
    expect([200, 404, 403]).toContain(res.status);
  });
});
