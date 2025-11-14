<!--
 Copyright 2025 Shuai Zhang
 SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
-->

**You:**

Json Schema 哪些版本之间的升级是全自动且准确的？

* * *

**ChatGPT:**

先把结论说在前面：

**如果你问的是「JSON Schema 规范版本」之间（draft-04/06/07/2019-09/2020-12）能不能做到“全自动且仍然 100% 准确”的升级：**

> **严格意义上，只有很少几对版本可以认为是“自动升级≈等价”**：
>
> 1. **draft-04 ↔ “draft-05”**（其实 meta-schema 没变，本质上就是 draft-04）[JSON Schema](https://json-schema.org/specification-links?utm_source=chatgpt.com)
>
> 2. **draft-06 → draft-07**（Core + Validation 在验证关键字和结果上完全向后兼容）[JSON Schema+1](https://json-schema.org/draft-07/json-schema-release-notes?utm_source=chatgpt.com)
>

其他常见升级（比如 **draft-04 → 06/07**、**draft-07 → 2019-09**、**2019-09 → 2020-12**）**都存在语义变化或潜在 breaking changes**，只能做到“工具自动迁移 + 人工 review / 回归测试”，不能说对所有 schema 都“全自动且准确”。[JSON Schema+2JSON Schema+2](https://json-schema.org/blog/posts/stable-json-schema?utm_source=chatgpt.com)

* * *

1. 真正可以认为“全自动且准确”的版本对
---------------------

### 1.1 draft-04 ↔ “draft-05”

* 官方 spec 链接里说明：**“draft-05” 没有新的 meta-schema，仍然用 draft-04 的 meta-schema，所以它其实就是 draft-04 的 bugfix/说明版本**。[JSON Schema](https://json-schema.org/specification-links?utm_source=chatgpt.com)

* 实际上你只要改 `$schema` 里那串 URI（甚至很多人根本不区分 04/05），行为不会变。


> ✅ 结论：**04 ↔ “05” 之间可以视为纯文案升级**，对验证语义来说可以认为是全自动且准确。

* * *

### 1.2 draft-06 → draft-07

* JSON Schema 官方 **Draft-07 release notes** 直接写明：
    Core & Validation 部分是“相对小的更新”，**在验证关键字和结果上完全向后兼容 draft-06**。[JSON Schema+1](https://json-schema.org/draft-07/json-schema-release-notes?utm_source=chatgpt.com)

* Ajv 文档也说：如果你要支持 draft-06，**基本只需要加上 meta-schema，甚至“只改（或删掉）`$schema` 属性就够了”**——其他 schema 结构不需要变。[Ajv](https://ajv.js.org/guide/schema-language.html?utm_source=chatgpt.com)


> ✅ 结论：**draft-06 升级到 draft-07 可以视为“自动 + 语义等价”**
> 在实践中你完全可以：
>
> * 保留原 schema 不变，只让验证库跑在 draft-07 模式
>
> * 或者把 `$schema` 改成 draft-07 的 URI，其他一律不改
>

> ⚠️ 注意：
> 这里讨论的是 **Core + Validation 关键字**（绝大多数业务场景）；
> Hyper-Schema 部分有一些额外变化，用得少的话可以先忽略。

* * *

2. 其他版本：为什么不能说“全自动且准确”
----------------------

下面这些升级都存在“某些合法 schema 的验证结果会变”的可能，因此 **不适合对所有 schema 打包承诺“100% 自动准确”**。

### 2.1 draft-04 → draft-06 / draft-07

* draft-06 的 release notes 就是专门讲「从 draft-04 迁移到 draft-06 会有哪些变化」，里面包括：关键字语义调整、`exclusiveMinimum/Maximum` 含义变化等。[JSON Schema+1](https://json-schema.org/draft-06/json-schema-release-notes?utm_source=chatgpt.com)

* 很多验证器（比如 Ajv）都特意说明：**draft-04 和后续草案在一些关键字上有不兼容之处**，所以很多库干脆不再支持 04。[Ajv+1](https://ajv.js.org/guide/schema-language.html?utm_source=chatgpt.com)

* 确实有工具可以“自动迁移”，比如 `json-schema-migrate` / `ajv-cli` 能把 draft-04 的 schema 迁到 draft-07 / 2019-09 / 2020-12。[GitHub+1](https://github.com/ajv-validator/json-schema-migrate?utm_source=chatgpt.com)
    但它自己 issue 里也有 case 说明转换不一定完美，需要你人工检查。[GitHub](https://github.com/ajv-validator/json-schema-migrate/issues/6?utm_source=chatgpt.com)


> 🔍 结论：**可以“基本自动迁移”，但绝不能说对所有 draft-04 schema 都完全准确**。生产上必须加测试。

* * *

### 2.2 draft-07 → 2019-09

* 2019-09 引入了 **新概念和新关键字**：`$recursiveRef/$recursiveAnchor`、`unevaluatedProperties` 等。[Ajv+1](https://ajv.js.org/json-schema.html?utm_source=chatgpt.com)

* 维护者自己在讨论里说：**从 draft-07 到 2019-09 有明显的架构变化和 breaking changes**。[GitHub](https://github.com/orgs/json-schema-org/discussions/282?utm_source=chatgpt.com)

* 实现层面（比如 Ajv）可以做到：**一个 2019-09 的 validator 同时也正确理解 draft-07 的 schema**（通过识别 `$schema`），这被称为“backwards compatible”。[Ajv+1](https://ajv.js.org/json-schema.html?utm_source=chatgpt.com)
    但这是“同一个实现支持多版本”，**不是“把 07 的 schema 文本改成 2019-09 后仍 100% 等价”**。


> 🔍 结论：
>
> * 不建议“批量改 `$schema` 让所有 07 schema 都按 2019-09 跑”，理论上可能有差异；
>
> * 更推荐：**validator 同时支持 draft-07 和 2019-09**，老 schema 保持原样。
>

* * *

### 2.3 2019-09 → 2020-12

这里官方明确说了“可能验证结果完全不同”：

* 官方 blog《Moving Toward a Stable Spec》点名：
    2019-09 → 2020-12 的变动（`$recursive*` → `$dynamic*`、`items`/`prefixItems` 重构、移除 `additionalItems` 等）导致 **同一个 schema 在两个 draft 下验证结果可能完全不同**，升级体验“非常差”。[JSON Schema+1](https://json-schema.org/blog/posts/stable-json-schema?utm_source=chatgpt.com)


> 🔥 结论：**2019-09 → 2020-12 绝对算“breaking change”**，不可能承诺“全自动且准确”。

* * *

3. 实战建议：想“自动”但又要稳，应该怎么做？
------------------------

### 3.1 优先策略：**不要“硬迁 schema”，而是让 validator 支持多版本**

多数现代库都支持同时加载多个 meta-schema，例如：

* Ajv：支持 draft-04/06/07/2019-09/2020-12，同一个实例可以根据 `$schema` 决定用哪套规则。[Ajv+2Ajv+2](https://ajv.js.org/v6-to-v8-migration.html?utm_source=chatgpt.com)

* 其他库（Opis JSON Schema、json-schema-library 等）也支持多 draft。[opis.io+1](https://opis.io/json-schema/?utm_source=chatgpt.com)


这种模式下：

1. **老 schema 不动**（继续写 `$schema`: draft-04/06/07…）

2. 你的服务只需要升级 validator 版本，注册对应 meta-schema

3. 以后新 schema 再用你指定的“目标版本”（比如 2020-12）


> 这样你几乎不用“迁 schema”，也就不存在“自动升级不准确”的问题。

* * *

### 3.2 必须“改 schema 文件”的时候

如果你被要求“所有 schema 一律改成同一 draft”，可以用这个经验法则：

1. **draft-06 → draft-07：可以认为是安全自动升级**

    * 要么直接把 `$schema` 改成 draft-07 的 URI；

    * 要么干脆删掉 `$schema`，在 validator 层统一指定。

2. 其他路径（04→06/07，07→2019-09，2019-09→2020-12）：

    * **可以用工具先做自动迁移**：例如 `json-schema-migrate` / `ajv-cli`。[GitHub+1](https://github.com/ajv-validator/json-schema-migrate?utm_source=chatgpt.com)

    * 之后一定要：

        * 对关键 schema 写回归测试（正/负样例都跑一次两边对比）；

        * 对用到 `exclusiveMinimum/Maximum`、`id/$id`、数组 `items`/`additionalItems` 相关的 schema 特别小心。


* * *

4. 如果你问的是“业务 Schema v1 → v2 的 **数据** 自动迁移”
------------------------------------------

顺带说一句：如果你指的不是 JSON Schema 规范版本，而是：

> “我的配置 `schema` 有 v1 / v2 / v3，能不能靠 JSON Schema 自动把旧 JSON 数据迁到新版本？”

那么答案是：**JSON Schema 规范本身并不定义“数据迁移”语义**，也没有“自动升级实例 JSON”这种标准机制。
StackOverflow 上类似问题的回答也都是：**只能自己写迁移逻辑（脚本/代码），或者根据版本跑不同 schema 校验**。[Stack Overflow](https://stackoverflow.com/questions/70875281/automatically-migrate-json-data-to-newest-version-of-json-schema?utm_source=chatgpt.com)

* * *

### 小结

* 真正可以说“几乎 100% 自动 + 语义等价”的只有：

    * **draft-04 ↔ “draft-05”**

    * **draft-06 → draft-07**

* 其他升级路径都或多或少有语义变化，只能说“有工具自动迁移，但结果要人工验证”。

* 实际工程里，更推荐做法是：**用支持多 draft 的 validator，老 schema 不迁，只升级实现。**


如果你愿意贴一段你现在的 schema（和目标 draft），我可以直接帮你判断：
“这一份在你这个场景下能不能放心地全自动迁”。

* * *

**You:**

所以听起来至少需要支持 Draft-07 + 2019-09 + 2020-12，更早的可以通过工具直接迁移到 Draft-07

* * *

**ChatGPT:**

是的，你现在的理解**基本对**，但我帮你稍微“拧紧一下螺丝”，顺便给一个比较实用的方案。

* * *

1. 版本策略：怎么选最省心
--------------

### 你总结的方案

> 至少支持 **draft-07 + 2019-09 + 2020-12**，
> 更早的（04 / 06）都用工具一次性迁到 **draft-07**。

这是一个**非常合理、工程上可行**的策略，而且有这些好处：

* draft-07 是目前最常见、生态最成熟的一个版本

* 2019-09 / 2020-12 是“现代”版本，给将来扩展留空间

* 旧版本（04 / 06）相对少，集中迁一次就好，不必长期背负兼容


我会稍微调整一下优先级和边界：

1. **强制要求：draft-07 + 2020-12**

2. **可选 & 视存量而定：2019-09**

3. **旧版本（draft-04/06）用工具迁到 draft-07**


原因如下。

* * *

2. 为什么建议“07 + 2020-12”为主，2019-09 看情况
------------------------------------

### 2.1 生产里最常见的还是 draft-07

* 绝大多数公开 API / 开源项目里的 JSON Schema 仍然停在 draft-07。

* 各大库（Ajv、json-schema-validator 等）对 draft-07 的支持最成熟、坑最少。


👉 所以：**把所有旧 schema 至少统一迁到 draft-07，是一个很好的“安全落地版本”**。

* * *

### 2.2 2019-09 的“过渡”地位

2019-09 很重要，因为它首次引入了现在 2020-12 沿用的一些大概念（`unevaluated*`、`$recursive*` 等），
但它有点像“实验性过渡版”：

* 新特性比较多

* 很多实现/文档在 2019-09 出来后没多久就开始直接推荐 2020-12

* 官方自己在 blog 里也承认：从 07 到 2019-09 再到 2020-12 的升级体验并不完美


👉 所以很现实地说：

* **如果你们内部已经有大量 2019-09 的现有 schema**：那当然要支持它。

* 如果没有太多现存 2019-09，那完全可以先不上，直接让：

    * 旧 schema = draft-07

    * 新 schema = 2020-12（或暂时也用 07）


* * *

### 2.3 2020-12 是目前的“终点站”

* 最新 spec（后续如果有新 draft，大概率都会基于 2020-12 的结构演进）

* 对 2019-09 做了一些“纠偏”：比如 `$dynamicRef` 替代 `$recursiveRef`，数组关键字重构等

* 长期看，如果你想用 **unevaluated 系列、动态递归引用** 这些高级玩法，**2020-12 是最佳目标版本**。


👉 实战建议：

* **新设计的 schema（新项目、新服务）直接用 2020-12**

* 老 schema 先聚拢到 draft-07；

* 是否要升级到 2020-12，可以按业务重要程度/收益评估，一批一批来。


* * *

3. 老版本迁移：怎么“靠工具到 07”
--------------------

你打算：**更早的版本（特别是 draft-04）用工具直接迁到 draft-07**——这个思路没问题，但要注意两层含义：

1. **技术上“能自动转成一个合法的 07 schema”**

2. **业务上“转完后验证语义真的和原来一样”**


第 1 点工具能解决，第 2 点只能靠你们测试。

### 3.1 工具层面（概念性说明，避免推荐某个固定库）

现在常见的做法是：

* 使用一个支持多 draft 的 JSON Schema 工具/库

* 内部集成一个“迁移脚本”：

    * 输入：旧版本 JSON Schema（特别是 draft-04）

    * 输出：结构已调整、`$schema` 指向 draft-07 的 schema

* 常见迁移动作包括：

    * `id` → `$id`

    * `exclusiveMinimum`/`exclusiveMaximum` 语义变化处理

    * 一些已经废弃的关键字替换/重写


### 3.2 测试策略（关键）

最稳的做法是：

1. 挑选一批“有代表性”的实例 JSON：

    * 正向样例（以前就应该通过的）

    * 反向样例（以前就应该被拒）

2. 用 **“老实现+老 schema”、“新实现+迁移后的 schema”** 各验证一遍，对比结果：

    * 如果两边结果一致，可以认为迁移对该 schema 是安全的

    * 如果出现差异，就要人工查看是否是：

        * 原本的 schema 写得有问题 → 现在刚好被暴露

        * 迁移脚本有 bug，需要调整

        * spec 本身的语义变化 → 需要业务侧接受这个变化或者改 schema


* * *

4. 对你的方案稍微 refine 一下
--------------------

结合上面这些，给你一个更“可落地”的版本策略：

1. **支持的 draft：**

    * 必选：**draft-07**

    * 强烈推荐：**2020-12**

    * 可选：2019-09（如果现存大量 2019-09 schema，就加上；否则可以先不忙）

2. **迁移策略：**

    * 所有 **draft-04/06** 的 schema：

        * 统一跑一次工具迁移 → draft-07

        * 对关键 schema 做回归测试

    * draft-07 以上的 schema：

        * 暂时不强制迁移；

        * validator 根据 `$schema` 支持多版本

3. **新 schema 写法：**

    * 如果团队尚未熟悉 2020-12，可以先全用 draft-07，一段时间后再考虑升级

    * 如果已经有对 2020-12 较强的支持（包括库、文档、测试）：

        * 新项目直接 2020-12

        * 老项目按需迁移（有新需求才顺带升级）


一句话版：

> ✅ “旧的统一收敛到 draft-07，新的以 2020-12 为目标，2019-09 只在有存量时支持”
> 这样既符合你说的“至少支持 07+2019-09+2020-12”的思路，又在工程上更务实。

* * *

如果你愿意，可以把你们现在的一两段 schema（连同 `$schema` 和你们使用的语言/库）贴出来，我可以帮你具体设计：

* 迁移脚本大致应该做哪些变换

* 验证层怎么配置（多 draft 支持、缓存 meta-schema 等）
