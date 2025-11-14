<!--
 Copyright 2025 Shuai Zhang
 SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
-->

**You:**

我的目的是读取各个不同版本的 JSON Schema （包括 Draft-04, 06, 07, 2019-09, 2020-12），转换成对应的强类型语言的 data type。你认为我使用哪个语言比较合适？主要考虑生态，例如有合适的 JSON Schema 解析器，等等。偏好强类型，Python，TypeScript 这种能注解的也行。

* * *

**ChatGPT:**

按你这个需求（同时吃下 Draft-04/06/07/2019-09/2020-12，再把它们变成强类型 data type），我会这样排优先级：

> **1️⃣ 首选：TypeScript / Node.js**
> **2️⃣ 次选：Python（做“胶水 + 代码生成器”）**
> **3️⃣ 备选：C#/.NET 或 Kotlin/Java（如果你愿意用这些生态）**

下面展开讲一下原因，方便你做取舍。

* * *

1. TypeScript：我最推荐你用来写这个生成器的语言
------------------------------

### 多版本 JSON Schema 支持非常齐全

在 JS/TS 生态里，支持多个草案版本的库非常多，而且成熟：

* **Ajv**：主流 JSON Schema 校验器，支持 draft-04/06/07/2019-09/2020-12。[GitHub+1](https://github.com/ajv-validator/ajv?utm_source=chatgpt.com)

* **@hyperjump/json-schema / json-schema-library**：工具库，支持 draft-04/06/07/2019-09/2020-12 的“核心特性”，专门用来遍历/操作 schema，非常适合作为你自己代码生成的 AST 层。[npmjs.com+1](https://www.npmjs.com/package/json-schema-library?utm_source=chatgpt.com)

* 再配上 **json-schema-ref-parser** 之类的 bundler，可以很舒服地做 `$ref` 解析与去重。[json-schema.org+1](https://json-schema.org/tools?utm_source=chatgpt.com)


这些库本身就已经考虑了不同草案之间的细节差异（`$defs` vs `definitions`、`items`/`prefixItems`、`$dynamicRef` 等），你可以站在它们肩膀上做自己的“统一中间表示”。

### 现成的 Schema → TypeScript type/code 生成库

TS 世界里已经有不少现成的 “Schema → TS 类型” 工具，你可以直接用或参考其实现：

* **json-schema-to-typescript**：把 JSON Schema 编译成 `.d.ts`，被广泛使用，有 CLI 和 API。[GitHub+1](https://github.com/bcherny/json-schema-to-typescript?utm_source=chatgpt.com)

* **json-schema-to-ts**：更偏“类型体操”的库，能直接在 TS 类型层面推导 schema 对应的类型。[json-schema.org](https://json-schema.org/tools?utm_source=chatgpt.com)


你即使最终自己写一套生成器，也可以参考它们对 `oneOf/anyOf/allOf` 等的建模方式。

### TypeScript 作为生成器语言的优势

* **结构类型 + 联合类型**：JSON Schema 的 `oneOf/anyOf/enum/null` 等，对应到 TS 的 union/`null`/literal type 很自然。

* **写代码生成器很舒服**：字符串模板、AST 操作库一抓一大把；Node 做 CLI / 脚本也非常方便。

* 你的目标如果就是 “Schema → TypeScript 类型”，那 **生成器和目标语言就是同一个**，调试和联动（比如在编辑器里跳转定义）体验极好。


**小结**：
如果你目前没有语言硬性限制，而你又能接受 JS/TS 生态，那我会直接推荐：

> **用 TypeScript/Node 写一个生成器：底层用 Ajv 或 json-schema-library 负责解析 + 统一各种 draft，自己在上面实现一层映射 AST → TS 类型/类。**

* * *

2. Python：生态齐全，适合作为“母语生成器”
--------------------------

你提到 Python 也可以，那么 Python 这条路大概是：

### 多 draft 解析/验证：python-jsonschema

`jsonschema` 是官方 tooling 列表里重点推荐的实现之一，**直接支持 Draft 2020-12/2019-09/7/6/4/3**，而且有统一的 API：[jsonschema+2PyPI+2](https://python-jsonschema.readthedocs.io/?utm_source=chatgpt.com)

* 可以根据 `$schema` 自动选用对应 draft 的 Validator。

* 内置了 referencing 的抽象（`referencing.jsonschema.DRAFT202012` 等），方便你在一个程序里同时处理多种方言。[jsonschema](https://python-jsonschema.readthedocs.io/en/latest/referencing/?utm_source=chatgpt.com)


这部分完全能满足你“读各种版本 JSON Schema”的需求。

### Schema → 强类型 Python 模型的现成库

Python 里做“Schema → 类型/模型”的项目也不少，例如：

* **datamodel-code-generator**：从 JSON Schema/OpenAPI 等生成 **Pydantic model 或 dataclasses**，可以当库用也可以当 CLI 用。[GitHub+2Pydantic+2](https://github.com/koxudaxi/datamodel-code-generator?utm_source=chatgpt.com)

* **statham-schema**：专门从 JSON Schema 生成可扩展的 Python 类模型。[GitHub](https://github.com/jacksmith15/statham-schema?utm_source=chatgpt.com)

* **json-schema-codegen**：用 Python 读 JSON Schema，生成 **C++ 或 Python 代码**。[PyPI](https://pypi.org/project/json-schema-codegen/?utm_source=chatgpt.com)

* **yacg**：一个比较通用的 codegen 工具，用 Python 读 JSON Schema，然后通过模板生成各种语言的代码；工具列表里标明支持 3/4/6/7/2019-09/2020-12。[GitHub+1](https://github.com/OkieOth/yacg?utm_source=chatgpt.com)


再配合类型提示 + mypy（或 pyright），你可以在 Python 里依然保持相当不错的静态类型体验。

### Python 路线的优缺点

**优点**

* 写脚本 / glue code 超爽，很适合做多语言代码生成“总控台”：

    * 解析 Schema → 中间模型

    * 然后根据模板生成 TS/Kotlin/Go… 各种语言的 data type。

* 有诸如 yacg 这种已经帮你做好“模板引擎 + schema 访问”的框架，可以少写很多底层活。[GitHub+1](https://github.com/OkieOth/yacg?utm_source=chatgpt.com)


**缺点**

* 本身语言不是“强静态类型”，即使有 type hints，你的生成器内部还是没有 TS/C#/Kotlin 那种编译期约束。

* 多 draft 支持虽然有，但 **schema → Python 类型/代码 的库在 2020-12 的覆盖度不如 JS/TS 那么集中**，很多项目还是围绕 draft-07 写的，你可能需要自己补一些新语义。


* * *

3. 更“硬核强类型”的选项：C#/.NET 或 Kotlin/Java
------------------------------------

如果你愿意跳出 Python/TS 这两个偏好，也可以考虑：

### C# / .NET

* **JsonSchema.Net** 和 **Corvus.JsonSchema**：都支持从 draft-06 到 2020-12，并且包含对象模型和代码生成能力（Corvus 有专门的“build-time code generation”做 Schema→C# 模型）。[Endjin+3GitHub+3json-schema.org+3](https://github.com/corvus-dotnet/Corvus.JsonSchema?utm_source=chatgpt.com)

* .NET 本身类型系统对 `oneOf`→判别联合、`enum`→enum type、`format`→自定义类型 之类建模也比较舒服。


如果你的目标语言就是 C#，这是非常强的一条路线。

### Kotlin / Java

* **networknt/json-schema-validator**：Java 实现，支持 draft-04/06/07/2019-09/2020-12。[GitHub+2Maven Repository+2](https://github.com/networknt/json-schema-validator?utm_source=chatgpt.com)

* **json-kotlin-schema-codegen**：从 JSON Schema 生成 Kotlin data class、Java class 或 TypeScript interface，官方说明主要 target Draft-07 + 2019-09。[GitLab+3GitHub+3GitHub+3](https://github.com/pwall567/json-kotlin-schema-codegen?utm_source=chatgpt.com)


这条路线对于 JVM 项目很友好，但和你当前偏好的 Python/TS 相比，学习/部署成本会高一些。

* * *

4. 结合你的偏好，实际建议
--------------

你说“偏好强类型，Python、TypeScript 这种能注解的也行”，我会给出一个很直接的结论：

### 如果只选一个语言写解析 & 生成器

> **选 TypeScript / Node.js。**

理由：

1. 多版本 JSON Schema 支持最齐全，生态集中（Ajv、hyperjump/json-schema、json-schema-library）。[GitHub+2npmjs.com+2](https://github.com/ajv-validator/ajv?utm_source=chatgpt.com)

2. 有成熟的 Schema→TS 类型工具可直接用或抄思路（json-schema-to-typescript、json-schema-to-ts）。[GitHub+2json-schema.org+2](https://github.com/bcherny/json-schema-to-typescript?utm_source=chatgpt.com)

3. 你最终想要的 data type 本身很可能就写在 TS 里（前后端共享接口），一条龙体验最好。


### 如果你更想用 Python 当“中枢”，输出多语言

> **用 Python + `jsonschema` 做解析，配合 yacg 或自己基于 Jinja2 模板写一个多语言 codegen。**

* `jsonschema` 负责各种 draft 的语义差异。[jsonschema+1](https://python-jsonschema.readthedocs.io/?utm_source=chatgpt.com)

* 你再在上面做一个统一的中间 AST，然后用模板分别吐出 TS / Kotlin / C++ / …

* 单机脚本或 CI 里跑都很轻松。


* * *

如果你愿意，我可以帮你设计一套 **“统一中间 AST”** 的结构，然后分别给出 TypeScript 版和 Python 版的最小可行 demo，比如：

* 读一个包含 `$ref`、`allOf`、`oneOf` 的 2020-12 schema；

* 解析成中间 AST；

* 生成一段 TypeScript `type` / `interface` 代码。
