'use strict';

const { hashPassword } = require('../helpers/bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const seedEmails = ['demo@bluveriroll.com', 'explorer@bluveriroll.com'];

    // Hapus data seed lama jika sudah pernah di-seed sebelumnya agar idempotent (tidak error duplicate key)
    await queryInterface.bulkDelete('Users', { email: seedEmails }, {});

    await queryInterface.bulkInsert('Users', [
      {
        id: '11111111-1111-4111-8111-111111111111',
        username: 'RaihanOtaku',
        email: 'demo@bluveriroll.com',
        password: hashPassword('password123'),
        googleId: null,
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=RaihanOtaku',
        createdAt: now,
        updatedAt: now
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        username: 'BluveriExplorer',
        email: 'explorer@bluveriroll.com',
        password: hashPassword('password123'),
        googleId: null,
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=BluveriExplorer',
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      email: ['demo@bluveriroll.com', 'explorer@bluveriroll.com']
    }, {});
  }
};
