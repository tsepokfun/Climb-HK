import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const files = [
  path.join(here, 'T-01', 'case.test.mjs'),
  path.join(here, 'T-02', 'case.test.mjs'),
  path.join(here, 'T-03', 'case.test.mjs'),
];

const failures = [];
for (const f of files) {
  const res = spawnSync(process.execPath, ['--test', f], { stdio: 'inherit' });
  if (res.status !== 0) failures.push(path.basename(path.dirname(f)));
}

if (failures.length === 0) {
  console.log('QA: all pass');
  process.exit(0);
} else {
  console.error('QA: failures in ' + failures.join(', '));
  process.exit(1);
}