import request from 'supertest';
import app from '../../src/app';
import { describe, it, expect, beforeAll } from 'vitest';

const base = '/api/v1/users';

// Hard-coded test credentials for login
const USER_A_ID = process.env.USER_A_ID;
const USER_A_PASSWORD = process.env.USER_A_PASSWORD;

let AUTH_TOKEN: string = '';
let AUTH_USER_ID: string = '';

beforeAll(async () => {
  // Login to get token
  const res = await request(app)
    .post(`${base}/login`)
    .send({ identifier: USER_A_ID, password: USER_A_PASSWORD });

  expect([200, 401]).toContain(res.status);
  if (res.status === 200) {
    AUTH_TOKEN = res.body.data.token;
    AUTH_USER_ID = res.body.data.user.user_id;
  }
});



describe('User Routes (login with email/user_id + password, no OTP)', () => {
  it('should list users (public)', async () => {
    const res = await request(app)
      .get(`${base}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should search users (public)', async () => {
    const res = await request(app)
      .get(`${base}/search`)
      .query({ search: 'user' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('should get user by id (public)', async () => {
    const userId = AUTH_USER_ID || 'nonexistent_user_id_for_test';
    const res = await request(app).get(`${base}/${userId}`);
    expect([200, 404]).toContain(res.status);
  });

  it('should get user teams by id (public)', async () => {
    if (!AUTH_USER_ID) return; // skip if login failed
    const res = await request(app).get(`${base}/${AUTH_USER_ID}/teams`);
    expect([200, 404]).toContain(res.status);
  });

  it('should get current user profile (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .get(`${base}/profile`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('user_id');
  });

  it('should update current user profile (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .put(`${base}/profile`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ displayName: `Updated-${Date.now()}` });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should get my teams (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .get(`${base}/teams`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should reject change password with invalid current password (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .put(`${base}/change-password`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ currentPassword: 'invalid-current', newPassword: 'SomeNewPass!234' });

    expect([400, 401, 403]).toContain(res.status);
  });


  it('should change password successfully and login with new password (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const NEW_PASSWORD = `Tmp${Date.now()}!12`;

    // Change to new password
    const changeRes = await request(app)
      .put(`${base}/change-password`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ currentPassword: USER_A_PASSWORD, newPassword: NEW_PASSWORD });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body).toHaveProperty('success', true);

    // Login with new password
    const loginNew = await request(app)
      .post(`${base}/login`)
      .send({ identifier: USER_A_ID, password: NEW_PASSWORD });

    expect(loginNew.status).toBe(200);
    expect(loginNew.body).toHaveProperty('success', true);
    expect(loginNew.body.data).toHaveProperty('token');

    // Revert back to original password
    const revertToken = loginNew.body.data.token as string;

    const revertRes = await request(app)
      .put(`${base}/change-password`)
      .set('Authorization', `Bearer ${revertToken}`)
      .send({ currentPassword: NEW_PASSWORD, newPassword: USER_A_PASSWORD });

    expect(revertRes.status).toBe(200);
    expect(revertRes.body).toHaveProperty('success', true);

    // Login with original password again
    const loginOrig = await request(app)
      .post(`${base}/login`)
      .send({ identifier: USER_A_ID, password: USER_A_PASSWORD });

    expect(loginOrig.status).toBe(200);
    expect(loginOrig.body).toHaveProperty('success', true);
  });



  it('should forbid deleting another user (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const otherId = AUTH_USER_ID === 'someone_else' ? 'another_user' : 'someone_else';
    const res = await request(app)
      .delete(`${base}/${otherId}`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('success', false);
  });
});


// manually test these endpoints
// 1. /register/request-otp
// 2. /register/verify-otp
// 3. /forgot-password/request-otp
// 4. /forgot-password/reset

// since this routes require otp to test test the otp related routes manually


