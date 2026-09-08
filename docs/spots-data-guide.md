# 香港攀岩点数据维护指南

> 本文档面向未来维护者,说明 `js/spots-data.js` 里的攀岩点数据如何新增、修改、定期核对与验证。
>
> 站点是纯静态、零依赖的网站(无需 `npm install`,无需构建)。数据用一个 JavaScript 文件承载而不是 JSON,原因是用户可能以 `file://` 直接打开页面:浏览器会拦截 `fetch` 本地 JSON,而 `<script src>` 不受影响。

## 1. 数据文件与结构

### 1.1 唯一数据源

- **唯一数据源是 `js/spots-data.js`**(UMD 风格模块)。
- 浏览器通过 `<script src="js/spots-data.js">` 得到全局变量 `window.SPOTS_DATA`;Node 通过 `import spotsData from './js/spots-data.js'` 得到同一份数据(含 `spots` 数组)。
- 地图页 `Map/map.html` 与首页 `index.html` 都从这里读数据。**不要在任何页面里内联一份点数据**(那是本项目此前数据损坏的根源)。

### 1.2 字段表

`spots` 数组里的每个点是一个对象,字段如下:

| 字段 | 类型 | 必填 | 说明 | 示例 |
| --- | --- | --- | --- | --- |
| `id` | 正整数 number | 必填 | 全表唯一、自增,永不复用 | `1` |
| `typeCode` | string | 必填 | 类型码,仅限 `NB` / `AB` / `NC` / `AC` | `"NB"` |
| `lat` | number | 必填 | 纬度,范围 22.1–22.6 | `22.213` |
| `lng` | number | 必填 | 经度,范围 113.8–114.5 | `114.200` |
| `diff` | string | 必填(字段须存在) | 原始难度展示字符串 | `"VB - V12"` |
| `grades` | object 或 null | 必填(可为 null) | 结构化难度,见第 2 节 | `{ boulder: { min: "VB", max: "V12" } }` |
| `name` | `{ zh, en }` | 必填 | 双语名称 | `{ zh: "舂坎角", en: "Chung Hom Kok" }` |
| `desc` | `{ zh, en }` | 必填 | 双语描述(自撰) | `{ zh: "…", en: "…" }` |
| `trans` | `{ zh, en }` | 必填 | 双语交通方式 | `{ zh: "…", en: "…" }` |
| `gmap` | string | 必填 | Google Maps 链接(与 lat/lng 一致) | `"https://www.google.com/maps/search/?api=1&query=22.213,114.200"` |
| `source` | string 或 null | 字段须存在(可为 null) | 数据来源 URL(追溯用);校验脚本不强制内容 | `"https://hongkongclimbing.com/…"` 或 `null` |

> 注意:`name.en` 必须与 `data/thecrag-hk-areas-snapshot.json` 中对应条目的 `name` **完全一致**(快照对照靠它精确匹配,见第 6 节)。

### 1.3 类型码

- `NB` = 天然抱石(Natural Bouldering)
- `AB` = 人工 / 室内抱石(Indoor Bouldering gym)
- `NC` = 天然攀登(Natural Sport / Trad Climbing)
- `AC` = 人工 / 室内攀登(Indoor Lead / Rope wall)

---

## 2. 难度格式规范

### 2.1 抱石 V 级(`grades.boulder`)

- 档位序列:VB、V0、V1、…、V14,共 16 档,**VB 最低**。
- 顺序:VB < V0 < V1 < … < V14。
- `+` 后缀:表示该档再高半档(数值 +0.5)。例如 `V7+` 介于 V7 与 V8 之间;区间判定时 `V7+` 视为包含 V7。
- 写法规则:大写 `V`,后面是数字 0–14(10–14 同样大写),可选 `+`。
- 合法示例:`VB`、`V0`、`V7`、`V12+`。
- 非法示例:`v7`(小写)、`V15`(超出)、`VB+`(VB 无 `+`)。

### 2.2 攀登法国级(`grades.rope`)

- 格式:`F` + 数字(1–9)+ 可选字母(A / B / C)+ 可选 `+`。
- 字母必须**大写** A / B / C;`+` 表示该字母档再高一个子步。
- 合法示例:`F4`、`F5`、`F6A`、`F6A+`、`F7C+`、`F8B+`。
- 数据中实际出现范围:F2B – F8B(F8B+ 仍是合法格式)。
- 非法示例:`f6a`(小写 F)、`F6a`(字母小写)、`F10`(数字超 1–9)、`F6D`(无 D 档)。

### 2.3 `grades` 字段的三种取值

- 抱石:`{ boulder: { min: "VB", max: "V12" } }`
- 攀登:`{ rope: { min: "F4", max: "F8A+" } }`
- 无结构化难度(如 "Top Rope"、"Top Rope/Lead"、"N/A"):`grades: null`,难度筛选时视为无 V 级。

### 2.4 `diff` 与 `grades` 的关系

- 对有结构化难度的点,页面展示文案由 `grades` 自动生成(如 `{ boulder: { min: "VB", max: "V12" } }` → "VB - V12")。
- 对 `grades: null` 的点,页面直接显示 `diff` 的原文案(如 "Top Rope/Lead")。
- 校验脚本只要求 `diff` 字段存在;但修改难度时请把 `grades` 与 `diff` 一起改,保持两者一致。

### 2.5 筛选行为说明

- 难度筛选激活时(在 `Map/map.html` 点选 VB 或 V0–V14 任一档),**只有「难度区间包含该档」的抱石点**(`grades.boulder`)会显示,其余点一律隐藏。
- 被隐藏的包括:
  - **攀登点**(法国级,`grades.rope`)——本次未做法国级筛选 UI,难度筛选激活时隐藏;
  - **没有结构化难度的点**(`grades: null`,如 `Top Rope`、`N/A` 的室内馆)——无 V 级,同样隐藏。
- 区间包含判定:`V7+` 等 `+` 档视为包含其基础档(如选 V7 时,区间含 `V7+` 的点也算命中),见 §2.1。
- **V14 档当前可能无匹配点**:现有数据抱石最高为 `V12+`,点选 V13 / V14 后列表与标记为空属预期,不是 bug。

---

## 3. 新增一个攀岩点(完整步骤)

按顺序做,每一步都不可省略;照做后校验应全绿。

### 步骤 1 — 在数组中追加对象

在 `js/spots-data.js` 的 `spots` 数组末尾追加一个对象(建议按现有注释分组,放进对应类型区段)。

- `id` 取当前数组中最大 id +1(截至本文撰写时最大为 `39`),**不要复用已删除的 id**。
- 11 个字段全部填齐(见 1.2 字段表)。
- 示例:

```js
{ id: 40, typeCode: 'NB', lat: 22.300, lng: 114.220, diff: "V0 - V7", grades: { boulder: { min: "V0", max: "V7" } }, name: { zh: "示例抱石區", en: "Example Blocs" }, desc: { zh: "自撰中文描述。", en: "Original English description." }, trans: { zh: "交通方式", en: "Access" }, gmap: "https://www.google.com/maps/search/?api=1&query=22.300,114.220", source: "https://hongkongclimbing.com/…" }
```

### 步骤 2 — 双语文案自撰

- `name` / `desc` / `trans` 的 `zh` 与 `en` 都要填。
- **只取事实性信息**(名称、坐标、难度、类型)。描述与交通用你自己的话写,**不要复制** theCrag 或 hongkongclimbing.com 的受版权描述文本。

### 步骤 3 — 获取坐标

- 打开 Google Maps,搜索该区域;在目标位置**右键 → 复制坐标**(或点按落点查看坐标)。
- 区域级精度即可:**3 位小数**(约 ±100 米),与现有数据一致。
- 注意顺序:Google Maps 复制的是「纬度, 经度」,前一个填 `lat`、后一个填 `lng`,不要颠倒。

### 步骤 4 — 生成 `gmap` 链接

- 固定格式:`https://www.google.com/maps/search/?api=1&query=<lat>,<lng>`
- `query` 参数必须与 `lat` / `lng` 完全一致(同精度、同顺序)。

### 步骤 5 — 填 `source`

- 填该点的数据来源 URL(theCrag 区域页,或 hongkongclimbing.com 页面)。
- 确实没有明确来源时填 `null`。

### 步骤 6 — 更新快照

在 `data/thecrag-hk-areas-snapshot.json` 的 `areas` 数组加一条:

```json
{ "name": "Example Blocs", "url": "https://hongkongclimbing.com/…" }
```

- `name` 必须与 `spot.name.en` **完全一致**。
- `url` 与 `source` 一致(无来源时 `null`)。

### 步骤 7 — 跑测试与校验

两条命令都要**全绿**:

```
npm test            # 即 node --test tests/*.test.mjs
npm run validate    # 即 node tools/validate-spots.mjs
```

- `npm test`:现有测试对前 15 个点做逐字断言、对全量数据做「≥30 点 + id 唯一」断言;新增点不会破坏前 15 点的断言,但必须保证 id 唯一。
- `npm run validate`:输出形如 `39 spots, 0 errors, 0 missing areas`,且退出码为 0;有任何 error 或 missing area 都要修完再继续。

### 步骤 8 — 提交 PR / Issue

- 仓库地址:`github.com/tsepokfun/Climb-HK`。
- 方式一(推荐):fork 仓库 → 新建分支 → 提交(commit message 说明新增了什么点)→ 推送 → 发起 Pull Request。
- 方式二:直接开 Issue,说明要新增的点与来源,由维护者入库。

---

## 4. 修改一个点

1. 先按 `id` 或 `name.en` 找到该点(在数组内定位)。
2. **`id` 不可变**:任何情况下都不要改 `id`;它是稳定标识,校验要求全表唯一。
3. **改坐标要同步 `gmap`**:改了 `lat` / `lng`,必须同步改 `gmap` 链接里的 `query`,保持一致。
4. **改文案要双语同步**:`name` / `desc` / `trans` 的 `zh` 与 `en` 要一起改,不能只改一种语言。
5. **改难度要同步 `diff`**:改了 `grades`,把 `diff` 也改成一致的展示字符串。
6. **改 `name.en` 要同步快照**:改了 `name.en`,必须同步改快照中对应条目的 `name`,否则 `validate` 报 `missing area`。
7. 改完跑 `npm test` 与 `npm run validate`,全绿才算完成。

---

## 5. 定期核对流程(每半年)

建议每年 **1 月** 与 **7 月** 各做一次,对照两个权威源,把新增 / 改名 / 关闭的区域同步进数据。

对照对象:

- theCrag 香港区:`https://www.thecrag.com/en/climbing/hong-kong`
- hongkongclimbing.com 指南下载页:`https://hongkongclimbing.com/guide-downloads/`(新区域常以免费 PDF 迷你指南形式发布)

操作步骤:

1. 打开上述两个来源,浏览香港各区与室内馆列表。
2. 与 `data/thecrag-hk-areas-snapshot.json` 的 `areas` 清单逐条对比,找出三类差异:
   - **新增区域** → 按第 3 节「新增步骤」入库;
   - **改名区域** → 按第 4 节「修改步骤」更新(含快照);
   - **关闭 / 结业区域** → 从 `spots` 与快照中同时删除(id 不复用)。
3. 跑 `npm test` 与 `npm run validate`,确认全绿(零 error、零 missing area)。
4. 提交 PR(或 Issue),说明本次核对的时间、发现的差异与处理方式。

---

## 6. 校验规则速查

以下规则与 `tools/validate-spots.mjs` 一致;`npm run validate` 就是用它跑真实数据。

| 规则 | 要求 |
| --- | --- |
| id | 正整数,全表唯一 |
| lat | 数字,范围 [22.1, 22.6] |
| lng | 数字,范围 [113.8, 114.5] |
| typeCode | 仅限 `NB` / `AB` / `NC` / `AC` |
| name / desc / trans | `zh` 与 `en` 均须为非空字符串 |
| gmap | 必须是字符串 |
| diff | 字段必须存在 |
| grades | `null`、`{ boulder: {min,max} }` 或 `{ rope: {min,max} }`;min/max 可被难度解析器解析,且 min ≤ max |
| 快照对照 | 快照 `areas` 中每个 `name` 都必须精确匹配某个 `spot.name.en`;缺失即报 `missing area`,通过标准是**零缺失** |

配套测试文件(改动数据后应保持全绿):`tests/spots-data.test.mjs`(点数 / 唯一性 / 结构)、`tests/grades.test.mjs`(难度解析)、`tests/filter.test.mjs`(筛选)、`tests/validate-spots.test.mjs`(校验规则)。