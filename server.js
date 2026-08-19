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

    db.run(`CREATE TABLE IF NOT EXISTS daily_summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        day_number INTEGER NOT NULL,
        summary_text TEXT NOT NULL,
        stats TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
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

// Get daily summary (for Yesterday tab)
app.get('/api/summary/:date', (req, res) => {
    const { date } = req.params;
    
    db.get(
        'SELECT * FROM daily_summaries WHERE date = ? ORDER BY created_at DESC LIMIT 1',
        [date],
        (err, row) => {
            if (err) {
                console.error('Error fetching summary:', err);
                return res.status(500).json({ error: 'Failed to fetch summary' });
            }
            
            if (!row) {
                return res.json({ summary: null });
            }
            
            res.json({
                date: row.date,
                dayNumber: row.day_number,
                summary: row.summary_text,
                stats: row.stats ? JSON.parse(row.stats) : null,
                createdAt: row.created_at
            });
        }
    );
});

// Get weekly summary (last 7 days of data aggregated)
app.get('/api/weekly-summary', (req, res) => {
    db.all(
        `SELECT date, day_number, summary_text, stats, created_at
         FROM daily_summaries
         ORDER BY date DESC
         LIMIT 7`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching weekly summaries:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Reverse to get chronological order (oldest to newest)
            rows.reverse();
            
            // Aggregate dopamine patterns
            const patterns = {
                energizing: [],
                draining: [],
                flowState: [],
                procrastination: []
            };
            
            const completionTrend = [];
            const focusHeatmap = {}; // { date: { hour: 'flow'|'procrastination'|'energizing'|'draining' } }
            
            rows.forEach(row => {
                const stats = row.stats ? JSON.parse(row.stats) : {};
                const summary = row.summary_text || '';
                
                // Add completion data
                completionTrend.push({
                    date: row.date,
                    dayOfWeek: new Date(row.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
                    completionRate: stats.completionRate || 0,
                    completed: stats.completed || 0,
                    total: stats.totalScheduled || 0
                });
                
                // Parse dopamine tags from summary text
                const energizingMatches = summary.match(/✅[^-]*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?):\s*([^\n—]+)/gi) || [];
                const drainingMatches = summary.match(/❌[^-]*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?):\s*([^\n—]+)/gi) || [];
                const flowMatches = summary.match(/🟢[^-]*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?):\s*([^\n—]+)/gi) || [];
                const procrastMatches = summary.match(/🔴[^-]*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?):\s*([^\n—]+)/gi) || [];
                
                // Extract activities and times
                energizingMatches.forEach(match => {
                    const parts = match.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?):?\s*([^\n—]+)/i);
                    if (parts) {
                        patterns.energizing.push({ date: row.date, time: parts[1], activity: parts[2].trim() });
                        addToHeatmap(focusHeatmap, row.date, parts[1], 'energizing');
                    }
                });
                
                drainingMatches.forEach(match => {
                    const parts = match.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?):?\s*([^\n—]+)/i);
                    if (parts) {
                        patterns.draining.push({ date: row.date, time: parts[1], activity: parts[2].trim() });
                        addToHeatmap(focusHeatmap, row.date, parts[1], 'draining');
                    }
                });
                
                flowMatches.forEach(match => {
                    const parts = match.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?):?\s*([^\n—]+)/i);
                    if (parts) {
                        patterns.flowState.push({ date: row.date, time: parts[1], activity: parts[2].trim() });
                        addToHeatmap(focusHeatmap, row.date, parts[1], 'flow');
                    }
                });
                
                procrastMatches.forEach(match => {
                    const parts = match.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?):?\s*([^\n—]+)/i);
                    if (parts) {
                        patterns.procrastination.push({ date: row.date, time: parts[1], activity: parts[2].trim() });
                        addToHeatmap(focusHeatmap, row.date, parts[1], 'procrastination');
                    }
                });
            });
            
            // Calculate insights
            const insights = generateWeeklyInsights(patterns, completionTrend, focusHeatmap);
            
            res.json({
                weekStart: rows[0]?.date || null,
                weekEnd: rows[rows.length - 1]?.date || null,
                completionTrend,
                patterns,
                focusHeatmap,
                insights
            });
        }
    );
});

// Helper: Add time to heatmap
function addToHeatmap(heatmap, date, timeStr, type) {
    const hour = extractHour(timeStr);
    if (hour === null) return;
    
    if (!heatmap[date]) heatmap[date] = {};
    if (!heatmap[date][hour]) heatmap[date][hour] = [];
    heatmap[date][hour].push(type);
}

// Helper: Extract hour from time string
function extractHour(timeStr) {
    const match = timeStr.match(/(\d{1,2}):\d{2}\s*(AM|PM)?/i);
    if (!match) return null;
    
    let hour = parseInt(match[1]);
    const period = match[2];
    
    if (period) {
        if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
        if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
    }
    
    return hour;
}

// Helper: Generate weekly insights
function generateWeeklyInsights(patterns, completionTrend, focusHeatmap) {
    const insights = {
        bestFocusTime: null,
        procrastinationRisk: null,
        weekPattern: null,
        suggestions: []
    };
    
    // Find most common flow time
    if (patterns.flowState.length > 0) {
        const flowHours = patterns.flowState.map(f => extractHour(f.time)).filter(h => h !== null);
        const hourCounts = {};
        flowHours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
        const mostCommonHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);
        insights.bestFocusTime = `${mostCommonHour}:00 (${hourCounts[mostCommonHour]} flow states)`;
        
        insights.suggestions.push(`Block ${mostCommonHour}:00-${parseInt(mostCommonHour) + 1}:30 for hardest tasks (your flow time)`);
    }
    
    // Find most common procrastination time
    if (patterns.procrastination.length > 0) {
        const procrastHours = patterns.procrastination.map(p => extractHour(p.time)).filter(h => h !== null);
        const hourCounts = {};
        procrastHours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
        const mostCommonHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);
        insights.procrastinationRisk = `${mostCommonHour}:00 (${hourCounts[mostCommonHour]} incidents)`;
        
        insights.suggestions.push(`Move easier tasks to ${mostCommonHour}:00-${parseInt(mostCommonHour) + 1}:00 (procrastination window)`);
    }
    
    // Detect weekly pattern
    if (patterns.energizing.length > patterns.draining.length) {
        insights.weekPattern = 'More energizing activities than draining ones. Good momentum!';
    } else if (patterns.draining.length > patterns.energizing.length) {
        insights.weekPattern = 'More draining activities than energizing. Consider adjusting break activities.';
        insights.suggestions.push('Replace screen time breaks with movement or outdoor time');
    }
    
    // Check completion trend
    if (completionTrend.length > 0) {
        const avgCompletion = completionTrend.reduce((sum, day) => sum + day.completionRate, 0) / completionTrend.length;
        if (avgCompletion < 70) {
            insights.suggestions.push('Week average below 70%. Focus on ONE priority per day next week.');
        }
    }
    
    return insights;
}

// Save daily summary (called by cron job)
app.post('/api/summary', (req, res) => {
    const { date, dayNumber, summary, stats } = req.body;
    
    if (!date || !dayNumber || !summary) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    db.run(
        `INSERT INTO daily_summaries (date, day_number, summary_text, stats, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(date) DO UPDATE SET
         summary_text = ?, stats = ?, created_at = CURRENT_TIMESTAMP`,
        [date, dayNumber, summary, JSON.stringify(stats), summary, JSON.stringify(stats)],
        (err) => {
            if (err) {
                console.error('Error saving summary:', err);
                return res.status(500).json({ error: 'Failed to save summary' });
            }
            
            res.json({ success: true, message: 'Summary saved successfully' });
        }
    );
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
