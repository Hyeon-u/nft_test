'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TradeHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  TradeHistory.init({
    no: {
      type: DataTypes.INTEGER,
      primaryKey:true
    },
    fromid: DataTypes.STRING,
    toid: DataTypes.STRING,
    contentsid: DataTypes.INTEGER,
    pricevalue: DataTypes.INTEGER,
    priceunit: DataTypes.STRING,
    transaction: DataTypes.STRING,
    state: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'TradeHistory',
  });
  return TradeHistory;
};