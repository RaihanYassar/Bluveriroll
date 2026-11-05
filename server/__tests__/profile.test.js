process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { sequelize, User } = require('../models');
const migration = require('../migrations/20261104000001-create-users');
const { signToken } = require('../helpers/jwt');

describe('Profile & Analytics API Tests', () => {
  let token;
  let user;

  beforeAll(async () => {
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    user = await User.create({
      username: 'ProfileTester',
      email: 'profiler@bluveriroll.com',
      password: 'password123'
    });
    token = signToken({ id: user.id, email: user.email, username: user.username });
  });

  afterAll(async () => {
    await migration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await sequelize.close();
  });

  describe('GET /api/profile/dna', () => {
    it('harus menolak request tanpa token dengan status 401', async () => {
      const res = await request(app).get('/api/profile/dna');
      expect(res.status).toBe(401);
    });

    it('harus mengembalikan Anime DNA profile dengan status 200', async () => {
      const res = await request(app)
        .get('/api/profile/dna')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('dna');
      expect(res.body.dna).toHaveProperty('hasEnoughData', false);
      expect(res.body.dna).toHaveProperty('minimumRequired', 5);
      expect(res.body.userId).toBe(user.id);
    });
  });

  describe('GET /api/profile/journey', () => {
    it('harus menolak request tanpa token dengan status 401', async () => {
      const res = await request(app).get('/api/profile/journey');
      expect(res.status).toBe(401);
    });

    it('harus mengembalikan Watch Journey timeline dengan status 200', async () => {
      const res = await request(app)
        .get('/api/profile/journey')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('history');
      expect(Array.isArray(res.body.history)).toBe(true);
      expect(res.body.userId).toBe(user.id);
    });
  });
});