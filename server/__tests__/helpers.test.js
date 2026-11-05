process.env.NODE_ENV = 'test';

const { hashPassword, comparePassword } = require('../helpers/bcrypt');
const { signToken, verifyToken } = require('../helpers/jwt');

describe('Security Helpers Unit Tests', () => {
  describe('Bcrypt Helper', () => {
    it('harus melakukan hash password dan memverifikasi password yang benar', () => {
      const raw = 'rahasia123';
      const hashed = hashPassword(raw);
      expect(hashed).not.toBe(raw);
      expect(comparePassword(raw, hashed)).toBe(true);
      expect(comparePassword('salah', hashed)).toBe(false);
    });
  });

  describe('JWT Helper', () => {
    it('harus membuat dan memverifikasi token JWT dengan benar', () => {
      const payload = { id: 'uuid-123', email: 'test@bluveriroll.com' };
      const token = signToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
    });
  });
});

