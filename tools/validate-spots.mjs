/**
 * tools/validate-spots.mjs - data validation for js/spots-data.js.
 *
 * Node ESM entry point. Pure validation functions are exported for tests;
 * running this file directly validates the real data and the snapshot.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import spotsData from '../js/spots-data.js';
import grades from '../js/grades.js';

const VALID_TYPE_CODES = ['NB', 'AB', 'NC', 'AC'];
const LAT_MIN = 22.1;
const LAT_MAX = 22.6;
const LNG_MIN = 113.8;
const LNG_MAX = 114.5;
const GMAP_PREFIX = 'https://www.google.com/maps/search/?api=1&query=';
const COORD_TOLERANCE = 0.0005;

// True when `value` is a non-empty string (after trimming).
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Human-readable id label used in every error message.
function idLabel(spot) {
  const id = spot && spot.id;
  if (typeof id === 'number' && Number.isInteger(id) && id > 0) return String(id);
  return JSON.stringify(id);
}

// Validate a single spot's own fields (no cross-spot uniqueness check).
// Returns an array of error strings; an empty array means the spot is valid.
export function validateSpot(spot) {
  if (spot === null || spot === undefined || typeof spot !== 'object') {
    return ['spot: must be an object'];
  }
  const errors = [];
  const label = idLabel(spot);
  const id = spot.id;

  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    errors.push(`spot ${label}: id must be a positive integer`);
  }
  if (typeof spot.lat !== 'number' || spot.lat < LAT_MIN || spot.lat > LAT_MAX) {
    errors.push(`spot ${label}: lat must be a number within [${LAT_MIN}, ${LAT_MAX}]`);
  }
  if (typeof spot.lng !== 'number' || spot.lng < LNG_MIN || spot.lng > LNG_MAX) {
    errors.push(`spot ${label}: lng must be a number within [${LNG_MIN}, ${LNG_MAX}]`);
  }
  if (!VALID_TYPE_CODES.includes(spot.typeCode)) {
    errors.push(`spot ${label}: typeCode must be one of ${VALID_TYPE_CODES.join('/')}`);
  }
  for (const group of ['name', 'desc', 'trans']) {
    for (const lang of ['zh', 'en']) {
      if (!isNonEmptyString(spot[group] && spot[group][lang])) {
        errors.push(`spot ${label}: ${group}.${lang} must be a non-empty string`);
      }
    }
  }
  validateAddress(spot, label, errors);
  validateGmap(spot, label, errors);
  if (!('diff' in spot)) {
    errors.push(`spot ${label}: diff field must exist`);
  }
  validateGrades(spot, label, errors);
  validateDiff(spot, label, errors);
  return errors;
}

// Validate the `address` field: AB/AC require {zh, en} with non-empty strings;
// NB/NC require null.
function validateAddress(spot, label, errors) {
  const indoor = spot.typeCode === 'AB' || spot.typeCode === 'AC';
  const outdoor = spot.typeCode === 'NB' || spot.typeCode === 'NC';
  if (indoor) {
    if (spot.address === null || spot.address === undefined || typeof spot.address !== 'object' || Array.isArray(spot.address)) {
      errors.push(`spot ${label}: address must be {zh, en} for typeCode ${spot.typeCode}`);
      return;
    }
    for (const lang of ['zh', 'en']) {
      if (!isNonEmptyString(spot.address[lang])) {
        errors.push(`spot ${label}: address.${lang} must be a non-empty string`);
      }
    }
  } else if (outdoor) {
    if (spot.address !== null) {
      errors.push(`spot ${label}: address must be null for typeCode ${spot.typeCode}`);
    }
  }
}

// Validate the gmap field: correct prefix and query coords matching lat/lng.
function validateGmap(spot, label, errors) {
  const gmap = spot.gmap;
  if (typeof gmap !== 'string') {
    errors.push(`spot ${label}: gmap must be a string`);
    return;
  }
  if (!gmap.startsWith(GMAP_PREFIX)) {
    errors.push(`spot ${label}: gmap must start with ${GMAP_PREFIX}`);
    return;
  }
  const coord = gmap.slice(GMAP_PREFIX.length);
  const parts = coord.split(',');
  if (parts.length !== 2) {
    errors.push(`spot ${label}: gmap query must be "lat,lng"`);
    return;
  }
  const qLat = parseFloat(parts[0]);
  const qLng = parseFloat(parts[1]);
  if (Number.isNaN(qLat) || Number.isNaN(qLng)) {
    errors.push(`spot ${label}: gmap query lat,lng must be numeric`);
    return;
  }
  if (Math.abs(qLat - spot.lat) > COORD_TOLERANCE) {
    errors.push(`spot ${label}: gmap query lat ${qLat} does not match spot lat ${spot.lat}`);
  }
  if (Math.abs(qLng - spot.lng) > COORD_TOLERANCE) {
    errors.push(`spot ${label}: gmap query lng ${qLng} does not match spot lng ${spot.lng}`);
  }
}

// Validate the `grades` field: null | {boulder:{min,max}} | {rope:{min,max}},
// with each range parseable by the grades helpers and min <= max.
function validateGrades(spot, label, errors) {
  const g = spot.grades;
  if (g === null) return;
  if (typeof g !== 'object' || Array.isArray(g)) {
    errors.push(`spot ${label}: grades must be null or {boulder:{min,max}} or {rope:{min,max}}`);
    return;
  }
  const keys = Object.keys(g);
  if (keys.length !== 1 || (keys[0] !== 'boulder' && keys[0] !== 'rope')) {
    errors.push(`spot ${label}: grades must have exactly one of 'boulder' or 'rope'`);
    return;
  }
  const kind = keys[0];
  try {
    if (kind === 'boulder') grades.parseBoulderRange(g[kind]);
    else grades.parseRopeRange(g[kind]);
  } catch (err) {
    errors.push(`spot ${label}: invalid ${kind} range ${JSON.stringify(g[kind])}: ${err.message}`);
  }
}

// Validate diff consistency: for structured (non-null) grades, `diff` must
// equal the display string generated from grades (min - max). Skipped when
// grades is null.
function validateDiff(spot, label, errors) {
  if (spot.grades === null || spot.grades === undefined) return;
  const expected = spotsData.formatGrade(spot.grades);
  if (expected === null || expected === undefined) return;
  if (spot.diff !== expected) {
    errors.push(`spot ${label}: diff must equal formatGrade(grades): expected ${JSON.stringify(expected)}, got ${JSON.stringify(spot.diff)}`);
  }
}

// Validate the whole spot list, including id uniqueness / duplicates.
// Returns an array of error strings.
export function validateSpots(spots) {
  const errors = [];
  const seen = new Set();
  for (const spot of spots || []) {
    errors.push(...validateSpot(spot));
    const id = spot && spot.id;
    if (typeof id === 'number' && Number.isInteger(id) && id > 0) {
      if (seen.has(id)) {
        errors.push(`spot ${id}: duplicate id (already used by an earlier spot)`);
      } else {
        seen.add(id);
      }
    }
  }
  return errors;
}

// Compare snapshot areas against spot.name.en values and their source URLs.
// For each snapshot entry whose url is non-null, the matching spot's `source`
// must equal it exactly (a null url skips the check). Also reports spots that
// are in the data but absent from the snapshot (reverse). Returns an array of
// error strings; empty means consistent.
export function compareSnapshot(spots, snapshot) {
  const byName = new Map();
  for (const spot of spots || []) {
    const en = spot && spot.name && spot.name.en;
    if (typeof en === 'string' && !byName.has(en)) {
      byName.set(en, spot);
    }
  }
  const snapshotNames = new Set();
  for (const area of (snapshot && snapshot.areas) || []) {
    if (area && typeof area.name === 'string') snapshotNames.add(area.name);
  }
  const issues = [];
  for (const area of (snapshot && snapshot.areas) || []) {
    if (!byName.has(area.name)) {
      issues.push(`missing area: ${area.name}`);
      continue;
    }
    if (area.url === null || area.url === undefined) {
      continue;
    }
    const spot = byName.get(area.name);
    if (spot.source !== area.url) {
      issues.push(`url mismatch for ${area.name}: snapshot ${JSON.stringify(area.url)} != source ${JSON.stringify(spot.source)}`);
    }
  }
  for (const spot of spots || []) {
    const en = spot && spot.name && spot.name.en;
    if (typeof en === 'string' && !snapshotNames.has(en)) {
      issues.push(`spot ${idLabel(spot)}: "${en}" is in spots data but missing from snapshot`);
    }
  }
  return issues;
}

// True when `argv1` (process.argv[1]) resolves to the same file as the given
// import.meta.url. path.resolve normalizes a relative path so the entry check
// also works when the script is invoked from another directory.
export function isEntryPoint(importMetaUrl, argv1) {
  if (!argv1) return false;
  return importMetaUrl === pathToFileURL(resolve(argv1)).href;
}

// --- main (only when run directly, not when imported by a test) ---
if (isEntryPoint(import.meta.url, process.argv[1])) {
  const here = dirname(fileURLToPath(import.meta.url));
  const snapshotPath = join(here, '..', 'data', 'thecrag-hk-areas-snapshot.json');
  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));

  const spots = spotsData.spots;
  const errors = validateSpots(spots);
  const snapshotIssues = compareSnapshot(spots, snapshot);

  for (const message of [...errors, ...snapshotIssues]) {
    console.error(message);
  }
  console.log(`${spots.length} spots, ${errors.length} errors, ${snapshotIssues.length} missing areas`);

  process.exitCode = errors.length === 0 && snapshotIssues.length === 0 ? 0 : 1;
}