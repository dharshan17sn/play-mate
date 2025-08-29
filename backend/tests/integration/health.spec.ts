import request from 'supertest';
import app from '../../src/app';
import { describe, it, expect } from 'vitest';

describe('Health Check', () => {
  
  it('GET /health should return 200 and expected payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    
  });


});
