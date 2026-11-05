process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { sequelize, User } = require('../models');
const migration = require('../migrations/20261104000001-create-users');
const { signToken } = require('../helpers/jwt');

describe('Watchlist API Tests', () => {
  let token;
  let user;

  beforeAll(async () => {
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    user = await User.create({
      username: 'WatchlistUser',
      email: 'watchlist@bluveriroll.com',
      password: 'password123'
    });
    token = signToken({ id: user.id, email: user.email, username: user.username });
  });

  afterAll(async () => {
    await migration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await sequelize.close();
  });

  describe('GET /api/watchlist', () => {
    it('harus menolak request tanpa token dengan status 401', async () => {
      const res = await request(app).get('/api/watchlist');
      expect(res.status).toBe(401);
    });

    it('harus mengembalikan watchlist pengguna dengan status 200', async () => {
      const res = await request(app)
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.userId).toBe(user.id);
    });
  });

  describe('POST /api/watchlist', () => {
    it('harus menambahkan anime ke watchlist dengan status 201', async () => {
      const payload = {
        animeId: 1,
        title: 'Cowboy Bebop',
        imageUrl: 'https://example.com/bebop.jpg',
        status: 'Watching',
        score: 9.5,
        currentEpisode: 5,
        totalEpisodes: 26
      };

      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/added to watchlist/i);
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.animeId).toBe(1);
    });

    it('harus gagal dengan status 400 jika animeId atau title tidak ada', async () => {
      const res = await request(app)
        .post('/api/watchlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Plan to Watch' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Anime ID and title are required/i);
    });
  });

  describe('PUT /api/watchlist/:id', () => {
    it('harus memperbarui watchlist item dengan status 200', async () => {
      const res = await request(app)
        .put('/api/watchlist/item-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Completed', score: 10, currentEpisode: 26 });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/updated successfully/i);
      expect(res.body.data.id).toBe('item-uuid-1');
      expect(res.body.data.status).toBe('Completed');
    });
  });

  describe('DELETE /api/watchlist/:id', () => {
    it('harus menghapus item dari watchlist dengan status 200', async () => {
      const res = await request(app)
        .delete('/api/watchlist/item-uuid-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/removed from watchlist/i);
      expect(res.body.id).toBe('item-uuid-1');
    });
  });
});

