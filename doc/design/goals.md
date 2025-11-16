<!--
 Copyright 2025 Shuai Zhang
 SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
-->

# Goals

你正在做一套把**通用 JSON Schema 世界**（尤其是 SchemaStore/OpenAPI 等生态里的各式 schema）系统性地“搬”到 **Apple Pkl 世界**的转换工具：
它从任意版本的 JSON Schema 出发，走过一条可验证、可维护的转换流水线，最终产出结构清晰的 Pkl 工程和包，让开发者可以用强类型、可组合的 Pkl 来定义和复用原本只是“裸 JSON 配置”的东西，并通过 Pkl 的 JSON 渲染能力生成严格符合这些 JSON Schema 的配置文件。

下面是按“做什么 / 为什么”整理出来的长版描述。

## 你想做的事情（What）

### 1. 把「任意 JSON Schema」变成「可直接使用的 Pkl 包」

- 输入：
  外部提供的 JSON Schema——通过 URL 或本地路径读取，支持 Draft‑07、2019‑09、2020‑12 这几条主线草案，旧的 Draft‑04/06 可以通过迁移工具过渡。
- 处理过程：
  不是直接字符串替换，而是：
    1. 读取与缓存 schema 内容；
    2. 解析成带位置信息的语法树；
    3. 通过一系列「nanopass 风格」的小步转换把各种版本、各种写法的 schema 归一成统一的中间表示（IR）；
    4. 再从这个 IR 映射成 Apple Pkl 世界里的类型和模块。
- 输出：
  一整个可以被当作 Pkl 包工程使用的目录，包括：
    - 一个 `PklProject` 清单（描述包名、版本、依赖等）；
    - 若干 Pkl 模块：类型定义、校验辅助、渲染/示例等；
    - 示例配置、README、校验信息（如源 schema URL、版本、哈希）。

你不是只是“生成几行 Pkl 代码”，而是要**自动生成完整的 Pkl 工程骨架**，让下游可以像用官方包一样 import 和复用这些 schema。

### 2. 利用生成的 Pkl 包产出符合 Schema 的 JSON

从最终使用者视角，本项目生成的 Pkl 包不是终点，而是一个用来编写配置的强类型“外壳”：

- 用户在自己的 Pkl 项目中导入这些自动生成的包，直接使用其中的类型和类来声明配置对象，而不是手写松散的 JSON。
- 写好的 Pkl 配置通过 Pkl 提供的 JSON 渲染能力导出为 JSON 文档（例如在命令行或 CI 中一键渲染）。
- 项目的核心承诺是：在转换器当前支持的 JSON Schema 语义范围内，只要用户的 Pkl 代码通过类型检查和生成包内的校验逻辑，导出的 JSON 应当**通过原始 JSON Schema 的校验**；对于暂时无法完全映射的高级特性，会在文档和生成的包中以注释或辅助校验函数的形式显式标出，不会悄悄丢弃约束。

### 3. 支持真实世界的大量 Schema，而不是只针对某几个特例

- 目标覆盖对象包括：
    - SchemaStore 生态里的典型配置 schema（tsconfig、package.json、各种工具配置等）；
    - OpenAPI 3.x 这类复杂、层级深的 schema（你用 openapis-3-0.json 做端到端样例）；
    - 其他任何符合 Draft‑07/2019‑09/2020‑12 的 schema，只要调用方给出 URL 或文件即可。
- 你会验证：
  转换器要能正确处理 SchemaStore 中“具有代表性”的 schema，但**在设计上不依赖任何特定 catalog 或 registry 的特殊规则**。

换句话说：你想要的是一个**普适的 JSON Schema → Pkl 桥接器**，只是在开发/验收阶段用 SchemaStore 这些现成 schema 当“试金石”。

### 4. 建立一条可验证、可插拔的「nanopass 转换流水线」

你不是写一个“一口气从 JSON Schema 直接吐 Pkl 字符串”的脚本，而是要把整个过程拆成一条**小步、单一职责的转换管线**：

1. **SchemaFetcher**：
   负责从 HTTP、本地文件、data URI 等地址拉取 JSON，做缓存与哈希校验，同时记录来源信息（URL、时间戳、ETag、SHA256 等），便于在 README/检查文件里追溯。
2. **Parser**：
   把 JSON 文本解析成带位置信息的 Parse Tree 和初始 AST，保留行列信息，以便后面任何一步出错都能回溯到具体位置。
3. **PassManager（nanopass 管线）**：
   用很多小 pass，而不是一个大块头：
    - 草案归一化 pass：把 Draft‑04/06 迁移到统一的语义层，把 `definitions`/`$defs` 等等各种命名对齐；
    - `$ref` 解析 pass：解析 `$ref`、`$dynamicRef`、`$anchor`，构建依赖图，检测循环；
    - 组合关键字 desugar pass：处理 `allOf` / `anyOf` / `oneOf` / `not` 等，将它们规约到统一的约束表达；
    - 类型抽象/约束下沉 pass：把 `type` 联合、`const`、`enum` 等抽象成统一 IR 节点和约束。
      每个 pass 前后都有结构验证（特别是在 Debug 模式下），确保输入输出都满足预期形状，没有悬空引用。
4. **统一中间表示（UnifiedSchemaIR）**：
   你设计了一套比原始 JSON 更抽象但又能覆盖真实语义的 IR——包括标量、对象、数组、枚举、组合、引用等节点，并带有元数据（描述、示例、默认值、读写属性等）。
5. **Pkl IR Adapter**：
   把 UnifiedSchemaIR 映射成「Apple/Pkl 视角」的 IR：类、typealias、Mapping/Listing、约束表达式、辅助验证函数等。
6. **ProjectEmitter**：
   把 Pkl IR 渲染成实际 Pkl 源文件和工程结构，包括模块划分、命名规划、README、校验信息等。

这条 pipeline 的设计目标是：**每一步都容易理解、容易单测、容易定位问题**，而不是搞一个在脑子里才说得清楚的“大黑盒转换器”。

### 5. 为 JSON Schema → Pkl 设计一套系统化的语义映射规则

你不是随便“差不多就行”地翻译，而是有明确规则来回答：

- 对象（`type: "object"`）如何生成类：
  `properties` → 字段；`required` → 非可空；`additionalProperties` 为 false → 使用 typed 对象；有 schema 的 `additionalProperties`/`patternProperties` → 映射成 `Mapping<K, V>` 以及可选的正则约束。
- 数组（`type: "array"`）如何对应：
  单一 `items` → 元素类型列表；元组式 `items`/`prefixItems` → 需要特殊处理；`minItems`、`maxItems`、`uniqueItems` 对应到长度约束、distinct 校验等。
- `enum` / `const` 如何表达：
  映射成字面量 union 或 typealias，让使用者在 Pkl 侧可以用类型系统拿到这些离散值。
- `oneOf` / `anyOf` / `allOf` / `not` 怎么处理：
    - `allOf`: 通过类型合并/多基类/mixin；
    - `oneOf` / `anyOf`: 生成 union 类型 + 辅助验证函数（静态类型 + 运行时约束结合）；
    - `not`: 倾向生成 runtime validator + 文档提示。
- 数值/字符串约束（`minimum` / `maximum` / `pattern` / `minLength` / `maxLength` 等）如何落到 Pkl 的约束表达。
- 高级特性（`if/then/else`、`unevaluated*`、`contentEncoding` 等）如何以“部分支持 + 文档 + runtime 校验”的方式暴露，而不是生硬忽略。

总之，你在做的是一套**尽可能保留语义、清楚标注限制**的映射，不是简单“只管结构不管约束”。

### 6. 产出可审计、可回溯、可再生成的 Pkl 工程

对每个输入 schema，你希望最终产出的工程：

- 不只有 .pkl 文件，还有：
    - README：说明来源（URL、草案版本、SHA256）、生成命令、已支持/未支持的特性、注意事项；
    - checksums 或类似文件：记录输入 schema 的哈希，方便回归比较；
    - 示例 Pkl 文件：根据 schema 中的 `examples` 或你自造的典型例子生成，方便人类理解。
- 是**可以反复再生成**的：
  当上游 JSON Schema 更新时，可以重新跑转换器，并通过哈希和 diff 快速看到变化。
- 对 OpenAPI 之类复杂 schema，还要做端到端测试：生成的 Pkl 类型与现有生态中类似的实现（例如官方 pantry 包）保持语义一致或差异可解释。

## 你为什么要这样做（Why）

### 1. 把“散落在各处的 JSON 配置规范”提升到强类型、可复用的层次

现实世界里，大量工具和系统的配置规范只存在于：

- 一份 JSON Schema 文件；
- 散落的文档和 README；
- 人们约定俗成的使用方式里。

这让开发者在使用这些配置时：

- 很难获得良好的 IDE 支持（类型提示、跳转定义、重构）；
- 很难在多语言环境下统一建模；
- 很难把这些规范当作「真正的代码资产」复用和演进。

你希望通过这套转换器，把这些 schema：

- 变成结构清晰的 Pkl 包；
- 进而可以作为：
    - 配置 as code 的基础；
    - 其他语言（Go/Swift/TS 等）代码生成的中间层；
    - 自动 UI、自动校验等的统一来源。

本质上，你是在搭一座桥：
**从“JSON Schema 文档 + 入门门槛高” → “Pkl 类型世界 + 强类型配置 + 再利用工具链”**。

### 2. 统一不同 JSON Schema 版本和写法，降低使用门槛

JSON Schema 生态本身存在多个版本（draft‑04/06/07/2019‑09/2020‑12），语义和关键字都在演进：

- 对普通用户来说，“这份 schema 是哪个 draft？这个关键字在这个版本到底什么意思？”非常难搞；
- 对工具作者来说，如果不做统一，会到处是 if/else 和特殊分支，难以维护。

你通过：

- 调研各版本之间的语义差异、迁移可行性；
- 选定“重点支持”的版本组合（比如以 Draft‑07/2019‑09/2020‑12 为主，旧版统一迁到 07）；
- 在转成 IR 的阶段吸收并抹平这些差异；

最终让**使用者不需要关心底层是哪一版 JSON Schema**，只需要选择需要的 Pkl 包即可。

### 3. 用 nanopass 和严格的流程保证“可维护”和“可验证”

你不只是要“功能上能跑”，还特别强调：

- **可读性优先**：
  任何人接手这套转换器时，能在几分钟内理解某个 pass 的职责和输入输出；
- **小步可验证**：
  每个 pass 只解决一个问题，并在 Debug 模式下做前后验证，防止隐蔽的结构破坏；
- **严格的设计与测试门槛**：
  先有设计文档和测试计划，再写实现；
  单元测试聚焦在关键算法与状态转换；
  E2E 测试由很多小片段 + 少量完整 journey 组成。

这些都服务于一个核心目标：
**对这种复杂的语义转换问题，你要用工程化手段控制复杂度，而不是堆脚本。**

### 4. 保持与外部生态「解耦但兼容」

虽然项目名带有 schemastore，但你的宪章里强调：

- 工具链**不直接集成任何 schema catalog**（包括 SchemaStore）；
- 每次转换都从**显式给出的 schema URL 或 inline 内容开始**，而不是依赖 catalog 元数据；
- 对外表现成一个“通用 JSON Schema → Pkl 工具”，而不是某个 catalog 的专属 adapter。

这样做的原因是：

- 避免绑死在某个 catalog 的组织方式或非标准字段；
- 让工具能适用于公司内网、自建 schema 仓库、第三方 API 定义等各种场景；
- 同时仍然可以用 SchemaStore 那些 schema 作为测试样本和 benchmark。

### 5. 为未来扩展留出空间

通过先把 schema 映射到统一 IR，再转成 Pkl，你隐含地为未来留了很多可能性：

- 从同一个 IR 生成：
    - 多语言的强类型定义（Go/Swift/TypeScript/Java 等）；
    - UI 表单描述；
    - 文档、例子、mock 数据。
- 把 Pkl 世界里已有的工具链（如 Pkl → 目标语言代码生成）与 JSON Schema 生态联通起来。
- 后续如果 Pkl 语言/库新增能力（新 constraint、类型构造），可以在 Pkl IR adapter 层演进，而不必重写整个 pipeline。

也就是说，**你现在做的不仅是“一个 JSON Schema → Pkl 的脚本”，而是在搭一个长期可持续的 schema 转换基础设施**。
