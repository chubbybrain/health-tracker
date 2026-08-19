#!/usr/bin/env node

// Quick test to show what the new dopamine reflection looks like

const sampleData = {
    stats: {
        completed: 28,
        totalScheduled: 33,
        completionRate: 85,
        notesProvided: 12
    },
    dopaminePatterns: {
        energizing: [
            { time: '6:45 AM', activity: 'Morning Walk', note: 'Outdoor walk cleared my head ✅' },
            { time: '3:00 PM', activity: 'Afternoon Snack', note: 'Apple + coffee hit the spot ✅' }
        ],
        draining: [
            { time: '11:00 AM', activity: 'Break', note: 'Checked Instagram for "5 min" turned into 20 ❌' },
            { time: '8:30 PM', activity: 'Evening Screen Time', note: 'Doom-scrolled Twitter ❌ Draining' }
        ],
        procrastination: [
            { time: '2:00 PM', activity: 'Deep Work Block', note: '🔴 Avoided the hard report, did easy emails instead' }
        ],
        flowState: [
            { time: '10:00 AM', activity: 'Work Session', note: '🟢 Flow state - finished feature in 90 min straight' }
        ]
    }
};

console.log('\n📊 EXAMPLE: Tomorrow Morning\'s "Yesterday" Tab\n');
console.log('════════════════════════════════════════════════════════════\n');
console.log('# Day Summary\n');
console.log('## 📊 Overall Performance');
console.log(`- ✅ Completed: ${sampleData.stats.completed} / ${sampleData.stats.totalScheduled} items (${sampleData.stats.completionRate}%)`);
console.log(`- ⏭️ Skipped: ${sampleData.stats.totalScheduled - sampleData.stats.completed} items`);
console.log(`- 📝 Notes provided: ${sampleData.stats.notesProvided}\n`);

console.log('## 🧠 Dopamine & Focus Reflection\n');

console.log('### What gave you energy vs. drained you?');
console.log(`**✅ Energizing activities (${sampleData.dopaminePatterns.energizing.length}):**`);
sampleData.dopaminePatterns.energizing.forEach(e => {
    console.log(`- ${e.time}: ${e.activity} — *"${e.note}"*`);
});
console.log(`\n**❌ Draining activities (${sampleData.dopaminePatterns.draining.length}):**`);
sampleData.dopaminePatterns.draining.forEach(d => {
    console.log(`- ${d.time}: ${d.activity} — *"${d.note}"*`);
});

console.log('\n### What triggered procrastination today?');
sampleData.dopaminePatterns.procrastination.forEach(p => {
    console.log(`- 🔴 ${p.time}: ${p.activity} — *"${p.note}"*`);
});

console.log('\n### When did you hit flow state?');
sampleData.dopaminePatterns.flowState.forEach(f => {
    console.log(`- 🟢 ${f.time}: ${f.activity} — *"${f.note}"*`);
});

console.log('\n### What pattern repeated from yesterday?');
console.log('*Pattern detection coming soon. For now, review your notes manually.*');

console.log('\n### What would make tomorrow 10% better?');
console.log('- ⚠️ You had more draining activities than energizing ones. Schedule breaks differently?');
console.log('- 🔴 Procrastination happened around 14:00. Schedule hardest tasks before then.');
console.log('- 🟢 You hit flow around 10:00. Block off that time for deep work tomorrow.');

console.log('\n════════════════════════════════════════════════════════════\n');
console.log('✅ This is what you\'ll see in the "Yesterday" tab starting tomorrow!\n');
console.log('👉 Start adding emoji tags to your notes today:\n');
console.log('   ✅ = energizing (left me focused)');
console.log('   ❌ = draining (left me scattered)');
console.log('   🔴 = procrastination trigger');
console.log('   🟢 = flow state (locked in)\n');
