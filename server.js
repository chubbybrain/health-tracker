const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 9001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database('./health-tracker.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Create tables
function initDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_key TEXT NOT NULL UNIQUE,
        completed INTEGER NOT NULL DEFAULT 0,
        timestamp TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_key TEXT NOT NULL UNIQUE,
        note_text TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Database tables initialized');
}

// API Routes

// Get all sync data
app.get('/api/sync', (req, res) => {
    const completionsPromise = new Promise((resolve, reject) => {
        db.all('SELECT item_key, completed, timestamp FROM completions', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    const notesPromise = new Promise((resolve, reject) => {
        db.all('SELECT item_key, note_text FROM notes WHERE note_text IS NOT NULL AND note_text != ""', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    Promise.all([completionsPromise, notesPromise])
        .then(([completions, notes]) => {
            const completionState = {};
            const completionTimestamps = {};
            const noteState = {};

            completions.forEach(row => {
                completionState[row.item_key] = row.completed === 1;
                if (row.timestamp) {
                    completionTimestamps[row.item_key] = row.timestamp;
                }
            });

            notes.forEach(row => {
                noteState[row.item_key] = row.note_text;
            });

            res.json({
                completionState,
                completionTimestamps,
                notes: noteState
            });
        })
        .catch(err => {
            console.error('Error fetching sync data:', err);
            res.status(500).json({ error: 'Failed to fetch data' });
        });
});

// Save sync data
app.post('/api/sync', (req, res) => {
    const { completionState, completionTimestamps, notes } = req.body;

    if (!completionState) {
        return res.status(400).json({ error: 'Missing completionState' });
    }

    const promises = [];

    // Update completions
    Object.keys(completionState).forEach(key => {
        const completed = completionState[key] ? 1 : 0;
        const timestamp = completionTimestamps?.[key] || null;
        
        promises.push(new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO completions (item_key, completed, timestamp, updated_at) 
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(item_key) DO UPDATE SET 
                 completed = ?, timestamp = ?, updated_at = CURRENT_TIMESTAMP`,
                [key, completed, timestamp, completed, timestamp],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        }));
    });

    // Update notes
    if (notes) {
        Object.keys(notes).forEach(key => {
            const noteText = notes[key];
            
            promises.push(new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO notes (item_key, note_text, updated_at) 
                     VALUES (?, ?, CURRENT_TIMESTAMP)
                     ON CONFLICT(item_key) DO UPDATE SET 
                     note_text = ?, updated_at = CURRENT_TIMESTAMP`,
                    [key, noteText, noteText],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            }));
        });
    }

    Promise.all(promises)
        .then(() => {
            res.json({ success: true, message: 'Data saved successfully' });
        })
        .catch(err => {
            console.error('Error saving sync data:', err);
            res.status(500).json({ error: 'Failed to save data' });
        });
});

// Export data for AI analysis
app.get('/api/export', (req, res) => {
    const query = `
        SELECT 
            c.item_key,
            c.completed,
            c.timestamp,
            n.note_text
        FROM completions c
        LEFT JOIN notes n ON c.item_key = n.item_key
        WHERE c.completed = 1 OR (n.note_text IS NOT NULL AND n.note_text != "")
        ORDER BY c.timestamp ASC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error exporting data:', err);
            return res.status(500).json({ error: 'Failed to export data' });
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            totalItems: rows.length,
            items: rows.map(row => ({
                itemKey: row.item_key,
                completed: row.completed === 1,
                completedAt: row.timestamp,
                notes: row.note_text || ''
            }))
        };

        res.json(exportData);
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Health Tracker API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});
