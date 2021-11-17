'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Contents extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Contents.init({
    no: {
      type:DataTypes.INTEGER,
      primaryKey:true
    },
    ownerid: DataTypes.STRING,
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    nftid: {
      type:DataTypes.STRING,
      unique:true
    },
    jsonlocation: DataTypes.STRING,
    filelocation: DataTypes.STRING,
    status: DataTypes.STRING,
    mint_tx: DataTypes.STRING,
    buyable: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Contents',
  });
  return Contents;
};