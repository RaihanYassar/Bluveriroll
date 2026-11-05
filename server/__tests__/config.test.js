process.env.NODE_ENV = 'test';
jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('Database Configuration Unit Tests', () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_TEST_URL;
  });

  it('harus memuat konfigurasi development, test, dan production', () => {
    const config = require('../config/database');
    expect(config).toHaveProperty('development');
    expect(config.development.dialect).toBe('postgres');
    expect(config).toHaveProperty('test');
    expect(config).toHaveProperty('production');
    expect(config.production.use_env_variable).toBe('DATABASE_URL');
  });

  it('harus menggunakan use_env_variable=DATABASE_URL pada development jika DATABASE_URL dikonfigurasi', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/bluveriroll_dev';
    jest.resetModules();
    const config = require('../config/database');
    expect(config.development.use_env_variable).toBe('DATABASE_URL');
    expect(config.development.dialectOptions).toHaveProperty('ssl');
  });

  it('harus menggunakan dialectOptions kosong pada development jika DATABASE_URL tidak ada', () => {
    delete process.env.DATABASE_URL;
    jest.resetModules();
    const config = require('../config/database');
    expect(config.development.use_env_variable).toBeUndefined();
    expect(config.development.dialectOptions).toEqual({});
  });

  it('harus menggunakan DATABASE_TEST_URL pada test jika dikonfigurasi', () => {
    process.env.DATABASE_TEST_URL = 'postgresql://user:pass@localhost:5432/bluveriroll_test';
    jest.resetModules();
    const config = require('../config/database');
    expect(config.test.use_env_variable).toBe('DATABASE_TEST_URL');
    expect(config.test.dialect).toBe('postgres');
  });
});

