// app.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const passportConfig = require('./config/passport'); // Import passport config
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Set up sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Initialize passport strategies.
passportConfig(passport);

// Use routes
app.use('/', authRoutes);
app.use('/', dataRoutes);

app.listen(port, () => console.log(`Server listening on port ${port}`));
