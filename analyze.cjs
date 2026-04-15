try {
const fs = require('fs');
let text = fs.readFileSync('eslint.json', 'utf16le');
if (text.charCodeAt(0) === 0xFEFF) {
  text = text.slice(1);
}
const data = JSON.parse(text);
const errors = data.filter(d => d.errorCount > 0);
let output = '';
errors.forEach(e => {
  output += 'File: ' + e.filePath + '\n';
  e.messages.filter(m => m.severity === 2).forEach(m => {
    output += `  Line ${m.line}:${m.column} - ${m.message} (${m.ruleId})\n`;
  });
});
fs.writeFileSync('eslint-summary.txt', output);
console.log('done');
} catch(err) {
  fs.writeFileSync('eslint-summary.txt', String(err));
}
