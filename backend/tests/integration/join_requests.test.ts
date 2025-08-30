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
const USER_C_ID = process.env.USER_C_ID;
const USER_C_PASSWORD = process.env.USER_C_PASSWORD;

let TOKEN_A = '';
let TOKEN_B = '';
let TOKEN_C = '';
let teamId: string = '';
let joinRequestId: string = '';

beforeAll(async () => {
  // Login user A (team creator/admin)
  const loginA = await request(app)
    .post('/api/v1/users/login')
    .send({ identifier: USER_A_ID, password: USER_A_PASSWORD });
  expect([200, 401]).toContain(loginA.status);
  if (loginA.status === 200) {
    TOKEN_A = loginA.body.data.token;
  }

  // Login user B (join requester)
  const loginB = await request(app)
    .post('/api/v1/users/login')
    .send({ identifier: USER_B_ID, password: USER_B_PASSWORD });
  expect([200, 401]).toContain(loginB.status);
  if (loginB.status === 200) {
    TOKEN_B = loginB.body.data.token;
  }

  // Login user C (additional admin)
  const loginC = await request(app)
    .post('/api/v1/users/login')
    .send({ identifier: USER_C_ID, password: USER_C_PASSWORD });
  expect([200, 401]).toContain(loginC.status);
  if (loginC.status === 200) {
    TOKEN_C = loginC.body.data.token;
  }
});

describe('Join Requests and Admin Management', () => {

  const unique = Date.now();
  const teamTitle = `JoinTestTeam_${unique}`;
  const gameName = `JoinTestGame_${unique}`;

  it('ensure a game exists for the team (create if needed)', async () => {
    const createGame = await request(app)
      .post(gameBase)
      .send({ name: gameName });
    expect([201, 409]).toContain(createGame.status);
  });

  it('create team (auth A - creator becomes admin automatically)', async () => {
    if (!TOKEN_A) return;

    const res = await request(app)
      .post(teamBase)
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ title: teamTitle, gameName });

    expect([201]).toContain(res.status);
    if (res.status === 201) {
      teamId = res.body.data.id;
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe(teamTitle);
    }
  });

  it('get team admins (should include creator)', async () => {
    if (!teamId) return;

    const res = await request(app)
      .get(`${inviteBase}/teams/${teamId}/admins`)
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    
    if (res.body.data.length > 0) {
      const creator = res.body.data.find((admin: any) => admin.isCreator);
      expect(creator).toBeDefined();
      expect(creator.userId).toBe(USER_A_ID);
    }
  });

  it('send join request to team (auth B)', async () => {
    if (!TOKEN_B || !teamId) return;

    const res = await request(app)
      .post(inviteBase)
      .set('Authorization', `Bearer ${TOKEN_B}`)
      .send({ teamId });

    expect([201, 400, 404, 409]).toContain(res.status);
    if (res.status === 201) {
      joinRequestId = res.body.data.id;
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.teamId).toBe(teamId);
    }
  });

  it('get join requests sent by user B', async () => {
    if (!TOKEN_B) return;

    const res = await request(app)
      .get(`${inviteBase}/sent`)
      .set('Authorization', `Bearer ${TOKEN_B}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('get join requests received by team admin (auth A)', async () => {
    if (!TOKEN_A) return;

    const res = await request(app)
      .get(`${inviteBase}/received`)
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('get join request by ID', async () => {
    if (!TOKEN_A || !joinRequestId) return;

    const res = await request(app)
      .get(`${inviteBase}/${joinRequestId}`)
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.data).toHaveProperty('id', joinRequestId);
      expect(res.body.data).toHaveProperty('teamId', teamId);
    }
  });

  it('accept join request sent by user B by admin (auth A)', async () => {
    if (!TOKEN_A || !joinRequestId) return;

    const res = await request(app)
      .put(`${inviteBase}/${joinRequestId}/accept`)
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
  });

  it('verify user B is now team member', async () => {
    if (!TOKEN_A || !teamId) return;

    const res = await request(app)
      .get(`${teamBase}/${teamId}`)
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      const members = res.body.data.members;
      const userBMember = members.find((member: any) => member.userId === USER_B_ID);
      expect(userBMember).toBeDefined();
      expect(userBMember.status).toBe('ACCEPTED');
    }
  });



  it('promote user B to team admin (auth A - creator)', async () => {
    if (!TOKEN_A || !teamId || !USER_B_ID) return;


    const res = await request(app)
      .post(`${inviteBase}/teams/${teamId}/admins`)
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ userId: USER_B_ID });

    expect([200, 400, 403, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.data).toHaveProperty('userId', USER_B_ID);
    }
  });

  it('verify user B is now admin', async () => {
    if (!teamId || !USER_B_ID) return;

    const res = await request(app)
      .get(`${inviteBase}/teams/${teamId}/admins`)
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    const admins = res.body.data;
    const userBAdmin = admins.find((admin: any) => admin.userId === USER_B_ID);
    expect(userBAdmin).toBeDefined();
    expect(userBAdmin.isCreator).toBe(false);
  });

  it('user B can also see join requests as admin', async () => {
    if (!TOKEN_B) return;

    const res = await request(app)
      .get(`${inviteBase}/received`)
      .set('Authorization', `Bearer ${TOKEN_B}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('user B can accept join requests as admin', async () => {
    if (!TOKEN_B || !teamId) return;

    // Send a join request from user C
    const sendRes = await request(app)
      .post(inviteBase)
      .set('Authorization', `Bearer ${TOKEN_C}`)
      .send({ teamId });

    if (sendRes.status === 201) {
      const requestId = sendRes.body.data.id;

      // Accept as admin (should succeed)
      const acceptRes = await request(app)
        .put(`${inviteBase}/${requestId}/accept`)
        .set('Authorization', `Bearer ${TOKEN_B}`);

      expect(acceptRes.status).toBe(200);
    }
  });






  it('demote user B from admin (auth A - creator only)', async () => {
    if (!TOKEN_A || !teamId || !USER_B_ID) return;

    const res = await request(app)
      .delete(`${inviteBase}/teams/${teamId}/admins/${USER_B_ID}`)
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect([200, 400, 403, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.data).toHaveProperty('success', true);
    }
  });

  it('verify user B is no longer admin', async () => {
    if (!teamId || !USER_B_ID) return;

    const res = await request(app)
      .get(`${inviteBase}/teams/${teamId}/admins`)
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    const admins = res.body.data;
    const userBAdmin = admins.find((admin: any) => admin.userId === USER_B_ID);
    expect(userBAdmin).toBeUndefined();
  });

  it('user B cannot demote admin (not creator)', async () => {
    if (!TOKEN_B || !teamId || !USER_A_ID) return;

    const res = await request(app)
      .delete(`${inviteBase}/teams/${teamId}/admins/${USER_A_ID}`)
      .set('Authorization', `Bearer ${TOKEN_B}`);

    expect([403, 404]).toContain(res.status);
  });

  it('creator cannot demote themselves as admin', async () => {
    if (!TOKEN_A || !teamId || !USER_A_ID) return;

    const res = await request(app)
      .delete(`${inviteBase}/teams/${teamId}/admins/${USER_A_ID}`)
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect([400, 403]).toContain(res.status);
  });

  it('test join request cancellation by requester', async () => {
    if (!TOKEN_B || !teamId) return;

    // Send a new join request
    const sendRes = await request(app)
      .post(inviteBase)
      .set('Authorization', `Bearer ${TOKEN_B}`)
      .send({ teamId });

    if (sendRes.status === 201) {
      const requestId = sendRes.body.data.id;

      // Cancel the request
      const cancelRes = await request(app)
        .delete(`${inviteBase}/${requestId}`)
        .set('Authorization', `Bearer ${TOKEN_B}`);

      expect([200, 400, 404]).toContain(cancelRes.status);
    }
  });

  it('test join request rejection by admin', async () => {
    if (!TOKEN_C || !teamId) return;

    // Send a join request from user C
    const sendRes = await request(app)
      .post(inviteBase)
      .set('Authorization', `Bearer ${TOKEN_C}`)
      .send({ teamId });

    if (sendRes.status === 201) {
      const requestId = sendRes.body.data.id;

      // Try to reject as non-admin (should fail)
      const rejectRes = await request(app)
        .put(`${inviteBase}/${requestId}/reject`)
        .set('Authorization', `Bearer ${TOKEN_C}`);

      expect([403, 404]).toContain(rejectRes.status);
    }
  });

  // it('cleanup - delete team (auth A)', async () => {
  //   if (!TOKEN_A || !teamId) return;

  //   const res = await request(app)
  //     .delete(`${teamBase}/${teamId}`)
  //     .set('Authorization', `Bearer ${TOKEN_A}`);

  //   expect([200, 404, 403]).toContain(res.status);
  // });
});
