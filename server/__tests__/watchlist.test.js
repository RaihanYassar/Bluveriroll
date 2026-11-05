process.env.NODE_ENV = 'test';

const WatchlistController = require('../controllers/watchlistController');
const { sequelize, User } = require('../models');
const userMigration = require('../migrations/20261104000001-create-users');
const watchlistMigration = require('../migrations/20261104000002-create-watchlists');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('WatchlistController CRUD Tests', () => {
  let user;

  beforeAll(async () => {
    await userMigration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    await watchlistMigration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    user = await User.create({
      username: 'WatchlistUser',
      email: 'watchlist@bluveriroll.com',
      password: 'password123'
    });
  });

  afterAll(async () => {
    await watchlistMigration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await userMigration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await sequelize.close();
  });

  it('harus menjalankan Full CRUD Watchlist (Create, Upsert, Read, Update, Delete)', async () => {
    // 1. Create
    const createRes = createMockRes();
    await WatchlistController.addToWatchlist(
      {
        user: { id: user.id },
        body: {
          animeId: 32281,
          title: 'Kimi no Na wa. (Your Name)',
          imageUrl: 'https://example.com/yourname.jpg',
          status: 'Watching',
          score: 9.5,
          currentEpisode: 1,
          totalEpisodes: 1,
          genres: ['Drama', 'Romance'],
          notes: 'Visual makoto shinkai keren banget'
        }
      },
      createRes,
      jest.fn()
    );
    expect(createRes.status).toHaveBeenCalledWith(201);
    const createdItem = createRes.json.mock.calls[0][0].data;
    expect(createdItem.title).toBe('Kimi no Na wa. (Your Name)');

    // 1b. Upsert (menambahkan animeId yang sama memperbarui item tanpa duplikat)
    const upsertRes = createMockRes();
    await WatchlistController.addToWatchlist(
      {
        user: { id: user.id },
        body: {
          animeId: 32281,
          title: 'Kimi no Na wa. (Your Name)',
          status: 'Completed',
          score: 10
        }
      },
      upsertRes,
      jest.fn()
    );
    expect(upsertRes.status).toHaveBeenCalledWith(201);

    // 2. Read
    const getRes = createMockRes();
    await WatchlistController.getWatchlist({ user: { id: user.id } }, getRes, jest.fn());
    expect(getRes.status).toHaveBeenCalledWith(200);
    expect(getRes.json.mock.calls[0][0].data).toHaveLength(1);

    // 3. Update
    const updateRes = createMockRes();
    await WatchlistController.updateWatchlist(
      {
        watchlistItem: createdItem,
        body: { status: 'Completed', score: 10, currentEpisode: 1, notes: 'Masterpiece 10/10' }
      },
      updateRes,
      jest.fn()
    );
    expect(updateRes.status).toHaveBeenCalledWith(200);
    expect(createdItem.status).toBe('Completed');
    expect(createdItem.score).toBe(10);

    // 4. Delete
    const deleteRes = createMockRes();
    await WatchlistController.removeFromWatchlist(
      { watchlistItem: createdItem },
      deleteRes,
      jest.fn()
    );
    expect(deleteRes.status).toHaveBeenCalledWith(200);
  });

  it('harus menolak addToWatchlist dengan 400 jika animeId atau title tidak diisi', async () => {
    const next = jest.fn();
    await WatchlistController.addToWatchlist(
      { user: { id: user.id }, body: { status: 'Plan to Watch' } },
      createMockRes(),
      next
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });
});
