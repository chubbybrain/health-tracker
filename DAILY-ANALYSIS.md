# Daily Analysis & Summary System

## Overview

The health tracker automatically analyzes your daily progress and generates insights every night at **3:00 AM**. No manual export needed — just check the **Yesterday** tab in the morning to see your summary.

---

## How It Works

### 1. **Throughout the Day**
- Check off items as you complete them
- Add notes about how you feel, substitutions, energy levels
- All data syncs automatically to the server

### 2. **Every Night at 3:00 AM**
- Cron job (`analyze-day.js`) runs automatically
- Reads yesterday's completion data from SQLite database
- Analyzes patterns:
  - Overall completion rate
  - Timing delays (workouts starting late, etc.)
  - Meal tracking
  - Hydration logging
  - Notes provided
- Generates AI-style summary with insights
- Saves summary to `daily_summaries` table

### 3. **Next Morning**
- Open the app: https://184-107-106-29.sslip.io/
- Click **Yesterday** tab
- See your daily summary with:
  - 📊 Performance stats
  - ⏰ Timing insights
  - 💪 Workout summary
  - 🍽️ Nutrition tracking
  - 💡 Your notes
  - 🎯 Recommendations for today

---

## The Summary Format

Example:
```markdown
# Day 1 Summary

## 📊 Overall Performance
- ✅ Completed: 28 / 33 items (85%)
- ⏭️ Skipped: 5 items
- 📝 Notes provided: 12

## ⏰ Timing Insights
- 🐌 Morning workout: 30 min late (scheduled 6:30 AM, completed 7:00 AM)
- 🏃 Lunch: 15 min early (scheduled 12:00 PM, completed 11:45 AM)

## 💪 Workouts (2)
- 06:30 AM: Morning workout — *"Felt strong, increased weights"*
- 05:00 PM: Evening cardio — *"20 min walk, good energy"*

## 🍽️ Nutrition (5 meals)
- 06:00 AM: Pre-workout fuel
- 07:15 AM: Post-workout meal — *"4 hard-boiled eggs, felt full"*
- ...

## 💡 Key Notes
- **Pre-workout fuel**: Had 1 slice of toast before workout
- **Post-workout meal**: 4 hard-boiled eggs, 2 toast w/ honey & cheddar

## 🎯 Recommendations for Today
- 🏋️ Workout started late yesterday. Set an alarm 15 min before scheduled start.
- 📝 Add more notes about energy levels and how meals make you feel.
```

---

## Technical Details

### Cron Job
- **Name:** `health-tracker-daily-analysis`
- **Schedule:** `0 3 * * *` (3:00 AM daily)
- **Script:** `/tmp/webserver/analyze-day.js`
- **Delivery:** `local` (saved to files, no notifications)

### Database Schema
```sql
CREATE TABLE daily_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,         -- YYYY-MM-DD format
    day_number INTEGER NOT NULL,        -- 1-14 (program day)
    summary_text TEXT NOT NULL,         -- Markdown summary
    stats TEXT,                         -- JSON stats object
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

#### GET `/api/summary/:date`
Fetch summary for a specific date.

**Request:**
```
GET https://184-107-106-29.sslip.io/api/summary/2026-08-10
```

**Response:**
```json
{
  "date": "2026-08-10",
  "dayNumber": 1,
  "summary": "# Day 1 Summary\n\n...",
  "stats": {
    "totalScheduled": 33,
    "completed": 28,
    "skipped": 5,
    "completionRate": 85,
    "notesProvided": 12
  },
  "createdAt": "2026-08-11 03:00:15"
}
```

**Empty Response (no summary yet):**
```json
{
  "summary": null
}
```

#### POST `/api/summary`
Save a new summary (called by cron job).

**Request:**
```json
{
  "date": "2026-08-10",
  "dayNumber": 1,
  "summary": "# Day 1 Summary\n\n...",
  "stats": {
    "totalScheduled": 33,
    "completed": 28,
    ...
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Summary saved successfully"
}
```

---

## Maintenance

### View Cron Job Status
```bash
hermes cronjob --action=list
```

### Test Cron Job Manually
```bash
hermes cronjob --action=run --job-id=169e507a0f37
```

### View Cron Output Logs
```bash
ls -lah ~/.hermes/cron/output/
```

### Run Analysis Script Manually (for debugging)
```bash
cd /tmp/webserver
node analyze-day.js
```

### Check Database Directly
```bash
sqlite3 /tmp/webserver/health-tracker.db "SELECT * FROM daily_summaries ORDER BY date DESC LIMIT 1;"
```

---

## Troubleshooting

### "No summary available yet" in Yesterday tab
- **Cause:** Summary hasn't been generated yet (cron runs at 3 AM)
- **Fix:** Wait until after 3 AM, or run the cron job manually

### Cron job fails
- **Check logs:** `~/.hermes/cron/output/<job-id>/`
- **Common issues:**
  - Node.js not found (ensure PM2 environment is correct)
  - Database locked (server.js must be running)
  - Date calculation error (check `analyze-day.js` getDayNumber function)

### Summary shows wrong day
- **Fix:** Update the `startDate` in `analyze-day.js` to match your program's actual start date
- Currently hardcoded to: `2026-08-10` (Day 1)

---

## Future Enhancements

Potential improvements:
- AI-powered recommendations (use GPT/Claude to analyze notes and suggest adjustments)
- Trend analysis (compare week-over-week progress)
- Export summaries to PDF
- Weekly summaries (every Sunday)
- Push notifications when summary is ready
- Graph completion rates over time

---

**Last Updated:** Aug 10, 2026  
**Version:** 2.1.0
