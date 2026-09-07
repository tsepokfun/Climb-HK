import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import spotsData from '../js/spots-data.js';
import { validateSpot, validateSpots, compareSnapshot } from '../tools/validate-spots.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// A fully valid spot used as the base for "one bad field" cases.
const goodSpot = {
  id: 100,
  typeCode: 'NB',
  lat: 22.3,
  lng: 114.2,
  diff: 'V0 - V5',
  grades: { boulder: { min: 'V0', max: 'V5' } },
  name: { zh: 'Test ZH', en: 'Test Spot' },
  desc: { zh: 'Description ZH', en: 'Description' },
  trans: { zh: 'Transport ZH', en: 'Transport' },
  gmap: 'https://example.com/map',
  source: 'https://example.com'
};

test('validateSpot accepts a fully valid spot', () => {
  assert.deepEqual(validateSpot(goodSpot), []);
});

test('duplicate ids are reported', () => {
  const errors = validateSpots([goodSpot, { ...goodSpot }]);
  assert.ok(errors.some((e) => e.includes('duplicate id')), 'expected a duplicate-id error');
});

test('out-of-range coordinates are reported', () => {
  const bad = { ...goodSpot, lat: 22.7, lng: 114.6 };
  const errors = validateSpot(bad);
  assert.ok(errors.some((e) => e.includes('lat')), 'expected a lat error');
  assert.ok(errors.some((e) => e.includes('lng')), 'expected a lng error');
});

test('invalid typeCode is reported', () => {
  const bad = { ...goodSpot, typeCode: 'XX' };
  assert.ok(validateSpot(bad).some((e) => e.includes('typeCode')), 'expected a typeCode error');
});

test('missing bilingual fields are reported', () => {
  const bad = { ...goodSpot, name: { zh: '', en: 'Test Spot' } };
  assert.ok(validateSpot(bad).some((e) => e.includes('name.zh')), 'expected a name.zh error');
});

test('invalid boulder grade string (VX) is reported', () => {
  const bad = { ...goodSpot, grades: { boulder: { min: 'VX', max: 'V5' } } };
  assert.ok(validateSpot(bad).some((e) => e.includes('invalid boulder range')), 'expected a boulder range error');
});

test('boulder range min > max is reported', () => {
  const bad = { ...goodSpot, grades: { boulder: { min: 'V8', max: 'V3' } } };
  assert.ok(validateSpot(bad).some((e) => e.includes('invalid boulder range')), 'expected a min>max error');
});

test('snapshot areas missing from the data are reported', () => {
  const snapshot = { areas: [{ name: 'Nonexistent Area', url: null }] };
  assert.deepEqual(compareSnapshot([goodSpot], snapshot), ['missing area: Nonexistent Area']);
});

test('real data validates clean: 0 errors, 0 missing areas', () => {
  const spots = spotsData.spots;
  const snapshot = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'thecrag-hk-areas-snapshot.json'), 'utf8'));
  assert.deepEqual(validateSpots(spots), []);
  assert.deepEqual(compareSnapshot(spots, snapshot), []);
  assert.equal(spots.length, 33);
});