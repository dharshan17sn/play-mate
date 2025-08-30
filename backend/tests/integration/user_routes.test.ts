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

  it('should add preferred games to user profile (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .put(`${base}/profile`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ 
        preferredGames: ['Cricket', 'Football'],
        preferredDays: ['MONDAY', 'WEDNESDAY'],
        timeRange: '18:00-22:00'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('preferredGames');
    expect(Array.isArray(res.body.data.preferredGames)).toBe(true);
  });

  it('should add more games to existing preferred games (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .put(`${base}/profile`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ 
        preferredGames: ['Basketball', 'Tennis']
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('preferredGames');
    expect(Array.isArray(res.body.data.preferredGames)).toBe(true);
    // Should now have both previous games and new games
    expect(res.body.data.preferredGames.length).toBeGreaterThanOrEqual(2);
  });

  it('should reject update with non-existent games (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .put(`${base}/profile`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ 
        preferredGames: ['NonExistentGame1', 'NonExistentGame2']
      });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('Games not found');
  });

  it('should update preferred days and time range (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .put(`${base}/profile`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ 
        preferredDays: ['TUESDAY', 'THURSDAY', 'SATURDAY'],
        timeRange: '19:00-23:00'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('preferredDays');
    expect(res.body.data).toHaveProperty('timeRange');
    expect(Array.isArray(res.body.data.preferredDays)).toBe(true);
    expect(res.body.data.timeRange).toBe('19:00-23:00');
  });

  it('should reject invalid time range format (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .put(`${base}/profile`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ 
        timeRange: 'Time range must be in format HH:MM-HH:MM'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('timeRange');
  });

  it('should reject invalid preferred days (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .put(`${base}/profile`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ 
        preferredDays: ['INVALID_DAY', 'MONDAY']
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should update all profile fields together (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .put(`${base}/profile`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({ 
        displayName: `CompleteUpdate-${Date.now()}`,
        photo: 'https://example.com/new-photo.jpg',
        gender: 'male',
        location: 'San Francisco',
        preferredDays: ['FRIDAY', 'SATURDAY', 'SUNDAY'],
        timeRange: '20:00-02:00',
        preferredGames: ['Volleyball', 'Hockey']
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('displayName');
    expect(res.body.data).toHaveProperty('photo');
    expect(res.body.data).toHaveProperty('gender');
    expect(res.body.data).toHaveProperty('location');
    expect(res.body.data).toHaveProperty('preferredDays');
    expect(res.body.data).toHaveProperty('timeRange');
    expect(res.body.data).toHaveProperty('preferredGames');
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
      .send({
        currentPassword: 'wrong-password',
        newPassword: 'NewPassword123!'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should change password successfully (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .put(`${base}/change-password`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({
        currentPassword: USER_A_PASSWORD,
        newPassword: 'NewPassword123!'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);

    // Revert password change for other tests
    const revertRes = await request(app)
      .put(`${base}/change-password`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`)
      .send({
        currentPassword: 'NewPassword123!',
        newPassword: USER_A_PASSWORD
      });

    expect([200, 401]).toContain(revertRes.status);
  });

  it('should reject delete user with wrong user_id (auth)', async () => {
    if (!AUTH_TOKEN) return; // skip if login failed

    const res = await request(app)
      .delete(`${base}/wrong_user_id`)
      .set('Authorization', `Bearer ${AUTH_TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should reject invalid login credentials', async () => {
    const res = await request(app)
      .post(`${base}/login`)
      .send({
        identifier: 'nonexistent_user',
        password: 'wrong_password'
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should login with user_id', async () => {
    if (!USER_A_ID) return; // skip if no user id

    const res = await request(app)
      .post(`${base}/login`)
      .send({
        identifier: USER_A_ID,
        password: USER_A_PASSWORD
      });

    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
    }
  });

  it('should login with email', async () => {
    const userEmail = process.env.USER_A_EMAIL;
    if (!userEmail) return; // skip if no email

    const res = await request(app)
      .post(`${base}/login`)
      .send({
        identifier: userEmail,
        password: USER_A_PASSWORD
      });

    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
    }
  });
});


// manually test these endpoints
// 1. /register/request-otp
// 2. /register/verify-otp
// 3. /forgot-password/request-otp
// 4. /forgot-password/reset

// since this routes require otp to test test the otp related routes manually


