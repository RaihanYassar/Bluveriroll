process.env.NODE_ENV = 'test';
process.env.GOOGLE_CLIENT_ID = 'mock-google-client-id.apps.googleusercontent.com';

const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken
  }))
}));

const AuthController = require('../controllers/authController');
const { sequelize, User } = require('../models');
const userMigration = require('../migrations/20261104000001-create-users');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('AuthController Unit & Integration Tests', () => {
  beforeAll(async () => {
    await userMigration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
  });

  afterAll(async () => {
    await userMigration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('harus berhasil registrasi user baru dengan status 201', async () => {
      const req = {
        body: {
          username: 'Raihan',
          email: 'raihan@bluveriroll.com',
          password: 'password123'
        }
      };
      const res = createMockRes();
      const next = jest.fn();

      await AuthController.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 201,
          data: expect.objectContaining({ email: 'raihan@bluveriroll.com' })
        })
      );
    });

    it('harus memanggil next(err) jika field wajib kosong', async () => {
      const req = { body: { username: 'Raihan' } };
      const res = createMockRes();
      const next = jest.fn();

      await AuthController.register(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await User.create({
        username: 'LoginUser',
        email: 'login@bluveriroll.com',
        password: 'password123'
      });
    });

    it('harus berhasil login dengan kredensial valid dan mengembalikan access_token', async () => {
      const req = { body: { email: 'login@bluveriroll.com', password: 'password123' } };
      const res = createMockRes();
      const next = jest.fn();

      await AuthController.login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          access_token: expect.any(String)
        })
      );
    });

    it('harus gagal jika email/password kosong, tidak ditemukan, salah password, atau akun Google', async () => {
      const res = createMockRes();

      const nextEmpty = jest.fn();
      await AuthController.login({ body: { email: '' } }, res, nextEmpty);
      expect(nextEmpty).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));

      const nextNotFound = jest.fn();
      await AuthController.login({ body: { email: 'nobody@mail.com', password: '123' } }, res, nextNotFound);
      expect(nextNotFound).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));

      const nextWrongPass = jest.fn();
      await AuthController.login({ body: { email: 'login@bluveriroll.com', password: 'wrong' } }, res, nextWrongPass);
      expect(nextWrongPass).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));

      await User.create({ username: 'GUser', email: 'g@mail.com', googleId: 'g1', password: null });
      const nextGoogleOnly = jest.fn();
      await AuthController.login({ body: { email: 'g@mail.com', password: '123' } }, res, nextGoogleOnly);
      expect(nextGoogleOnly).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
    });
  });

  describe('googleLogin & getMe', () => {
    it('harus menangani login Google untuk user baru dan user lama serta error cases', async () => {
      const res = createMockRes();

      const nextNoToken = jest.fn();
      await AuthController.googleLogin({ body: {} }, res, nextNoToken);
      expect(nextNoToken).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));

      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-123',
          email: 'googleuser@bluveriroll.com',
          email_verified: true,
          name: 'Google Otaku',
          picture: 'https://example.com/pic.jpg'
        })
      });

      await AuthController.googleLogin({ body: { token: 'valid-google-token' } }, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);

      // Existing user link
      await User.create({ username: 'Manual', email: 'manual@bluveriroll.com', password: 'password123' });
      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'google-456',
          email: 'manual@bluveriroll.com',
          email_verified: true,
          name: 'Manual User'
        })
      });
      await AuthController.googleLogin({ body: { credential: 'valid-token-2' } }, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);

      // Conflict googleId
      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => ({
          sub: 'different-google-id',
          email: 'manual@bluveriroll.com',
          email_verified: true
        })
      });
      const nextConflict = jest.fn();
      await AuthController.googleLogin({ body: { idToken: 'conflict-token' } }, res, nextConflict);
      expect(nextConflict).toHaveBeenCalledWith(expect.objectContaining({ status: 409 }));

      // Unverified email
      mockVerifyIdToken.mockResolvedValueOnce({
        getPayload: () => ({ email_verified: false })
      });
      const nextUnverified = jest.fn();
      await AuthController.googleLogin({ body: { token: 'unverified' } }, res, nextUnverified);
      expect(nextUnverified).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));

      // Verify throw
      mockVerifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));
      const nextInvalid = jest.fn();
      await AuthController.googleLogin({ body: { token: 'bad' } }, res, nextInvalid);
      expect(nextInvalid).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
    });

    it('harus mengembalikan profil user pada getMe', async () => {
      const res = createMockRes();
      await AuthController.getMe({ user: { id: '1', username: 'Raihan' } }, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

