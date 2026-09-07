/**
 * js/grades.js - pure grade-parsing helpers (no DOM, no I/O).
 *
 * UMD: a browser classic <script> exposes window.GRADES; Node require()/import
 * gets the same object via module.exports (default import).
 *
 * V-scale numeric ordering (monotonic, matches the PRD):
 *   VB = 0, V0 = 1, V1 = 2, ..., V14 = 15; a trailing '+' adds 0.5.
 *   So V7 = 8 and V7+ = 8.5.
 *
 * French (sport) grade ordering - monotonic, six sub-steps per full grade:
 *   value = n + (letter * 2 + plus) / 6
 *   where letter is '' or 'A' (index 0), 'B' (1), 'C' (2), and '+' adds one
 *   sub-step. Examples: F4 = 4.0, F6A = 6.0, F6A+ = 6.167, F6B = 6.333,
 *   F6C+ = 6.833, F8A+ = 8.167, F8B = 8.333, F8B+ = 8.5.
 */
(function (root, factory) {
  if (typeof module === 'object' && module && module.exports) {
    module.exports = factory();
  } else {
    root.GRADES = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // 'VB' plus V0..V14, in climbing order.
  var V_GRADE_KEYS = ['VB'];
  for (var n = 0; n <= 14; n++) V_GRADE_KEYS.push('V' + n);

  // Map a V grade key (e.g. 'V7', 'V7+', 'VB') to a numeric value.
  function vGradeToNum(key) {
    if (typeof key !== 'string') throw new Error('Invalid V grade: expected a string, got ' + typeof key);
    var k = key.trim();
    if (k === 'VB') return 0;
    var m = /^V(1[0-4]|[0-9])\+?$/.exec(k);
    if (!m) throw new Error('Invalid V grade: ' + key);
    var base = Number(m[1]) + 1; // V0 = 1, V1 = 2, ..., V14 = 15
    return k.charAt(k.length - 1) === '+' ? base + 0.5 : base;
  }

  // Convert a { min, max } boulder range (strings) into numeric bounds.
  function parseBoulderRange(range) {
    if (!range || typeof range !== 'object') throw new Error('Boulder range must be an object');
    if (typeof range.min !== 'string' || typeof range.max !== 'string') {
      throw new Error('Boulder range requires string min/max');
    }
    var min = vGradeToNum(range.min);
    var max = vGradeToNum(range.max);
    if (min > max) throw new Error('Boulder range min > max: ' + range.min + ' > ' + range.max);
    return { min: min, max: max };
  }

  // Does a numeric interval contain a V grade key (string) or a numeric value?
  // A '+' boundary that equals the queried base grade + 0.5 is snapped down to
  // that base, so a "V7+" interval counts as containing V7.
  function gradeContains(range, gradeKey) {
    var g = typeof gradeKey === 'number' ? gradeKey : vGradeToNum(gradeKey);
    var isBase = Number.isInteger(g);
    function eff(v) {
      return isBase && v === g + 0.5 ? g : v;
    }
    return eff(range.min) <= g && g <= eff(range.max);
  }

  // Map a French (sport) grade string (e.g. 'F4', 'F8A+') to a numeric value.
  function parseRopeGrade(str) {
    if (typeof str !== 'string') throw new Error('Invalid French grade: expected a string, got ' + typeof str);
    var k = str.trim();
    var m = /^F([1-9])([ABC]?)(\+?)$/.exec(k);
    if (!m) throw new Error('Invalid French grade: ' + str);
    var n = Number(m[1]);
    var letter = m[2];
    var plus = m[3] === '+';
    var letterIndex = letter === '' ? 0 : (letter === 'A' ? 0 : (letter === 'B' ? 1 : 2));
    return n + (letterIndex * 2 + (plus ? 1 : 0)) / 6;
  }

  // Convert a { min, max } rope range (strings) into numeric bounds.
  function parseRopeRange(range) {
    if (!range || typeof range !== 'object') throw new Error('Rope range must be an object');
    if (typeof range.min !== 'string' || typeof range.max !== 'string') {
      throw new Error('Rope range requires string min/max');
    }
    var min = parseRopeGrade(range.min);
    var max = parseRopeGrade(range.max);
    if (min > max) throw new Error('Rope range min > max: ' + range.min + ' > ' + range.max);
    return { min: min, max: max };
  }

  return {
    V_GRADE_KEYS: V_GRADE_KEYS,
    vGradeToNum: vGradeToNum,
    parseBoulderRange: parseBoulderRange,
    gradeContains: gradeContains,
    parseRopeGrade: parseRopeGrade,
    parseRopeRange: parseRopeRange
  };
});