import { test } from 'node:test';
import assert from 'node:assert/strict';
import grades from '../js/grades.js';

const { V_GRADE_KEYS, vGradeToNum, parseBoulderRange, gradeContains, parseRopeGrade, parseRopeRange } = grades;

test('V_GRADE_KEYS lists VB then V0..V14', () => {
  assert.equal(V_GRADE_KEYS.length, 16);
  assert.equal(V_GRADE_KEYS[0], 'VB');
  assert.equal(V_GRADE_KEYS[15], 'V14');
  for (let n = 0; n <= 14; n++) {
    assert.equal(V_GRADE_KEYS[n + 1], 'V' + n);
  }
});

test('vGradeToNum maps VB=0, V0=1, ..., V14=15', () => {
  assert.equal(vGradeToNum('VB'), 0);
  assert.equal(vGradeToNum('V0'), 1);
  assert.equal(vGradeToNum('V1'), 2);
  assert.equal(vGradeToNum('V7'), 8);
  assert.equal(vGradeToNum('V14'), 15);
});

test('vGradeToNum adds 0.5 for a + suffix', () => {
  assert.equal(vGradeToNum('V0+'), 1.5);
  assert.equal(vGradeToNum('V7+'), 8.5);
  assert.equal(vGradeToNum('V12+'), 13.5);
});

test('vGradeToNum throws on invalid keys', () => {
  for (const bad of ['V15', 'V', 'V99', 'F4', 'X', '', 'v7']) {
    assert.throws(() => vGradeToNum(bad), /Invalid V grade/);
  }
});

test('parseBoulderRange converts min/max to a numeric range', () => {
  assert.deepEqual(parseBoulderRange({ min: 'VB', max: 'V12' }), { min: 0, max: 13 });
  assert.deepEqual(parseBoulderRange({ min: 'V0', max: 'V7+' }), { min: 1, max: 8.5 });
  assert.deepEqual(parseBoulderRange({ min: 'V7+', max: 'V7+' }), { min: 8.5, max: 8.5 });
});

test('parseBoulderRange throws on invalid or reversed input', () => {
  assert.throws(() => parseBoulderRange({ min: 'V10', max: 'V0' }), /min > max/);
  assert.throws(() => parseBoulderRange({ min: 'V0' }), /requires string min\/max/);
  assert.throws(() => parseBoulderRange({ min: 'V0', max: 'V99' }), /Invalid V grade/);
  assert.throws(() => parseBoulderRange(null), /must be an object/);
});

test('gradeContains judges interval membership', () => {
  assert.equal(gradeContains({ min: 0, max: 13 }, 'V7'), true);
  assert.equal(gradeContains({ min: 1, max: 8.5 }, 'V7'), true);
  assert.equal(gradeContains({ min: 8.5, max: 8.5 }, 'V7'), true); // a V7+ interval contains V7
  assert.equal(gradeContains({ min: 9, max: 9 }, 'V7'), false);     // V8 does not
  assert.equal(gradeContains({ min: 0, max: 13 }, 'V14'), false);   // max below V14
  assert.equal(gradeContains({ min: 0, max: 15 }, 'V14'), true);
  assert.equal(gradeContains({ min: 0, max: 0 }, 'VB'), true);
  assert.equal(gradeContains({ min: 1, max: 13 }, 'VB'), false);
});

test('gradeContains accepts a numeric grade key', () => {
  assert.equal(gradeContains({ min: 1, max: 8 }, 8), true);
  assert.equal(gradeContains({ min: 1, max: 8 }, 0), false);
});

test('parseRopeGrade uses a documented monotonic French ordering', () => {
  assert.equal(parseRopeGrade('F4'), 4.0);
  assert.equal(parseRopeGrade('F5'), 5.0);
  assert.ok(Math.abs(parseRopeGrade('F2B') - (2 + 2 / 6)) < 1e-9);
  assert.ok(Math.abs(parseRopeGrade('F8A+') - (8 + 1 / 6)) < 1e-9);
  assert.ok(Math.abs(parseRopeGrade('F8B') - (8 + 2 / 6)) < 1e-9);
  assert.ok(Math.abs(parseRopeGrade('F8B+') - (8 + 3 / 6)) < 1e-9);
  assert.ok(Math.abs(parseRopeGrade('F7C+') - (7 + 5 / 6)) < 1e-9);
  assert.ok(Math.abs(parseRopeGrade('F7B') - (7 + 2 / 6)) < 1e-9);
});

test('parseRopeGrade is strictly monotonic across the F4..F8B+ range', () => {
  const seq = ['F4', 'F5', 'F6A', 'F6A+', 'F6B', 'F6B+', 'F6C', 'F6C+', 'F7A', 'F7A+', 'F7B', 'F7B+', 'F7C', 'F7C+', 'F8A', 'F8A+', 'F8B', 'F8B+'];
  for (let i = 1; i < seq.length; i++) {
    assert.ok(parseRopeGrade(seq[i - 1]) < parseRopeGrade(seq[i]), seq[i - 1] + ' < ' + seq[i]);
  }
});

test('parseRopeRange converts min/max to a numeric range', () => {
  assert.deepEqual(parseRopeRange({ min: 'F4', max: 'F8A+' }), { min: 4.0, max: 8 + 1 / 6 });
  assert.deepEqual(parseRopeRange({ min: 'F2B', max: 'F8B' }), { min: 2 + 2 / 6, max: 8 + 2 / 6 });
  assert.deepEqual(parseRopeRange({ min: 'F5', max: 'F7C+' }), { min: 5.0, max: 7 + 5 / 6 });
});

test('parseRopeRange throws on invalid input', () => {
  assert.throws(() => parseRopeRange({ min: 'F4', max: 'G4' }), /Invalid French grade/);
  assert.throws(() => parseRopeRange({ min: 'F8B+', max: 'F4' }), /min > max/);
  assert.throws(() => parseRopeRange({ min: 'F4' }), /requires string min\/max/);
  assert.throws(() => parseRopeRange(null), /must be an object/);
});