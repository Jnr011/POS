
const { Sequelize } = require('sequelize');

// Use in-memory SQLite database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
});

module.exports = sequelize;
