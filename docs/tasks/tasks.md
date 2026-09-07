# 任务表:香港攀岩点地图 — 难度筛选 + 全量数据与维护方案

- 版本:v1
- 日期:2026-09-08
- 对应 PRD:`docs/design/prd-2026-09-08-map-grade-filter-hk-spots.md`
- Shape 说明:全表默认 `solo`(一名工程师先写失败测试再写实现);无 paired 任务(小任务无架构师,不启用 pair)。
- 依赖顺序:T-01 先行;T-02、T-03 在 T-01 后并行;T-04 在 T-01 后(与 T-01 共享 `js/spots-data.js`,必须串行);T-05 在 T-04 后;T-06、T-07 在 T-05 后并行;全部代码任务完成后进入 QA 与评审。

---

## M1 行走骨架

### T-01 单一数据源 + 难度解析/筛选模块(行走骨架)

- **Milestone**:M1
- **Shape**:solo
- **文件**:`js/spots-data.js`、`js/grades.js`、`js/filter.js`、`package.json`、`tests/spots-data.test.mjs`、`tests/grades.test.mjs`、`tests/filter.test.mjs`
- **工作**:新建 UMD 风格模块 `js/spots-data.js`(含现有 15 点,难度改为结构化 `grades` 字段,展示文案由结构化字段生成且与原文一致);`js/grades.js` 提供 V 级/法国级解析与区间判定纯函数;`js/filter.js` 提供「难度 + 类型 + 关键词」AND 组合谓词;`package.json` 提供 `test` 与 `validate` 脚本占位。
- **DoD(验收标准)**:
  1. `node --test tests/` 全绿(即 `npm test` 全绿),且工程师报告展示「测试先红后绿」的证据。
  2. 现有 15 个点迁移后字段齐全(id/typeCode/lat/lng/grades/name/desc/trans/gmap),双语文案与原文一致。
  3. `js/spots-data.js` 在 Node(`import`)与浏览器全局(用 `node:vm` 模拟 `<script>` 加载)两种方式都能取到同一份数据(有测试覆盖)。
  4. 难度解析测试覆盖:VB、V0–V14、"+" 后缀、区间包含判定;法国级 F4–F8B+ 解析;`Top Rope` 等无结构化难度 → `grades: null`。
  5. `js/filter.js` 谓词测试覆盖:难度×类型×搜索三条件叠加。
  6. QA 用例见 `qa/T-01/`(QA 阶段补,本任务不写)。
  7. 300 点内单次筛选 < 10ms(性能断言测试)。

---

## M2 功能与数据

### T-02 地图页接线:难度筛选 UI + 共享数据源

- **Milestone**:M2
- **Shape**:solo
- **文件**:`Map/map.html`
- **工作**:删除内联 `spots` 数组,改为 `<script src="../js/spots-data.js"></script>` 与 `<script src="../js/filter.js"></script>`;筛选条新增「难度 V 级」行(全部/VB/V0–V14,单选,与类型筛选、搜索叠加);双语文案接入 `langDict`;标记与侧栏卡片联动保持现状。
- **DoD(验收标准)**:
  1. 打开 `Map/map.html`:15 个点显示与改造前一致(标记、卡片、弹窗、双语切换均正常)。
  2. 点击任一难度按钮(VB 或 V0–V14):地图标记与侧栏列表即时过滤,只显示难度区间包含该档的抱石点;攀登点在难度筛选激活时隐藏。
  3. 难度筛选与类型筛选、关键词搜索叠加(AND)生效。
  4. 「全部」按钮恢复显示所有点。
  5. 中/EN 切换后:按钮标签、提示文案完整,筛选状态保持。
  6. 单元/QA 测试:`qa/T-02/` 用例全部通过(由 QA 编写,基于本 DoD 黑盒验证)。
  7. 移动端(375px 宽)按钮换行不溢出、可点。

### T-03 首页接线:共享数据源

- **Milestone**:M2
- **Shape**:solo
- **文件**:`index.html`
- **工作**:删除首页内联简化版 `spots` 数组,改为加载 `js/spots-data.js`;首页小地图逻辑改用共享数据(id/typeCode/lat/lng),显示数量随数据源增长;语言检测机制不回归。
- **DoD(验收标准)**:
  1. 打开 `index.html`:首页小地图点数量与 `js/spots-data.js` 中数量一致(改造后 = 全量数据点数量)。
  2. 首页语言自动检测(`navigator.language`)行为不变。
  3. 点击首页地图覆盖层跳转 `Map/map.html` 行为不变。
  4. QA 用例 `qa/T-03/` 全部通过。

### T-04 全量数据入库 + 基准快照

- **Milestone**:M2
- **Shape**:solo
- **文件**:`js/spots-data.js`、`data/thecrag-hk-areas-snapshot.json`
- **依赖**:与 T-01 共享 `js/spots-data.js`,必须串行(T-01 完成后开始)。
- **工作**:以 theCrag 香港区为基准清单、hongkongclimbing.com 指南为复核,人工整理香港主要攀岩区域(含室内馆),全量写入 `js/spots-data.js`;生成 `data/thecrag-hk-areas-snapshot.json`(名称 + 来源 URL,事实性字段);每点补 `source` 字段;描述/交通文案自撰双语,不复制受版权文本。
- **DoD(验收标准)**:
  1. 点数量 ≥ 30,且覆盖全部四类(NB/AB/NC/AC)。
  2. 每点字段齐全,`source` 指向具体来源 URL。
  3. 快照对照零缺失(校验脚本运行输出缺失清单为空)。
  4. 描述文案为自撰双语,不包含从 theCrag/hongkongclimbing.com 复制的受版权文本。
  5. `tests/spots-data.test.mjs` 对全量数据的结构断言仍全绿。

---

## M3 维护与交付

### T-05 数据校验脚本 + 完整性对照

- **Milestone**:M3
- **Shape**:solo
- **文件**:`tools/validate-spots.mjs`、`tests/validate-spots.test.mjs`
- **依赖**:T-04 后开始(对照快照需要全量数据)。
- **工作**:实现校验规则:id 唯一、坐标在香港范围(lat 22.1–22.6、lng 113.8–114.5)、类型码合法、双语字段齐全、难度格式合法、区间 min ≤ max、快照对照缺失清单;`npm run validate` 接入 `package.json`。
- **DoD(验收标准)**:
  1. `npm run validate` 对当前数据输出零错误、缺失清单为空。
  2. 每条校验规则有对应单元测试,且用故意构造的坏数据样本证明「会红」(先红后绿)。
  3. 校验脚本同时能在 Node 中加载 `js/spots-data.js` 与快照并对照。

### T-06 维护文档(中文)+ README 更新

- **Milestone**:M3
- **Shape**:solo
- **文件**:`docs/spots-data-guide.md`、`README.md`
- **依赖**:T-05 后开始。
- **工作**:写中文维护指南(字段表、新增/修改点步骤、坐标获取方法、难度格式规范、每半年核对 theCrag 与 hongkongclimbing.com 的流程、GitHub Issue/PR 纠错通道);README 更新:修正过时目录结构、增加数据维护章节与测试/校验命令。
- **DoD(验收标准)**:
  1. 指南覆盖「新增一个攀岩点」从头到尾的完整步骤,照着做不产生校验错误。
  2. 指南写明定期核对流程(时间、对照对象、操作步骤)。
  3. README 的目录结构与实际一致,包含 `npm test` / `npm run validate` 命令说明。
  4. 文档评审通过(见 QA 与评审阶段)。

### T-07 GitHub Actions CI

- **Milestone**:M3
- **Shape**:solo
- **文件**:`.github/workflows/ci.yml`
- **依赖**:T-05 后开始。
- **工作**:CI 工作流:push 与 PR 触发,运行 `npm test` 与 `npm run validate`(零依赖,直接 `node --test` 与 `node tools/validate-spots.mjs`)。
- **DoD(验收标准)**:
  1. 工作流文件语法正确;本地跑与 CI 相同的两条命令可复现相同结果。
  2. CI 触发条件覆盖 push 与 pull_request。
  3. 不引入任何安装步骤(零依赖前提)。

---

## QA 与评审阶段(全部代码任务完成后)

- QA 编写并运行 `qa/T-01/`、`qa/T-02/`、`qa/T-03/` 黑盒用例(基于各任务 DoD,不读实现)+ `qa/run-all.mjs` 总跑器,全部通过。
- 代码评审:对全部改动 `git diff` 出一轮评审,blocking 项修复。
- 文档评审:PRD、任务表、维护指南、README 各一轮评审,blocking 项修复。
- 安全评审:本次改动不触碰网络/登录/密钥/用户输入解析/新依赖(搜索框为既有代码),按规则跳过并在总结中说明理由。
- git:分支 `crew/map-grade-filter-hk-spots` 提交各任务;推送需用户同意。

---

## Verdicts(评审结论,评审阶段填写)

- T-01:`code: not run — 待评审`、`security: skipped — 不触碰风险面`、`qa: not run — 待 QA`、`doc: not run — 待文档评审`
- T-02:`code: not run — 待评审`、`security: skipped — 不触碰风险面`、`qa: not run — 待 QA`、`doc: not run — 待文档评审`
- T-03:`code: not run — 待评审`、`security: skipped — 不触碰风险面`、`qa: not run — 待 QA`、`doc: not run — 待文档评审`
- T-04:`code: not run — 待评审`、`security: skipped — 不触碰风险面`、`qa: not run — 待 QA`、`doc: not run — 待文档评审`
- T-05:`code: not run — 待评审`、`security: skipped — 不触碰风险面`、`qa: not run — 待 QA`、`doc: not run — 待文档评审`
- T-06:`code: skipped — 无代码`、`security: skipped — 无代码`、`qa: not run — 待 QA`、`doc: not run — 待文档评审`
- T-07:`code: not run — 待评审`、`security: skipped — 不触碰风险面`、`qa: not run — 待 QA`、`doc: not run — 待文档评审`
