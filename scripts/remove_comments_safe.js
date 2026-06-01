#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadTypescript() {
  const tsCandidate = path.join(process.cwd(), 'services', 'web', 'node_modules', 'typescript');
  if (fs.existsSync(tsCandidate)) return require(tsCandidate);
  try {
    return require('typescript');
  } catch (e) {
    console.error('TypeScript not found. Please run npm install in services/web');
    process.exit(1);
  }
}

const ts = loadTypescript();

const root = path.resolve(process.cwd());
const services = ['web','bot','api'];
const exts = ['.ts', '.tsx', '.css'];

function shouldSkip(filePath) {
  const s = filePath.split(path.sep);
  if (s.includes('node_modules')) return true;
  if (s.includes('.git')) return true;
  if (s.includes('dist')) return true;
  return false;
}

function removeCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\r\n/g,'\n');
}

function removeTsCommentsUsingScanner(text, isTsx) {
  const scanner = ts.createScanner(ts.ScriptTarget.ESNext, /*skipTrivia*/ false, isTsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard, text);
  let out = '';
  while (true) {
    const token = scanner.scan();
    if (token === ts.SyntaxKind.EndOfFileToken) break;
    const tokenText = scanner.getTokenText();
    // Skip comments tokens
    if (token === ts.SyntaxKind.SingleLineCommentTrivia || token === ts.SyntaxKind.MultiLineCommentTrivia) {
      // don't append comment text, but preserve newlines that might be inside comment
      const nl = (tokenText.match(/\n/g) || []).join('');
      if (nl.length) out += nl;
      continue;
    }
    out += tokenText;
  }
  // Ensure file ends with newline
  if (!out.endsWith('\n')) out = out + '\n';
  return out;
}

function processFile(filePath) {
  try {
    const rel = path.relative(root, filePath);
    const ext = path.extname(filePath).toLowerCase();
    let text = fs.readFileSync(filePath, 'utf8');
    let newText = text;
    if (ext === '.css') {
      newText = removeCssComments(text);
    } else if (ext === '.ts' || ext === '.tsx') {
      newText = removeTsCommentsUsingScanner(text, ext === '.tsx');
    }
    if (newText !== text) {
      fs.writeFileSync(filePath, newText, 'utf8');
      console.log('Processed:', rel);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error processing', filePath, e.message);
    return false;
  }
}

function walkAndProcess(base) {
  const dir = path.join(root, 'services', base);
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const stat = fs.statSync(cur);
    if (stat.isDirectory()) {
      const children = fs.readdirSync(cur).map(n => path.join(cur, n));
      for (const c of children) {
        if (shouldSkip(c)) continue;
        stack.push(c);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(cur).toLowerCase();
      if (exts.includes(ext)) {
        const changed = processFile(cur);
        if (changed) count++;
      }
    }
  }
  return count;
}

let total = 0;
for (const s of services) {
  total += walkAndProcess(s);
}
console.log('Total files changed:', total);

process.exit(0);
