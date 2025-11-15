# CLAUDE.md - AI Assistant Guide for vine-server

## Project Overview

**vine-server** is a Node.js web application that provides authenticated spreadsheet data management capabilities. It combines a backend API server with a frontend spreadsheet parser interface for managing structured data (primarily Amazon Vine order data).

### Key Characteristics
- **Type**: Full-stack web application
- **Backend**: Node.js + Express + SQLite
- **Frontend**: Vanilla JavaScript with XLSX library
- **Authentication**: Passport.js with Local Strategy (bcrypt password hashing)
- **Data Storage**: SQLite databases (users.db for auth, data.db for application data)
- **Architecture**: Modular MVC-like structure with separated routes, middleware, and config

---

## Repository Structure

```
vine-server/
├── app.js                     # Main application entry point (PREFERRED)
├── server.js                  # Legacy server implementation (hardcoded credentials)
├── db.js                      # Database initialization module
├── userdb.js                  # CLI user management utility
├── index.html                 # Frontend spreadsheet parser UI
├── users.db                   # SQLite user database
├── .env                       # Environment configuration
├── package.json               # NPM dependencies (INCOMPLETE - see issues)
├── config/
│   └── passport.js            # Passport authentication strategy
├── middleware/
│   └── auth.js                # Authentication guard middleware
└── routes/
    ├── auth.js                # Login/logout endpoints
    └── data.js                # Data management endpoints
```

### Entry Points
- **Production**: `app.js` (modular, properly structured)
- **Legacy**: `server.js` (contains hardcoded admin credentials, avoid)
- **User Management**: `userdb.js` (CLI tool)

---

## Critical Issues to Know

### 1. Missing Dependencies
**URGENT**: The following dependencies are used in code but NOT in package.json:

```json
{
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "sqlite3": "^5.1.0",
  "express-session": "^1.17.0",
  "passport": "^0.6.0",
  "passport-local": "^1.0.0"
}
```

**Action Required**: Before making changes, verify these are installed or add them to package.json.

### 2. Dual Database References
- `users.db` - User authentication data
- `data.db` - Application data (created by routes/data.js)
- Some code has hardcoded paths; check environment variables

### 3. Security Considerations
- Default session secret in .env should be regenerated for production
- CORS is fully enabled (no origin restrictions)
- Session storage is in-memory (lost on restart)
- Legacy server.js has hardcoded credentials: `admin:jnco5626` (DO NOT USE)

---

## Architecture Patterns

### MVC-like Structure
- **Routes** (`routes/`): HTTP request handlers, business logic
- **Middleware** (`middleware/`): Request interceptors (authentication)
- **Config** (`config/`): Strategy configurations (Passport)
- **Models**: Implicit through direct SQLite queries

### Authentication Flow
1. User requests protected resource → `ensureAuthenticated()` middleware checks session
2. If not authenticated → 401 response
3. User submits login form → POST /login → Passport LocalStrategy
4. Strategy queries users.db → bcrypt.compare(password, hash)
5. On success → serialize user.id to session → redirect to /
6. Subsequent requests use session cookie for authentication

### Data Persistence Pattern
- Single JSON array serialized to store table (id=1)
- INSERT ON CONFLICT REPLACE pattern for upserts
- Frontend handles data validation and transformation
- Server acts as persistence layer

---

## Database Schema

### users.db (Authentication)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL  -- bcrypt hashed
);
```

### data.db (Application Data)

```sql
CREATE TABLE store (
  id INTEGER PRIMARY KEY,
  data TEXT  -- JSON stringified array
);
```

**Storage Format**:
```javascript
// Stored as JSON string in store.data
[
  {
    "ASIN": "B0ABCD1234",
    "Order Type": "Regular",
    "Order Number": "123-4567890-1234567",
    "Order Date": "2024-01-15",
    "Estimated Tax Value": 2.50,
    "Profit": 15.00,
    // ... dynamic fields
  }
]
```

---

## API Endpoints

### Authentication Endpoints

#### `GET /login`
Returns HTML login form with dark theme styling.

**Response**: 200 OK (HTML)

#### `POST /login`
Authenticates user credentials via Passport LocalStrategy.

**Request**:
```
Content-Type: application/x-www-form-urlencoded
username=<string>
password=<string>
```

**Success**: 302 Redirect to /
**Failure**: 302 Redirect to /login

#### `GET /logout`
Destroys session and redirects to login page.

**Response**: 302 Redirect to /login

### Data Endpoints (Authentication Required)

#### `GET /data`
Retrieves stored array data.

**Authentication**: Required (ensureAuthenticated middleware)

**Response**:
```json
200 OK
[
  { "ASIN": "...", "Profit": 15.00, ... }
]
```

**Errors**:
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Database error

#### `POST /data`
Saves array data to database (upsert operation).

**Authentication**: Required

**Request**:
```json
Content-Type: application/json
[
  { "ASIN": "...", "Profit": 15.00, ... }
]
```

**Validation**:
- Data must be an array or convertible to array
- Invalid formats return 400 Bad Request

**Response**:
```json
200 OK
{ "message": "Data saved/updated successfully" }
```

**Errors**:
- `400 Bad Request` - Invalid data format
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Database error

---

## Development Workflows

### Initial Setup

```bash
# Clone repository
git clone https://github.com/dhahaj/vine-server
cd vine-server

# Install dependencies (after fixing package.json)
npm install

# Create/verify .env file
cat > .env << EOF
SESSION_SECRET=<generate-random-secret>
DATABASE_URL=users.db
PORT=3000
EOF

# Create initial admin user
node userdb.js add admin <password>

# Start server
npm start
```

### User Management

The `userdb.js` CLI tool provides user administration:

```bash
# Add new user
node userdb.js add <username> <password>

# List all users
node userdb.js list

# Get user details
node userdb.js get <username>

# Update password
node userdb.js update <username> <new-password>

# Remove user
node userdb.js remove <username>

# Check if user exists
node userdb.js check <username>
```

**Important**: Passwords are automatically hashed with bcrypt (10 salt rounds).

### Running the Server

```bash
# Production mode (app.js)
npm start

# Or directly
node app.js

# Custom port
PORT=8080 node app.js
```

### Database Operations

**Accessing databases**:
```bash
sqlite3 users.db "SELECT * FROM users;"
sqlite3 data.db "SELECT * FROM store;"
```

**Reset data**:
```bash
# Clear all application data
sqlite3 data.db "DELETE FROM store;"

# Remove all users (CAUTION)
sqlite3 users.db "DELETE FROM users;"
```

---

## Key Conventions

### Code Style
- Use Promises for database operations (see userdb.js for patterns)
- Error handling: Log errors, return appropriate HTTP status codes
- Authentication: Always use `ensureAuthenticated` middleware for protected routes
- Database access: Use parameterized queries to prevent SQL injection

### File Organization
- **Routes**: Place all route handlers in `routes/` directory
- **Middleware**: Authentication and request processing in `middleware/`
- **Config**: Strategy configurations in `config/`
- **Utilities**: CLI tools and helpers in root directory

### Database Patterns

**Promise-based queries** (preferred):
```javascript
function getUser(username) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}
```

**Parameterized queries** (always use):
```javascript
// GOOD
db.get('SELECT * FROM users WHERE username = ?', [username], callback);

// BAD (SQL injection risk)
db.get(`SELECT * FROM users WHERE username = '${username}'`, callback);
```

### Password Security
- Always hash passwords with bcrypt before storage
- Use 10+ salt rounds: `bcrypt.hash(password, 10)`
- Compare with `bcrypt.compare(plaintext, hash)`
- Never log or expose password hashes

### Session Management
- Session secret must be strong and unique (use crypto.randomBytes)
- Sessions expire on server restart (in-memory storage)
- User ID serialized to session, full user object loaded on each request

---

## Common Tasks

### Adding a New Route

1. Create route file in `routes/` directory:
```javascript
// routes/myroute.js
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/myendpoint', ensureAuthenticated, (req, res) => {
    // Handler logic
    res.json({ message: 'Success' });
});

module.exports = router;
```

2. Register route in `app.js`:
```javascript
const myRoute = require('./routes/myroute');
app.use('/api', myRoute);
```

### Adding a New Middleware

1. Create middleware file in `middleware/` directory:
```javascript
// middleware/mymiddleware.js
module.exports = function myMiddleware(req, res, next) {
    // Middleware logic
    if (condition) {
        return next(); // Continue to next middleware
    }
    res.status(403).json({ error: 'Forbidden' });
};
```

2. Apply in routes or app.js:
```javascript
const myMiddleware = require('./middleware/mymiddleware');
app.use(myMiddleware); // Global
// or
router.get('/path', myMiddleware, handler); // Route-specific
```

### Modifying Database Schema

1. Update schema in `db.js`:
```javascript
db.run(`CREATE TABLE IF NOT EXISTS tablename (
    id INTEGER PRIMARY KEY,
    field TEXT
)`);
```

2. For existing databases, create migration script:
```javascript
// migration.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('users.db');

db.run('ALTER TABLE users ADD COLUMN email TEXT', (err) => {
    if (err) console.error('Migration failed:', err);
    else console.log('Migration successful');
    db.close();
});
```

3. Run migration: `node migration.js`

### Adding User Validation

Update `config/passport.js`:
```javascript
LocalStrategy({ usernameField: 'username', passwordField: 'password' },
  async (username, password, done) => {
    // Add custom validation
    if (!username || !password) {
      return done(null, false, { message: 'Missing credentials' });
    }

    // Existing logic...
  }
)
```

---

## Testing Checklist

When making changes, verify:

- [ ] Authentication still works (login/logout)
- [ ] Protected routes return 401 when not authenticated
- [ ] Data can be saved and retrieved via /data endpoints
- [ ] Passwords are hashed (never stored as plaintext)
- [ ] No SQL injection vulnerabilities (use parameterized queries)
- [ ] Error responses include appropriate status codes
- [ ] Sessions persist across requests (but not server restarts)
- [ ] CORS headers present in responses
- [ ] Database connections are properly closed

### Manual Testing Commands

```bash
# Test login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=yourpassword" \
  -c cookies.txt

# Test authenticated request
curl http://localhost:3000/data \
  -b cookies.txt

# Test data save
curl -X POST http://localhost:3000/data \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '[{"test": "data"}]'

# Test unauthenticated request (should return 401)
curl http://localhost:3000/data
```

---

## Environment Variables

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_SECRET` | None | Secret key for session encryption (required) |
| `PORT` | 3000 | Server listening port |
| `DATABASE_URL` | users.db | Path to user database file |

### Example .env

```bash
SESSION_SECRET=aVeryStrongRandomSecretKeyHere
DATABASE_URL=users.db
PORT=3000
```

**Production .env**:
```bash
SESSION_SECRET=$(openssl rand -base64 32)
DATABASE_URL=/var/lib/vine-server/users.db
PORT=8080
NODE_ENV=production
```

---

## Frontend Integration

### index.html
- Self-contained spreadsheet parser interface
- Communicates with backend via Fetch API
- Default API endpoint: `https://vine.soupnazi.cc/api`
- Uses CDN libraries: XLSX, sql.js

### Key Frontend Features
- Excel/CSV file parsing
- Editable data grid
- Duplicate removal (by ASIN + Order Type)
- Data persistence to backend
- Export to Excel

### Frontend-Backend Contract

**Data Format**:
```javascript
// Frontend sends array of objects
POST /data
[
  {
    "ASIN": "B0ABCD1234",
    "Order Type": "Regular",
    "Order Number": "123-4567890-1234567",
    // ... other fields
  }
]

// Backend returns same format
GET /data
[{ ... }]
```

**Authentication**:
- Frontend relies on session cookies
- No explicit token handling
- Login form is server-rendered HTML

---

## Security Best Practices

### Authentication
- [x] Passwords hashed with bcrypt (10 rounds)
- [x] Session-based authentication
- [ ] HTTPS required (configure in production)
- [ ] Rate limiting on login endpoint (not implemented)
- [ ] CSRF protection (not implemented)

### Data Validation
- [x] Type checking on /data endpoint (array validation)
- [x] Parameterized SQL queries
- [ ] Input sanitization (minimal)
- [ ] Schema validation (not enforced)

### Session Security
- [x] Secure session secret
- [ ] httpOnly cookies (check express-session config)
- [ ] secure cookies for HTTPS (not configured)
- [ ] Session timeout (not configured)

### Recommendations for Production

1. **Enable HTTPS**:
```javascript
// Use reverse proxy (nginx/apache) or:
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(443);
```

2. **Restrict CORS**:
```javascript
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

3. **Add Rate Limiting**:
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts
});

app.post('/login', loginLimiter, ...);
```

4. **Configure Secure Sessions**:
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true, // HTTPS only
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

---

## Deployment

### Prerequisites
- Node.js 14+ installed
- SQLite3 installed
- Writable directory for database files
- Environment variables configured

### Deployment Steps

1. **Prepare server**:
```bash
# Install dependencies
npm install --production

# Create .env with production values
cat > .env << EOF
SESSION_SECRET=$(openssl rand -base64 32)
PORT=3000
DATABASE_URL=/var/lib/vine-server/users.db
NODE_ENV=production
EOF
```

2. **Initialize database**:
```bash
# Run db initialization
node db.js

# Create admin user
node userdb.js add admin <secure-password>
```

3. **Start with PM2** (recommended):
```bash
npm install -g pm2
pm2 start app.js --name vine-server
pm2 save
pm2 startup
```

4. **Configure reverse proxy** (nginx example):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Systemd Service

Create `/etc/systemd/system/vine-server.service`:
```ini
[Unit]
Description=Vine Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/vine-server
ExecStart=/usr/bin/node app.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl enable vine-server
systemctl start vine-server
```

---

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module 'express'`
**Solution**: Add missing dependencies to package.json and run `npm install`

**Issue**: `Error: Cannot open database`
**Solution**: Ensure database files have correct permissions and directory exists

**Issue**: `Login fails with correct credentials`
**Solution**: Check if password was hashed correctly when added to database

**Issue**: `Session lost after server restart`
**Solution**: Expected behavior (in-memory sessions). Consider persistent session store (Redis, MongoDB)

**Issue**: `CORS errors in browser`
**Solution**: Verify CORS is enabled and origin is allowed

**Issue**: `401 Unauthorized on /data endpoint`
**Solution**: Ensure user is logged in (check session cookie exists)

### Debug Mode

Enable verbose logging:
```javascript
// Add to app.js
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.user);
    next();
});
```

Check database contents:
```bash
sqlite3 users.db ".schema"
sqlite3 users.db "SELECT id, username FROM users;"
sqlite3 data.db "SELECT id, length(data) as data_length FROM store;"
```

---

## File Reference Guide

### app.js (36 lines)
**Purpose**: Main application entry point
**Key Functions**:
- Express server initialization
- Middleware stack configuration
- Route registration
- Server listening on PORT

**When to Modify**:
- Adding global middleware
- Registering new routes
- Changing server configuration

### server.js (266 lines)
**Purpose**: Legacy server implementation
**Status**: DEPRECATED - Contains hardcoded credentials
**When to Modify**: Never (use app.js instead)

### db.js (17 lines)
**Purpose**: Database initialization
**Key Functions**:
- Creates users table if not exists
- Exports database connection

**When to Modify**:
- Adding new tables
- Changing schema
- Database configuration

### userdb.js (254 lines)
**Purpose**: CLI user management utility
**Commands**: add, remove, list, update, get, getAll, check
**Key Functions**:
- Promise-based database operations
- Password hashing
- User CRUD operations

**When to Modify**:
- Adding new user management commands
- Changing password hashing parameters
- Adding user fields

### routes/auth.js (128 lines)
**Purpose**: Authentication routes
**Endpoints**: GET/POST /login, GET /logout
**Key Functions**:
- Login form rendering
- Passport authentication
- Session management

**When to Modify**:
- Changing login flow
- Adding registration
- Customizing login UI

### routes/data.js (75 lines)
**Purpose**: Data persistence routes
**Endpoints**: GET/POST /data
**Key Functions**:
- Data validation (array checking)
- Database upsert operations
- Error handling

**When to Modify**:
- Adding data validation
- Implementing new data endpoints
- Changing storage format

### config/passport.js (72 lines)
**Purpose**: Passport strategy configuration
**Key Functions**:
- LocalStrategy implementation
- User serialization/deserialization
- Password validation with bcrypt

**When to Modify**:
- Adding authentication strategies (OAuth, JWT)
- Changing password validation logic
- Adding user lookup logic

### middleware/auth.js (9 lines)
**Purpose**: Authentication guard middleware
**Key Functions**:
- `ensureAuthenticated()` - Checks if user is logged in

**When to Modify**:
- Adding authorization logic
- Implementing role-based access
- Changing authentication error responses

### index.html (653 lines)
**Purpose**: Frontend spreadsheet parser UI
**Key Features**:
- File upload/parsing (XLSX)
- Editable data grid
- Duplicate removal
- Data export
- Backend data persistence

**When to Modify**:
- Adding UI features
- Changing data format
- Updating API endpoints

---

## Git Workflow

### Branch Strategy
- **Main Branch**: Production-ready code
- **Feature Branches**: Use `claude/` prefix for AI-generated changes
- **Current Branch**: `claude/claude-md-mi0nt6mfp46guki4-01GHyrf8r3curmgE8V5ufFuG`

### Commit Conventions

Use conventional commit format:
```
feat: add user email field to database schema
fix: resolve session timeout issue on login
refactor: convert callbacks to Promises in userdb.js
docs: update API endpoint documentation
```

### Before Committing
1. Test authentication flow
2. Verify database operations work
3. Check for security vulnerabilities
4. Ensure no hardcoded credentials
5. Update documentation if API changes

---

## AI Assistant Guidelines

### When Making Changes

1. **Always Read First**: Use Read tool before editing any file
2. **Check Dependencies**: Verify required modules are in package.json
3. **Test Authentication**: Changes should not break login/logout
4. **Maintain Security**: Never reduce security (password hashing, parameterized queries)
5. **Update Documentation**: If API changes, update this file

### Code Modification Priorities

1. **Security**: Prevent vulnerabilities (SQL injection, XSS, password exposure)
2. **Backwards Compatibility**: Don't break existing API contracts
3. **Error Handling**: Always include proper error responses
4. **Logging**: Add meaningful error messages
5. **Documentation**: Update inline comments and this guide

### Preferred Patterns

**Database Operations**:
```javascript
// PREFERRED: Promise-based with error handling
function getUser(username) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
            if (err) {
                console.error('Database error:', err);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}
```

**Route Handlers**:
```javascript
// PREFERRED: Async/await with try-catch
router.get('/endpoint', ensureAuthenticated, async (req, res) => {
    try {
        const data = await getData();
        res.json(data);
    } catch (error) {
        console.error('Error in /endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

**Middleware**:
```javascript
// PREFERRED: Clear error responses
function checkRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}
```

### Anti-Patterns to Avoid

- ❌ Hardcoding credentials
- ❌ String concatenation in SQL queries
- ❌ Storing plaintext passwords
- ❌ Ignoring errors silently
- ❌ Using server.js as reference (it's legacy)
- ❌ Breaking authentication middleware chain
- ❌ Removing CORS without understanding implications

---

## Additional Resources

### External Documentation
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Passport.js Documentation](http://www.passportjs.org/docs/)
- [SQLite3 Node.js](https://github.com/TryGhost/node-sqlite3)
- [Bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

### Internal Documentation
- This file (CLAUDE.md) - Primary reference for AI assistants
- Inline comments in code files
- Git commit history for context on changes

---

## Changelog

### 2025-11-15 - Initial Documentation
- Created comprehensive CLAUDE.md based on codebase analysis
- Documented all routes, middleware, and configuration
- Identified critical issues (missing dependencies)
- Provided development workflows and deployment guide

---

## Quick Reference

### Start Server
```bash
npm start  # Uses app.js
```

### Add User
```bash
node userdb.js add <username> <password>
```

### Test Endpoints
```bash
# Login
curl -X POST http://localhost:3000/login -d "username=admin&password=pass" -c cookies.txt

# Get data
curl http://localhost:3000/data -b cookies.txt

# Save data
curl -X POST http://localhost:3000/data -H "Content-Type: application/json" -d '[]' -b cookies.txt
```

### Database Access
```bash
sqlite3 users.db "SELECT * FROM users;"
sqlite3 data.db "SELECT json_array_length(data) FROM store;"
```

---

**Last Updated**: 2025-11-15
**Maintainer**: AI Assistant
**Repository**: https://github.com/dhahaj/vine-server
