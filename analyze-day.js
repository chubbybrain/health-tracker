#!/usr/bin/env node

/**
 * Daily Analysis Cron Job
 * Runs at 3:00 AM to analyze yesterday's completion data
 * and generate insights summary for the "Yesterday" tab
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'health-tracker.db');
const SCHEDULE_PATH = path.join(__dirname, 'schedule_data.json');

// Load schedule data
const scheduleData = JSON.parse(fs.readFileSync(SCHEDULE_PATH, 'utf8'));

// Get yesterday's date in YYYY-MM-DD format
function getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
}

// Calculate which day number yesterday was (1-14)
function getDayNumber(dateStr) {
    // For now, hardcode Day 1 as today (Aug 10, 2026)
    // In production, this should match the actual start date from your plan
    const targetDate = new Date(dateStr);
    const startDate = new Date('2026-08-10'); // Day 1 start date
    const daysDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    if (daysDiff < 1) {
        return null; // Before program started
    }
    
    if (daysDiff > scheduleData.meta.total_days) {
        // Cycle repeats after 14 days
        return ((daysDiff - 1) % scheduleData.meta.total_days) + 1;
    }
    
    return daysDiff;
}

// Main analysis function
async function analyzeYesterday() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                return reject(err);
            }

            const yesterday = getYesterdayDate();
            const dayNumber = getDayNumber(yesterday);
            
            console.log(`Analyzing data for ${yesterday} (Day ${dayNumber})`);

            // Get all items for yesterday
            const dayItems = scheduleData.schedule.filter(item => 
                parseInt(item.DayNumber) === dayNumber
            );

            if (dayItems.length === 0) {
                console.log('No scheduled items for yesterday');
                db.close();
                return resolve(null);
            }

            // Get completion data
            const itemKeys = dayItems.map(item => 
                `${item.DayNumber}_${item.Time}_${item.Activity}`
            );

            db.all(
                `SELECT 
                    c.item_key,
                    c.completed,
                    c.timestamp,
                    n.note_text
                FROM completions c
                LEFT JOIN notes n ON c.item_key = n.item_key
                WHERE c.item_key IN (${itemKeys.map(() => '?').join(',')})`,
                itemKeys,
                (err, rows) => {
                    if (err) {
                        console.error('Error fetching completion data:', err);
                        db.close();
                        return reject(err);
                    }

                    // Build statistics
                    const completedItems = rows.filter(r => r.completed === 1);
                    const itemsWithNotes = rows.filter(r => r.note_text && r.note_text.trim());
                    
                    const stats = {
                        totalScheduled: dayItems.length,
                        completed: completedItems.length,
                        skipped: dayItems.length - completedItems.length,
                        completionRate: Math.round((completedItems.length / dayItems.length) * 100),
                        notesProvided: itemsWithNotes.length
                    };

                    // Analyze timing delays
                    const delays = [];
                    completedItems.forEach(item => {
                        if (!item.timestamp) return;
                        
                        const scheduledItem = dayItems.find(d => 
                            `${d.DayNumber}_${d.Time}_${d.Activity}` === item.item_key
                        );
                        
                        if (!scheduledItem) return;
                        
                        const scheduledTime = new Date(`${yesterday}T${convertTo24Hour(scheduledItem.Time)}`);
                        const completedTime = new Date(item.timestamp);
                        const delayMinutes = Math.round((completedTime - scheduledTime) / (1000 * 60));
                        
                        if (Math.abs(delayMinutes) > 15) {
                            delays.push({
                                activity: scheduledItem.Activity,
                                scheduled: scheduledItem.Time,
                                completed: completedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                                delayMinutes
                            });
                        }
                    });

                    // Categorize activities
                    const categories = {
                        workouts: [],
                        meals: [],
                        hydration: [],
                        supplements: [],
                        other: []
                    };

                    // Dopamine pattern tracking
                    const dopaminePatterns = {
                        energizing: [],
                        draining: [],
                        procrastination: [],
                        flowState: []
                    };
                    
                    completedItems.forEach(item => {
                        const scheduledItem = dayItems.find(d => 
                            `${d.DayNumber}_${d.Time}_${d.Activity}` === item.item_key
                        );
                        
                        if (!scheduledItem) return;
                        
                        const activity = scheduledItem.Activity.toLowerCase();
                        const note = item.note_text || '';
                        
                        // Track dopamine patterns from notes
                        if (note) {
                            if (note.includes('✅') || note.toLowerCase().includes('energizing') || note.toLowerCase().includes('focused')) {
                                dopaminePatterns.energizing.push({ time: scheduledItem.Time, activity: scheduledItem.Activity, note });
                            }
                            if (note.includes('❌') || note.toLowerCase().includes('draining') || note.toLowerCase().includes('scattered')) {
                                dopaminePatterns.draining.push({ time: scheduledItem.Time, activity: scheduledItem.Activity, note });
                            }
                            if (note.includes('🔴') || note.toLowerCase().includes('procrastin')) {
                                dopaminePatterns.procrastination.push({ time: scheduledItem.Time, activity: scheduledItem.Activity, note });
                            }
                            if (note.includes('🟢') || note.toLowerCase().includes('flow')) {
                                dopaminePatterns.flowState.push({ time: scheduledItem.Time, activity: scheduledItem.Activity, note });
                            }
                        }
                        
                        if (activity.includes('workout') || activity.includes('cardio') || activity.includes('strength')) {
                            categories.workouts.push({ ...scheduledItem, note });
                        } else if (activity.includes('meal') || activity.includes('snack') || activity.includes('breakfast') || activity.includes('lunch') || activity.includes('dinner')) {
                            categories.meals.push({ ...scheduledItem, note });
                        } else if (activity.includes('water') || activity.includes('hydration')) {
                            categories.hydration.push({ ...scheduledItem, note });
                        } else if (activity.includes('supplement') || activity.includes('magnesium') || activity.includes('vitamin')) {
                            categories.supplements.push({ ...scheduledItem, note });
                        } else {
                            categories.other.push({ ...scheduledItem, note });
                        }
                    });

                    // Generate summary text
                    const summary = generateSummary(stats, delays, categories, dopaminePatterns, itemsWithNotes);

                    // Save summary to database
                    db.run(
                        `INSERT INTO daily_summaries (date, day_number, summary_text, stats)
                         VALUES (?, ?, ?, ?)
                         ON CONFLICT(date) DO UPDATE SET
                         summary_text = ?, stats = ?, created_at = CURRENT_TIMESTAMP`,
                        [yesterday, dayNumber, summary, JSON.stringify(stats), summary, JSON.stringify(stats)],
                        (err) => {
                            db.close();
                            
                            if (err) {
                                console.error('Error saving summary:', err);
                                return reject(err);
                            }
                            
                            console.log('✅ Summary saved successfully');
                            console.log('\n' + summary);
                            resolve({ yesterday, dayNumber, summary, stats });
                        }
                    );
                }
            );
        });
    });
}

// Convert 12-hour time to 24-hour for comparison
function convertTo24Hour(timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '00:00:00';
    
    let [, hours, minutes, period] = match;
    hours = parseInt(hours);
    
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

// Generate human-readable summary
function generateSummary(stats, delays, categories, dopaminePatterns, itemsWithNotes) {
    let summary = `# Day Summary\n\n`;
    
    // Overall completion
    summary += `## 📊 Overall Performance\n`;
    summary += `- ✅ Completed: ${stats.completed} / ${stats.totalScheduled} items (${stats.completionRate}%)\n`;
    summary += `- ⏭️ Skipped: ${stats.skipped} items\n`;
    summary += `- 📝 Notes provided: ${stats.notesProvided}\n\n`;
    
    // Dopamine Reflection Questions
    summary += `## 🧠 Dopamine & Focus Reflection\n\n`;
    
    // Question 1: Energy patterns
    if (dopaminePatterns.energizing.length > 0 || dopaminePatterns.draining.length > 0) {
        summary += `### What gave you energy vs. drained you?\n`;
        
        if (dopaminePatterns.energizing.length > 0) {
            summary += `**✅ Energizing activities (${dopaminePatterns.energizing.length}):**\n`;
            dopaminePatterns.energizing.forEach(e => {
                summary += `- ${e.time}: ${e.activity} — *"${e.note}"*\n`;
            });
        }
        
        if (dopaminePatterns.draining.length > 0) {
            summary += `**❌ Draining activities (${dopaminePatterns.draining.length}):**\n`;
            dopaminePatterns.draining.forEach(d => {
                summary += `- ${d.time}: ${d.activity} — *"${d.note}"*\n`;
            });
        }
        
        summary += '\n';
    } else {
        summary += `### What gave you energy vs. drained you?\n`;
        summary += `*No energy patterns tracked. Add ✅ (energizing) or ❌ (draining) tags to your notes.*\n\n`;
    }
    
    // Question 2: Procrastination triggers
    if (dopaminePatterns.procrastination.length > 0) {
        summary += `### What triggered procrastination today?\n`;
        dopaminePatterns.procrastination.forEach(p => {
            summary += `- 🔴 ${p.time}: ${p.activity} — *"${p.note}"*\n`;
        });
        summary += '\n';
    } else {
        summary += `### What triggered procrastination today?\n`;
        summary += `*No procrastination triggers logged. Add 🔴 tags when you notice avoidance.*\n\n`;
    }
    
    // Question 3: Flow state wins
    if (dopaminePatterns.flowState.length > 0) {
        summary += `### When did you hit flow state?\n`;
        dopaminePatterns.flowState.forEach(f => {
            summary += `- 🟢 ${f.time}: ${f.activity} — *"${f.note}"*\n`;
        });
        summary += '\n';
    } else {
        summary += `### When did you hit flow state?\n`;
        summary += `*No flow states tracked. Add 🟢 tags when you're locked in and productive.*\n\n`;
    }
    
    // Question 4: Pattern analysis (requires comparing to previous days)
    summary += `### What pattern repeated from yesterday?\n`;
    summary += `*Pattern detection coming soon. For now, review your notes manually.*\n\n`;
    
    // Question 5: Tomorrow improvement
    summary += `### What would make tomorrow 10% better?\n`;
    
    if (dopaminePatterns.draining.length > dopaminePatterns.energizing.length) {
        summary += `- ⚠️ You had more draining activities than energizing ones. Schedule breaks differently?\n`;
    }
    
    if (dopaminePatterns.procrastination.length > 0) {
        const procrastTimes = dopaminePatterns.procrastination.map(p => parseInt(p.time.split(':')[0]));
        const avgProcrastHour = Math.round(procrastTimes.reduce((a, b) => a + b, 0) / procrastTimes.length);
        summary += `- 🔴 Procrastination happened around ${avgProcrastHour}:00. Schedule hardest tasks before then.\n`;
    }
    
    if (dopaminePatterns.flowState.length > 0) {
        const flowTimes = dopaminePatterns.flowState.map(f => parseInt(f.time.split(':')[0]));
        const avgFlowHour = Math.round(flowTimes.reduce((a, b) => a + b, 0) / flowTimes.length);
        summary += `- 🟢 You hit flow around ${avgFlowHour}:00. Block off that time for deep work tomorrow.\n`;
    }
    
    if (stats.completionRate < 70) {
        summary += `- ⚠️ Yesterday's completion rate was ${stats.completionRate}%. Pick ONE thing to focus on tomorrow.\n`;
    }
    
    summary += '\n';
    
    // Timing analysis
    if (delays.length > 0) {
        summary += `## ⏰ Timing Insights\n`;
        delays.forEach(d => {
            const emoji = d.delayMinutes > 0 ? '🐌' : '🏃';
            const verb = d.delayMinutes > 0 ? 'late' : 'early';
            summary += `- ${emoji} **${d.activity}**: ${Math.abs(d.delayMinutes)} min ${verb} (scheduled ${d.scheduled}, completed ${d.completed})\n`;
        });
        summary += '\n';
    }
    
    // Workouts
    if (categories.workouts.length > 0) {
        summary += `## 💪 Workouts (${categories.workouts.length})\n`;
        categories.workouts.forEach(w => {
            summary += `- ${w.Time}: ${w.Activity}`;
            if (w.note) summary += ` — *"${w.note}"*`;
            summary += '\n';
        });
        summary += '\n';
    }
    
    // Meals
    if (categories.meals.length > 0) {
        summary += `## 🍽️ Nutrition (${categories.meals.length} meals)\n`;
        categories.meals.forEach(m => {
            summary += `- ${m.Time}: ${m.Activity}`;
            if (m.note) summary += ` — *"${m.note}"*`;
            summary += '\n';
        });
        summary += '\n';
    }
    
    // Notes with insights
    if (itemsWithNotes.length > 0) {
        summary += `## 💡 Key Notes\n`;
        itemsWithNotes.forEach(item => {
            if (item.note_text && item.note_text.trim()) {
                const key = item.item_key.split('_');
                summary += `- **${key[2]}**: ${item.note_text}\n`;
            }
        });
        summary += '\n';
    }
    
    // Recommendations for today
    summary += `## 🎯 Recommendations for Today\n`;
    
    if (stats.completionRate < 70) {
        summary += `- ⚠️ Yesterday's completion rate was ${stats.completionRate}%. Focus on hitting at least 80% today.\n`;
    }
    
    if (delays.some(d => d.activity.toLowerCase().includes('workout') && d.delayMinutes > 30)) {
        summary += `- 🏋️ Workout started late yesterday. Set an alarm 15 min before scheduled start.\n`;
    }
    
    if (categories.hydration.length < 4) {
        summary += `- 💧 Only ${categories.hydration.length} hydration entries logged. Aim for 8+ glasses today.\n`;
    }
    
    if (stats.notesProvided < 3) {
        summary += `- 📝 Add more notes about energy levels, hunger, and how meals/workouts felt.\n`;
    }
    
    summary += `\n---\n\n*Analysis generated at ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC*`;
    
    return summary;
}

// Run the analysis
analyzeYesterday()
    .then(result => {
        if (result) {
            console.log(`\n✅ Analysis complete for ${result.yesterday} (Day ${result.dayNumber})`);
        } else {
            console.log('\n⚠️ No data to analyze');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Analysis failed:', err);
        process.exit(1);
    });
