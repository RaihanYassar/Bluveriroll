const errorHandler = require('../middlewares/errorHandler');

describe('Error Handler Middleware Unit Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    next = jest.fn();
  });

  it('harus menangani SequelizeValidationError dengan status 400', () => {
    const err = {
      name: 'SequelizeValidationError',
      errors: [{ message: 'Validation failed on email' }, { message: 'Username cannot be empty' }]
    };

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Validation failed on email, Username cannot be empty');
  });

  it('harus menangani SequelizeUniqueConstraintError dengan status 400', () => {
    const err = {
      name: 'SequelizeUniqueConstraintError',
      errors: [{ message: 'Email must be unique' }]
    };

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email must be unique');
  });

  it('harus menangani JsonWebTokenError dengan status 401', () => {
    const err = { name: 'JsonWebTokenError' };

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid or expired authentication token');
  });

  it('harus menangani TokenExpiredError dengan status 401', () => {
    const err = { name: 'TokenExpiredError' };

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid or expired authentication token');
  });

  it('harus menangani BadRequest dengan status 400', () => {
    const err = { name: 'BadRequest', message: 'Custom bad request' };

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Custom bad request');
  });

  it('harus menangani Unauthorized dengan status 401', () => {
    const err = { name: 'Unauthorized', message: 'Custom unauthorized' };

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Custom unauthorized');
  });

  it('harus menangani Forbidden dengan status 403', () => {
    const err = { name: 'Forbidden', message: 'You do not have access' };

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You do not have access');
  });

  it('harus menangani NotFound dengan status 404', () => {
    const err = { name: 'NotFound', message: 'Resource not found' };

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Resource not found');
  });

  it('harus menangani custom status code pada error object', () => {
    const err = { status: 422, message: 'Unprocessable entity' };

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(422);
    expect(res.body.message).toBe('Unprocessable entity');
  });

  it('harus menangani unhandled error umum dengan status 500', () => {
    const err = new Error('Unexpected database failure');

    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
  });
});

