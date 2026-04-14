# Persona Research — 操作手册

> 基于 Nuwa-skill extraction framework + Perskill distill_templates 实践经验。
> 本手册定义从零开始为一个 persona 构建完整 AI agent 技能文件的完整流程。

---

## 一、前置检查：Kill-Switch

在开始之前，诚实回答以下问题。任一答案为"否"，请考虑换一个研究对象。

- [ ] **有书/专著或 60+ 分钟的对抗性来源存在？**（若无，技能会变成传记，而非思维操作系统）
- [ ] **≥2,000 段公开发言（推文/帖子/采访）存在？**（若无，Expression DNA 是噪音）
- [ ] **至少一条记录在案的价值观 vs 行为矛盾？**（若无，要么这个人无聊，要么研究不够深入）
- [ ] **与 Perskill 目标受众（AI builders / operators / vibe coders）相关？**
- [ ] **预计有 8–25 小时的阅读时间可用？**（这是真正的约束，不是 API 消耗）

---

## 二、源类型优先级矩阵

根据 persona 类型选择适用的 Agent（6 个收集 Agent）：

| Persona 类型 | Agent 1 书籍 | Agent 2 访谈 | Agent 3 社交 DNA | Agent 4 对抗报道 | Agent 5 行为记录 | Agent 6 时代窗口 |
|---|---|---|---|---|---|---|
| Crypto/Trading（有社交媒体） | ✅ 高优先 | ✅ | ✅ Twitter/X | ✅ | ✅ | ✅ |
| 中国企业家（无 Twitter） | ⚠️ 无书籍用 am730/微信 | ✅ | ❌ 无 | ✅ | ⚠️ 无法庭文件 | ✅ |
| 投资者/金融家 | ✅ | ✅ | ⚠️ 看情况 | ✅ | ✅ | ✅ |
| 运动员/艺术家 | ⚠️ 传记 | ⚠️ 采访为主 | ❌ | ✅ | ❌ | ⚠️ |
| 导演/创意人士 | ⚠️ 传记 | ✅ | ❌ | ✅ | ❌ | ✅ |

### 中文人物特殊适配

如果目标人物是中文人物且无 Twitter/X：

| 原框架要求 | 替换方案 |
|-----------|----------|
| Agent 1: Published Works（书籍） | 手动获取 20-30 篇代表性文章（am730、公众号等）；标注"无法 API 抓取" |
| Agent 3: Social DNA（Twitter 量化） | 用采访措辞分析替代（无量化数据，用定性语言模式分析） |
| Agent 5: Decision Records（法庭文件） | 用新闻报道中的具体决策记录替代 |

---

## 三、Distill 流程（Step by Step）

> **注意：** 有两个工作流。根据 persona 类型选择：
> - **有 Twitter 的 persona（Crypto/Trading 类）**：使用自动化 pipeline
> - **无 Twitter 的 persona（中文企业家/HK 创业家）**：使用模板化 scaffold + 手动 distillation

### Step 0: 预研究 — 确定 persona 类型

在写任何脚本之前，通过 web search 回答：

1. **是否有 Twitter/X 账号？**
   - 有 → 使用 `--type=TWITTER_CRYPTO`，自动跑 Agent 3（Twitter DNA）
   - 无 → 使用 `--type=CHINESE_BUSINESS` 或 `--type=HK_ENTREPRENEUR`

2. **主要语言？** → 中文 persona 优先中文源
3. **所在行业？** → 决定官方文件和行业报道的优先级
4. **是否有公开演讲习惯？** → 毕业典礼、会议演讲是核心引语来源
5. **是否有上市公司背景？** → 年报和电话会议记录
6. **有哪些关键竞争对手？** → 竞争叙事是理解商业逻辑的关键

### Step 1: 脚手架 — 生成研究项目

```bash
# 生成研究项目模板（推荐）
npx tsx scripts/research/persona-research.ts <id> --type=<TYPE> --name="<Full Name>"

# TYPE 选项：
#   TWITTER_CRYPTO    有活跃 Twitter 的 crypto/trading 人设
#   CHINESE_BUSINESS   无 Twitter 的中文人物企业家
#   HK_ENTREPRENEUR   香港创业家（中文 + 英文媒体）
#   WESTERN_INVESTOR   西方投资人（英文为主）

# 示例：
npx tsx scripts/research/persona-research.ts warren-buffett --type=WESTERN_INVESTOR --name="Warren Buffett"
```

此命令生成：
- `scripts/research/output/{id}/PLAN.md` — 已填好的 Distill Plan
- `scripts/research/output/{id}/SKILL_TEMPLATE.md` — SKILL.md 格式模板
- `scripts/research/output/{id}/triple-verify-log.md` — 空白验证日志
- `scripts/research/output/{id}/validation-log.md` — 空白验证测试
- `skills/{id}/research/` — Git 追踪的最终档案目录
- `scripts/research/{id}-deep.ts` — persona-specific 深度研究脚本

### Step 2: 数据收集 — 运行 pipeline

```bash
# 有 Twitter 的 persona
npx tsx scripts/research/pipeline.ts <handle> --count=500 --deep-research --type=TWITTER_CRYPTO

# 无 Twitter 的 persona（中文人物）
npx tsx scripts/research/pipeline.ts none --skip-tweets --deep-research --type=HK_ENTREPRENEUR

# 自定义抓取（手动指定 URL）
npx tsx scripts/research/firecrawl-research.ts https://zh.wikipedia.org/wiki/施永青
```

pipeline 输出到 `scripts/research/output/{id}/`：
- `00-source-catalog.md` — 所有抓取来源
- `01-tweet-statistics.md` — Twitter 量化分析（自动生成，含语言检测、emoji 统计）
- `PLAN.md` — 已生成的 Plan

### Step 3: 手动蒸馏（关键步骤）

> 这部分需要 LLM 辅助，不能自动化。

1. **读取所有研究文件**，建立直觉（不要边读边记）
2. **列出 15–25 个候选思维模式** → 填入 `triple-verify-log.md`
3. **运行三测验证**，每个候选都要通过 3 个测试
4. **撰写 SKILL.md §4**（Mental Models）— 只放入通过的模型
5. **撰写 §5**（Heuristics）— 被降级的候选放在这里
6. **撰写 §6**（Expression DNA）— 从 `01-tweet-statistics.md` 复制数字
7. **撰写 §8**（Contradictions）— 必须有 3–6 条
8. **撰写 §7**（Timeline）— 用时代边界标记行为变化
9. **填其余章节**（§1, §2, §3, §9, §10, §11）

### Step 4: 验证

```bash
npx tsx scripts/research/run-validation.ts <id>
```

此脚本：
- 检查 `validation-log.md` 中的 Part A（3 个已知声明）和 Part B（1 个新问题）
- 如果 Part A < 2/3 或 Part B 失败，输出错误并阻止 ship
- 生成 `skills/{id}/validation-report.md`

### Step 5: 导出并提交

```bash
# 导出 skills 文件（会自动识别有 research 的 persona 并集成）
npx tsx scripts/export-personas.ts

# Git 提交
git add skills/<id>/
git commit -m "feat(persona): add <name> — <short description>"
git push origin main
```

**导出脚本的 research 集成：**
- 如果 `skills/{id}/research/` 存在 → 导出的 SKILL.md frontmatter 标注 `research_depth: DISTILLED`，Promotion Ledger 和 Contradictions 会自动织入
- 如果没有 research/ → 回退到 generic prompt 生成（等同于原有行为）

### Step 6: LLM 蒸馏格式标准

#### 6.1 思维框架文档格式

每个框架必须有：

```markdown
### 框架名称

**起源**
- {框架形成的具体经历}（三个以内的关键节点）

**核心内容**
- {一句话概括}

**使用条件**（触发场景）
- {在什么情况下应该调用此框架}

**操作步骤**
1. {第一步}
2. {第二步}
3. {第三步}

**示例**（worked example）
{具体的真实案例，说明框架如何应用}

**边界与诚实限制**
- {框架不适用的场景}
- {当事人本人对此框架的诚实评估}
```

#### 6.2 决策日志格式

每个决策案例必须有：

```markdown
## 案例：{决策名称}

**背景**
{当时的情况}

**选项识别**
- A: {选项A及其逻辑}
- B: {选项B及其逻辑}
- C: {选项C及其逻辑}

**最终选择及理由**
{选择的决策及背后的逻辑}

**结果**
{决策后的结果}

**复盘：框架应用**
{这个案例体现了哪些框架？框架在这个案例中如何运作？}

**元教训**
{从这个决策中学到的可迁移教训}
```

#### 6.3 词汇模式文档格式

```markdown
## 词汇模式分析

### 高频核心词汇
| 词汇 | 频次 | 使用场景 | 含义 |
|---|---|---|---|
| {词1} | {频次} | 场景描述 | 含义解读 |

### 签名隐喻
| 隐喻 | 出现场景 | 含义 |
|---|---|---|
| {隐喻1} | {场景} | {解读} |

### 两种沟通语域
1. **公开仪式语域**（毕业典礼、正式演讲）：{特点描述}
2. **内部操作语域**（采访、年报评论）：{特点描述}
```

---

## 四、Triple Verification 测试（三测验证）

### 三个测试

**Test 1 — 跨域再现**
同一框架必须在 ≥2 个不同领域出现（商业决策 + 个人哲学 + 投资 + 创意工作等）。一个领域 = 巧合。两个 = 模式。三个 += 操作系统。

**Test 2 — 生成能力**
该模型必须能让你预测他们在从未公开评论过的问题上的立场。如果唯一知道他们想法的方式是直接引用，那这不是模型，而是流行语。

**Test 3 — 非显而易见 / 专属性**
不是任何聪明 operator 都会想到的东西。模型必须揭示一种独特的视角，深思熟虑的竞争对手会不同意。

### 判决规则

- ✅ 通过 3/3 → Mental Model（包含在 SKILL.md §4，标注 `(N源交叉)` 标签）
- ⚠️ 通过 2/3 → Decision Heuristic（包含在 SKILL.md §5 作为单行描述 + 案例）
- ⚠️ 通过 1/3 → Color detail（可能包含在 Identity Card §3 或 Timeline §7，不是模型）
- ❌ 通过 0/3 → 完全删除

### 候选模型日志格式

|| # | 候选模型 | 领域1证据 | 领域2证据 | 领域3证据 | T1通过？ | 新型预测启用 | T2通过？ | 谁会不同意？ | T3通过？ | 判决 |
|---|-----|----------------|-----------|-----------|-----------|:--------:|------------------|:--------:|----------------|:--------:|---------|
|| 1 | {one-line name} | > "{quote}" — {source, year} | > "{quote}" — {source, year} | {behavioral pattern + source} | ☐ | {novel prediction} | ☐ | {named counter-operator} | ☐ | Model / Heuristic / Cut |

目标：15-25 个候选 → 最终 3-7 个 Mental Model + 5-10 个 Heuristic。

---

## 五、SKILL.md 写作标准

每个 SKILL.md 必须包含 11 个章节：

| 章节 | 内容 | 必需 |
|-------|------|------|
| §1 Role-Play Rules | 角色扮演规则（最重要） | ✅ 必需 |
| §2 Answer Workflow | 回答工作流（Agentic Protocol） | ✅ 必需 |
| §3 Identity Card | 身份卡（第一人称叙事） | ✅ 必需 |
| §4 Core Mental Models | 核心心智模型（3-7个） | ✅ 必需 |
| §5 Decision Heuristics | 决策启发式（5-10条） | ✅ 必需 |
| §6 Expression DNA | 表达 DNA（数据驱动） | ✅ 必需 |
| §7 Timeline | 时间线（最少3个时代，目标是5个） | ✅ 必需 |
| §8 Contradictions | 矛盾（必需 — 3-6条） | ✅ 必需 |
| §9 Values & Anti-patterns | 价值观与反模式 | ✅ 必需 |
| §10 Knowledge Lineage | 知识谱系 | ✅ 必需 |
| §11 Honest Boundaries | 诚实边界 | ✅ 必需 |

### 禁止的反模式

以下内容**不应**作为心智模型：
- 通用美德 — "努力工作"、"专注"、"长期思考" → 删除
- 单域行为 — 仅在一个领域观察到的行为 → 最多作为启发式
- 事后叙事 — 当事人讲述的过去胜利故事，不能预测未来行动 → 仅作为颜色
- 无行为证明的价值观声明 → 删除

---

## 七、验证测试（Harness）

### 3+1 协议

**Part A — 三个已知声明测试（方向一致性）**

选取三个 persona 公开说过的话，但**不是 SKILL.md 中直接引用**的。隐藏真实答案，用技能回答该问题所回应的问题。对比方向。

通过标准：技能的回答与真实回答指向**同一方向**。措辞不重要——方向和推理模式重要。

阈值：3 个中必须有 2 个方向匹配。少于 2 个 → SKILL.md 有问题。重新审视心智模型和启发式。

**Part B — 一个全新问题测试（校准不确定性）**

在一个 persona **没有公开记录**的主题上提出问题。

通过标准：技能以他们的声音回应，应用相关心智模型，并且**明确承认不确定性**。自信捏造 = 失败。

---

## 八、涉及的文件模板

每个 persona 的 skills 文件夹结构：

```
skills/{persona-slug}/
├── SKILL.md               ← 11章节格式（必需）
├── PROFILE.md             ← 快速概览
├── README.md              ← 安装说明
├── validation-log.md      ← 验证测试日志（distill_templates 复制）
└── research/
    ├── README.md          ← 研究档案说明
    ├── 01-{topic}.md     ← 研究文档（按需要编号）
    ├── ...
    ├── triple-verify-log.md  ← 三测验证日志
    ├── raw-extract.json   ← 原始抓取数据
    └── sources.md         ← 完整来源清单
```

---

## 九、Credit Budget 参考

| 工具 | 典型使用量 | 成本估算 |
|------|-----------|----------|
| TwitterAPI.io | 500-20,000 条推文 × 1-3 个账号 | ~$2-8 |
| Firecrawl `/scrape` | 40-80 个长篇 URL | ~$2-4 |
| Firecrawl `/deep-research` | 5 次运行（每个时代1次） | ~$3-6 |
| Firecrawl `/search` | 10-20 个对抗性查询 | ~$1-2 |
| **总预算目标** | | **$8-20 per persona** |

如果花费超过 $25，就是过度收集了。三测验证（TRIPLE_VERIFY.md）是解药，不是更多来源。

---

## 十、研究截止日期管理

每个 persona 必须在 §11 Honest Boundaries 和 SKILL.md frontmatter 中标注：

- `data_freshness`: 最后更新日期
- `nextUpdateDue`: 下次更新日期
- `Research cutoff`: 研究截止日期

建议：活跃人物每 3 个月重新验证；安静人物每 12 个月重新验证。

---

## 十一、参考案例

- **Justin Sun**: `justin-sun-perspective/SKILL.md` — 完整的 distill_templates 格式参考，包含完整的 Twitter DNA 和 triple-verify 日志
- **Li Ka-shing**: `li-ka-shing/SKILL.md` — 无 Twitter 但有完整书籍章节的参考
- **施永青**: `shi-yongqing/SKILL.md` — 无 Twitter + 无书籍 + 中文人物 的完整适配参考

---

*最后更新：2026-04-14*
