import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputFlag = process.argv.indexOf('--out-dir');

if (outputFlag !== -1 && !process.argv[outputFlag + 1]) {
  throw new Error('--out-dir requires a directory path');
}

const outputDirectory = path.resolve(
  outputFlag === -1 ? path.join(projectRoot, 'dist') : process.argv[outputFlag + 1],
);

await mkdir(outputDirectory, { recursive: true });
const publicFiles = new Set([
  'dashboard-theme.css',
  'index.html',
  'mitchell-firm-brain.html',
]);
const publicDirectories = new Set(['assets']);
const unexpectedEntries = (await readdir(outputDirectory, { withFileTypes: true }))
  .filter((entry) => (
    (!entry.isFile() || !publicFiles.has(entry.name))
    && (!entry.isDirectory() || !publicDirectories.has(entry.name))
  ))
  .map((entry) => entry.name);

if (unexpectedEntries.length > 0) {
  throw new Error(
    `Refusing unexpected public output: ${unexpectedEntries.join(', ')}`,
  );
}

const outputAssets = path.join(outputDirectory, 'assets');
await mkdir(outputAssets, { recursive: true });
const publicAssets = new Set(['mitchell-firm-logo.png']);
const unexpectedAssets = (await readdir(outputAssets, { withFileTypes: true }))
  .filter((entry) => !entry.isFile() || !publicAssets.has(entry.name))
  .map((entry) => entry.name);

if (unexpectedAssets.length > 0) {
  throw new Error(
    `Refusing unexpected public asset: ${unexpectedAssets.join(', ')}`,
  );
}

await Promise.all([
  copyFile(
    path.join(projectRoot, 'mitchell-firm-brain.html'),
    path.join(outputDirectory, 'index.html'),
  ),
  copyFile(
    path.join(projectRoot, 'mitchell-firm-brain.html'),
    path.join(outputDirectory, 'mitchell-firm-brain.html'),
  ),
  copyFile(
    path.join(projectRoot, 'dashboard-theme.css'),
    path.join(outputDirectory, 'dashboard-theme.css'),
  ),
  copyFile(
    path.join(projectRoot, 'assets', 'mitchell-firm-logo.png'),
    path.join(outputAssets, 'mitchell-firm-logo.png'),
  ),
]);

console.log(`Built static demo in ${outputDirectory}`);
