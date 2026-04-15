const fs = require('fs');
const data = JSON.parse(fs.readFileSync('eslint.json', 'utf8'));
const errors = data.filter(d => d.errorCount > 0);
errors.forEach(e => {
  console.log('File:', e.filePath);
  e.messages.filter(m => m.severity === 2).forEach(m => {
    console.log(`  Line ${m.line}:${m.column} - ${m.message} (${m.ruleId})`);
  });
});
