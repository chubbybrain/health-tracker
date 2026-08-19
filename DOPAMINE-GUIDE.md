# 🧠 Dopamine Management System - Quick Start Guide

Your own Liven-inspired system, built with tools you control.

---

## 📋 **What You Have Now**

### 1️⃣ **Dopamine Plan** (Daily Overlay)
**File:** `dopamine-plan.md`  
**Purpose:** Maps dopamine strategies to your existing 2-week health schedule

**Key strategies:**
- 🌅 **Morning low-stimulation** (phone off until 7:45 AM coffee)
- 💼 **Work focus blocks** (phone in drawer, single-task sprints)
- ⚡ **Healthy reward breaks** (movement, nature, NOT scrolling)
- 🌙 **Evening wind-down** (screen curfew at 9 PM)

**How to use:**
- Read it once to understand the overlay
- No need to modify your schedule — just follow the strategies during existing time blocks
- Start with ONE habit (phone off until coffee = easiest win)

---

### 2️⃣ **AI Reflection Questions** (Nightly Analysis)
**File:** `analyze-day.js` (runs at 3 AM via cron)  
**Purpose:** Your AI analyzes yesterday's data and asks Liven-style questions

**The 5 questions:**
1. **What gave you energy vs. drained you?** (✅ energizing, ❌ draining tags)
2. **What triggered procrastination today?** (🔴 tags)
3. **When did you hit flow state?** (🟢 tags)
4. **What pattern repeated from yesterday?** (coming soon)
5. **What would make tomorrow 10% better?** (AI suggestions based on your patterns)

**How it works:**
- Add emoji tags to your tracker notes throughout the day:
  - `✅` = energizing (left me focused/calm)
  - `❌` = draining (left me scattered/anxious)
  - `🔴` = procrastination trigger
  - `🟢` = flow state (locked in and productive)
- At 3 AM, AI analyzes your tags and completion data
- Next morning, check the **Yesterday tab** in your tracker for insights

**Example notes:**
```
[9:30] Took a 10-min walk outside ✅ Energizing
[11:00] Checked Instagram during break ❌ Draining - wanted to keep scrolling
[2:00] 🔴 Avoided hard task, did easy emails instead
[3:30] 🟢 Flow state - finished feature in 90 min straight
```

---

### 3️⃣ **Weekly Pattern Dashboard** (Sunday Review)
**File:** `obsidian-sync/40 Knowledge/Weekly Dopamine Patterns.md`  
**Purpose:** Weekly review template to spot recurring patterns

**What to track:**
- 🎯 Best focus times (when did flow happen?)
- ⚡ Energy dip triggers (what drains you?)
- 🔴 Procrastination patterns (when/why do you avoid tasks?)
- 🟢 Flow state wins (what helps you lock in?)
- 💊 Dopamine choices (healthy vs. cheap hits)
- 📊 Completion rate trend (which days work best?)

**How to use:**
1. Every Sunday, open the template in Obsidian
2. Review your daily AI summaries from the past week (Yesterday tab in tracker)
3. Fill in the patterns you notice
4. Pick ONE improvement for next week (e.g., "Protect 11 AM–12:30 PM for deep work")
5. Archive the week and copy template for next week

---

## 🚀 **Getting Started (Today)**

### **Step 1: Add Tags to Your Notes**
Starting today, when you complete tasks in your tracker, add emoji tags:

- After a workout: `[6:45] Felt great, ready to crush the day ✅`
- After a break: `[11:00] Scrolled Twitter for 10 min ❌ Drained`
- When avoiding work: `[2:00] 🔴 Switched to easier tasks instead of the report`
- When locked in: `[3:30] 🟢 Flow - finished in one sitting`

**Why:** These tags feed the AI analysis at 3 AM.

---

### **Step 2: Check Yesterday Tab Tomorrow Morning**
Tomorrow (Aug 20), after your 3 AM cron runs, check the **Yesterday tab** in your tracker.

You'll see:
- Overall completion %
- **🧠 Dopamine & Focus Reflection** (the 5 questions)
- Timing insights (delays, early completions)
- Workouts, meals, notes

**Why:** This is your daily "Livie AI" replacement — but it actually analyzes YOUR data.

---

### **Step 3: Try ONE Dopamine Strategy**
Pick the easiest win from `dopamine-plan.md`:

**Recommended starter:**
- 🌅 **Phone off until coffee** (7:45 AM)
  - Don't check notifications, email, or social media until after your first coffee
  - This delays the first cheap dopamine hit and lets you start with EARNED dopamine (workout, breakfast, coffee)

**Why:** Hardest habit but highest impact. Morning sets the tone for the whole day.

---

### **Step 4: Sunday Review (Aug 25)**
Next Sunday, open your Obsidian dashboard and fill in the weekly patterns.

Look for:
- When did flow happen? (protect that time next week)
- When did energy dip? (add movement breaks then)
- What triggered procrastination? (schedule hardest tasks BEFORE that time)

**Why:** Weekly patterns reveal what daily data can't show.

---

## 📊 **What Success Looks Like**

**Week 1 (Aug 19-25):**
- [ ] Added emoji tags to at least 5 notes
- [ ] Checked Yesterday tab 3+ times
- [ ] Tried phone-off-until-coffee 3+ mornings

**Week 2 (Aug 26-Sep 1):**
- [ ] Completed first Sunday review
- [ ] Identified your best focus time (flow pattern)
- [ ] Adjusted schedule based on procrastination patterns

**Week 3+:**
- [ ] Consistent emoji tagging (10+ tags/day)
- [ ] Weekly reviews on auto-pilot
- [ ] One new dopamine strategy added (screen curfew, focus blocks, etc.)

---

## 🦊 **Why This Beats Liven**

| **Liven App** | **Your System** |
|---------------|-----------------|
| ❌ $24-75/month subscription | ✅ Free, no hidden costs |
| ❌ Predatory auto-renewal | ✅ You own all the code |
| ❌ Generic quiz → generic plan | ✅ Analyzes YOUR actual behavior |
| ❌ Vendor lock-in (data trapped) | ✅ Plain text, portable forever |
| ❌ AI chatbot with no memory | ✅ AI learns from your daily patterns |
| ❌ App crashes, bad UX | ✅ Simple web app + Obsidian |

**The concept is solid. The execution is yours.**

---

## 📚 **Files Reference**

| File | Location | Purpose |
|------|----------|---------|
| `dopamine-plan.md` | `/tmp/health-tracker/` | Daily strategy overlay |
| `analyze-day.js` | `/tmp/health-tracker/` | 3 AM AI analysis script |
| `Weekly Dopamine Patterns.md` | `~/obsidian-sync/40 Knowledge/` | Sunday review template |
| Health Tracker | `https://184-107-106-29.sslip.io` or `https://chubbybrain.github.io/health-tracker/` | Daily tracking app |

---

## 🔧 **Troubleshooting**

**Q: I don't see the dopamine reflection questions in Yesterday tab**  
A: The 3 AM cron runs tonight (Aug 20 at 3 AM). You'll see it tomorrow morning. In the meantime, start adding emoji tags today so there's data to analyze.

**Q: Where do I add the emoji tags?**  
A: In your tracker, when you check off a task, click the "Add note" field and type your note with the emoji (✅ ❌ 🔴 🟢).

**Q: Do I HAVE to use all 4 emojis?**  
A: No. Use what's relevant. If a break energized you, add ✅. If you procrastinated, add 🔴. AI only analyzes what you provide.

**Q: Can I modify the questions?**  
A: Yes! Edit `analyze-day.js` (search for "Dopamine Reflection Questions"). Add/remove questions as needed.

**Q: What if I miss a day of tagging?**  
A: No problem. The AI works with whatever data you provide. More tags = better insights, but gaps are fine.

---

**Next step:** Add your first emoji tag to today's notes and try phone-off-until-coffee tomorrow morning. 🚀
