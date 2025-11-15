// routes/data.js
const express = require('express');
const router = express.Router();
const { dataDb } = require('../db'); // Use shared database connection
const { ensureAuthenticated } = require('../middleware/auth'); // Import middleware

// Use the shared database connection (already initialized in db.js)
const db = dataDb;

// POST endpoint (secured)
router.post('/data', ensureAuthenticated, (req, res) => {
    console.log('POST request received');
    let newData = req.body;

    if (!Array.isArray(newData)) {
        console.warn('Received data is not an array. Converting to an array.');
        newData = newData && Object.keys(newData).length > 0 ? [newData] : [];
        if (!Array.isArray(newData)) {
            return res.status(400).json({ error: 'Data must be an array' });
        }
    }

    const jsonData = JSON.stringify(newData, null, 2);

    db.get('SELECT id FROM store WHERE id = 1', (err, row) => {
        if (err) {
            console.error('Database error (SELECT):', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (row) {
            db.run(
                'UPDATE store SET data = ? WHERE id = 1',
                jsonData,
                function (err) {
                    if (err) {
                        console.error('Database error (UPDATE):', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    res.status(200).json({ message: 'Data updated successfully' });
                }
            );
        } else {
            db.run(
                'INSERT INTO store (id, data) VALUES (1, ?)',
                jsonData,
                function (err) {
                    if (err) {
                        console.error('Database error (INSERT):', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    res.status(200).json({ message: 'Data saved successfully' });
                }
            );
        }
    });
});

// GET endpoint (secured)
router.get('/data', ensureAuthenticated, (req, res) => {
    console.log('GET request received');
    db.get('SELECT data FROM store WHERE id = 1', (err, row) => {
        if (err) {
            console.error('Database error (GET):', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        let data = [];
        if (row) {
            try {
                data = JSON.parse(row.data);
                if (!Array.isArray(data)) {
                    console.warn('Stored data is not an array. Converting to an array.');
                    data = [];
                }
            } catch (parseErr) {
                console.error('Error parsing stored data:', parseErr);
                data = [];
            }
        }

        console.log('Sending data:', data);
        res.json(data);
    });
});

module.exports = router;
