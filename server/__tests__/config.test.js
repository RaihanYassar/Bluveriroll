process.env.NODE_ENV = 'test';

/**
 * Unit test untuk config/database.js
 * Menguji semua branch konfigurasi database termasuk:
 * - Konfigurasi development, test, dan production
 * - Branch DATABASE_URL (use_env_variable)
 * - Branch SSL (NODE_ENV=production / DATABASE_URL set)
 * - Branch DATABASE_TEST_URL untuk test environment
 */

describe('Database Configuration Unit Tests', () => {
  afterEach(() => {
    // Bersihkan module cache agar setiap test mendapat fresh config
    jest.resetModules();
    // Hapus env vars yang mungkin di-set oleh test
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_TEST_URL;
  });

  it('harus memuat konfigurasi development, test, dan production', () => {
    const config = require('../config/database');

    expect(config).toHaveProperty('development');
    expect(config.development.dialect).toBe('postgres');

    expect(config).toHaveProperty('test');
    expect(config.test.dialect).toBeDefined();

    expect(config).toHaveProperty('production');
    expect(config.production.dialect).toBe('postgres');
    expect(config.production.use_env_variable).toBe('DATABASE_URL');
  });

  it('harus menggunakan use_env_variable=DATABASE_URL pada development jika DATABASE_URL dikonfigurasi', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/bluveriroll_dev';
    jest.resetModules();

    const config = require('../config/database');

    // Branch: use_env_variable harus di-set jika DATABASE_URL ada
    expect(config.development.use_env_variable).toBe('DATABASE_URL');
  });

  it('harus menggunakan undefined sebagai use_env_variable pada development jika DATABASE_URL tidak ada', () => {
    // Pastikan DATABASE_URL tidak ada
    delete process.env.DATABASE_URL;
    jest.resetModules();

    const config = require('../config/database');

    // Branch: use_env_variable harus undefined jika DATABASE_URL tidak ada
    expect(config.development.use_env_variable).toBeUndefined();
  });

  it('harus menyertakan SSL dialectOptions pada baseConfig jika DATABASE_URL dikonfigurasi', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@db.supabase.co:5432/bluveriroll';
    jest.resetModules();

    const config = require('../config/database');

    // Branch: (NODE_ENV === 'production' || DATABASE_URL) → ssl harus ada
    expect(config.development.dialectOptions).toHaveProperty('ssl');
    expect(config.development.dialectOptions.ssl.require).toBe(true);
    expect(config.development.dialectOptions.ssl.rejectUnauthorized).toBe(false);
  });

  it('harus menggunakan dialectOptions kosong pada development jika DATABASE_URL tidak ada dan bukan production', () => {
    delete process.env.DATABASE_URL;
    // NODE_ENV sudah 'test' bukan 'production'
    jest.resetModules();

    const config = require('../config/database');

    // Branch: bukan production dan tidak ada DATABASE_URL → dialectOptions kosong
    expect(config.development.dialectOptions).toEqual({});
  });

  it('harus menggunakan use_env_variable=DATABASE_TEST_URL pada test jika DATABASE_TEST_URL dikonfigurasi', () => {
    process.env.DATABASE_TEST_URL = 'postgresql://user:pass@localhost:5432/bluveriroll_test';
    jest.resetModules();

    const config = require('../config/database');

    // Branch: DATABASE_TEST_URL ada → pakai use_env_variable
    expect(config.test.use_env_variable).toBe('DATABASE_TEST_URL');
    expect(config.test.dialect).toBe('postgres');
  });

  it('harus menggunakan SQLite in-memory pada test jika DATABASE_TEST_URL tidak dikonfigurasi', () => {
    delete process.env.DATABASE_TEST_URL;
    jest.resetModules();

    const config = require('../config/database');

    // Branch: DATABASE_TEST_URL tidak ada → SQLite in-memory
    expect(config.test.dialect).toBe('sqlite');
    expect(config.test.storage).toBe(':memory:');
  });

  it('harus memastikan konfigurasi production selalu menyertakan SSL', () => {
    jest.resetModules();

    const config = require('../config/database');

    expect(config.production.dialectOptions).toHaveProperty('ssl');
    expect(config.production.dialectOptions.ssl.require).toBe(true);
    expect(config.production.dialectOptions.ssl.rejectUnauthorized).toBe(false);
    expect(config.production.logging).toBe(false);
  });
});
