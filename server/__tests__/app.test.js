process.env.NODE_ENV = 'test';

const app = require('../app');
const apiRouter = require('../routes');

describe('Express App & Router Structure Tests', () => {
  it('harus mengekspor instance Express app dan router dengan benar', () => {
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
    expect(apiRouter).toBeDefined();
  });

  it('harus menangani request ke root /, /api/health, dan 404 handler', () => {
    const createRes = () => {
      const headers = {};
      const res = {
        statusCode: 200,
        setHeader: jest.fn((k, v) => { headers[k.toLowerCase()] = v; }),
        getHeader: jest.fn((k) => headers[k.toLowerCase()]),
        end: jest.fn()
      };
      res.status = jest.fn((code) => {
        res.statusCode = code;
        return res;
      });
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    const res404 = createRes();
    app.handle(
      { method: 'GET', url: '/unknown-route', originalUrl: '/unknown-route', headers: {} },
      res404,
      jest.fn()
    );
    expect(res404.status).toHaveBeenCalledWith(404);

    const resRoot = createRes();
    app.handle(
      { method: 'GET', url: '/', originalUrl: '/', headers: {} },
      resRoot,
      jest.fn()
    );
    expect(resRoot.status).toHaveBeenCalledWith(200);

    const resHealth = createRes();
    app.handle(
      { method: 'GET', url: '/api/health', originalUrl: '/api/health', headers: {} },
      resHealth,
      jest.fn()
    );
    expect(resHealth.status).toHaveBeenCalledWith(200);
  });
});
