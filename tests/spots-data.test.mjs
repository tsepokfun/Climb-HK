import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import spotsData from '../js/spots-data.js';

const { spots, formatGrade, gradeText } = spotsData;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Original difficulty strings, extracted verbatim from Map/map.html.
const expectedDiffs = [
  'VB - V12', 'VB - V12+', 'VB - V12', 'VB - V10',
  'V0 - V10', 'V0 - V7', 'V0 - V7+', 'V0 - V7',
  'F4 - F8A+', 'F4 - F8A+', 'F2B - F8B', 'F5 - F7C+', 'F4 - F7B',
  'Top Rope/Lead', 'Top Rope'
];

const expectedNames = [
  ['舂坎角', 'Chung Hom Kok'],
  ['石澳 - 抱石區', 'Shek O - Bouldering'],
  ['東龍洲 - 抱石', 'Tung Lung Chau - Boulder'],
  ['南丫島', 'Lamma Island'],
  ['JUST CLIMB (新蒲崗店)', 'JUST CLIMB (San Po Kong)'],
  ['Verm City (鰂魚涌)', 'Verm City (Quarry Bay)'],
  ['HK Climbing Park (沙田)', 'HK Climbing Park (Shatin)'],
  ['尚山岩館 (深水埗)', 'Crux (Sham Shui Po)'],
  ['石澳 - 運動攀登', 'Shek O - Sport Climbing'],
  ['東龍洲 - 攀登', 'Tung Lung Chau - Climbing'],
  ['畢架山', 'Beacon Hill'],
  ['獅子山', 'Lion Rock'],
  ['中環岩壁', 'Central Crags'],
  ['JUST CLIMB (啟德)', 'JUST CLIMB (Kai Tak)'],
  ['大角咀體育館', 'Tai Kok Tsui Sports Centre']
];

const expectedDescs = [
  ['約97條路線，花崗岩。路況包括手足並用的攀爬石壁。', 'Around 97 routes on granite. Includes scrambling sections.'],
  ['約143條路線。大頭洲「九宮格」是馳名攀石地。', '143 routes. Tai Tau Chau is famous for its intricate rock textures.'],
  ['東海岸佈滿懸崖峭壁，表面粗糙，摩擦力極佳。', 'East coast cliffs with excellent rough friction.'],
  ['山地塘一帶有多處天然抱石，如月老石等。', 'Multiple natural boulders around Mount Stenhouse.'],
  ['超過100條路線，分4大程度12級難度。', 'Over 100 routes divided into 12 difficulty levels.'],
  ['香港最大抱石場地逾1.8萬呎，設4.5米高牆。', "HK's largest gym (18k sq.ft) with 4.5m walls."],
  ['高達4.5米的室內抱石區域，多達50條抱石路線。', '4.5m tall walls with up to 50 bouldering routes.'],
  ['以動物主題分級，設有人氣訓練板Moonboard。', 'Animal-themed grading, features a Moonboard.'],
  ['包含日落隙及技術牆，考驗力量與平衡。', 'Includes Sunset Crack and Tech Wall, testing power & balance.'],
  ['崖下海浪咆哮，極具挑戰性的海溝及巨牆。', 'Challenging sea cliff walls and gullies above crashing waves.'],
  ['花崗岩表面粗糙，擁有超過60條路線。', 'Rough granite surface with over 60 routes.'],
  ['經典多繩距路線「鬼佬」是必爬路線，可俯瞰維港。', "Classic multi-pitch 'Gweilo' overlooking Victoria Harbour."],
  ['約109條路線，在摩天大廈簇擁下享受攀岩。', 'Around 109 routes nestled among skyscrapers.'],
  ['全港唯一有蓋綜合攀石場。17.5米先鋒牆。', "HK's only covered complex. 17.5m lead wall."],
  ['共設10條路線(高9米)。需持二級運動攀登證書。', '10 routes (9m). Level 2 climbing cert required.']
];

const expectedTrans = [
  ['中環乘6X等巴士至舂坎角道', 'Bus 6X from Central to Chung Hom Kok Rd'],
  ['筲箕灣乘9號巴士', 'Bus 9 from Shau Kei Wan'],
  ['西灣河/三家村乘街渡', 'Ferry from Sai Wan Ho / Sam Ka Tsuen'],
  ['中環4號碼頭乘渡輪', 'Ferry from Central Pier 4'],
  ['新蒲崗', 'San Po Kong'],
  ['鰂魚涌渣華道', 'Java Road, Quarry Bay'],
  ['沙田富豪花園', 'Belair Gardens, Shatin'],
  ['深水埗大南街', 'Tai Nan Street, Sham Shui Po'],
  ['筲箕灣乘9號巴士', 'Bus 9 from Shau Kei Wan'],
  ['乘街渡前往', 'Ferry from Sai Wan Ho'],
  ['石硤尾轉乘32M小巴', 'Minibus 32M from Shek Kip Mei'],
  ['慈雲山徒步上山', 'Hike up from Tsz Wan Shan'],
  ['半山區', 'Mid-Levels'],
  ['啟德體育大道', 'Kai Tak Sports Avenue'],
  ['大角咀福全街', 'Fuk Tsun Street, Tai Kok Tsui']
];

const expectedTypeCodes = ['NB', 'NB', 'NB', 'NB', 'AB', 'AB', 'AB', 'AB', 'NC', 'NC', 'NC', 'NC', 'NC', 'AC', 'AC'];

const expectedGrades = [
  { boulder: { min: 'VB', max: 'V12' } },
  { boulder: { min: 'VB', max: 'V12+' } },
  { boulder: { min: 'VB', max: 'V12' } },
  { boulder: { min: 'VB', max: 'V10' } },
  { boulder: { min: 'V0', max: 'V10' } },
  { boulder: { min: 'V0', max: 'V7' } },
  { boulder: { min: 'V0', max: 'V7+' } },
  { boulder: { min: 'V0', max: 'V7' } },
  { rope: { min: 'F4', max: 'F8A+' } },
  { rope: { min: 'F4', max: 'F8A+' } },
  { rope: { min: 'F2B', max: 'F8B' } },
  { rope: { min: 'F5', max: 'F7C+' } },
  { rope: { min: 'F4', max: 'F7B' } },
  null,
  null
];

test('spots-data has at least 30 spots', () => {
  assert.ok(spots.length >= 30, 'expected >= 30 spots, got ' + spots.length);
});

test('spot ids are unique', () => {
  const ids = spots.map((s) => s.id);
  assert.equal(new Set(ids).size, spots.length);
});

test('every spot has the full required field set', () => {
  for (const s of spots) {
    assert.equal(typeof s.id, 'number', 'id of spot ' + s.id);
    assert.ok(['NB', 'AB', 'NC', 'AC'].includes(s.typeCode), 'typeCode of spot ' + s.id);
    assert.equal(typeof s.lat, 'number', 'lat of spot ' + s.id);
    assert.equal(typeof s.lng, 'number', 'lng of spot ' + s.id);
    assert.equal(typeof s.name.zh, 'string', 'name.zh of spot ' + s.id);
    assert.equal(typeof s.name.en, 'string', 'name.en of spot ' + s.id);
    assert.equal(typeof s.desc.zh, 'string', 'desc.zh of spot ' + s.id);
    assert.equal(typeof s.desc.en, 'string', 'desc.en of spot ' + s.id);
    assert.equal(typeof s.trans.zh, 'string', 'trans.zh of spot ' + s.id);
    assert.equal(typeof s.trans.en, 'string', 'trans.en of spot ' + s.id);
    assert.equal(typeof s.gmap, 'string', 'gmap of spot ' + s.id);
    assert.ok('source' in s, 'source of spot ' + s.id);
    assert.ok('diff' in s, 'diff of spot ' + s.id);
    assert.ok('grades' in s, 'grades of spot ' + s.id);
  }
});

test('bilingual text matches the original HTML verbatim', () => {
  spots.slice(0, 15).forEach((s, i) => {
    assert.equal(s.name.zh, expectedNames[i][0], 'name.zh #' + i);
    assert.equal(s.name.en, expectedNames[i][1], 'name.en #' + i);
    assert.equal(s.desc.zh, expectedDescs[i][0], 'desc.zh #' + i);
    assert.equal(s.desc.en, expectedDescs[i][1], 'desc.en #' + i);
    assert.equal(s.trans.zh, expectedTrans[i][0], 'trans.zh #' + i);
    assert.equal(s.trans.en, expectedTrans[i][1], 'trans.en #' + i);
  });
});

test('type codes match the original classification', () => {
  spots.slice(0, 15).forEach((s, i) => assert.equal(s.typeCode, expectedTypeCodes[i], 'typeCode #' + i));
});

test('grades structure matches the original diff', () => {
  spots.slice(0, 15).forEach((s, i) => assert.deepEqual(s.grades, expectedGrades[i], 'grades #' + i));
});

test('formatGrade reproduces the original diff text', () => {
  assert.equal(formatGrade({ boulder: { min: 'VB', max: 'V12+' } }), 'VB - V12+');
  assert.equal(formatGrade({ boulder: { min: 'V0', max: 'V7+' } }), 'V0 - V7+');
  assert.equal(formatGrade({ rope: { min: 'F4', max: 'F8A+' } }), 'F4 - F8A+');
  assert.equal(formatGrade(null), null);
});

test('gradeText equals the original diff for the first 15 spots', () => {
  spots.slice(0, 15).forEach((s, i) => {
    assert.equal(gradeText(s), expectedDiffs[i], 'diff #' + i);
  });
});

test('UMD: browser global equals the Node import', () => {
  const file = path.join(__dirname, '..', 'js', 'spots-data.js');
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  assert.ok(sandbox.SPOTS_DATA, 'SPOTS_DATA global should be set');
  assert.equal(Array.isArray(sandbox.SPOTS_DATA.spots), true);
  assert.equal(JSON.stringify(sandbox.SPOTS_DATA.spots), JSON.stringify(spots));
});