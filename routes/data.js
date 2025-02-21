// routes/data.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { ensureAuthenticated } = require('../middleware/auth'); // Import middleware

// Open (or create) the SQLite database - You might want to move this database connection to a separate module
const db = new sqlite3.Database('data.db', (err) => {
    if (err) console.error('Error opening data.db', err);
    else console.log('Connected to data.db');
});

// Create table if needed - Move this to a database initialization script
db.run('CREATE TABLE IF NOT EXISTS store (id INTEGER PRIMARY KEY, data TEXT)');

// POST endpoint (secured)
router.post('/data', ensureAuthenticated, (req, res) => {
    console.log('POST request received');
    let newData = req.body;

    if (!Array.isArray(newData)) {
        console.warn('Received data is not an array. Converting to an array.');
        newData = newData && Object.keys(newData).length > 0 ? [newData] : [];
        if (!Array.isArray(newData)) {
            return res.status(400).send('Data must be an array'); //Ensure we really return
        }
    }

    const jsonData = JSON.stringify(newData, null, 2);

    db.get('SELECT id FROM store WHERE id = 1', (err, row) => {
        if (err) return res.status(500).send(err);

        if (row) {
            db.run(
                'UPDATE store SET data = ? WHERE id = 1',
                jsonData,
                function (err) {
                    if (err) return res.status(500).send(err);
                    res.status(200).send('Data updated successfully');
                }
            );
        } else {
            db.run(
                'INSERT INTO store (id, data) VALUES (1, ?)',
                jsonData,
                function (err) {
                    if (err) return res.status(500).send(err);
                    res.status(200).send('Data saved successfully');
                }
            );
        }
    });
});

// GET endpoint (secured)
router.get('/data', ensureAuthenticated, (req, res) => {
    console.log('GET request received');
    db.get('SELECT data FROM store WHERE id = 1', (err, row) => {
        if (err) return res.status(500).send(err);

        let data = row ? JSON.parse(row.data) : [];

        if (!Array.isArray(data)) {
            console.warn(
                'Stored data is not an array. Converting to an array.'
            );
            data = [];
        }
        console.log('Sending data:', data);
        res.json(data);
    });
});

module.exports = router;
