const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(process.env.DATABASE_URL, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to the database');
        db.run(
            'CREATE TABLE IF NOT EXISTS store (id INTEGER PRIMARY KEY, data TEXT)'
        ); // create tables
        db.run(
            'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)'
        ); //create table for users
    }
});

module.exports = db;
