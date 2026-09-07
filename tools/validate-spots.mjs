/**
 * tools/validate-spots.mjs - data validation for js/spots-data.js.
 *
 * Node ESM entry point. Pure validation functions are exported for tests;
 * running this file directly validates the real data and the snapshot.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import spotsData from '../js/spots-data.js';
import grades from '../js/grades.js';

const VALID_TYPE_CODES = ['NB', 'AB', 'NC', 'AC'];
const LAT_MIN = 22.1;
const LAT_MAX = 22.6;
const LNG_MIN = 113.8;
const LNG_MAX = 114.5;

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
  if (typeof spot.gmap !== 'string') {
    errors.push(`spot ${label}: gmap must be a string`);
  }
  if (!('diff' in spot)) {
    errors.push(`spot ${label}: diff field must exist`);
  }
  validateGrades(spot, label, errors);
  return errors;
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

// Compare snapshot areas against the spot.name.en values.
// Returns an array of missing-area strings.
export function compareSnapshot(spots, snapshot) {
  const names = new Set();
  for (const spot of spots || []) {
    const en = spot && spot.name && spot.name.en;
    if (typeof en === 'string') names.add(en);
  }
  const missing = [];
  for (const area of (snapshot && snapshot.areas) || []) {
    if (!names.has(area.name)) {
      missing.push(`missing area: ${area.name}`);
    }
  }
  return missing;
}

// --- main (only when run directly, not when imported by a test) ---
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const here = dirname(fileURLToPath(import.meta.url));
  const snapshotPath = join(here, '..', 'data', 'thecrag-hk-areas-snapshot.json');
  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));

  const spots = spotsData.spots;
  const errors = validateSpots(spots);
  const missing = compareSnapshot(spots, snapshot);

  for (const message of [...errors, ...missing]) {
    console.error(message);
  }
  console.log(`${spots.length} spots, ${errors.length} errors, ${missing.length} missing areas`);

  process.exitCode = errors.length === 0 && missing.length === 0 ? 0 : 1;
}