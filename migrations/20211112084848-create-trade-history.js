'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TradeHistories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      no: {
        type: Sequelize.INTEGER
      },
      fromid: {
        type: Sequelize.STRING
      },
      toid: {
        type: Sequelize.STRING
      },
      contentsid: {
        type: Sequelize.INTEGER
      },
      pricevalue: {
        type: Sequelize.INTEGER
      },
      priceunit: {
        type: Sequelize.STRING
      },
      transaction: {
        type: Sequelize.STRING
      },
      state: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TradeHistories');
  }
};