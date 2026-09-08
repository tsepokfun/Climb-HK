import { test } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import spotsData from '../js/spots-data.js';
import grades from '../js/grades.js';
import filter from '../js/filter.js';

const { filterSpots } = filter;
const spots = spotsData.spots;
const byId = (arr) => arr.map((s) => s.id).sort((a, b) => a - b);

// Reference "full text" of a spot: what searchTerm matches against
// (name.zh + name.en + desc.zh + desc.en + trans.zh + trans.en + difficulty).
// Kept independent of filterSpots so the test asserts the same spec.
function textOf(spot) {
  const g = spot.grades;
  let diffText = '';
  if (typeof spot.diff === 'string') diffText = spot.diff;
  else if (g && g.boulder) diffText = g.boulder.min + ' - ' + g.boulder.max;
  else if (g && g.rope) diffText = g.rope.min + ' - ' + g.rope.max;
  return (spot.name.zh + ' ' + spot.name.en + ' ' + spot.desc.zh + ' ' + spot.desc.en + ' ' + spot.trans.zh + ' ' + spot.trans.en + ' ' + diffText).toLowerCase();
}

test("typeFilter 'all' returns every spot", () => {
  assert.deepEqual(byId(filterSpots(spots, { typeFilter: 'all' })), byId(spots));
});

test('typeFilter selects only the matching typeCode', () => {
  for (const tc of ['NB', 'AB', 'NC', 'AC']) {
    const result = filterSpots(spots, { typeFilter: tc });
    const expected = byId(spots.filter((s) => s.typeCode === tc));
    assert.deepEqual(byId(result), expected, 'typeCode ' + tc);
    // every returned spot satisfies the predicate
    assert.ok(result.every((s) => s.typeCode === tc), 'every spot must be ' + tc);
  }
});

test('gradeFilter returns exactly the boulder spots whose range contains the grade', () => {
  for (const key of ['VB', 'V0', 'V7', 'V12', 'V14']) {
    const result = filterSpots(spots, { gradeFilter: key });
    const expected = byId(spots.filter((s) => {
      return s.grades && s.grades.boulder && grades.gradeContains(grades.parseBoulderRange(s.grades.boulder), key);
    }));
    assert.deepEqual(byId(result), expected, 'gradeFilter ' + key);
  }
});

test('gradeFilter excludes rope and grades:null spots', () => {
  for (const key of ['V0', 'V7', 'V12']) {
    for (const s of filterSpots(spots, { gradeFilter: key })) {
      assert.ok(s.grades && s.grades.boulder, 'spot ' + s.id + ' must have boulder grades');
    }
  }
});

test('searchTerm matches the full bilingual text (name/desc/trans/difficulty)', () => {
  const terms = ['舂坎角', 'chung hom kok', 'F8A+', 'just climb', '花崗岩', 'moonboard', '街渡', 'mid-levels'];
  for (const term of terms) {
    const expected = byId(spots.filter((s) => textOf(s).includes(term.toLowerCase())));
    assert.deepEqual(byId(filterSpots(spots, { searchTerm: term })), expected, 'term ' + term);
  }
});

test('empty searchTerm matches all spots', () => {
  assert.equal(filterSpots(spots, { searchTerm: '' }).length, spots.length);
  assert.equal(filterSpots(spots, { searchTerm: '   ' }).length, spots.length);
});

test('searchTerm matches text that only appears in desc or trans (regression)', () => {
  // A synthetic spot: each term below appears in exactly one desc/trans field
  // and in none of name.zh/name.en/diff, so it only matches once the haystack
  // includes desc and trans (not just name + difficulty).
  const spot = {
    id: 900,
    typeCode: 'NB',
    name: { zh: '名稱', en: 'Name' },
    desc: { zh: '這是簡介文本', en: 'This is the info text' },
    trans: { zh: '搭巴士前往', en: 'Go by bus' },
    grades: { boulder: { min: 'VB', max: 'V0' } },
    diff: 'VB - V0'
  };
  const list = [spot];
  assert.deepEqual(filterSpots(list, { searchTerm: '簡介文本' }).map((s) => s.id), [900]); // desc.zh
  assert.deepEqual(filterSpots(list, { searchTerm: 'info text' }).map((s) => s.id), [900]); // desc.en
  assert.deepEqual(filterSpots(list, { searchTerm: '巴士' }).map((s) => s.id), [900]);       // trans.zh
  assert.deepEqual(filterSpots(list, { searchTerm: 'by bus' }).map((s) => s.id), [900]);     // trans.en
  assert.deepEqual(filterSpots(list, { searchTerm: '不存在的詞' }).map((s) => s.id), []);    // no match
});

test('type + grade + search combine with AND', () => {
  const term = '舂坎角';
  const expected = byId(spots.filter((s) => {
    return s.typeCode === 'NB'
      && s.grades && s.grades.boulder
      && grades.gradeContains(grades.parseBoulderRange(s.grades.boulder), 'V12')
      && textOf(s).includes(term);
  }));
  assert.deepEqual(byId(filterSpots(spots, { typeFilter: 'NB', gradeFilter: 'V12', searchTerm: term })), expected);
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