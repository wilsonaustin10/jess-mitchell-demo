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
const unexpectedEntries = (await readdir(outputDirectory, { withFileTypes: true }))
  .filter((entry) => !entry.isFile() || !publicFiles.has(entry.name))
  .map((entry) => entry.name);

if (unexpectedEntries.length > 0) {
  throw new Error(
    `Refusing unexpected public output: ${unexpectedEntries.join(', ')}`,
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
]);

console.log(`Built static demo in ${outputDirectory}`);
