const { Sequelize } = require("sequelize");

// const db = new Sequelize(process.env.DB_CONNECTION_STRING);
const db = new Sequelize(
  "postgresql://postgres:postgresPassword@localhost/eleven-journal"
);

module.exports = db;
