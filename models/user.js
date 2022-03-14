'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  User.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true, //
      primaryKey:true
    },
    userid: DataTypes.STRING,
    password: DataTypes.STRING,
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    role: DataTypes.INTEGER,
    wallet_address: DataTypes.STRING,
    wallet_privatekey: DataTypes.STRING,
    token: DataTypes.STRING,
    token_exp: DataTypes.INTEGER,
    eth_balance: DataTypes.STRING
  }, {
    timestamps: true,
    sequelize,
    modelName: 'User',
  });
  return User;
};