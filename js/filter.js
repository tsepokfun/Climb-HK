/**
 * js/filter.js - pure spot filtering (no DOM, no I/O).
 *
 * UMD: a browser classic <script> exposes window.FILTER (expects window.GRADES
 * to be loaded first); Node require()/import gets the same object.
 */
(function (root, factory) {
  if (typeof module === 'object' && module && module.exports) {
    module.exports = factory(require('./grades.js'));
  } else {
    root.FILTER = factory(root.GRADES);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (grades) {
  'use strict';

  // Difficulty display string for a spot (prefer the raw diff, else generate).
  function difficultyText(spot) {
    if (typeof spot.diff === 'string') return spot.diff;
    var g = spot.grades;
    if (!g) return '';
    if (g.boulder) return g.boulder.min + ' - ' + g.boulder.max;
    if (g.rope) return g.rope.min + ' - ' + g.rope.max;
    return '';
  }

  // Filter spots by type + grade + search term (all AND-ed). Pure.
  function filterSpots(spots, options) {
    var o = options || {};
    var typeFilter = o.typeFilter || 'all';
    var gradeFilter = o.gradeFilter || null;
    var searchTerm = String(o.searchTerm || '').toLowerCase().trim();

    return (Array.isArray(spots) ? spots : []).filter(function (spot) {
      if (typeFilter !== 'all' && spot.typeCode !== typeFilter) return false;

      if (gradeFilter !== null && gradeFilter !== undefined) {
        var g = spot.grades;
        if (!g || !g.boulder) return false; // rope and null grades never match
        var range = grades.parseBoulderRange(g.boulder);
        if (!grades.gradeContains(range, gradeFilter)) return false;
      }

      if (searchTerm) {
        var haystack = (spot.name.zh + ' ' + spot.name.en + ' ' + spot.desc.zh + ' ' + spot.desc.en + ' ' + spot.trans.zh + ' ' + spot.trans.en + ' ' + difficultyText(spot)).toLowerCase();
        if (haystack.indexOf(searchTerm) === -1) return false;
      }

      return true;
    });
  }

  return { filterSpots: filterSpots };
});