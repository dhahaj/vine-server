const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Set up sessions so we can keep the user logged in
app.use(
    session({
        secret: 'YourSuperSecretKey', // use a strong secret in production!
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Define a local strategy. In a real application, verify credentials from a DB.
passport.use(
    new LocalStrategy(function (username, password, done) {
        // For example, only allow username "admin" with password "password123"
        if (username === 'admin' && password === 'jnco5626') {
            return done(null, { id: 1, username: 'admin' });
        } else {
            return done(null, false, { message: 'Incorrect credentials.' });
        }
    })
);

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    // In a real application, fetch the user from the database
    if (id === 1) {
        done(null, { id: 1, username: 'admin' });
    } else {
        done(new Error('User not found'));
    }
});

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    // res.status(401).json({ message: 'Not authenticated' });
    res.redirect('/login');
}

// --- Authentication Routes ---
// Display a simple login form.
app.get('/login', (req, res) => {
    res.send(`
<!DOCTYPE html>
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
</html>
  `);
});

// Process login submissions.
app.post(
    '/login',
    express.urlencoded({ extended: false }),
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
    })
);

// Logout route.
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/login');
    });
});

// --- Data Endpoints (Secured) ---

// Open (or create) the SQLite database
const db = new sqlite3.Database('data.db', (err) => {
    if (err) console.error('Error opening data.db', err);
    else console.log('Connected to data.db');
});

// Create table if needed
db.run('CREATE TABLE IF NOT EXISTS store (id INTEGER PRIMARY KEY, data TEXT)');

// GET endpoint (secured)
app.get('/data', ensureAuthenticated, (req, res) => {
    console.log('GET request received');
    db.get('SELECT data FROM store WHERE id = 1', (err, row) => {
        if (err) return res.status(500).send(err);
        const data = row ? JSON.parse(row.data) : [];
        res.json(data);
    });
});

// POST endpoint (secured)
app.post('/data', ensureAuthenticated, (req, res) => {
    const newData = req.body;
    const jsonData = JSON.stringify(newData, null, 2);
    db.get('SELECT id FROM store WHERE id = 1', (err, row) => {
        if (err) return res.status(500).send(err);
        if (row) {
            db.run(
                'UPDATE store SET data = ? WHERE id = 1',
                jsonData,
                function (err) {
                    if (err) return res.status(500).send(err);
                    res.json({ message: 'Data saved successfully' });
                }
            );
        } else {
            db.run(
                'INSERT INTO store (id, data) VALUES (1, ?)',
                jsonData,
                function (err) {
                    if (err) return res.status(500).send(err);
                    res.json({ message: 'Data saved successfully' });
                }
            );
        }
    });
});

// Serve the main page if authenticated; otherwise, redirect to login.
// app.get('/', ensureAuthenticated, (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'), (err) => {
//         if (err) {
//             res.status(500).send('Error loading index.html');
//         }
//     });
// });

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    // For API endpoints, return a 401 JSON error.
    res.status(401).json({ message: 'Not authenticated' });
}


app.listen(port, () => console.log(`Server listening on port ${port}`));
