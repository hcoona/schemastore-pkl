<!--
 Copyright 2025 Shuai Zhang
 SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
-->

# JSON Schema 版本升级工具调查

## **You:**

JSON Schema 出了好几个版本了，有什么升级工具自动把旧的 Schema 升级成新的 Schema 吗？

## **ChatGPT:**

有，但属于“半自动”，还没有一个**万能一键升级所有 JSON Schema 的官方工具**。大概有几类东西可以用：

### 1. Node.js 生态：json-schema-migrate / Ajv CLI

#### 1）`json-schema-migrate` / `json-schema-migrate-x`

这是 Ajv 作者出的一个小库，专门把 **draft-04** 的 JSON Schema 迁到更新版本（draft-07、2019-09、2020-12）[GitHub](https://github.com/ajv-validator/json-schema-migrate)。
新的 `json-schema-migrate-x` 是社区维护的 fork，支持同样的目标版本[NPM](https://www.npmjs.com/package/json-schema-migrate-x?utm_source=chatgpt.com)。

它会自动帮你做一批机械性的改写，比如：[GitHub](https://github.com/ajv-validator/json-schema-migrate)

- `id` → `$id`

- `$schema` 切到对应 meta-schema（draft-07 / 2019-09 / 2020-12）

- 布尔版 `exclusiveMinimum/Maximum` 改成数字版本

- 单元素 `enum` → `const`，非标准 `constant` → `const`

- 迁到 2019-09/2020-12 时，把
    - `definitions` → `$defs`

    - `dependencies` → `dependentRequired` / `dependentSchemas`

    - `items` 数组形式 → `prefixItems` 等

**简单用法（Node.js）：**

```js
const migrate = require('json-schema-migrate');
const schema = {
    id: 'my-schema',
    minimum: 1,
    exclusiveMinimum: true,
};

migrate.draft2020(schema);
// schema 现在大致变成：
// {
//   $id: 'my-schema',
//   exclusiveMinimum: 1,
//   $schema: 'https://json-schema.org/draft/2020-12/schema'
//   ...
// }
console.log(schema);
```

你可以选 `migrate.draft7` / `migrate.draft2019` / `migrate.draft2020`。

---

#### 2）`ajv-cli` 的 `ajv migrate` 命令

如果你只是想命令行批量跑，不想写代码，可以用 Ajv 的 CLI 工具：`ajv-cli`。
它内置一个 `migrate` 子命令，底层就是调用 `json-schema-migrate` 来把 **draft-04** schema 迁到 draft-07 / 2019-09 / 2020-12。[ajv.js.org+1](https://ajv.js.org/guide/environments.html)

典型用法（假设你已经 `npm i -g ajv-cli`）：

```bash
# 把 old-schema.json 从旧 draft 迁到 draft-2020-12
ajv migrate -s old-schema.json --spec=draft2020 -o new-schema.json

# 批量迁移文件（写回原文件，同时生成 .bak 备份）
ajv migrate -s "schemas/*.json"
```

说明：

- `-s`：输入 schema 文件（可用多次或通配符）

- `-o`：输出文件（不指定就覆盖原文件并保留 `.bak`）

- `--spec=`：目标版本，可选 `draft7` / `draft2019` / `draft2020`（不同版本的 CLI 细节略有差异）

> 这一套比较适合“旧项目是 draft-04，现在想升级到新 Ajv / 新 JSON Schema 版本”的场景。

### 2. 图形界面工具：Oxygen JSON Editor / XML Editor

如果你想用 GUI 而不是 Node 脚本，可以看一下 **Oxygen JSON Editor/XML Editor**。
它的 JSON Schema tools 里明确写着可以：

> “update older JSON schemas to the latest versions（更新旧的 JSON Schema 到最新版本）”[Oxygen XML](https://www.oxygenxml.com/xml_editor/json_schema_tools.html)

同时还支持：

- 生成示例 JSON

- 从 JSON 反向生成 Schema

- 生成 HTML 文档等

缺点是：商业软件，适合你已经在用 Oxygen 的团队；不适合只想在 CI 里简单跑个命令的场景。

### 3. 官方文档级别的“升级指南”

JSON Schema 官方站点有一个 **“Migrating from older drafts”** 页面，按版本列出了从 draft-04 → draft-06、draft-06 → draft-07、draft-07 → 2019-09、2019-09 → 2020-12 的迁移说明和注意点[json-schema.org](https://json-schema.org/specification)。

这些不是工具，而是**人工修改 schema 时的 checklist**，比如：

- 哪些关键字被废弃 / 替换

- 哪些行为语义有变化（比如 `exclusiveMinimum` 的含义）

- `definitions` / `$defs` / `$anchor` / `$dynamicRef` 等如何迁移

通常实际做法是：

1. 用 `json-schema-migrate` / `ajv migrate` 做一遍机械转换；

2. 再对照官方 migration guide 手工检查、修关键地方。

### 4. 一些现实限制（为什么没有“完美自动升级”）

简单总结下“坑”：

1. **工具主要针对 draft-04 → 更高版本**
    - 真正被支持自动迁移的主线基本是 draft-04 起步。再早的草案几乎没人管了。

2. **只能做“语法和标准层面”的机械转换**
    - 比如关键字改名、meta-schema URL 改变、

    - 但碰到“业务语义”相关的变化（比如你以前用某些模式来表达含义，现在想换一种建模），工具完全不知道你的意图。

3. **数据迁移 ≠ Schema 迁移**
    - 上面这些工具只是改“Schema 文件本身”。

    - 如果你对数据格式也有变更（字段重命名、结构重组），那必须自己写脚本（jq / Python / Node 等）来 **迁移数据**，Schema 只是描述规则。

### 5. 实际推荐的几种路线

你可以根据技术栈和需求选一个：

#### 方案 A：Node/TS 项目

- 依赖少、可写脚本 → 用 `json-schema-migrate` 或 `ajv-cli`

- 典型流程：
    1. 在一个分支上跑 `ajv migrate` 或自己用 `json-schema-migrate` 写脚本批量处理。

    2. 用新版本（2020-12 或 2019-09）的 validator 跑一遍单测 / 示例数据。

    3. 少量手工修 schema，并记录变更。

#### 方案 B：偏文档/编辑器驱动

- 团队已经在用 Oxygen 之类的工具 → 用 Oxygen 的“update older JSON schemas to the latest versions”功能，然后再人工 review 一遍。[Oxygen XML](https://www.oxygenxml.com/xml_editor/json_schema_tools.html)

#### 方案 C：其他语言（Java / C# / Python）

- 目前没有像 `json-schema-migrate` 这样语言无关的“官方通用升级器”。

- 通常做法是：
    - 看你的 validator 是否直接支持旧 draft（很多库支持多版本 meta-schema，就不需要升级 Schema 本身）；

    - 或者写一个小脚本，对照官方迁移文档来重写关键字段（比如把 `id` 换成 `$id`、`definitions` 换 `$defs` 等）。

---

如果你方便说一下：现在主要是 **哪几个 draft（比如 04 → 07，还是 07 → 2020-12）**，以及你项目主要是 **Node/前端 还是 Java/Python**，我可以帮你给一个更贴着你项目的“迁移脚本/命令行示例小方案”。
