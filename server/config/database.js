require('dotenv').config();

const baseConfig = {
  dialect: 'postgres',
  dialectOptions: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
};

module.exports = {
  development: {
    use_env_variable: process.env.DATABASE_URL ? 'DATABASE_URL' : undefined,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'bluveriroll_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
    ...baseConfig
  },
  test: process.env.DATABASE_TEST_URL ? {
    use_env_variable: 'DATABASE_TEST_URL',
    dialect: 'postgres',
    logging: false
  } : {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

