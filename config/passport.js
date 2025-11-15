// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { userDb } = require('../db'); // Use shared database connection

module.exports = function (passport) {
    passport.use(
        new LocalStrategy(async function (username, password, done) {
            // Use shared database connection - no need to create/close
            userDb.get(
                'SELECT id, password FROM users WHERE username = ?',
                [username],
                async (err, row) => {
                    if (err) {
                        console.error('Database error during login:', err);
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
                        console.error('Bcrypt error:', bcryptErr);
                        return done(bcryptErr);
                    }
                }
            );
        })
    );

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        // Use shared database connection - no need to create/close
        userDb.get(
            'SELECT id, username FROM users WHERE id = ?',
            [id],
            (err, row) => {
                if (err) {
                    console.error('Database error during deserialization:', err);
                    return done(err);
                }
                if (!row) {
                    return done(new Error('User not found'));
                }
                return done(null, row);
            }
        );
    });
};
