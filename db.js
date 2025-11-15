const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

// Singleton database connections
const userDbFile = process.env.USER_DB_FILE || 'users.db';
const dataDbFile = process.env.DATA_DB_FILE || 'data.db';

// User database connection
const userDb = new sqlite3.Database(userDbFile, (err) => {
    if (err) {
        console.error('Error opening user database:', err);
    } else {
        console.log('Connected to user database');
        userDb.run(
            'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)'
        );
    }
});

// Data database connection
const dataDb = new sqlite3.Database(dataDbFile, (err) => {
    if (err) {
        console.error('Error opening data database:', err);
    } else {
        console.log('Connected to data database');
        dataDb.run(
            'CREATE TABLE IF NOT EXISTS store (id INTEGER PRIMARY KEY, data TEXT)'
        );
    }
});

// Export both databases
module.exports = {
    userDb,
    dataDb,
    // Legacy export for backward compatibility
    default: userDb
};
