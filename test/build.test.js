const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const projectRoot = path.join(__dirname, '..');

test('production build emits the demo at the deployment root', (t) => {
  const outputDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mitchell-demo-build-'),
  );
  t.after(() => fs.rmSync(outputDirectory, { recursive: true, force: true }));

  const result = spawnSync(
    'npm',
    ['run', 'build', '--', '--out-dir', outputDirectory],
    { cwd: projectRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const index = fs.readFileSync(path.join(outputDirectory, 'index.html'), 'utf8');
  assert.match(index, /<title>Mitchell Firm Brain<\/title>/);
  assert.match(index, /href="dashboard-theme\.css"/);
  assert.match(index, /src="assets\/mitchell-firm-logo\.png"/);
});

test('production build preserves the stylesheet and legacy demo URL', (t) => {
  const outputDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mitchell-demo-build-'),
  );
  t.after(() => fs.rmSync(outputDirectory, { recursive: true, force: true }));

  const result = spawnSync(
    'npm',
    ['run', 'build', '--', '--out-dir', outputDirectory],
    { cwd: projectRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(fs.statSync(path.join(outputDirectory, 'dashboard-theme.css')).size > 0);
  assert.ok(fs.statSync(path.join(outputDirectory, 'mitchell-firm-brain.html')).size > 0);
  const logoPath = path.join(outputDirectory, 'assets', 'mitchell-firm-logo.png');
  assert.equal(fs.existsSync(logoPath), true, 'the production logo should be published');
  assert.ok(fs.statSync(logoPath).size > 0);
  assert.deepEqual(
    fs.readFileSync(logoPath),
    fs.readFileSync(path.join(projectRoot, 'assets', 'mitchell-firm-logo.png')),
  );
  assert.deepEqual(
    fs.readdirSync(outputDirectory).sort(),
    ['assets', 'dashboard-theme.css', 'index.html', 'mitchell-firm-brain.html'],
  );
  assert.deepEqual(
    fs.readdirSync(path.join(outputDirectory, 'assets')),
    ['mitchell-firm-logo.png'],
  );
});

test('production build refuses unexpected files in its public output', (t) => {
  const outputDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mitchell-demo-build-'),
  );
  t.after(() => fs.rmSync(outputDirectory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(outputDirectory, 'private-notes.txt'), 'do not deploy');

  const result = spawnSync(
    'npm',
    ['run', 'build', '--', '--out-dir', outputDirectory],
    { cwd: projectRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unexpected public output/i);
});

test('production build refuses unexpected files in its public assets', (t) => {
  const outputDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mitchell-demo-build-'),
  );
  t.after(() => fs.rmSync(outputDirectory, { recursive: true, force: true }));
  const assetsDirectory = path.join(outputDirectory, 'assets');
  fs.mkdirSync(assetsDirectory);
  fs.writeFileSync(path.join(assetsDirectory, 'private-notes.txt'), 'do not deploy');

  const result = spawnSync(
    'npm',
    ['run', 'build', '--', '--out-dir', outputDirectory],
    { cwd: projectRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unexpected public asset/i);
});

test('production build refuses unexpected directories in its public assets', (t) => {
  const outputDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mitchell-demo-build-'),
  );
  t.after(() => fs.rmSync(outputDirectory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(outputDirectory, 'assets', 'private'), { recursive: true });

  const result = spawnSync(
    'npm',
    ['run', 'build', '--', '--out-dir', outputDirectory],
    { cwd: projectRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unexpected public asset/i);
});
