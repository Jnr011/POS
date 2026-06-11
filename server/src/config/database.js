
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Use file-based SQLite database for persistence
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(dbDir, 'pos.db'),
    logging: false
});

module.exports = sequelize;
module.exports.sequelize = sequelize;
