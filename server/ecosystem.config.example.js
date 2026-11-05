module.exports = {
  apps: [
    {
      name: 'bluveriroll-server',
      script: './bin/www.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 80,
        HOST: '0.0.0.0',
        CLIENT_URL: 'https://your-domain.pages.dev,http://localhost:5173',
        DATABASE_URL: 'postgresql://postgres.xxxx:your_password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
        JWT_SECRET: 'your_production_jwt_secret',
        JWT_EXPIRES_IN: '7d',
        OPENAI_API_KEY: 'sk-proj-your_openai_api_key',
        OPENAI_MODEL: 'gpt-4o-mini',
        GOOGLE_CLIENT_ID: 'your_google_client_id.apps.googleusercontent.com',
        JIKAN_API_BASE_URL: 'https://api.jikan.moe/v4'
      }
    }
  ]
};

