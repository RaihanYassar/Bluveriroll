process.env.NODE_ENV = 'test';

const ProfileController = require('../controllers/profileController');
const { sequelize, User, Watchlist } = require('../models');
const userMigration = require('../migrations/20261104000001-create-users');
const watchlistMigration = require('../migrations/20261104000002-create-watchlists');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('ProfileController Analytics Tests', () => {
  let user;

  beforeAll(async () => {
    await userMigration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    await watchlistMigration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    user = await User.create({
      username: 'ProfileUser',
      email: 'profile@bluveriroll.com',
      password: 'password123'
    });
  });

  afterAll(async () => {
    await watchlistMigration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await userMigration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
    await sequelize.close();
  });

  it('harus mengembalikan hasEnoughData=false jika watchlist kurang dari 5 item', async () => {
    const res = createMockRes();
    await ProfileController.getAnimeDNA({ user: { id: user.id } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].dna.hasEnoughData).toBe(false);
  });

  it('harus menghitung Anime DNA dan Watch Journey jika watchlist memiliki >= 5 item', async () => {
    for (let i = 1; i <= 5; i++) {
      await Watchlist.create({
        userId: user.id,
        animeId: i,
        title: `Movie ${i}`,
        status: 'Completed',
        score: 9,
        currentEpisode: 1,
        totalEpisodes: 1,
        genres: 'Action, Sci-Fi'
      });
    }

    const dnaRes = createMockRes();
    await ProfileController.getAnimeDNA({ user: { id: user.id } }, dnaRes, jest.fn());
    const dna = dnaRes.json.mock.calls[0][0].dna;
    expect(dna.hasEnoughData).toBe(true);
    expect(dna.totalLogged).toBe(5);
    expect(dna.averageRating).toBe(9);
    expect(dna.favoriteGenres).toContain('Action');

    const journeyRes = createMockRes();
    await ProfileController.getWatchJourney({ user: { id: user.id } }, journeyRes, jest.fn());
    expect(journeyRes.json.mock.calls[0][0].history).toHaveLength(5);

    const tarotRes = createMockRes();
    await ProfileController.getTarotReading(
      { user: { id: user.id }, body: {} },
      tarotRes,
      jest.fn()
    );
    expect(tarotRes.status).toHaveBeenCalledWith(200);
    expect(tarotRes.json.mock.calls[0][0].tarot.cards).toHaveLength(3);

    const roastRes = createMockRes();
    await ProfileController.roastWatchlist(
      { user: { id: user.id }, body: { mode: 'roast' } },
      roastRes,
      jest.fn()
    );
    expect(roastRes.status).toHaveBeenCalledWith(200);
  });
});

