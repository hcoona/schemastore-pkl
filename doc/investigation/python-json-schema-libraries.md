<!--
 Copyright 2025 Shuai Zhang
 SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
-->

# Python JSON Schema 库调查

## **You:**

Python 3.12 有合适的解析各个版本的 JSON Schema 的库吗

## **ChatGPT:**

有的，而且不止一个库可以选 😊。简单说结论：

- **如果你要“用 JSON Schema 做校验”**：推荐 `jsonschema`
- **如果你要“用 JSON Schema 当成 AST 来解析 / 处理”**：推荐 `referencing` + 自己做一点小包装
- 另外有一些“全家桶”类库，比如 `jessiql-jsonschema`、`fastjsonschema`，但它们对“所有版本”支持没那么系统

下面分场景说清楚。

### 1. 主流方案：`jsonschema`（Python 官方社区标准库）

`jsonschema` 是 Python 里最常用的 JSON Schema 校验库，完全支持 Python 3.12，并且对各个草案版本有比较规范的支持。

#### 支持的草案版本（不同 Class）

大致上（以 4.x/5.x 系列为例）会有这些 Validator：

```python
from jsonschema import (
    Draft4Validator,
    Draft6Validator,
    Draft7Validator,
)
from jsonschema.validators import validator_for
```

新版本还引入了对 2019-09 / 2020-12 的支持，通常通过 `jsonschema.Draft201909Validator`、`jsonschema.Draft202012Validator`（具体名字要看你安装的版本 `pip show jsonschema` 再对照文档）。

一个典型用法：

```python
from jsonschema import Draft7Validator

schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer", "minimum": 0}
    },
    "required": ["name"]
}

data = {"name": "Alice", "age": 20}

validator = Draft7Validator(schema)
validator.validate(data)  # 不抛异常则通过
```

`jsonschema` **默认是“校验器”而不是“通用解析器”**：

- 它能识别 `$schema` URL，帮你选合适的 validator

- 能解析 `$ref`、做引用解析（新版本用 `referencing` 库来做）

- 但不会给你特别结构化的“AST 对象树”（通常就是 Python dict）

### 2. 想要“统一处理不同版本”的写法

如果你的 JSON Schema 文件里都有 `$schema` 字段，可以让 `jsonschema` 自动挑选 Validator：

```python
from jsonschema.validators import validator_for

def validate_generic(schema: dict, instance: object):
    Validator = validator_for(schema)
    Validator.check_schema(schema)  # 可选：先检查 schema 自身是否合法
    validator = Validator(schema)
    validator.validate(instance)
```

这样不管是 draft-04 / draft-07 / 2019-09 / 2020-12，只要 `$schema` 写对，基本都能自动处理。

### 3. 要做“更底层的解析 / 引用系统”的话：`referencing`

从 `jsonschema` 4.x 开始，它把 `$ref` 解析和资源管理拆到了一个独立库：**`referencing`**。

如果你的需求是：

- 不一定要真正做“校验”，只是想解析 `$ref`、构建 schema 资源图

- 或者需要自己实现一套处理逻辑（代码生成、UI 自动生成等）

就可以直接用 `referencing`：

```python
from referencing import Registry, Resource

schema = {
    "$id": "https://example.com/root.json",
    "type": "object",
    "properties": {
        "child": {"$ref": "child.json"}
    }
}

child_schema = {
    "$id": "https://example.com/child.json",
    "type": "string"
}

registry = Registry().with_resources({
    "https://example.com/root.json": Resource.from_contents(schema),
    "https://example.com/child.json": Resource.from_contents(child_schema),
})

root_res = registry.lookup("https://example.com/root.json")
resolved_root = root_res.contents
# 然后你可以用 registry.resolve(...) 去跟踪 $ref、做你自己的处理
```

它本身对“哪个草案版本”不太关心，更多只是做 URI / `$id` / `$ref` 的解析和资源寻址，你可以配合 `jsonschema` 或自定义逻辑来统一处理各种草案。

### 4. 其它可选库（根据需求选择）

#### 4.1 `fastjsonschema`

- 主打：**把 JSON Schema 编译成 Python 函数**，极致性能

- 草案支持：基本上是 draft-07 为主，对更新草案支持不如 `jsonschema` 规范、全面

- 用于“高性能校验”很合适，但不太适合作为“通用多版本解析器”

#### 4.2 生成代码 / 文档类库

如果你的需求是“从 JSON Schema 生成 Pydantic 模型、dataclass、表单 UI”，可以关注一些专用库，比如：

- `datamodel-code-generator`（支持多种输入含 JSON Schema）

- 一些前端工具/后端脚手架也会内置 JSON Schema 解析器（但 Python 里还是 `jsonschema` 最稳）

### 5. 实战推荐组合

根据你提到的“各个版本的 JSON Schema + Python 3.12”，我会推荐几套组合：

1. **只是要正确校验，不想自己搞版本细节**
    - 直接用：`jsonschema`

    - 写法：通过 `$schema` + `validator_for` 自动选版本

2. **需要做复杂工具：代码生成 / UI 自动生成 / 统一 Schema 管理**
    - `jsonschema` + `referencing`

    - `jsonschema` 负责不同草案规则

    - `referencing` 负责 `$ref` / registry / 资源图，你自己在上层构建 AST 和各种变换

3. **对性能有极致需求（如在线请求大量校验）**
    - 开发时用 `jsonschema` 做验证，运行时将稳定 schema 用 `fastjsonschema` 编译成函数

---

如果你愿意，可以贴一个你手头的 JSON Schema（最好带 `$schema`），我可以给你写一段针对“多版本自动解析 + 校验/处理”的示例框架，直接能在 Python 3.12 下跑。

## (Round 2) **You:**

再明确一下，我的需求是解析 JSON Schema，而非使用 JSON Schema 做校验。我的场景是将 JSON Schema 转换成其他强类型语言的类。

## (Round 2) **ChatGPT:**

懂了，你是想把 **JSON Schema → 强类型语言类**，重点在“解析/建模”，不是做 runtime 校验 ✅

先说结论：

- **没有**一个“官方级”的 Python 3.12 库能把 _所有 draft_ 的 JSON Schema 都统一成一个漂亮的 AST 再帮你直接多语言 codegen。

- 但有几块“积木”很适合拿来拼：
    - 覆盖各种 draft 的：`jsonschema`（+ `referencing`）

    - 针对 2019-09 / 2020-12、有面向对象 Schema 树的：`jschon`

    - 做好了一套“Schema→Python 类型”的现成生成器：`datamodel-code-generator`

比较适合你的组合是：**“jsonschema/referencing 或 jschon 做解析 + 自己定义一个语言无关的 IR，再输出各强类型语言”**。

### 1. 作为“多版本解析核心”：`jsonschema` + `referencing`

特点：

- 覆盖的草案非常全：Draft 3 / 4 / 6 / 7 / 2019-09 / 2020-12 都支持。

- 新版把 `$ref` 解析从老的 `RefResolver` 抽成了独立库 `referencing`，可以单独用来做跨文档引用解析。

- schema 仍然是 Python dict，但你可以：
    - 通过 `$schema` 字段识别 draft

    - 用 `referencing.Registry` 管理 `$id` / `$ref` 和文档

示意代码（只做解析，不做校验）：

```python
from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Any, List, Optional
from referencing import Registry, Resource
import json
from pathlib import Path

# 1. 建立 registry，把所有 schema 文件注册进去
def build_registry(schema_dir: Path) -> Registry:
    registry = Registry()
    for path in schema_dir.glob("*.json"):
        with path.open("r", encoding="utf-8") as f:
            raw = json.load(f)
        schema_id = raw.get("$id") or path.as_uri()
        registry = registry.with_resource(
            schema_id,
            Resource.from_contents(raw),
        )
    return registry

# 2. 非常简化的中间表示（只示例 object / array）
@dataclass
class TypeRef:
    name: str
    props: Dict[str, "TypeRef"] | None = None
    item: "TypeRef" | None = None
    required: List[str] | None = None
    kind: str = "any"  # "object" / "array" / 基础类型 等

def schema_to_ir(schema: Dict[str, Any], name: str = "Root") -> TypeRef:
    t = schema.get("type")
    if t == "object":
        props = {}
        for prop_name, prop_schema in schema.get("properties", {}).items():
            props[prop_name] = schema_to_ir(prop_schema, name=prop_name)
        return TypeRef(
            name=name,
            kind="object",
            props=props,
            required=schema.get("required", []),
        )
    if t == "array":
        item_schema = schema.get("items", {})
        return TypeRef(
            name=name,
            kind="array",
            item=schema_to_ir(item_schema, name=f"{name}Item"),
        )
    # 简化处理：string / integer / boolean ...
    return TypeRef(name=name, kind=t or "any")

# 3. 解析入口：拿到 dict + draft 信息 + 你的 IR
def parse_schema(raw_schema: Dict[str, Any], name: str = "Root") -> TypeRef:
    schema_uri = raw_schema.get("$schema", "")
    # 这里可以根据 schema_uri 判断 draft 做一些兼容处理
    # 例如 draft-04 的 exclusiveMinimum 是 bool，而 2019-09 起是数字等等
    # 在 IR 里把这些差异抹平
    return schema_to_ir(raw_schema, name=name)
```

> 你可以把 `TypeRef` 扩展成完整的类型系统（union/oneOf/allOf/enum/nullable 等），然后各目标语言都从这个 IR 生成类 / type / interface。

### 2. 如果只考虑“现代草案”：用 `jschon` 当 AST

`jschon` 是一个比较“OO 风格”的 JSON Schema 实现，支持 **2019-09 和 2020-12 草案**，带有 Schema 编译、索引、`$ref` 解析和 JSON Pointer 等。

优点：

- `JSONSchema` 是对象，不是裸 dict，节点结构更适合遍历。

- 内置 catalog, 可以管理很多 schema 文件，并自动按 `$ref` 加载。

大致用法（简化版，只示意解析）：

```python
from jschon import create_catalog, JSONSchema

# 初始化 catalog，启用 2020-12 词汇表
catalog = create_catalog("2020-12", default=True)

# 从 dict 构建 JSONSchema 对象
schema = JSONSchema({
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer"}
    },
    "required": ["name"]
})

# 你可以访问 schema.data 获得原始结构，或者沿着 schema 的子节点遍历
```

对 2019-09 / 2020-12 的项目，这个比直接操作 dict 会舒服很多；缺点就是 **老 draft（4/6/7）不支持**，不能满足“各个版本”的硬性要求。

### 3. 学习/复用现成的代码生成器：`datamodel-code-generator`

`datamodel-code-generator` 是一个 Python 库 + CLI，用来从 JSON Schema / OpenAPI 等生成 **Pydantic model / dataclasses**，它本身就是一个“Schema → Python 类型”的生成器：

- 输入：JSON Schema / OpenAPI / JSON 等

- 输出：Python 类型（Pydantic / dataclass）

- 已在 Python 3.12 环境里有人用（官方有 docker 镜像基于 Python 3.12）

你可以：

1. 直接当库用，先生成 Python 类型，再从 Python 类型映射到其它语言（比如把 Pydantic model 作为中间表示）。

2. 或者阅读它内部的 _model_ / _parser_ 实现，把那一套 JSON Schema→抽象类型系统的逻辑移植到你自己的项目里，而不是重新发明轮子。

不过它对 JSON Schema 的支持是“够用为主”，不算一个“完全覆盖所有 draft、所有特性的编译器”，特别是复杂的 compound schema / `$id` 结构时会有人遇到坑。

### 4. 推荐的整体思路（适合你这种“多语言 codegen”场景）

综合你的需求，我会建议这样设计：

1. **解析 & 引用解析层**
    - 使用 `jsonschema` + `referencing` 处理：
        - 识别 `$schema` → 拿到草案版本

        - 把各种 `$id` / `$ref` 解析成一个“完整展开”的 schema 视图

    - 如果能限制只用 2019-09 / 2020-12，就可以改用 `jschon`，得到更友好的对象模型。

2. **统一中间表示 (IR) 层**（你自己设计）
    - 例如定义：
        - `PrimitiveType(name="string" | "int" | "bool" | "decimal" | …)`

        - `ObjectType(name, properties: {name: Type}, required: set)`

        - `ArrayType(item: Type)`

        - `UnionType(variants: List[Type])`（对应 oneOf/anyOf）

        - `EnumType(name, values: List[str])`

    - 在从 JSON Schema → IR 的过程中顺便做：
        - 草案差异归一化（例如 exclusiveMinimum 的语义差异）

        - 处理 allOf 继承、oneOf/anyOf union、$ref 展开/命名等

3. **后端生成器**
    - 针对每个目标强类型语言写一个 `emit_<lang>(Type)`：
        - TypeScript: interface / type / enum

        - Java / C#: class / record

        - Go: struct

        - …

这么做的好处：

- **解析和版本兼容由成熟库承担**，你只是消费它们的输出。

- **草案差异只在 JSON Schema→IR 的一步里处理一次**，后面所有语言生成共享同一个 IR。

- 以后想支持别的输入（OpenAPI、GraphQL）也可以统一映射到同一个 IR。

---

如果你愿意下一步动手，我们可以一起把“**从简单 JSON Schema → IR → 某个具体语言（比如 TypeScript 或 Java）**”写成一个最小 Demo，再在此基础上递进支持 oneOf / allOf / enum 等复杂特性。
