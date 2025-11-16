<!--
 Copyright 2025 Shuai Zhang
 SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
-->

# JSON Schema 各 Draft 的核心共同特性

> 基于 draft-04、draft-06、draft-07、2019-09、2020-12 官方 meta-schema，总结它们的稳定核心特性，便于后续做统一抽象（例如转换到 Pkl）。

## 1. 统一的整体模型

- Schema 本身是一个 JSON 值，用来约束“实例”数据。
- 顶层 schema 的类型：
    - draft-04：`object`；
    - draft-06 起：`["object", "boolean"]`，其中：
        - `false` schema 表示“永远不通过”；
        - `true` schema 表示“永远通过”。
- 从 draft-06 起，这种 “object/boolean schema” 形式在 2019-09、2020-12 中保持不变。

无论哪一版，**schema 都是描述实例结构与约束的声明性文档**，而不是执行代码。

## 2. 元信息与标识

### 2.1 版本声明 `$schema`

- 所有草案都通过 `$schema` 声明当前 schema 遵循的规范版本（即所用 meta-schema 的 URI）。
- 对工具而言，`$schema` 决定了：
    - 可以使用哪些关键字；
    - 关键字的语义细节（例如 `exclusiveMaximum` 的布尔 / 数值差异）。

### 2.2 模式标识 `id` / `$id`

- draft-04 使用 `id`；
- draft-06 及之后使用 `$id`，但语义上都是 “当前 schema 的规范化 URI 标识 + 作用域起点”。
- 2019-09、2020-12 中 `$id` 的语义保持延续，用于：
    - 给 schema 片段命名，支持 `$ref` / `$dynamicRef`；
    - 参与相对 URI 的解析。

在建模时可以抽象为统一的 “schemaId”。

### 2.3 人类可读元数据

在这些草案中，以下元数据关键字长期存在并保持一致的大致含义：

- `title`：简短标题。
- `description`：较长描述。
- `default`：推荐的默认实例值（不参与验证，只是提示）。
- `examples`：典型示例实例（draft-06 引入，之后沿用）。
- `readOnly` / `writeOnly`：对读 / 写方向的提示（从 draft-07 起，后续草案保留）。
- `$comment`：仅供人类或工具消费的注释，不影响验证结果（draft-07 起，之后保留）。

这些关键字都属于“meta-data”维度，与验证逻辑解耦。

## 3. 类型系统的共同核心

### 3.1 简单类型集合

所有草案都共享同一组简单类型枚举：

- `array`
- `boolean`
- `integer`
- `null`
- `number`
- `object`
- `string`

meta-schema 中通常用 `simpleTypes` 这样的内部定义表示这一枚举。

### 3.2 `type` 关键字

- 允许使用单个字符串：`"type": "string"`。
- 也允许使用字符串数组表示联合类型：`"type": ["string", "null"]`。
- 无论哪个 draft，`type` 的核心语义都保持稳定：实例的 JSON 类型必须是给定集合之一。

## 4. 组合与复用能力

### 4.1 结构化组合关键字

从 draft-04 起，一直到 2020-12，下列组合关键字的总体语义保持稳定：

- `allOf`：实例必须同时满足数组中所有子 schema。
- `anyOf`：实例满足数组中至少一个子 schema 即通过。
- `oneOf`：实例必须且仅能满足数组中一个子 schema。
- `not`：实例不得满足给定子 schema。

这些关键字构成了 schema 语言的“逻辑组合”基础。

### 4.2 条件结构 `if` / `then` / `else`

- 在 draft-07 中引入，在 2019-09 / 2020-12 中继续存在。
- 语义上是：`if` 子 schema 成立时应用 `then`，否则应用 `else`。
- 虽然 draft-04/06 不支持这一语法，但在现代草案中已经成为稳定特性，可以视为高阶扩展，而不是根本性的语义变化。

### 4.3 `$ref` 与可重用定义

- draft-06 起在 meta-schema 中显式出现 `$ref` 属性定义（draft-04 虽未在 `properties` 里列出，但规范已支持 `$ref`，并在 meta-schema 内部大量使用）。
- 共同语义：用 URI 指向另一处 schema，将其内联到当前位置继续验证。
- 搭配可重用定义：
    - draft-04～2020-12 一直存在 `definitions` 对象，用于命名子 schema；
    - 在 2020-12 中推荐改用 `$defs`，但 meta-schema 仍保留 `definitions` 以兼容既有内容。

从语言建模角度看，可以统一成：

- “命名子 schema 集合”（`definitions` / `$defs`）；
- “通过 `$ref` 引用命名或定位到的子 schema”。

### 4.4 依赖关系：`dependencies` → `dependentSchemas` / `dependentRequired`

- 所有旧 draft 都有 `dependencies`：
    - 值为 schema：当前属性存在时，实例整体还必须满足另一 schema；
    - 值为字符串数组：当前属性存在时，实例还必须包含这些属性。
- 2019-09 / 2020-12 中，这一概念被拆分为：
    - `dependentSchemas`；
    - `dependentRequired`。
- 为兼容既有 schema，2019-09 / 2020-12 的 meta-schema 仍保留 `dependencies`，并标注为 deprecated。

因此，“属性存在时触发额外约束”这一思想在所有草案中都是稳定的，只是关键字拆分得更细。

## 5. 数值、字符串、数组、对象的通用约束

### 5.1 数值类型验证

所有草案都提供以下数值相关关键字（虽在个别版本中具体类型或细节略有不同）：

- `multipleOf`：实例必须是某数值的整数倍。
- `maximum` / `minimum`：上 / 下界。
- `exclusiveMaximum` / `exclusiveMinimum`：严格不等的边界。
    - draft-04：布尔 + 对应极值字段；
    - draft-06 之后：直接给出边界数值。
    - 虽然表示法演进，但“开区间 vs 闭区间”的核心语义一致。

### 5.2 字符串类型验证

各草案一直保持以下字符串约束关键字：

- `maxLength` / `minLength`：按 Unicode 代码点计数的最大 / 最小长度。
- `pattern`：
    - 使用正则表达式（语法略有实现差异）；
    - meta-schema 中通常为 `"format": "regex"`。

### 5.3 数组类型验证

所有版本都对数组提供了一致的基础约束：

- `items`：
    - 可以是单一 schema（对所有元素应用）；
    - 也可以是 schema 数组（位置敏感的元组验证）。
- `additionalItems`：
    - 当 `items` 为数组时，控制“多出来的元素”：
        - 允许并给出 schema；
        - 或用 `false` 禁止。
- `maxItems` / `minItems`：数组长度上下界。
- `uniqueItems`：是否要求元素全局唯一。
- 从 draft-06 起增加 `contains`，并在后续版本稳定存在，用于声明“至少有一个元素满足给定 schema”。

### 5.4 对象类型验证

对象相关关键字在所有草案中都高度一致，差别仅在于是否拆分 / 标记废弃：

- `properties`：显式列出的属性及其子 schema。
- `patternProperties`：属性名匹配正则时的子 schema。
- `additionalProperties`：
    - 为未出现在 `properties` / `patternProperties` 中的属性提供统一约束；
    - 可以是 schema 或布尔。
- `required`：必须出现的属性名数组。
- `maxProperties` / `minProperties`：属性数量上下界。
- `propertyNames`（draft-06 起）：对所有属性名本身应用 schema。
- `definitions` / `$defs`：可重用子 schema 集合。

这一组关键字几乎在各个草案中原样出现，是“对象结构建模”的稳定核心。

## 6. 非结构验证与内容描述

### 6.1 `enum` 与 `const`

- `enum` 自 draft-04 起存在且语义稳定：实例必须恰好等于给定集合中的某个值。
- `const` 从 draft-06 起引入，并在之后一直存在：实例必须等于某个单值。

两者共同提供了“枚举 / 常量”级别的值限制。

### 6.2 `format` 与内容相关关键字

- `format` 在所有草案中都存在，用作对特定字符串格式（如 `date-time`、`email` 等）的声明。
    - 草案之间的差异主要在“是否必须强制校验”与“哪些格式是规范化的”，但作为注解 + 可选验证的角色保持不变。
- 从 draft-07 起有 `contentMediaType` / `contentEncoding`（后续草案继续沿用），用于声明字符串中嵌入的非文本内容（例如 Base64 编码的二进制）。

## 7. 新草案对旧特性的兼容策略

2019-09 与 2020-12 在设计上引入了词汇表（`$vocabulary`）、动态引用（`$recursiveRef` / `$dynamicRef`）等新机制，但从官方 meta-schema 可以看出几个重要事实：

- `type`、`properties`、`items`、`additionalProperties`、`allOf` / `anyOf` / `oneOf` / `not` 等核心关键字都被放入稳定 vocab 中，语义保持兼容。
- 曾经广泛使用的关键字（例如 `definitions`、`dependencies`）即便在新模型下被更细致的关键字替代，仍然在 meta-schema 中保留，并标注为 deprecated，以确保旧 schema 可继续工作。
- 顶层 `type: ["object", "boolean"]` 的 schema 观念、简单类型集合、数组 / 对象基本约束等，在 2019-09 / 2020-12 中都保持延续。

从工程实践的角度看，这意味着：

- 只要抓住这些“在 meta-schema 中被一再复用的基础关键字”，就能为不同 draft 之间构建一个稳定的抽象层；
- 针对各版本新增或拆分的关键字（如 `if` / `then` / `else`、`dependentSchemas`、`unevaluatedProperties` 等），可以在这一基础之上增量建模，而不影响核心结构。

---

以上内容可作为后续实现“多 Draft 支持的 JSON Schema → Pkl 映射”时的共同语言：只要围绕这些核心特性设计模型和 API，大部分实际 schema 在不同 draft 之间都会自然对齐。
