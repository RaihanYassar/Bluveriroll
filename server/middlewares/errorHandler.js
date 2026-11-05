// Centralized Error Handler for BLUVERIROLL API
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join(', ');
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token';
  } else if (err.name === 'BadRequest' || err.status === 400) {
    statusCode = 400;
    message = err.message || 'Bad Request';
  } else if (err.name === 'Unauthorized' || err.status === 401) {
    statusCode = 401;
    message = err.message || 'Unauthorized access';
  } else if (err.name === 'Forbidden' || err.status === 403) {
    statusCode = 403;
    message = err.message || 'Forbidden';
  } else if (err.name === 'NotFound' || err.status === 404) {
    statusCode = 404;
    message = err.message || 'Data not found';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message;
  }

  // Log unexpected errors in development
  if (statusCode === 500 && process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Server Error:', err);
  }

  res.status(statusCode).json({
    statusCode,
    message
  });
};

module.exports = errorHandler;

