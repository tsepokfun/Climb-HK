/**
 * js/spots-data.js - single source of truth for all climbing spots.
 *
 * UMD: a browser classic <script> exposes window.SPOTS_DATA; Node import gets
 * the same object via module.exports (default import).
 *
 * Each spot keeps `diff` (the original raw difficulty display string, verbatim
 * from the old inline data) plus a structured `grades` object used for
 * filtering/validation. Spots without a structured difficulty (e.g.
 * "Top Rope/Lead") have grades: null and `diff` remains their display text.
 */
(function (root, factory) {
  if (typeof module === 'object' && module && module.exports) {
    module.exports = factory();
  } else {
    root.SPOTS_DATA = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var spots = [
    // --- Outdoor bouldering (NB) ---
    { id: 1, typeCode: 'NB', lat: 22.213, lng: 114.200, diff: "VB - V12", grades: { boulder: { min: "VB", max: "V12" } }, name: { zh: "舂坎角", en: "Chung Hom Kok" }, desc: { zh: "約97條路線，花崗岩。路況包括手足並用的攀爬石壁。", en: "Around 97 routes on granite. Includes scrambling sections." }, trans: { zh: "中環乘6X等巴士至舂坎角道", en: "Bus 6X from Central to Chung Hom Kok Rd" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.213,114.200", source: null },
    { id: 2, typeCode: 'NB', lat: 22.228, lng: 114.251, diff: "VB - V12+", grades: { boulder: { min: "VB", max: "V12+" } }, name: { zh: "石澳 - 抱石區", en: "Shek O - Bouldering" }, desc: { zh: "約143條路線。大頭洲「九宮格」是馳名攀石地。", en: "143 routes. Tai Tau Chau is famous for its intricate rock textures." }, trans: { zh: "筲箕灣乘9號巴士", en: "Bus 9 from Shau Kei Wan" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.228,114.251", source: null },
    { id: 3, typeCode: 'NB', lat: 22.245, lng: 114.290, diff: "VB - V12", grades: { boulder: { min: "VB", max: "V12" } }, name: { zh: "東龍洲 - 抱石", en: "Tung Lung Chau - Boulder" }, desc: { zh: "東海岸佈滿懸崖峭壁，表面粗糙，摩擦力極佳。", en: "East coast cliffs with excellent rough friction." }, trans: { zh: "西灣河/三家村乘街渡", en: "Ferry from Sai Wan Ho / Sam Ka Tsuen" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.245,114.290", source: null },
    { id: 4, typeCode: 'NB', lat: 22.200, lng: 114.130, diff: "VB - V10", grades: { boulder: { min: "VB", max: "V10" } }, name: { zh: "南丫島", en: "Lamma Island" }, desc: { zh: "山地塘一帶有多處天然抱石，如月老石等。", en: "Multiple natural boulders around Mount Stenhouse." }, trans: { zh: "中環4號碼頭乘渡輪", en: "Ferry from Central Pier 4" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.200,114.130", source: null },

    // --- Gym bouldering (AB) ---
    { id: 5, typeCode: 'AB', lat: 22.335, lng: 114.198, diff: "V0 - V10", grades: { boulder: { min: "V0", max: "V10" } }, name: { zh: "JUST CLIMB (新蒲崗店)", en: "JUST CLIMB (San Po Kong)" }, desc: { zh: "超過100條路線，分4大程度12級難度。", en: "Over 100 routes divided into 12 difficulty levels." }, trans: { zh: "新蒲崗", en: "San Po Kong" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.335,114.198", source: null },
    { id: 6, typeCode: 'AB', lat: 22.292, lng: 114.207, diff: "V0 - V7", grades: { boulder: { min: "V0", max: "V7" } }, name: { zh: "Verm City (鰂魚涌)", en: "Verm City (Quarry Bay)" }, desc: { zh: "香港最大抱石場地逾1.8萬呎，設4.5米高牆。", en: "HK's largest gym (18k sq.ft) with 4.5m walls." }, trans: { zh: "鰂魚涌渣華道", en: "Java Road, Quarry Bay" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.292,114.207", source: null },
    { id: 7, typeCode: 'AB', lat: 22.385, lng: 114.195, diff: "V0 - V7+", grades: { boulder: { min: "V0", max: "V7+" } }, name: { zh: "HK Climbing Park (沙田)", en: "HK Climbing Park (Shatin)" }, desc: { zh: "高達4.5米的室內抱石區域，多達50條抱石路線。", en: "4.5m tall walls with up to 50 bouldering routes." }, trans: { zh: "沙田富豪花園", en: "Belair Gardens, Shatin" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.385,114.195", source: null },
    { id: 8, typeCode: 'AB', lat: 22.328, lng: 114.163, diff: "V0 - V7", grades: { boulder: { min: "V0", max: "V7" } }, name: { zh: "尚山岩館 (深水埗)", en: "Crux (Sham Shui Po)" }, desc: { zh: "以動物主題分級，設有人氣訓練板Moonboard。", en: "Animal-themed grading, features a Moonboard." }, trans: { zh: "深水埗大南街", en: "Tai Nan Street, Sham Shui Po" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.328,114.163", source: null },

    // --- Outdoor climbing (NC) ---
    { id: 9, typeCode: 'NC', lat: 22.230, lng: 114.250, diff: "F4 - F8A+", grades: { rope: { min: "F4", max: "F8A+" } }, name: { zh: "石澳 - 運動攀登", en: "Shek O - Sport Climbing" }, desc: { zh: "包含日落隙及技術牆，考驗力量與平衡。", en: "Includes Sunset Crack and Tech Wall, testing power & balance." }, trans: { zh: "筲箕灣乘9號巴士", en: "Bus 9 from Shau Kei Wan" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.230,114.250", source: null },
    { id: 10, typeCode: 'NC', lat: 22.247, lng: 114.288, diff: "F4 - F8A+", grades: { rope: { min: "F4", max: "F8A+" } }, name: { zh: "東龍洲 - 攀登", en: "Tung Lung Chau - Climbing" }, desc: { zh: "崖下海浪咆哮，極具挑戰性的海溝及巨牆。", en: "Challenging sea cliff walls and gullies above crashing waves." }, trans: { zh: "乘街渡前往", en: "Ferry from Sai Wan Ho" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.247,114.288", source: null },
    { id: 11, typeCode: 'NC', lat: 22.345, lng: 114.165, diff: "F2B - F8B", grades: { rope: { min: "F2B", max: "F8B" } }, name: { zh: "畢架山", en: "Beacon Hill" }, desc: { zh: "花崗岩表面粗糙，擁有超過60條路線。", en: "Rough granite surface with over 60 routes." }, trans: { zh: "石硤尾轉乘32M小巴", en: "Minibus 32M from Shek Kip Mei" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.345,114.165", source: null },
    { id: 12, typeCode: 'NC', lat: 22.352, lng: 114.185, diff: "F5 - F7C+", grades: { rope: { min: "F5", max: "F7C+" } }, name: { zh: "獅子山", en: "Lion Rock" }, desc: { zh: "經典多繩距路線「鬼佬」是必爬路線，可俯瞰維港。", en: "Classic multi-pitch 'Gweilo' overlooking Victoria Harbour." }, trans: { zh: "慈雲山徒步上山", en: "Hike up from Tsz Wan Shan" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.352,114.185", source: null },
    { id: 13, typeCode: 'NC', lat: 22.272, lng: 114.155, diff: "F4 - F7B", grades: { rope: { min: "F4", max: "F7B" } }, name: { zh: "中環岩壁", en: "Central Crags" }, desc: { zh: "約109條路線，在摩天大廈簇擁下享受攀岩。", en: "Around 109 routes nestled among skyscrapers." }, trans: { zh: "半山區", en: "Mid-Levels" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.272,114.155", source: null },

    // --- Gym climbing (AC) ---
    { id: 14, typeCode: 'AC', lat: 22.321, lng: 114.195, diff: "Top Rope/Lead", grades: null, name: { zh: "JUST CLIMB (啟德)", en: "JUST CLIMB (Kai Tak)" }, desc: { zh: "全港唯一有蓋綜合攀石場。17.5米先鋒牆。", en: "HK's only covered complex. 17.5m lead wall." }, trans: { zh: "啟德體育大道", en: "Kai Tak Sports Avenue" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.321,114.195", source: null },
    { id: 15, typeCode: 'AC', lat: 22.320, lng: 114.160, diff: "Top Rope", grades: null, name: { zh: "大角咀體育館", en: "Tai Kok Tsui Sports Centre" }, desc: { zh: "共設10條路線(高9米)。需持二級運動攀登證書。", en: "10 routes (9m). Level 2 climbing cert required." }, trans: { zh: "大角咀福全街", en: "Fuk Tsun Street, Tai Kok Tsui" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.320,114.160", source: null }
  ];

  // Generate the display string from structured grades (null when no grades).
  function formatGrade(grades) {
    if (!grades) return null;
    if (grades.boulder) return grades.boulder.min + ' - ' + grades.boulder.max;
    if (grades.rope) return grades.rope.min + ' - ' + grades.rope.max;
    return null;
  }

  // Display string for a spot: generated from grades, or the raw diff fallback.
  function gradeText(spot) {
    var formatted = formatGrade(spot && spot.grades);
    return formatted !== null && formatted !== undefined ? formatted : ((spot && spot.diff) || '');
  }

  return { spots: spots, formatGrade: formatGrade, gradeText: gradeText };
});