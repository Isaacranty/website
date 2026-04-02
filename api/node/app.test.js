const request = require('supertest');
const app = require('./app');

describe('Node API', () => {
  it('status should return 200', async () => {
    const res = await request(app).get('/status');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('node up');
  }, 10000);
});
