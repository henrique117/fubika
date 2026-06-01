#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const child = require('child_process');

function loadTypescript() {
  const tsCandidate = path.join(process.cwd(), 'services', 'web', 'node_modules', 'typescript');
  if (fs.existsSync(tsCandidate)) return require(tsCandidate);
  try { return require('typescript'); } catch (e) { console.error('TypeScript not found. Run npm install in services/web'); process.exit(1); }
}
const ts = loadTypescript();

const root = path.resolve(process.cwd());
const servicesArg = process.argv.slice(2);
const services = servicesArg.length ? servicesArg : ['web','bot','api'];
const exts = ['.ts','.tsx','.css'];

function shouldSkip(p) {
  const parts = p.split(path.sep);
  return parts.includes('node_modules') || parts.includes('.git') || parts.includes('dist');
}

function removeCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\r\n/g, '\n');
}

function removeTsCommentsUsingScanner(text, isTsx) {
  const scanner = ts.createScanner(ts.ScriptTarget.ESNext, false, isTsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard, text);
  let out = '';
  while (true) {
    const token = scanner.scan();
    if (token === ts.SyntaxKind.EndOfFileToken) break;
    const tokenText = scanner.getTokenText();
    if (token === ts.SyntaxKind.SingleLineCommentTrivia || token === ts.SyntaxKind.MultiLineCommentTrivia) {
      // preserve newline characters in comments
      const newlines = (tokenText.match(/\n/g) || []).join('');
      if (newlines) out += newlines;
      continue;
    }
    out += tokenText;
  }
  if (!out.endsWith('\n')) out += '\n';
  return out;
}

function processFile(p) {
  const rel = path.relative(root, p);
  const ext = path.extname(p).toLowerCase();
  const text = fs.readFileSync(p, 'utf8');
  let newText = text;
  if (ext === '.css') newText = removeCssComments(text);
  else if (ext === '.ts' || ext === '.tsx') newText = removeTsCommentsUsingScanner(text, ext === '.tsx');
  if (newText !== text) {
    // backup
    const bak = p + '.bak';
    if (!fs.existsSync(bak)) fs.copyFileSync(p, bak);
    fs.writeFileSync(p, newText, 'utf8');
    console.log('Modified:', rel);
    return bak;
  }
  return null;
}

function walkService(s) {
  const base = path.join(root, 'services', s);
  if (!fs.existsSync(base)) return [];
  const modifiedBaks = [];
  const stack = [base];
  while (stack.length) {
    const cur = stack.pop();
    const stat = fs.statSync(cur);
    if (stat.isDirectory()) {
      for (const f of fs.readdirSync(cur)) {
        const fp = path.join(cur, f);
        if (shouldSkip(fp)) continue;
        stack.push(fp);
      }
    } else if (stat.isFile()) {
      if (exts.includes(path.extname(cur).toLowerCase())) {
        const bak = processFile(cur);
        if (bak) modifiedBaks.push(bak);
      }
    }
  }
  return modifiedBaks;
}

(async function main(){
  console.log('Running safe removal with backups...');
  const allBaks = [];
  for (const s of services) {
    const b = walkService(s);
    allBaks.push(...b);
  }
  console.log('Files backed up:', allBaks.length);

  console.log('Testing builds for processed services...');
  // For each service we processed, if it has a package.json with a build script, run it
  const processedServices = new Set(allBaks.map(b => b.split(path.sep)[2]));
  try {
    for (const s of processedServices) {
      const pkg = path.join(root, 'services', s, 'package.json');
      if (fs.existsSync(pkg)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkg, 'utf8'));
        if (pkgJson.scripts && pkgJson.scripts.build) {
          console.log(`Running build for service: ${s}`);
          const res = child.spawnSync('npm', ['run','build'], {cwd: path.join(root,'services',s), stdio: 'inherit'});
          if (res.status !== 0) throw new Error(`Build failed for service ${s}`);
        }
      }
    }

    console.log('All builds succeeded. Removing backups.');
    for (const b of allBaks) { try { fs.unlinkSync(b); } catch(e) {} }
    console.log('Done.');
    process.exit(0);
  } catch (e) {
    console.error(`${e.message}`);
    console.error('Build failed — restoring backups.');
    for (const b of allBaks) {
      const original = b.slice(0,-4);
      try { fs.copyFileSync(b, original); fs.unlinkSync(b); console.log('Restored:', path.relative(root, original)); } catch(err){ console.error('Restore failed for', original, err.message); }
    }
    console.error('Restored backups due to build failure.');
    process.exit(1);
  }
})();
