# Health Tracker Backend Setup

## Overview
Node.js + Express + SQLite backend for syncing health tracker state across devices.

## Architecture

**Frontend** → **API (port 9001)** → **SQLite Database**

- Frontend uses `fetch()` to sync checkbox states, timestamps, and notes
- localStorage serves as offline fallback
- CORS enabled for cross-origin requests

## API Endpoints

### `GET /api/sync`
Fetch all completion state, timestamps, and notes.

**Response:**
```json
{
  "completionState": {
    "1_06:00 AM_Pre-workout fuel": true
  },
  "completionTimestamps": {
    "1_06:00 AM_Pre-workout fuel": "2026-08-10T11:23:00.000Z"
  },
  "notes": {
    "1_06:00 AM_Pre-workout fuel": "Had oatmeal, felt good"
  }
}
```

### `POST /api/sync`
Save state to database.

**Request Body:**
```json
{
  "completionState": { ... },
  "completionTimestamps": { ... },
  "notes": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data saved successfully"
}
```

### `GET /api/export`
Export all completed items with notes for AI analysis.

**Response:**
```json
{
  "exportDate": "2026-08-10T12:00:00.000Z",
  "totalItems": 12,
  "items": [
    {
      "itemKey": "1_06:00 AM_Pre-workout fuel",
      "completed": true,
      "completedAt": "2026-08-10T11:23:00.000Z",
      "notes": "Had oatmeal instead - felt better"
    }
  ]
}
```

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-10T12:00:00.000Z"
}
```

## Database Schema

### `completions` table
```sql
CREATE TABLE completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_key TEXT NOT NULL UNIQUE,
    completed INTEGER NOT NULL DEFAULT 0,
    timestamp TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### `notes` table
```sql
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_key TEXT NOT NULL UNIQUE,
    note_text TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Running the Server

### Development
```bash
cd /tmp/webserver
node server.js
```

### Production (with PM2)
```bash
npm install -g pm2
pm2 start server.js --name health-tracker-api
pm2 save
pm2 startup
```

### Check Status
```bash
# API health check
curl https://184-107-106-29.sslip.io/api/health

# View database
sqlite3 /tmp/webserver/health-tracker.db "SELECT * FROM completions LIMIT 5;"
```

## Deployment Notes

- **Server:** Running on port 9001
- **Proxy:** Caddy proxies `/api/*` to `127.0.0.1:9001`
- **Database:** SQLite file at `/tmp/webserver/health-tracker.db`
- **CORS:** Enabled for all origins (consider restricting in production)
- **Backup:** localStorage fallback if API is unreachable

## Security Considerations (For Later)

⚠️ **Current setup has NO authentication** — suitable for personal use only.

For multi-user deployment:
1. Add authentication (JWT tokens, session cookies)
2. Add user_id to database schema
3. Restrict CORS to specific origins
4. Use HTTPS only (already enforced via Caddy)
5. Rate limiting on API endpoints

## Backup Strategy

### Manual Backup
```bash
cp /tmp/webserver/health-tracker.db ~/backups/health-tracker-$(date +%Y%m%d).db
```

### Automated Daily Backup (Cron)
```bash
0 2 * * * cp /tmp/webserver/health-tracker.db ~/backups/health-tracker-$(date +\%Y\%m\%d).db
```

## Troubleshooting

### API not responding
```bash
# Check if Node is running
ps aux | grep "node server.js"

# Check logs
journalctl -u caddy -n 50

# Restart Node server
pkill -f "node server.js"
cd /tmp/webserver && node server.js &
```

### Database locked
```bash
# Check for stale connections
lsof | grep health-tracker.db

# Force close database connections
pkill -9 node
rm -f /tmp/webserver/health-tracker.db-wal
```

### CORS errors in browser
Check browser console for specific error. Verify Caddy is proxying correctly:
```bash
curl -I https://184-107-106-29.sslip.io/api/health
```

## Next Steps

- [ ] Add PM2 for process management
- [ ] Implement daily backup cron job
- [ ] Add authentication for multi-user support
- [ ] Create admin dashboard for viewing all user data
- [ ] Add WebSocket support for real-time sync
