import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import spotsData from '../js/spots-data.js';
import { validateSpot, validateSpots, compareSnapshot } from '../tools/validate-spots.mjs';
import * as validators from '../tools/validate-spots.mjs';

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
  address: null,
  gmap: 'https://www.google.com/maps/search/?api=1&query=22.3,114.2',
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
  const errors = compareSnapshot([goodSpot], snapshot);
  assert.ok(errors.some((e) => e.includes('missing area: Nonexistent Area')), 'expected a missing-area error');
});

test('snapshot url mismatch with spot source is reported', () => {
  const spot = { ...goodSpot, name: { zh: 'Test ZH', en: 'Match Area' }, source: 'https://actual.example.com' };
  const snapshot = { areas: [{ name: 'Match Area', url: 'https://snapshot.example.com' }] };
  const errors = compareSnapshot([spot], snapshot);
  assert.ok(errors.some((e) => e.includes('url mismatch')), 'expected a url mismatch error');
});

test('snapshot url equal to spot source is not reported', () => {
  const spot = { ...goodSpot, name: { zh: 'Test ZH', en: 'Match Area' }, source: 'https://same.example.com' };
  const snapshot = { areas: [{ name: 'Match Area', url: 'https://same.example.com' }] };
  assert.deepEqual(compareSnapshot([spot], snapshot), []);
});

test('snapshot url null skips the source comparison', () => {
  const spot = { ...goodSpot, name: { zh: 'Test ZH', en: 'Match Area' }, source: 'https://actual.example.com' };
  const snapshot = { areas: [{ name: 'Match Area', url: null }] };
  assert.deepEqual(compareSnapshot([spot], snapshot), []);
});

test('spot in data but missing from snapshot is reported', () => {
  const spot = { ...goodSpot, name: { zh: 'Test ZH', en: 'Data Only Area' } };
  const snapshot = { areas: [{ name: 'Other Area', url: null }] };
  const errors = compareSnapshot([spot], snapshot);
  assert.ok(errors.some((e) => e.includes('missing from snapshot')), 'expected a reverse-missing error');
});

test('diff inconsistent with grades is reported', () => {
  const bad = { ...goodSpot, diff: 'V0 - V6' };
  assert.ok(validateSpot(bad).some((e) => e.includes('formatGrade')), 'expected a diff consistency error');
});

test('diff consistency is skipped when grades is null', () => {
  const spot = { ...goodSpot, diff: 'Top Rope', grades: null };
  assert.deepEqual(validateSpot(spot), []);
});

test('gmap with wrong prefix is reported', () => {
  const bad = { ...goodSpot, gmap: 'https://example.com/map' };
  assert.ok(validateSpot(bad).some((e) => e.includes('gmap must start with')), 'expected a gmap prefix error');
});

test('gmap query coords mismatching lat/lng is reported', () => {
  const bad = { ...goodSpot, gmap: 'https://www.google.com/maps/search/?api=1&query=22.999,114.999' };
  const errors = validateSpot(bad);
  assert.ok(errors.some((e) => e.includes('gmap query lat')), 'expected a gmap lat mismatch');
  assert.ok(errors.some((e) => e.includes('gmap query lng')), 'expected a gmap lng mismatch');
});

test('AB spot missing address is reported', () => {
  const bad = { ...goodSpot, typeCode: 'AB', address: null };
  assert.ok(validateSpot(bad).some((e) => e.includes('address must be {zh, en}')), 'expected an AB address error');
});

test('AB spot with empty address.zh is reported', () => {
  const bad = { ...goodSpot, typeCode: 'AB', address: { zh: '', en: 'Test Address' } };
  assert.ok(validateSpot(bad).some((e) => e.includes('address.zh')), 'expected an address.zh error');
});

test('AB spot with empty address.en is reported', () => {
  const bad = { ...goodSpot, typeCode: 'AB', address: { zh: '地址', en: '  ' } };
  assert.ok(validateSpot(bad).some((e) => e.includes('address.en')), 'expected an address.en error');
});

test('NB spot with non-null address is reported', () => {
  const bad = { ...goodSpot, address: { zh: 'X', en: 'Y' } };
  assert.ok(validateSpot(bad).some((e) => e.includes('address must be null')), 'expected an NB address-null error');
});

test('NC spot with non-null address is reported', () => {
  const bad = { ...goodSpot, typeCode: 'NC', address: 'not-null' };
  assert.ok(validateSpot(bad).some((e) => e.includes('address must be null')), 'expected an NC address-null error');
});

test('AC spot with valid address is accepted', () => {
  const good = { ...goodSpot, typeCode: 'AC', address: { zh: '香港某地址', en: 'Some Address, Hong Kong' } };
  assert.deepEqual(validateSpot(good), []);
});

test('isEntryPoint matches the file itself', () => {
  assert.equal(validators.isEntryPoint(import.meta.url, join(__dirname, 'validate-spots.test.mjs')), true);
});

test('isEntryPoint is false for a different file', () => {
  assert.equal(validators.isEntryPoint(import.meta.url, join(__dirname, '..', 'tools', 'validate-spots.mjs')), false);
});

test('isEntryPoint is false without argv[1]', () => {
  assert.equal(validators.isEntryPoint(import.meta.url, undefined), false);
});

test('real data validates clean: 0 errors, 0 missing areas', () => {
  const spots = spotsData.spots;
  const snapshot = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'thecrag-hk-areas-snapshot.json'), 'utf8'));
  assert.deepEqual(validateSpots(spots), []);
  assert.deepEqual(compareSnapshot(spots, snapshot), []);
  assert.ok(spots.length >= 30);
});