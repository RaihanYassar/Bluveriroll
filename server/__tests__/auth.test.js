process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_bluveriroll_jwt_key_testing';
process.env.GOOGLE_CLIENT_ID = '496985110038-bqr7glv9gtba59qsbo0ief9r4upe806p.apps.googleusercontent.com';

const request = require('supertest');
const { OAuth2Client } = require('google-auth-library');
const app = require('../app');
const { sequelize, User } = require('../models');
const migration = require('../migrations/20261104000001-create-users');
const { signToken, verifyToken } = require('../helpers/jwt');

describe('BLUVERIROLL Authentication & User API', () => {
  beforeAll(async () => {
    // Jalankan migration tabel Users ke database test terisolasi
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
  });

  afterAll(async () => {
    // Batalkan migration dan tutup koneksi
    await migration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await sequelize.close();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    process.env.GOOGLE_CLIENT_ID = '496985110038-bqr7glv9gtba59qsbo0ief9r4upe806p.apps.googleusercontent.com';
    // Bersihkan data antar-test tanpa menghapus tabel
    await User.destroy({ where: {}, truncate: true });
  });

  describe('POST /api/auth/register', () => {
    it('harus berhasil registrasi user baru dan mengembalikan status 201 tanpa field password', async () => {
      const payload = {
        username: 'RaihanYassar',
        email: 'raihan@bluveriroll.com',
        password: 'securepassword123',
        avatarUrl: 'https://example.com/avatar.jpg'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('statusCode', 201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('username', payload.username);
      expect(response.body.data).toHaveProperty('email', payload.email);
      expect(response.body.data).toHaveProperty('avatarUrl', payload.avatarUrl);
      expect(response.body.data).not.toHaveProperty('password');

      // Verifikasi di database bahwa password ter-hash dan bukan plaintext
      const savedUser = await User.findByPk(response.body.data.id);
      expect(savedUser).not.toBeNull();
      expect(savedUser.password).not.toBe(payload.password);
      expect(savedUser.password.startsWith('$2')).toBe(true);
    });

    it('harus gagal registrasi jika email sudah terdaftar (duplikat) dengan status 400', async () => {
      // Buat user awal
      await User.create({
        username: 'ExistingUser',
        email: 'duplicate@bluveriroll.com',
        password: 'password123'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'AnotherUser',
          email: 'duplicate@bluveriroll.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toMatch(/already registered/i);
    });

    it('harus gagal jika username tidak diisi dengan status 400', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'no_username@bluveriroll.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toMatch(/Username, email, and password are required/i);
    });

    it('harus gagal jika email tidak diisi dengan status 400', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'UserNoEmail',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toMatch(/Username, email, and password are required/i);
    });

    it('harus gagal jika password tidak diisi dengan status 400', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'UserNoPass',
          email: 'nopass@bluveriroll.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toMatch(/Username, email, and password are required/i);
    });

    it('harus gagal jika format email tidak valid dengan status 400', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'UserBadEmail',
          email: 'invalid-email-format',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toMatch(/Invalid email format/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        username: 'LoginUser',
        email: 'login@bluveriroll.com',
        password: 'mypassword123',
        avatarUrl: 'https://example.com/avatar.png'
      });
    });

    it('harus berhasil login dengan kredensial benar dan mengembalikan status 200 beserta access_token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@bluveriroll.com',
          password: 'mypassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username', 'LoginUser');
      expect(response.body.user).toHaveProperty('email', 'login@bluveriroll.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('harus gagal login dengan password salah dan mengembalikan status 401', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@bluveriroll.com',
          password: 'wrong_password'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('harus gagal login dengan email yang tidak terdaftar dan mengembalikan status 401', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notfound@bluveriroll.com',
          password: 'mypassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('harus gagal login jika email atau password kosong dengan status 400', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@bluveriroll.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toMatch(/Email and password are required/i);
    });

    it('harus menolak login dengan password jika user terdaftar lewat Google (password null)', async () => {
      await User.create({
        username: 'GoogleUser',
        email: 'googleonly@bluveriroll.com',
        googleId: 'google_12345',
        password: null
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'googleonly@bluveriroll.com',
          password: 'somepassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toMatch(/registered using Google/i);
    });
  });

  describe('GET /api/auth/me', () => {
    let validToken;
    let createdUser;

    beforeEach(async () => {
      createdUser = await User.create({
        username: 'ProfileUser',
        email: 'profile@bluveriroll.com',
        password: 'password123',
        avatarUrl: 'https://example.com/profile.jpg'
      });

      validToken = signToken({
        id: createdUser.id,
        email: createdUser.email,
        username: createdUser.username
      });
    });

    it('harus berhasil mengambil profil pengguna dengan token yang valid (status 200)', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body.user).toHaveProperty('id', createdUser.id);
      expect(response.body.user).toHaveProperty('username', 'ProfileUser');
      expect(response.body.user).toHaveProperty('email', 'profile@bluveriroll.com');
      expect(response.body.user).toHaveProperty('avatarUrl', 'https://example.com/profile.jpg');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('harus menolak request tanpa token Authorization dengan status 401', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toBe('Please login first');
    });

    it('harus menolak request dengan format token tidak valid dengan status 401', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormatHeader');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toMatch(/Invalid authorization token format/i);
    });

    it('harus menolak request dengan JWT token palsu / corrupt dengan status 401', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toMatch(/Invalid or expired authentication token/i);
    });

    it('harus menolak request jika user pemilik token sudah tidak ada di database dengan status 401', async () => {
      const tokenWithDeletedUser = signToken({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'ghost@bluveriroll.com',
        username: 'ghost'
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenWithDeletedUser}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toMatch(/User not found or token invalid/i);
    });
  });

  describe('POST /api/auth/google-login', () => {
    it('harus menolak request tanpa token dengan status 400', async () => {
      const response = await request(app)
        .post('/api/auth/google-login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toMatch(/Google OAuth token is required/i);
    });

    it('harus mengembalikan status 200 jika token dikirimkan dan terverifikasi', async () => {
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: 'google-legacy-route-123',
          email: 'legacyroute@bluveriroll.com',
          email_verified: true,
          name: 'Legacy Route User',
          picture: 'https://example.com/legacy.jpg'
        })
      });

      const response = await request(app)
        .post('/api/auth/google-login')
        .send({ token: 'fake_google_oauth_token_123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body.message).toBe('Google login successful');
      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).not.toHaveProperty('password');
    });
  });

  describe('POST /api/auth/google', () => {
    it('harus berhasil login Google dan membuat user baru jika belum terdaftar (status 200)', async () => {
      const verifySpy = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: 'google-uid-new-001',
          email: 'newgoogleuser@bluveriroll.com',
          email_verified: true,
          name: 'New Google User',
          picture: 'https://lh3.googleusercontent.com/a/new-avatar.jpg'
        })
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid_google_id_token_001' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty('message', 'Google login successful');
      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toMatchObject({
        username: 'New Google User',
        email: 'newgoogleuser@bluveriroll.com',
        googleId: 'google-uid-new-001',
        avatarUrl: 'https://lh3.googleusercontent.com/a/new-avatar.jpg'
      });
      expect(response.body.user).not.toHaveProperty('password');

      // Pastikan verifyIdToken dipanggil dengan audience GOOGLE_CLIENT_ID
      expect(verifySpy).toHaveBeenCalledWith({
        idToken: 'valid_google_id_token_001',
        audience: process.env.GOOGLE_CLIENT_ID
      });

      // Pastikan JWT BLUVERIROLL valid
      const decoded = verifyToken(response.body.access_token);
      expect(decoded).toHaveProperty('id', response.body.user.id);
      expect(decoded).toHaveProperty('email', 'newgoogleuser@bluveriroll.com');

      // Pastikan user baru benar-benar tersimpan di database
      const savedUser = await User.findOne({ where: { googleId: 'google-uid-new-001' } });
      expect(savedUser).not.toBeNull();
      expect(savedUser.email).toBe('newgoogleuser@bluveriroll.com');
      expect(savedUser.password).toBeNull();
    });

    it('harus berhasil membuat user baru dengan fallback username dari email jika name dan picture tidak tersedia', async () => {
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: 'google-uid-noname-002',
          email: 'animefan99@bluveriroll.com',
          email_verified: true
        })
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid_google_credential_token' });

      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe('animefan99');
      expect(response.body.user.avatarUrl).toBeNull();
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('harus berhasil login untuk user lama yang sudah terdaftar dengan googleId yang sama tanpa membuat user duplikat', async () => {
      const existingGoogleUser = await User.create({
        username: 'ExistingGoogleUser',
        email: 'existing.google@bluveriroll.com',
        password: null,
        googleId: 'google-uid-existing-777',
        avatarUrl: 'https://lh3.googleusercontent.com/a/existing.jpg'
      });

      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: 'google-uid-existing-777',
          email: 'existing.google@bluveriroll.com',
          email_verified: true,
          name: 'ExistingGoogleUser',
          picture: 'https://lh3.googleusercontent.com/a/existing.jpg'
        })
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid_token_for_existing_user' });

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(existingGoogleUser.id);
      expect(response.body.user.googleId).toBe('google-uid-existing-777');
      expect(response.body.user).not.toHaveProperty('password');

      const totalUsers = await User.count({ where: { email: 'existing.google@bluveriroll.com' } });
      expect(totalUsers).toBe(1);
    });

    it('harus berhasil menautkan akun Google ke akun email yang sudah terdaftar sebelumnya (Account Linking)', async () => {
      const existingEmailUser = await User.create({
        username: 'EmailPassUser',
        email: 'linked@bluveriroll.com',
        password: 'MyPassword123!',
        googleId: null,
        avatarUrl: null
      });
      const originalPasswordHash = existingEmailUser.password;

      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: 'google-uid-to-link-888',
          email: 'linked@bluveriroll.com',
          email_verified: true,
          name: 'Email Pass User',
          picture: 'https://lh3.googleusercontent.com/a/linked-avatar.jpg'
        })
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid_token_for_linking' });

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(existingEmailUser.id);
      expect(response.body.user.googleId).toBe('google-uid-to-link-888');
      expect(response.body.user.avatarUrl).toBe('https://lh3.googleusercontent.com/a/linked-avatar.jpg');
      expect(response.body.user).not.toHaveProperty('password');

      // Pastikan di database googleId tertaut dan password hash lama tidak berubah
      const updatedUser = await User.findByPk(existingEmailUser.id);
      expect(updatedUser.googleId).toBe('google-uid-to-link-888');
      expect(updatedUser.password).toBe(originalPasswordHash);
    });

    it('harus mempertahankan avatarUrl lama saat menautkan akun email yang sudah memiliki avatarUrl', async () => {
      const existingUserWithAvatar = await User.create({
        username: 'CustomAvatarUser',
        email: 'customavatar@bluveriroll.com',
        password: 'MyPassword123!',
        googleId: null,
        avatarUrl: 'https://bluveriroll.com/custom-avatar.png'
      });

      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: 'google-uid-custom-avatar-999',
          email: 'customavatar@bluveriroll.com',
          email_verified: true,
          name: 'Custom Avatar User',
          picture: 'https://lh3.googleusercontent.com/a/google-avatar.jpg'
        })
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid_token_custom_avatar' });

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(existingUserWithAvatar.id);
      expect(response.body.user.googleId).toBe('google-uid-custom-avatar-999');
      expect(response.body.user.avatarUrl).toBe('https://bluveriroll.com/custom-avatar.png');
    });

    it('harus menolak login jika terjadi konflik googleId berbeda pada akun yang sudah terhubung (status 409)', async () => {
      await User.create({
        username: 'OriginalOwner',
        email: 'conflict@bluveriroll.com',
        password: 'Password123!',
        googleId: 'google-uid-original-111',
        avatarUrl: 'https://example.com/original.jpg'
      });

      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: 'google-uid-intruder-999',
          email: 'conflict@bluveriroll.com',
          email_verified: true,
          name: 'Intruder Google',
          picture: 'https://example.com/intruder.jpg'
        })
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'conflicting_google_token' });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('statusCode', 409);
      expect(response.body.message).toMatch(/already linked to a different Google ID/i);

      // Pastikan googleId asli di database tidak tertimpa
      const unchangedUser = await User.findOne({ where: { email: 'conflict@bluveriroll.com' } });
      expect(unchangedUser.googleId).toBe('google-uid-original-111');
    });

    it('harus menolak login jika Google ID Token tidak valid atau kedaluwarsa (status 401)', async () => {
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockRejectedValue(
        new Error('Wrong number of segments in token')
      );

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'invalid_or_corrupted_google_id_token' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toMatch(/Invalid or expired Google ID token/i);
    });

    it('harus menolak login jika email Google belum terverifikasi (status 401)', async () => {
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: 'google-uid-unverified-555',
          email: 'unverified@bluveriroll.com',
          email_verified: false,
          name: 'Unverified User'
        })
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'unverified_email_google_token' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body.message).toMatch(/Google email is not verified/i);
    });

    it('harus mengembalikan error status 500 jika GOOGLE_CLIENT_ID belum dikonfigurasi', async () => {
      delete process.env.GOOGLE_CLIENT_ID;

      const response = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'some_google_id_token' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('statusCode', 500);
      expect(response.body.message).toMatch(/GOOGLE_CLIENT_ID is not configured/i);
    });
  });
});

