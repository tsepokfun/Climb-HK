import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');

test('<script src="js/spots-data.js"> present', () => {
  assert.ok(html.includes('<script src="js/spots-data.js"></script>'), 'script tag present');
});

test('no inline simplified spots array', () => {
  assert.ok(!html.includes('const spots = ['), 'no inline `const spots = [` array');
  assert.ok(!html.includes('簡化'), 'no 簡化 comment');
});

test('SPOTS_DATA.spots referenced', () => {
  assert.ok(html.includes('SPOTS_DATA.spots'), 'reference present');
});

test('navigator.language detection retained', () => {
  assert.ok(html.includes('navigator.language'), 'navigator.language present');
});

test('Map/map.html jump retained', () => {
  assert.ok(html.includes("window.location.href = 'Map/map.html'"), 'jump code present');
});