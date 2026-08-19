# 🚨 What to Do When You See the Conflict Modal

## What It Looks Like

```
┌─────────────────────────────────────────────────┐
│  ⚠️  Data Conflict Detected                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  Your local data differs from the server.       │
│  This could happen if you've been using the     │
│  tracker on another device or if data was       │
│  lost during a previous session.                │
│                                                  │
│  Choose which version to keep:                  │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ 📱 Keep Local Data (This Device)         │   │
│  │                                          │   │
│  │ Use the data currently on this device   │   │
│  │ and overwrite the server.                │   │
│  │                                          │   │
│  │ 15 items on this device                  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ ☁️ Keep Server Data (Cloud)              │   │
│  │                                          │   │
│  │ Load the data from the server and        │   │
│  │ discard local changes.                   │   │
│  │                                          │   │
│  │ 12 items • Last synced: 10 mins ago      │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Decision Guide

### **Choose 📱 Keep Local Data IF:**

✅ You **just entered data** on this device (within last hour)  
✅ This device has **more items** than the server  
✅ You're **certain** this device has the correct state  
✅ The server's "Last synced" timestamp is **old** (days ago)

**Example:**
- **Local:** 15 items on this device
- **Server:** 5 items • Last synced: 2 days ago
- **Action:** Click "Keep Local Data" ✅

---

### **Choose ☁️ Keep Server Data IF:**

✅ You recently synced from **another device** (phone, tablet)  
✅ Server has **more items** than local  
✅ You suspect local data is **corrupted** or **stale**  
✅ The server's "Last synced" timestamp is **recent** (minutes/hours ago)

**Example:**
- **Local:** 5 items on this device
- **Server:** 15 items • Last synced: 10 minutes ago
- **Action:** Click "Keep Server Data" ✅

---

## What Happens After You Choose?

### **After Choosing "Keep Local":**

1. ⏳ Orange "Uploading local data..." badge appears
2. 📤 Your local data is sent to the server
3. ✅ Green "Local data saved to server" badge
4. 🔄 Server now has your data
5. 📱 Other devices will get this version on next load

**Result:** Your local work is now the **source of truth**.

---

### **After Choosing "Keep Server":**

1. ⏳ Orange "Loading server data..." badge appears
2. 📥 Server data is downloaded
3. 💾 LocalStorage is updated
4. ✅ Green "Server data loaded" badge
5. 🔄 Page refreshes to show server data

**Result:** Server state is now **restored locally**.

---

## Common Scenarios

### **Scenario 1: Morning Work Lost (Today's Bug)**

**What happened:**
- You entered data this morning
- You refreshed the page
- Server was empty
- **Old v2.8.0:** Lost your work ❌
- **New v2.9.0:** Modal appears ✅

**Modal shows:**
- 📱 Local: 20 items on this device
- ☁️ Server: 0 items • Last synced: Never

**What to do:**
- Click "📱 Keep Local Data"
- Your morning's work is saved ✅

---

### **Scenario 2: Edited on Another Device**

**Timeline:**
- 10:00 AM — Edited on phone, synced to server
- 10:30 AM — Opened laptop (offline), edited different data
- 11:00 AM — Laptop goes online, refreshes

**Modal shows:**
- 📱 Local: 12 items on this device (laptop edits)
- ☁️ Server: 15 items • Last synced: 1 hour ago (phone edits)

**What to do:**
- **If phone edits are more important:** Choose "☁️ Keep Server Data"
- **If laptop edits are more important:** Choose "📱 Keep Local Data"
- ⚠️ **Warning:** Whichever you choose, the other device's changes are **lost**

**Best practice:**
- Choose server (phone wins)
- Manually re-enter the 3 lost laptop items

---

### **Scenario 3: Multiple Devices Active**

**Problem:**
- You have 3 devices (phone, laptop, tablet)
- All editing data independently
- All syncing at different times

**Result:**
- Whichever device **refreshes last** shows the conflict modal
- That device decides the "winning" version
- Other devices will get that version on next refresh

**Recommendation:**
- **Work on ONE device at a time**
- Only open tracker on second device **after** first device syncs
- Check "Last synced" timestamp before making edits

---

## Pro Tips

### **Avoid Conflicts Entirely:**

1. ✅ **One device at a time** — Don't edit on multiple devices simultaneously
2. ✅ **Wait for sync** — Look for green "✓ Synced" badge before switching devices
3. ✅ **Check timestamps** — If "Last synced" is recent, someone else was working
4. ✅ **Export backups** — Periodically export JSON (coming in next version)

---

### **When in Doubt:**

1. **Screenshot the modal** — Shows both versions' item counts
2. **Choose "Keep Local"** — Safer if you just entered data
3. **Manually verify** — After choosing, scroll through and check your data
4. **Re-enter if needed** — If you chose wrong, just type the lost items again

---

## Emergency Recovery

### **"I chose the wrong option!"**

**If you chose "Keep Server" but meant "Keep Local":**

1. ❌ **Bad news:** Your local changes are overwritten
2. ✅ **Good news:** If the data was in localStorage, it might still be recoverable
3. 🛠️ **Action:**
   - **DO NOT** reload the page again
   - Open DevTools → Console
   - Run:
     ```javascript
     localStorage.getItem('healthTrackerState')
     ```
   - Send me the output → I'll restore it manually

---

### **"The modal won't go away!"**

**If clicking options doesn't dismiss the modal:**

1. Open DevTools → Console
2. Manually resolve:
   ```javascript
   resolveConflict('local')  // or 'server'
   ```
3. If that fails → Screenshot console errors → Send to me

---

## Technical Details

### **Why Does This Happen?**

Conflicts occur when:
- **Checksums differ** between local and server
- Both local and server have data (neither is empty)
- Data was modified on one side while the other was offline

### **What Is a Checksum?**

- SHA-256 hash of your entire data state
- Example: `a3f2b1c4d5e6f7...` (64-character hex string)
- Even **one character** difference → Different checksum
- Identical data → Identical checksum

### **Why Not Auto-Merge?**

**Current limitation:**
- No way to know which device has "correct" data
- Auto-merge could combine corrupted + good data
- **User always knows best** → Let user decide

**Future enhancement:**
- Smart merge for non-overlapping changes
- Example: Phone edits Day 1, Laptop edits Day 2 → Merge both ✅

---

## When to Contact Support

**Contact me if:**
- ❌ Modal appears **every time** you refresh (checksum always conflicts)
- ❌ Choosing an option **doesn't** dismiss the modal
- ❌ Data looks **corrupted** after choosing (wrong dates, missing items)
- ❌ "Last synced" timestamp is **in the future** (time zone bug?)

**Include:**
- Screenshot of the conflict modal
- DevTools → Console screenshot (any red errors)
- Which option you chose

---

**Remember:** This modal exists to **protect your data**. It's better to see this and make a choice than to have your work **silently overwritten** like in v2.8.0. 🛡️
