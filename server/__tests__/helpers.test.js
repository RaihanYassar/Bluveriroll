const { hashPassword, comparePassword } = require('../helpers/bcrypt');
const { signToken, verifyToken } = require('../helpers/jwt');

describe('Helper Functions Unit Tests', () => {
  describe('bcrypt.js', () => {
    it('harus menghasilkan hash yang valid dan mengembalikan true saat password cocok', () => {
      const rawPassword = 'MySecretPassword123!';
      const hash = hashPassword(rawPassword);

      expect(hash).not.toBe(rawPassword);
      expect(hash.startsWith('$2')).toBe(true);

      const isMatch = comparePassword(rawPassword, hash);
      expect(isMatch).toBe(true);
    });

    it('harus mengembalikan false saat password tidak cocok', () => {
      const hash = hashPassword('correctPassword');
      const isMatch = comparePassword('wrongPassword', hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('jwt.js', () => {
    it('harus menandatangani token JWT dan berhasil memverifikasinya', () => {
      const payload = { id: 'uuid-123', email: 'test@mail.com', username: 'tester' };
      const token = signToken(payload);

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const decoded = verifyToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.username).toBe(payload.username);
    });

    it('harus mendukung custom options pada signToken', () => {
      const payload = { id: 'custom-123' };
      const token = signToken(payload, { expiresIn: '1h' });
      const decoded = verifyToken(token);
      expect(decoded.id).toBe('custom-123');
    });

    it('harus melempar error saat memverifikasi token yang rusak atau tidak valid', () => {
      expect(() => {
        verifyToken('invalid.token.signature');
      }).toThrow();
    });
  });
});

