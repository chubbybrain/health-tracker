# 🏋️ Health & Fitness Progressive Tracker

AI-assisted daily schedule tracker for the **40lb Weight Loss Program**. Built for progressive adaptation based on daily completion and notes.

## 🌐 Live Demo

**GitHub Pages:** https://chubbybrain.github.io/health-tracker/  
**Local Server:** https://184-107-106-29.sslip.io/

## ✨ Features

- **📅 2-Week Schedule** — 387 detailed schedule items with 15-minute precision
- **✅ Completion Tracking** — Check off items as you complete them
- **📝 Notes System** — Leave notes for each item (diet variations, workout performance, energy levels)
- **📊 Real-time Progress** — See daily completion percentage and stats
- **📤 AI Export** — Export notes as JSON for AI analysis and daily plan adaptation
- **💾 LocalStorage Persistence** — All data saved locally in your browser
- **📱 Mobile Responsive** — Works on phone, tablet, and desktop

## 🎯 How It Works

### For You (Daily User):
1. Open the tracker each morning
2. Follow the schedule throughout the day
3. Check off completed items
4. Leave notes on what worked/didn't work:
   - "Oatmeal felt better than banana pre-workout"
   - "Push-ups felt easier today, ready for more reps"
   - "Woke groggy, check sleep quality"
4. Export notes at end of day

### For AI Assistant (Cléo):
1. Read exported notes JSON
2. Analyze patterns and progression signals
3. Adapt tomorrow's schedule based on feedback
4. Update schedule data with new plan
5. Track progression milestones

## 🛠️ Technical Stack

- **Frontend:** Pure HTML/CSS/JavaScript (no framework dependencies)
- **Storage:** Browser LocalStorage
- **Data Format:** JSON schedule with metadata
- **Hosting:** GitHub Pages + Local HTTPS server (Caddy)

## 📦 Files

```
/
├── index.html           # Main web app (17KB)
├── schedule_data.json   # 2-week schedule (97KB, 387 items)
└── README.md           # This file
```

## 🔄 Workflow

```
User fills tracker → Export notes → Share with AI → AI analyzes → 
AI updates schedule → New day loads → Repeat
```

## 🎨 Features Detail

### Day Selector
- 14-day navigation buttons
- Visual completion status (green = fully complete)
- Active day highlighting

### Schedule Items
Each item shows:
- ⏰ Time (15-min blocks)
- 🎯 Activity name
- 📋 Details (meal specifics, workout type, etc.)
- ✅ Completion checkbox
- 📝 Notes field

### Progress Stats
- **Daily Progress %** — Completion percentage for current day
- **Completed** — Number of items checked off
- **Remaining** — Items left to complete

### Export Format
```json
{
  "exportDate": "2026-08-10T10:30:00Z",
  "currentDay": 3,
  "summary": {
    "totalItems": 387,
    "completedItems": 42,
    "notesCount": 8
  },
  "dailyBreakdown": [
    {
      "day": 1,
      "date": "Aug 11, 2026",
      "items": [
        {
          "time": "06:00 AM",
          "activity": "Pre-workout fuel",
          "completed": true,
          "notes": "Had oatmeal instead of banana, felt great!"
        }
      ]
    }
  ]
}
```

## 🚀 Local Development

```bash
# Serve locally
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

## 📱 Mobile Usage

Add to home screen for app-like experience:
- **iOS Safari:** Share → Add to Home Screen
- **Android Chrome:** Menu → Add to Home Screen

## 🔐 Data Privacy

- All data stored locally in browser (LocalStorage)
- No server-side tracking
- No third-party analytics
- Export only when you choose

## 📈 Progression Tracking

AI uses notes to detect:
- **Energy levels** — Sleep quality, workout performance
- **Diet preferences** — What meals work better
- **Exercise capacity** — Ready to increase volume/intensity
- **Recovery signals** — Need for rest days
- **Adherence patterns** — Which times/activities get skipped

## 🎯 Example Notes

**Good notes for AI adaptation:**
- ✅ "Push-ups felt easier, could do 12 reps instead of 10"
- ✅ "Woke at 5:50 instead of 5:45, felt groggy"
- ✅ "Greek yogurt parfait very filling, no hunger until lunch"
- ✅ "Zone 2 cardio at 110bpm felt perfect, conversational"

**Less useful:**
- ❌ "Good"
- ❌ "Done"
- ❌ Empty notes

## 🔄 Schedule Updates

AI can update `schedule_data.json` with:
- Adjusted workout volumes
- Meal swaps based on preferences
- Modified timing (sleep/wake adjustments)
- New exercises (progression)
- Rest day reallocation

## 📊 Metrics

- **Schedule Items:** 387 (15-min precision over 14 days)
- **Categories:** Wake/sleep, meals, workouts, hydration, supplements, prep time
- **Average items/day:** ~28 scheduled activities
- **Target weight loss:** 2-4 lbs Week 1, 1-1.5 lbs/week thereafter

## 🏆 Program Goals

- **Phase 1:** 40lb weight loss over 6-9 months
- **Health focus:** Cortisol management, Zone 2 cardio, strength foundation
- **Target:** 265 lbs → 225 lbs (sustainable 1 lb/week)
- **Metrics:** Sleep quality, energy, workout performance, measurements

## 🤝 Contributing

This is a personal health tracker, but feel free to fork for your own use!

## 📄 License

MIT - Use freely for your own health journey

---

**Built with ❤️ by Cléo (AI Assistant) for pol's health transformation journey**
