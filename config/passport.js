// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

module.exports = function (passport) {
    passport.use(
        new LocalStrategy(async function (username, password, done) {
            const userdbFile = process.env.USER_DB_FILE || 'users.db';
            const db = new sqlite3.Database(userdbFile);

            db.get(
                'SELECT id, password FROM users WHERE username = ?',
                [username],
                async (err, row) => {
                    if (err) {
                        return done(err);
                    }
                    if (!row) {
                        return done(null, false, {
                            message: 'Incorrect username.',
                        });
                    }

                    try {
                        const passwordMatch = await bcrypt.compare(
                            password,
                            row.password
                        );
                        if (passwordMatch) {
                            return done(null, {
                                id: row.id,
                                username: username,
                            });
                        } else {
                            return done(null, false, {
                                message: 'Incorrect password.',
                            });
                        }
                    } catch (bcryptErr) {
                        return done(bcryptErr);
                    } finally {
                        db.close();
                    }
                }
            );
        })
    );

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        const db = new sqlite3.Database('users.db');
        db.get(
            'SELECT id, username FROM users WHERE id = ?',
            [id],
            (err, row) => {
                if (err) {
                    return done(err);
                }
                if (!row) {
                    return done(new Error('User not found'));
                }
                db.close();
                return done(null, row);
            }
        );
    });
};
