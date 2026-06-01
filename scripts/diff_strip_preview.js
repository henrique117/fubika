#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
function loadTypescript() {
  const tsCandidate = path.join(process.cwd(), 'services', 'web', 'node_modules', 'typescript');
  if (fs.existsSync(tsCandidate)) return require(tsCandidate);
  try { return require('typescript'); } catch (e) { console.error('TypeScript not found. Run npm install in services/web'); process.exit(1); }
}
const ts = loadTypescript();
const target = process.argv[2];
if (!target) {
  console.error('Usage: node diff_strip_preview.js <relative-file-path>');
  process.exit(1);
}
const p = path.join(process.cwd(), target);
const text = fs.readFileSync(p,'utf8');
function removeTsCommentsUsingScanner(text, isTsx) {
  const scanner = ts.createScanner(ts.ScriptTarget.ESNext, false, isTsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard, text);
  let out = '';
  while (true) {
    const token = scanner.scan();
    if (token === ts.SyntaxKind.EndOfFileToken) break;
    const tokenText = scanner.getTokenText();
    if (token === ts.SyntaxKind.SingleLineCommentTrivia || token === ts.SyntaxKind.MultiLineCommentTrivia) {
      const newlines = (tokenText.match(/\n/g) || []).join('');
      if (newlines) out += newlines;
      continue;
    }
    out += tokenText;
  }
  if (!out.endsWith('\n')) out += '\n';
  return out;
}
const processed = removeTsCommentsUsingScanner(text, p.endsWith('.tsx'));

console.log('---- ORIGINAL ----');
console.log(text);
console.log('---- PROCESSED ----');
console.log(processed);

// Also print a simple unified diff of first 400 lines
const origLines = text.split(/\r?\n/);
const procLines = processed.split(/\r?\n/);
console.log('---- DIFF (first 300 lines) ----');
for (let i=0;i<Math.max(origLines.length, procLines.length) && i<300;i++){
  const o = origLines[i]||'';
  const p2 = procLines[i]||'';
  if (o!==p2) console.log(`${i+1}: - ${o}\n      + ${p2}`);
}
