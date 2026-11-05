process.env.NODE_ENV = 'test';

const errorHandler = require('../middlewares/errorHandler');
const { authentication, watchlistAuthorization } = require('../middlewares/authMiddleware');
const { sequelize, User, Watchlist } = require('../models');
const userMigration = require('../migrations/20261104000001-create-users');
const watchlistMigration = require('../migrations/20261104000002-create-watchlists');
const { signToken } = require('../helpers/jwt');

describe('Middlewares Unit Tests', () => {
  let user;
  let otherUser;
  let watchlistItem;

  beforeAll(async () => {
    await userMigration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    await watchlistMigration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    user = await User.create({ username: 'Owner', email: 'owner@mail.com', password: 'password123' });
    otherUser = await User.create({ username: 'Other', email: 'other@mail.com', password: 'password123' });
    watchlistItem = await Watchlist.create({
      userId: user.id,
      animeId: 1,
      title: 'Your Name'
    });
  });

  afterAll(async () => {
    await watchlistMigration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await userMigration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await sequelize.close();
  });

  const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('errorHandler Middleware', () => {
    it('harus menangani berbagai tipe error dengan status code yang sesuai', () => {
      const cases = [
        { err: { name: 'SequelizeValidationError', errors: [{ message: 'Email required' }] }, code: 400 },
        { err: { name: 'JsonWebTokenError' }, code: 401 },
        { err: { name: 'BadRequest', message: 'Invalid input' }, code: 400 },
        { err: { name: 'Unauthorized', message: 'Login needed' }, code: 401 },
        { err: { name: 'Forbidden', message: 'No access' }, code: 403 },
        { err: { name: 'NotFound', message: 'Missing' }, code: 404 },
        { err: { status: 503, message: 'Unavailable' }, code: 503 },
        { err: new Error('Unexpected'), code: 500 }
      ];

      cases.forEach(({ err, code }) => {
        const res = createMockRes();
        errorHandler(err, {}, res, jest.fn());
        expect(res.status).toHaveBeenCalledWith(code);
      });
    });
  });

  describe('authentication & watchlistAuthorization Middlewares', () => {
    it('harus menolak request tanpa header authorization atau format salah', async () => {
      const next1 = jest.fn();
      await authentication({ headers: {} }, {}, next1);
      expect(next1).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));

      const next2 = jest.fn();
      await authentication({ headers: { authorization: 'InvalidFormat' } }, {}, next2);
      expect(next2).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));

      const next3 = jest.fn();
      await authentication({ headers: { authorization: 'Bearer invalid.jwt.token' } }, {}, next3);
      expect(next3).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));

      const ghostToken = signToken({ id: '00000000-0000-4000-8000-000000000000' });
      const next4 = jest.fn();
      await authentication({ headers: { authorization: `Bearer ${ghostToken}` } }, {}, next4);
      expect(next4).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
    });

    it('harus meloloskan authentication jika token valid', async () => {
      const validToken = signToken({ id: user.id, email: user.email });
      const req = { headers: { authorization: `Bearer ${validToken}` } };
      const next = jest.fn();
      await authentication(req, {}, next);
      expect(req.user.id).toBe(user.id);
      expect(next).toHaveBeenCalledWith();
    });

    it('harus memvalidasi kepemilikan pada watchlistAuthorization (404, 403, dan 200)', async () => {
      const next404 = jest.fn();
      await watchlistAuthorization({ params: { id: 'non-existent' }, user: { id: user.id } }, {}, next404);
      expect(next404).toHaveBeenCalledWith(expect.objectContaining({ status: 404 }));

      const next403 = jest.fn();
      await watchlistAuthorization({ params: { id: watchlistItem.id }, user: { id: otherUser.id } }, {}, next403);
      expect(next403).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));

      const reqOwner = { params: { id: watchlistItem.id }, user: { id: user.id } };
      const nextOwner = jest.fn();
      await watchlistAuthorization(reqOwner, {}, nextOwner);
      expect(reqOwner.watchlistItem.id).toBe(watchlistItem.id);
      expect(nextOwner).toHaveBeenCalledWith();
    });
  });
});

