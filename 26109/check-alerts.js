const fs = require('fs');
const code = fs.readFileSync('src/pages/Alerts.jsx', 'utf8');
let depth = 0, inStr = false, strChar = '', escaped = false;
for (let i = 0; i < code.length; i++) {
  const c = code[i];
  if (escaped) { escaped = false; continue; }
  if (inStr) {
    if (c === '\\') { escaped = true; continue; }
    if (c === strChar) inStr = false;
    continue;
  }
  if (c === "'" || c === '"' || c === '`') { inStr = true; strChar = c; continue; }
  if (c === '{') depth++;
  if (c === '}') depth--;
  if (depth < 0) { console.log('ERROR: unbalanced braces at pos', i); process.exit(1); }
}
console.log('Brace balance check: OK (final depth=' + depth + ')');
console.log('File size:', code.length, 'bytes');

// Also count the key sections
const hasSlider = code.includes('type="range"');
const hasWatchlist = code.includes('Silent Watchlist');
const hasState = code.includes('const [budgetPercent, setBudgetPercent] = useState(5)');
const hasOnChange = code.includes('onChange={(e) => setBudgetPercent');
console.log('Has useState for budgetPercent:', hasState);
console.log('Has slider input:', hasSlider);
console.log('Has slider onChange:', hasOnChange);
console.log('Has watchlist section:', hasWatchlist);
console.log('Has progress bar:', code.includes('Slot Budget'));
console.log('Has ALERT_BUDGET reference:', code.includes('ALERT_BUDGET.used'));
