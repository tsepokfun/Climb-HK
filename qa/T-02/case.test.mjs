import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const html = readFileSync(path.join(root, 'Map', 'map.html'), 'utf8');

test('loads the three shared scripts in order', () => {
  const a = html.indexOf('../js/spots-data.js');
  const b = html.indexOf('../js/grades.js');
  const c = html.indexOf('../js/filter.js');
  assert.ok(a !== -1, 'spots-data.js script present');
  assert.ok(b !== -1, 'grades.js script present');
  assert.ok(c !== -1, 'filter.js script present');
  assert.ok(a < b && b < c, 'scripts appear in order spots-data -> grades -> filter');
});

test('no inline spots data array', () => {
  assert.ok(!html.includes('const spots = ['), 'no inline `const spots = [` array');
});

test('references SPOTS_DATA.spots, GRADES.V_GRADE_KEYS, FILTER.filterSpots', () => {
  assert.ok(html.includes('SPOTS_DATA.spots'), 'SPOTS_DATA.spots referenced');
  assert.ok(html.includes('GRADES.V_GRADE_KEYS'), 'GRADES.V_GRADE_KEYS referenced');
  assert.ok(html.includes('FILTER.filterSpots'), 'FILTER.filterSpots called');
});

test('langDict has p_grade and grade_all for zh and en', () => {
  assert.ok(html.includes("p_grade: '難度'"), 'zh p_grade present');
  assert.ok(html.includes("grade_all: '全部'"), 'zh grade_all present');
  assert.ok(html.includes("p_grade: 'Grade'"), 'en p_grade present');
  assert.ok(html.includes("grade_all: 'All'"), 'en grade_all present');
});

test('search placeholder still contains 難度', () => {
  const m = /placeholder="([^"]*難度[^"]*)"/.exec(html);
  assert.ok(m, 'placeholder contains 難度');
});

test('page-level style defines .grade-btn', () => {
  assert.ok(html.includes('.grade-btn {'), '.grade-btn defined in page <style>');
});

test('Google Maps API script retained', () => {
  assert.ok(html.includes('maps.googleapis.com'), 'Google Maps script present');
});