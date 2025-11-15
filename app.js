// app.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const { ensureAuthenticatedRedirect } = require('./middleware/auth');
const passportConfig = require('./config/passport'); // Import passport config
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// CORS configuration - restrict to specific origins
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true  // Allow cookies for session authentication
}));

// Set up sessions with security options
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,  // Prevent XSS attacks
            secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
            sameSite: 'lax',  // CSRF protection (more compatible than 'strict')
            maxAge: 24 * 60 * 60 * 1000  // 24 hours
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Initialize passport strategies.
passportConfig(passport);

// Use routes
app.use('/', authRoutes);
app.use('/', dataRoutes);

// Serve index.html at root path (requires authentication)
app.get('/', ensureAuthenticatedRedirect, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
