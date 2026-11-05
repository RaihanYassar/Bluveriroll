process.env.NODE_ENV = 'test';

const { sequelize, User, Watchlist } = require('../models');
const userMigration = require('../migrations/20261104000001-create-users');
const watchlistMigration = require('../migrations/20261104000002-create-watchlists');

describe('User & Watchlist Model Unit Tests', () => {
  beforeAll(async () => {
    await userMigration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    await watchlistMigration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
  });

  afterAll(async () => {
    await watchlistMigration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await userMigration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await sequelize.close();
  });

  afterEach(async () => {
    await Watchlist.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  it('harus memvalidasi method toJSON agar tidak menyertakan password', async () => {
    const user = await User.create({
      username: 'jsonuser',
      email: 'json@bluveriroll.com',
      password: 'mypassword123'
    });

    const json = user.toJSON();
    expect(json.username).toBe('jsonuser');
    expect(json.password).toBeUndefined();
  });

  it('harus meng-hash ulang password saat beforeUpdate dijalankan', async () => {
    const user = await User.create({
      username: 'updateuser',
      email: 'update@bluveriroll.com',
      password: 'initialpassword'
    });

    const oldHash = user.password;
    user.password = 'newpassword123';
    await user.save();
    expect(user.password).not.toBe(oldHash);

    const sameHash = user.password;
    user.username = 'renamed';
    await user.save();
    expect(user.password).toBe(sameHash);
  });

  it('mendukung user Google OAuth tanpa password', async () => {
    const user = await User.create({
      username: 'googler',
      email: 'googler@gmail.com',
      googleId: 'g_998877',
      password: null
    });
    expect(user.password).toBeNull();
  });

  it('mendukung relasi User dan Watchlist serta method associate', async () => {
    expect(() => User.associate({})).not.toThrow();
    expect(() => Watchlist.associate({})).not.toThrow();

    const user = await User.create({
      username: 'watcher',
      email: 'watcher@bluveriroll.com',
      password: 'password123'
    });

    const item = await Watchlist.create({
      userId: user.id,
      animeId: 52991,
      title: 'Sousou no Frieren',
      status: 'Completed',
      score: 9.5
    });

    expect(item.userId).toBe(user.id);
  });
});

