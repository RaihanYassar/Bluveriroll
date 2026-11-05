process.env.NODE_ENV = 'test';

const { sequelize, User } = require('../models');
const migration = require('../migrations/20261104000001-create-users');

describe('User Model Unit & Lifecycle Tests', () => {
  beforeAll(async () => {
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
  });

  afterAll(async () => {
    await migration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await sequelize.close();
  });

  afterEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  it('harus memvalidasi method toJSON agar tidak menyertakan password', async () => {
    const user = await User.create({
      username: 'jsonuser',
      email: 'json@bluveriroll.com',
      password: 'mypassword123'
    });

    const json = user.toJSON();
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('username', 'jsonuser');
    expect(json).toHaveProperty('email', 'json@bluveriroll.com');
    expect(json.password).toBeUndefined();
  });

  it('harus mengeksekusi hook beforeUpdate saat password diubah', async () => {
    const user = await User.create({
      username: 'updateuser',
      email: 'update@bluveriroll.com',
      password: 'initialpassword'
    });

    const oldHashedPassword = user.password;
    user.password = 'newpassword123';
    await user.save();

    expect(user.password).not.toBe('newpassword123');
    expect(user.password).not.toBe(oldHashedPassword);
    expect(user.password.startsWith('$2')).toBe(true);
  });

  it('tidak mengubah hash password pada hook beforeUpdate jika password tidak diubah', async () => {
    const user = await User.create({
      username: 'updateuser2',
      email: 'update2@bluveriroll.com',
      password: 'mysecurepassword'
    });

    const originalHash = user.password;
    user.username = 'newusername';
    await user.save();

    expect(user.password).toBe(originalHash);
  });

  it('tidak error saat beforeCreate dijalankan pada user tanpa password (Google user)', async () => {
    const user = await User.create({
      username: 'googler',
      email: 'googler@gmail.com',
      googleId: 'g_998877',
      password: null
    });

    expect(user.id).toBeDefined();
    expect(user.password).toBeNull();
  });

  it('harus menolak pembuatan user jika username kosong atau null', async () => {
    await expect(
      User.create({
        username: '',
        email: 'nousername@mail.com',
        password: 'password123'
      })
    ).rejects.toThrow();

    await expect(
      User.create({
        username: null,
        email: 'nullusername@mail.com',
        password: 'password123'
      })
    ).rejects.toThrow();
  });

  it('harus menolak pembuatan user jika email kosong atau null', async () => {
    await expect(
      User.create({
        username: 'someuser',
        email: '',
        password: 'password123'
      })
    ).rejects.toThrow();

    await expect(
      User.create({
        username: 'someuser2',
        email: null,
        password: 'password123'
      })
    ).rejects.toThrow();
  });

  it('harus memvalidasi method User.associate tanpa error', () => {
    expect(() => {
      User.associate({});
    }).not.toThrow();
  });
});

