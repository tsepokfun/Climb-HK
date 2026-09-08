# 攀·香港 - 香港攀岩資訊網站

這是一個專為香港攀岩愛好者設計的資訊網站，提供攀岩場地地圖、入門分類、裝備介紹及攀岩歷史等綜合資訊。

## 📁 專案結構

```
├── index.html          # 首頁（主頁面）
├── style.css           # 全站樣式
├── package.json        # 零依賴 Node 工具鏈（test / validate 指令）
├── CHANGELOG.md        # 更新日誌
├── .github/
│   └── workflows/
│       └── ci.yml      # GitHub Actions CI（push / PR 跑測試與校驗）
├── Map/                # 攀岩地圖頁面
│   └── map.html        # 地圖頁（含難度／類型／關鍵字篩選）
├── Path/               # 入門分類頁面
│   ├── AB.html         # 人工抱石入門
│   ├── AC.html         # 人工攀岩入門
│   ├── NB.html         # 天然抱石入門
│   └── NC.html         # 天然攀登入門
├── gear/               # 裝備介紹
│   └── gear.html       # 裝備頁（支援 ?type= 參數）
├── history/            # 香港攀岩史
│   └── history.html    # 歷史頁
├── image/              # 圖片資源目錄
├── js/                 # 前端資料與邏輯
│   ├── spots-data.js   # 攀岩點資料（唯一資料源，95 個點）
│   ├── grades.js       # 難度解析（V 級／法國級）
│   └── filter.js       # 篩選謂詞（難度 × 類型 × 關鍵字）
├── data/               # 資料來源與快照
│   ├── thecrag-hk-areas-snapshot.json  # 基準區域清單快照
│   └── hk-areas-catalog-draft.md       # 清單草稿（輸入用）
├── tests/              # 單元測試（node --test）
├── tools/              # 資料校驗腳本
│   └── validate-spots.mjs
├── qa/                 # QA 黑盒用例（node qa/run-all.mjs）
│   ├── run-all.mjs     # QA 總跑器
│   ├── gaps.md         # 無法在此測試的缺口清單
│   ├── T-01/           # 單一資料源 + 難度解析 用例
│   ├── T-02/           # 地圖難度篩選 用例
│   └── T-03/           # 首頁接線 用例
└── docs/               # 設計、任務表與維護文件
    ├── design/         # PRD 等設計文件
    │   └── prd-2026-09-08-map-grade-filter-hk-spots.md
    ├── tasks/          # 任務表
    │   └── tasks.md
    ├── decisions/      # 決策記錄（CRD）
    │   └── crd/0001-m2-m3-validator-placement.md
    └── spots-data-guide.md  # 資料維護指南（中文）
```

## ✨ 主要功能

### 1. 首頁 (index.html)
- **導航選單**：固定頂欄，點擊「⋯」展開導航選單
- **繩索進度條**：右側視覺化滾動進度，帶有攀爬小人圖示
- **入門分類**：四個互動卡片（人工抱石、人工攀岩、天然抱石、天然攀登）
- **裝備畫布**：可點擊的互動裝備圖，包含頭盔、攀岩鞋、安全帶等
- **中/英雙語切換**：全站支援繁體中文及英文

### 2. 攀岩地圖 (Map/map.html)
- 互動式地圖，標記香港主要攀岩場地
- 可按類型篩選：天然抱石、人工抱石、天然攀登、人工攀登
- 可按難度篩選：VB、V0–V14（抱石點；攀登點在難度篩選啟動時隱藏）
- 支援關鍵字搜尋（名稱、難度、簡介、交通）
- 點擊地圖標記或側邊欄卡片顯示詳細資訊

### 3. 入門分類頁面 (Path/AB, AC, NB, NC.html)
- 各類型攀岩的定義與特點介紹
- 必要裝備清單
- 初學者技巧與安全注意事項
- 難度分級對照表
- 初學者問卷表單

### 4. 裝備介紹 (gear/gear.html)
- 裝備分類：頭盔、攀岩鞋、安全吊帶、確保器、手套、主繩
- 推薦產品列表，含品牌與型號
- 產品詳細頁面，含產品圖片及描述
- 支援 URL 參數直接跳轉至特定裝備類型（如 `?type=helmet`）

### 5. 攀岩歷史 (history/history.html)
- 時間線呈現香港攀岩發展歷程（1950年代至今）
- 重要事件、人物與里程碑
- 統計數據展示（天然岩場數量、路線數量等）

## 🛠️ 技術特點

- **純原生實現**：HTML/CSS/JavaScript，無需外部依賴
- **單一資料源**：所有攀岩點集中於 `js/spots-data.js`，地圖頁與首頁共用
- **響應式設計**：支援手機及桌面裝置
- **雙語架構**：內建中英文詞典，支援即時切換
- **本地儲存**：語言偏好儲存於 `localStorage`
- **Canvas 互動**：裝備頁面使用 Canvas 繪製並支援點擊熱區檢測
- **滾動視差**：背景圖片滾動效果及區塊淡入淡出

## 🧗 資料維護

網站的全部攀岩點資料集中在單一檔案 `js/spots-data.js`（目前 95 個點）。地圖頁與首頁都從這份檔案讀取，**不要在任何頁面內聯一份點資料**。

- **資料帶地址**：室內館／公共攀石牆（AB/AC）有官方門牌地址，會在地圖卡片顯示；野外點（NB/NC）沒有地址。
- **更新流程（一句話）**：改 `js/spots-data.js`（並同步 `data/thecrag-hk-areas-snapshot.json`）→ 本地跑 `npm test`、`node tools/validate-spots.mjs`、`node qa/run-all.mjs` 三連檢 → 提交 PR 合併，CI 再自動驗證，合入 main 後 GitHub Pages 自動上線。
- **糾錯通道**：發現資料錯誤或缺漏，請開 GitHub Issue，或 fork 後提 Pull Request 修正。
- **定期核對**：每半年（建議 1 月與 7 月）對照 theCrag 香港區與 hongkongclimbing.com 核對一次。

新增或修改攀岩點的完整步驟（欄位表、難度格式規範、坐標取得方法、定期核對 theCrag 與 hongkongclimbing.com 的流程、PR/Issue 糾錯通道）請見：

**[docs/spots-data-guide.md](docs/spots-data-guide.md)**（中文維護指南）

## ✅ 測試與 CI

專案**零依賴**，無需 `npm install`，直接用 Node（已實測 v22.18.0）執行：

```
npm test            # 跑單元測試，等同 node --test tests/*.test.mjs
npm run validate    # 資料校驗，等同 node tools/validate-spots.mjs
node qa/run-all.mjs # QA 黑盒用例
```

- `npm test`：跑 `tests/` 下的難度解析、篩選、資料結構與校驗規則測試（Windows 上不可用 `node --test tests/`，須用 glob 寫法，見 package.json）。
- `npm run validate`：檢查每個點的欄位合法性（id 唯一、坐標範圍、類型碼、雙語非空、難度格式、min ≤ max）並對照快照；輸出 `0 errors, 0 missing areas` 即通過。
- `node qa/run-all.mjs`：跑 `qa/` 下的黑盒用例（T-01／T-02／T-03）。
- GitHub Actions CI（`.github/workflows/ci.yml`）在每次 push 與 pull request 自動跑以上三條命令，並**每週一 09:00 香港時間**（01:00 UTC）定時體檢（自動跑測試與資料校驗）。

## 📱 瀏覽器支援

- Chrome / Edge / Firefox / Safari 最新版本
- iOS / Android 行動裝置瀏覽器

## 🔗 頁面連結關係

```
index.html (首頁)
    ├── Map/map.html (地圖)
    ├── Path/AB.html (人工抱石)
    ├── Path/AC.html (人工攀岩)
    ├── Path/NB.html (天然抱石)
    ├── Path/NC.html (天然攀登)
    ├── gear/gear.html (裝備)
    └── history/history.html (歷史)
```

## 📝 備註

- 產品圖片需放置於 `image/` 目錄下，檔案名稱須與產品型號一致（如 `Solution.png`）
- 地圖圖片 `map.jpg` 建議尺寸為 1000x766 像素以獲得最佳顯示效果
- 所有外部連結（如 GitHub）可依實際需求修改
- 原始碼與問題回報：`https://github.com/tsepokfun/Climb-HK`

---

**攀・香港** — 為攀岩愛好者而設的在地資訊平台 🧗