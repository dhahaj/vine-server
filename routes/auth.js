// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/login', (req, res) => {
    console.log('Login page requested');
    res.send(`<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Login</title>
                    <style>
                        body {
                            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                            background: #121212;
                            color: #e0e0e0;
                            margin: 20px;
                            /* margin: 0; */
                            padding: 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                        }

                        h2 {
                            text-align: center;
                            color: #f0f0f0;
                            margin-bottom: 20px;
                        }

                        form {
                            /* background-color: #fff; */
                            padding: 20px;
                            border-radius: 5px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }

                        div {
                            margin-bottom: 15px;
                        }

                        label {
                            display: block;
                            margin-bottom: 5px;
                        }

                        input[type="text"],
                        input[type="password"] {
                            width: 100%;
                            /* padding: 8px; */
                            box-sizing: border-box;
                            padding: 8px 12px;
                            border: 1px solid #333;
                            border-radius: 4px;
                            font-size: 1em;
                            margin: 5px;
                            background: #1e1e1e;
                            color: #e0e0e0;
                        }

                        button {
                            width: 100%;
                            /* padding: 10px; */
                            background-color: #4CAF50;
                            /* color: white; */
                            /* border-radius: 5px; */
                            padding: 8px 16px;
                            border: none;
                            border-radius: 4px;
                            background: #3a3a3a;
                            color: #e0e0e0;
                            font-size: 1em;
                            cursor: pointer;
                            margin: 5px;
                            transition: background 0.3s ease;
                        }

                        button:hover {
                            background-color: #45a049;
                            background: #555;
                        }
                    </style>
                </head>
                <body>
                    <form method="post" action="/login">
                    <h1>Login</h1>
                        <div>
                            <label>Username:</label>
                            <input type="text" name="username" />
                        </div>
                        <div>
                            <label>Password:</label>
                            <input type="password" name="password" />
                        </div>
                        <div>
                            <button type="submit">Login</button>
                        </div>
                    </form>
                </body>
                </html>`);
});

router.post(
    '/login',
    express.urlencoded({ extended: false }),
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
    })
);

router.get('/logout', (req, res) => {
    console.log('Logout requested');
    req.logout(function (err) {
        // Use the logout function with a callback
        console.log('User logged out');
        if (err) {
            console.error('Error logging out:', err);
            return next(err);
        }
        res.redirect('/login');
    });
});

module.exports = router;
