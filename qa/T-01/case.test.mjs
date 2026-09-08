import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import SPOTS_DATA from '../../js/spots-data.js';
import GRADES from '../../js/grades.js';
import FILTER from '../../js/filter.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const spots = SPOTS_DATA.spots;

test('at least 30 spots', () => {
  assert.ok(Array.isArray(spots), 'spots is an array');
  assert.ok(spots.length >= 30, `expected >= 30 spots, got ${spots.length}`);
});

test('spot ids are unique', () => {
  const ids = spots.map((s) => s.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'all ids unique');
});

test('all four typeCodes present', () => {
  const codes = new Set(spots.map((s) => s.typeCode));
  for (const c of ['NB', 'AB', 'NC', 'AC']) {
    assert.ok(codes.has(c), `typeCode ${c} present`);
  }
});

test('every spot has required fields and non-empty bilingual text', () => {
  const fields = ['id', 'typeCode', 'lat', 'lng', 'diff', 'grades', 'name', 'desc', 'trans', 'gmap', 'source'];
  for (const s of spots) {
    for (const f of fields) {
      assert.ok(f in s, `spot ${s.id} missing field ${f}`);
    }
    for (const part of ['name', 'desc', 'trans']) {
      for (const lang of ['zh', 'en']) {
        assert.strictEqual(typeof s[part][lang], 'string', `spot ${s.id} ${part}.${lang} is a string`);
        assert.ok(s[part][lang].trim().length > 0, `spot ${s.id} ${part}.${lang} is non-empty`);
      }
    }
  }
});

test('grades structure is null | boulder | rope', () => {
  for (const s of spots) {
    if (s.grades === null) continue;
    const keys = Object.keys(s.grades);
    assert.strictEqual(keys.length, 1, `spot ${s.id} grades has exactly one key`);
    const kind = keys[0];
    assert.ok(kind === 'boulder' || kind === 'rope', `spot ${s.id} grades key is boulder|rope`);
    assert.strictEqual(typeof s.grades[kind].min, 'string', `spot ${s.id} ${kind}.min is a string`);
    assert.strictEqual(typeof s.grades[kind].max, 'string', `spot ${s.id} ${kind}.max is a string`);
  }
});

test('lat/lng within Hong Kong bounds', () => {
  for (const s of spots) {
    assert.ok(s.lat >= 22.1 && s.lat <= 22.6, `spot ${s.id} lat ${s.lat} in [22.1,22.6]`);
    assert.ok(s.lng >= 113.8 && s.lng <= 114.5, `spot ${s.id} lng ${s.lng} in [113.8,114.5]`);
  }
});

test('GRADES.V_GRADE_KEYS is exactly VB + V0..V14', () => {
  const expected = ['VB'];
  for (let n = 0; n <= 14; n++) expected.push('V' + n);
  assert.deepStrictEqual(GRADES.V_GRADE_KEYS, expected);
});

test('V7 filter returns exactly the boulder spots whose range contains V7', () => {
  const result = FILTER.filterSpots(spots, { gradeFilter: 'V7' });
  const expected = spots.filter((s) => s.grades && s.grades.boulder &&
    GRADES.gradeContains(GRADES.parseBoulderRange(s.grades.boulder), 'V7'));
  assert.ok(result.length > 0, 'V7 matches some spots');
  const got = result.map((s) => s.id).sort((a, b) => a - b);
  const want = expected.map((s) => s.id).sort((a, b) => a - b);
  assert.deepStrictEqual(got, want);
  for (const s of result) {
    assert.ok(s.grades && s.grades.boulder, `spot ${s.id} is boulder-graded`);
    assert.ok(['NB', 'AB'].includes(s.typeCode), `spot ${s.id} is a boulder type`);
  }
});

test('VB filter returns exactly the boulder spots whose range contains VB', () => {
  const result = FILTER.filterSpots(spots, { gradeFilter: 'VB' });
  const expected = spots.filter((s) => s.grades && s.grades.boulder &&
    GRADES.gradeContains(GRADES.parseBoulderRange(s.grades.boulder), 'VB'));
  assert.ok(result.length > 0, 'VB matches some spots');
  const got = result.map((s) => s.id).sort((a, b) => a - b);
  const want = expected.map((s) => s.id).sort((a, b) => a - b);
  assert.deepStrictEqual(got, want);
});

test('gradeFilter null returns the full set', () => {
  const result = FILTER.filterSpots(spots, { gradeFilter: null });
  assert.strictEqual(result.length, spots.length);
});

test('search matches desc/trans and is case-insensitive', () => {
  const zhHit = FILTER.filterSpots(spots, { searchTerm: '月老石' });
  assert.deepStrictEqual(zhHit.map((s) => s.id), [4]);
  const enHit = FILTER.filterSpots(spots, { searchTerm: 'BUS 6X' });
  assert.deepStrictEqual(enHit.map((s) => s.id), [1]);
});

test('UMD globals match Node imports', () => {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(read('js/spots-data.js'), sandbox);
  assert.ok(sandbox.SPOTS_DATA, 'SPOTS_DATA global exposed');
  assert.strictEqual(JSON.stringify(sandbox.SPOTS_DATA.spots), JSON.stringify(spots));

  vm.runInContext(read('js/grades.js'), sandbox);
  assert.ok(sandbox.GRADES, 'GRADES global exposed');
  assert.strictEqual(JSON.stringify(sandbox.GRADES.V_GRADE_KEYS), JSON.stringify(GRADES.V_GRADE_KEYS));

  vm.runInContext(read('js/filter.js'), sandbox);
  assert.ok(sandbox.FILTER, 'FILTER global exposed');
  const vmRes = sandbox.FILTER.filterSpots(sandbox.SPOTS_DATA.spots, { gradeFilter: 'V7' });
  const impRes = FILTER.filterSpots(spots, { gradeFilter: 'V7' });
  assert.strictEqual(JSON.stringify(vmRes), JSON.stringify(impRes));
});

test('filterSpots over 300 spots < 10ms', () => {
  const big = [];
  for (let i = 0; i < 300; i++) {
    big.push({
      id: 1000 + i,
      typeCode: ['NB', 'AB', 'NC', 'AC'][i % 4],
      lat: 22.1 + (i % 50) / 100,
      lng: 113.8 + (i % 70) / 100,
      diff: 'V0 - V10',
      grades: i % 3 === 0 ? null : { boulder: { min: 'V0', max: 'V' + (i % 14) } },
      name: { zh: '點' + i, en: 'Spot ' + i },
      desc: { zh: 'desc' + i, en: 'desc ' + i },
      trans: { zh: 't' + i, en: 't ' + i },
      gmap: 'https://example.com/' + i,
      source: null,
    });
  }
  const start = process.hrtime.bigint();
  const result = FILTER.filterSpots(big, { typeFilter: 'NB', gradeFilter: 'V7', searchTerm: 'desc' });
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  assert.ok(result.length > 0, 'filter returned some results');
  assert.ok(ms < 10, `filter took ${ms.toFixed(3)}ms, expected < 10ms`);
});