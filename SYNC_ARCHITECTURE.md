# 🔒 Bulletproof Sync Architecture

## Overview

Version 2.9.0 introduces a **conflict-detection sync system** that **never auto-clobbers your data**. Every sync operation is verified with checksums, and conflicts are resolved by **user choice**, not automatic merge rules.

---

## How It Works

### **1. Checksum Validation**

Every sync operation calculates a **SHA-256 checksum** of your data:

```javascript
checksum = SHA256({
  completionState,
  completionTimestamps,
  notes
})
```

This checksum is stored in the `sync_metadata` table alongside:
- `last_sync`: Timestamp of last successful sync
- `item_count`: Total items in the database

### **2. Conflict Detection (On Page Load)**

When you load the tracker:

1. **Load localStorage** — Get your local data (if any)
2. **Fetch from server** — Get server data + metadata
3. **Compare checksums** — Local vs. server
4. **Decide:**
   - ✅ **Checksums match** → Use server data (no conflict)
   - 🟡 **Local empty** → Use server data
   - 🟡 **Server empty** → Auto-push local data to server
   - 🔴 **Checksums differ** → **CONFLICT** — Show modal

### **3. Conflict Resolution Modal**

When a conflict is detected, you see a modal with **two options**:

#### **Option A: 📱 Keep Local Data (This Device)**
- Uses the data currently in your browser
- Overwrites the server with your local data
- **Use this if:**
  - You just entered data on this device
  - Server data is outdated
  - You know this device has the correct state

#### **Option B: ☁️ Keep Server Data (Cloud)**
- Loads data from the server
- Discards local changes
- **Use this if:**
  - You synced from another device recently
  - Local data is stale or corrupt
  - You want to restore from the last known good state

**Metadata shown:**
- **Local:** `X items on this device`
- **Server:** `Y items • Last synced: [timestamp]`

---

## Sync Status Indicator

A floating status badge (top-right) shows real-time sync state:

| State | Badge | Meaning |
|-------|-------|---------|
| 🟢 **Synced** | Green | Data successfully synced to server |
| 🟡 **Syncing** | Orange | Sync in progress |
| 🔴 **Error** | Red | Sync failed (offline or server error) |

Auto-hides after 3 seconds on success.

---

## Database Schema

### `sync_metadata` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Always `1` (single-row table) |
| `data_checksum` | TEXT | SHA-256 hash of current data |
| `last_sync` | TEXT | ISO timestamp of last sync |
| `item_count` | INTEGER | Total items in database |

**Purpose:** Detect data changes between client and server without downloading full state.

---

## API Changes

### **GET /api/sync**

**Before (v2.8.0):**
```json
{
  "completionState": {...},
  "completionTimestamps": {...},
  "notes": {...}
}
```

**After (v2.9.0):**
```json
{
  "completionState": {...},
  "completionTimestamps": {...},
  "notes": {...},
  "metadata": {
    "data_checksum": "a3f2b1...",
    "last_sync": "2026-08-19T14:30:00Z",
    "item_count": 42
  }
}
```

### **POST /api/sync**

**New required field:** `checksum`

```json
{
  "completionState": {...},
  "completionTimestamps": {...},
  "notes": {...},
  "checksum": "a3f2b1c4d5..."  // SHA-256 hash
}
```

Server validates checksum and stores it in `sync_metadata`.

---

## Safety Guarantees

### ✅ **What v2.9.0 Prevents**

1. **Silent data loss** — Never overwrites without user confirmation
2. **Merge conflicts** — User always picks the winning version
3. **Stale overwrites** — Checksums detect any data divergence
4. **Lost work** — LocalStorage backup survives page refreshes

### ❌ **What It Doesn't Handle (Yet)**

1. **Automatic merging** — No smart merge (e.g., "keep both")
2. **Multi-device real-time sync** — No WebSocket / live updates
3. **Versioned history** — No undo / rollback to previous states

---

## Workflow Examples

### **Scenario 1: Normal Usage (No Conflict)**

1. Enter data on your phone
2. Checkbox → Triggers `saveState()` → Syncs to server
3. Open tracker on laptop
4. Laptop loads → Checksums match → Uses server data ✅

### **Scenario 2: Offline Work**

1. Airplane mode — Enter data
2. Data saves to `localStorage` only
3. Sync fails → Red "Sync failed (offline?)" badge
4. Land → Reload page
5. Checksums differ (server is older)
6. Modal appears → Choose "Keep Local Data" → Pushes to server ✅

### **Scenario 3: Lost Server Data (This Issue)**

1. Server DB gets wiped (v2.8.0 bug scenario)
2. You had local data in `localStorage`
3. Old version: Overwrote local with empty server ❌
4. **New version (v2.9.0):**
   - Detects server empty
   - Auto-pushes local data to server
   - **No data loss** ✅

### **Scenario 4: Multi-Device Conflict**

1. Edit data on phone (device A)
2. Phone syncs to server
3. Edit **different data** on laptop (device B) while offline
4. Laptop comes online → Checksums differ
5. Modal appears:
   - **Local:** 15 items on this device
   - **Server:** 12 items • Last synced: 10 minutes ago
6. You choose:
   - **Keep Local** → Laptop wins (server gets 15 items)
   - **Keep Server** → Phone wins (laptop gets 12 items)

**Current limitation:** No automatic merge. You must manually re-enter lost changes.

---

## Testing

### **Test Conflict Detection**

1. Open tracker in **two browsers** (Chrome + Firefox)
2. **Chrome:** Enter data, sync
3. **Firefox:** Enter **different** data, go offline (DevTools → Network → Offline)
4. **Firefox:** Reload page (uses localStorage)
5. **Firefox:** Go online
6. **Firefox:** Reload → Conflict modal appears ✅

### **Test Auto-Push**

1. Clear server DB:
   ```bash
   cd /tmp/health-tracker
   rm health-tracker.db
   pm2 restart health-tracker-api
   ```
2. Open tracker (has localStorage data)
3. Conflict modal does **NOT** appear
4. Console shows: "Using local data (server empty)"
5. Check server: `curl https://184-107-106-29.sslip.io/api/sync | jq .metadata.item_count`
6. Should return your local item count ✅

---

## Troubleshooting

### **Modal Won't Dismiss**

**Cause:** JavaScript error during conflict resolution.

**Fix:**
1. Open DevTools → Console
2. Check for errors
3. Manually resolve:
   ```javascript
   resolveConflict('local')  // or 'server'
   ```

### **Sync Always Fails**

**Symptoms:** Red "Sync failed" badge every time.

**Check:**
1. Is API running? `curl https://184-107-106-29.sslip.io/api/health`
2. Check PM2 logs: `pm2 logs health-tracker-api --lines 20`
3. Verify Caddy reverse proxy:
   ```bash
   curl -I https://184-107-106-29.sslip.io/api/sync
   # Should return 200 OK
   ```

### **Checksums Always Conflict**

**Cause:** Checksum calculation differs between client/server.

**Debug:**
1. Open DevTools → Console
2. Check local checksum:
   ```javascript
   await calculateChecksum({completionState, completionTimestamps, notes})
   ```
3. Compare with server:
   ```bash
   curl -s https://184-107-106-29.sslip.io/api/sync | jq .metadata.data_checksum
   ```
4. If they differ but data looks identical → **Bug in checksum logic**

---

## Future Enhancements

### **Planned Features**

1. **Smart Merge** — Automatic merge when conflicts are non-overlapping
   - Example: Phone edits Day 1, Laptop edits Day 2 → Merge both
2. **Version History** — Store last 5 sync states for rollback
3. **Export Before Overwrite** — Auto-download JSON backup before conflict resolution
4. **Real-Time Sync** — WebSocket updates across devices
5. **Sync Health Dashboard** — Show sync history, failed attempts, conflict count

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Page Load                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────▼────────────┐
                │ Load localStorage      │
                │ (local data)           │
                └───────────┬────────────┘
                            │
                ┌───────────▼────────────┐
                │ Fetch /api/sync        │
                │ (server data + meta)   │
                └───────────┬────────────┘
                            │
              ┌─────────────▼─────────────┐
              │ Compare Checksums         │
              └─────────────┬─────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼────┐      ┌───────▼────────┐   ┌─────▼──────┐
    │ Match  │      │ Local Empty    │   │ Conflict!  │
    │        │      │ or Server Empty│   │            │
    └───┬────┘      └───────┬────────┘   └─────┬──────┘
        │                   │                   │
        │                   │              ┌────▼─────┐
        │                   │              │ Show     │
        │                   │              │ Modal    │
        │                   │              └────┬─────┘
        │                   │                   │
        │                   │         ┌─────────┼──────────┐
        │                   │         │                    │
        │                   │    ┌────▼─────┐      ┌──────▼────┐
        │                   │    │ Keep     │      │ Keep      │
        │                   │    │ Local    │      │ Server    │
        │                   │    └────┬─────┘      └──────┬────┘
        │                   │         │                   │
        └───────────────────┴─────────┴───────────────────┘
                            │
                    ┌───────▼────────┐
                    │ Render UI      │
                    └────────────────┘
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| **2.9.0** | Aug 19, 2026 | ✅ Conflict detection + user choice |
| 2.8.0 | Aug 19, 2026 | Week tab + dopamine insights |
| 2.0.1 | Earlier | Backend sync (buggy - no checksums) |

---

**Bottom line:** Your data is now **bulletproof**. The app will **never** silently overwrite your work again. 🛡️
