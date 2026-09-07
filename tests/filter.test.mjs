import { test } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import spotsData from '../js/spots-data.js';
import filter from '../js/filter.js';

const { filterSpots } = filter;
const spots = spotsData.spots;
const byId = (arr) => arr.map((s) => s.id).sort((a, b) => a - b);

test("typeFilter 'all' returns every spot", () => {
  assert.equal(filterSpots(spots, { typeFilter: 'all' }).length, 15);
});

test('typeFilter selects the matching typeCode', () => {
  assert.deepEqual(byId(filterSpots(spots, { typeFilter: 'NB' })), [1, 2, 3, 4]);
  assert.deepEqual(byId(filterSpots(spots, { typeFilter: 'AB' })), [5, 6, 7, 8]);
  assert.deepEqual(byId(filterSpots(spots, { typeFilter: 'NC' })), [9, 10, 11, 12, 13]);
  assert.deepEqual(byId(filterSpots(spots, { typeFilter: 'AC' })), [14, 15]);
});

test('gradeFilter V7 matches every boulder spot whose range contains V7', () => {
  assert.deepEqual(byId(filterSpots(spots, { gradeFilter: 'V7' })), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('gradeFilter VB matches only ranges that start at VB', () => {
  assert.deepEqual(byId(filterSpots(spots, { gradeFilter: 'VB' })), [1, 2, 3, 4]);
});

test('gradeFilter V14 matches nothing in the current 15 spots', () => {
  assert.equal(filterSpots(spots, { gradeFilter: 'V14' }).length, 0);
});

test('gradeFilter excludes rope and grades:null spots', () => {
  const res = filterSpots(spots, { gradeFilter: 'V0' });
  assert.deepEqual(byId(res), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('grade + type combine with AND', () => {
  assert.deepEqual(byId(filterSpots(spots, { typeFilter: 'AB', gradeFilter: 'V7' })), [5, 6, 7, 8]);
  assert.deepEqual(byId(filterSpots(spots, { typeFilter: 'NC', gradeFilter: 'V0' })), []);
});

test('searchTerm matches zh name, en name and difficulty text', () => {
  assert.deepEqual(byId(filterSpots(spots, { searchTerm: '舂坎角' })), [1]);
  assert.deepEqual(byId(filterSpots(spots, { searchTerm: 'Chung Hom Kok' })), [1]);
  assert.deepEqual(byId(filterSpots(spots, { searchTerm: 'JUST CLIMB' })), [5, 14]);
  assert.deepEqual(byId(filterSpots(spots, { searchTerm: 'Top Rope' })), [14, 15]);
  assert.deepEqual(byId(filterSpots(spots, { searchTerm: 'F8A' })), [9, 10]);
});

test('searchTerm is case-insensitive', () => {
  assert.deepEqual(byId(filterSpots(spots, { searchTerm: 'chung hom kok' })), [1]);
  assert.deepEqual(byId(filterSpots(spots, { searchTerm: 'just climb' })), [5, 14]);
});

test('empty searchTerm matches all spots', () => {
  assert.equal(filterSpots(spots, { searchTerm: '' }).length, 15);
  assert.equal(filterSpots(spots, { searchTerm: '   ' }).length, 15);
});

test('type + grade + search combine with AND', () => {
  assert.deepEqual(byId(filterSpots(spots, { typeFilter: 'NB', gradeFilter: 'V12', searchTerm: '舂坎角' })), [1]);
  assert.deepEqual(byId(filterSpots(spots, { typeFilter: 'NC', searchTerm: '東龍洲' })), [10]);
});

test('filterSpots is pure (does not mutate the input)', () => {
  const before = JSON.stringify(spots);
  filterSpots(spots, { typeFilter: 'AB', gradeFilter: 'V7', searchTerm: 'climb' });
  assert.equal(JSON.stringify(spots), before);
});

test('performance: 300 spots filter in under 10ms', () => {
  const big = Array.from({ length: 300 }, (_, i) => ({ ...spots[i % spots.length], id: 1000 + i }));
  const t0 = performance.now();
  const res = filterSpots(big, { typeFilter: 'all', gradeFilter: null, searchTerm: '' });
  const t1 = performance.now();
  assert.equal(res.length, 300);
  assert.ok(t1 - t0 < 10, `filter took ${(t1 - t0).toFixed(3)}ms`);
});