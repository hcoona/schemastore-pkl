<!--
 Copyright 2025 Shuai Zhang
 SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
-->

# SchemaStore PKL Package

This repository contains [Apple Pkl Language](https://pkl-lang.org/index.html) schema definitions sourced from [SchemaStore](https://schemastore.org).

## TypeScript 开发脚手架

该仓库现在内置了面向 Node.js 22+ 的 TypeScript 基础脚手架，默认开启 TypeScript 5.6 带来的最新安全检查（如 `noUncheckedSideEffectImports` 与 `strictBuiltinIteratorReturn`），方便后续扩展自定义工具链或生成脚本。[^ts56]

- **运行时基线**：面向 Node.js 22（2025 年 10 月 LTS），可直接使用迭代器辅助方法、`node --run`/`--watch` 等新特性。[^node22]
- **TypeScript 工具链**：固定在 TypeScript 5.9.x，并结合 5.7～5.9 引入的能力（`target`/`lib` 升级到 ES2024、`rewriteRelativeImportExtensions`、`noUncheckedSideEffectImports` 等），便于在 NodeNext/ESM 项目里直接复用源码或延迟导入。[^ts57][^ts58][^ts59]
- **包管理工具**：通过 `mise use pnpm@latest` 获取 pnpm 10，并使用 `pnpm-lock.yaml`（Lockfile v9）锁定依赖图，避免 npm 与 pnpm 混用。
- **构建链路**：使用 `tsup` 产出 ESM+CJS 以及类型定义，默认 `verbatimModuleSyntax`，适配双模块导出。
- **测试与覆盖率**：使用 `vitest` + `@vitest/coverage-v8`，并在 `pnpm run coverage` 中开启 V8 覆盖率。
- **Lint/Format**：采用 ESLint Flat Config + `typescript-eslint`，与仓库现有的 `prettier` 配置一致。

### 快速开始

```bash
mise use pnpm@latest   # 首次可用 mise 拉起 pnpm
pnpm install
pnpm run check         # lint + typecheck + test
pnpm run dev           # tsx --watch 运行示例入口
pnpm run build         # tsup 打包 dist/，生成 ESM/CJS + d.ts
```

### 目录与配置速览

| 路径                  | 说明                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| `src/ts/src`          | TypeScript 源码目录，默认导出示例的 `createSchemaDescriptor` 帮助函数 |
| `src/ts/test`         | Vitest 测试用例                                                       |
| `tsconfig.base.json`  | 统一的编译选项，开启 TypeScript 5.6 新增的安全检查                    |
| `tsconfig.build.json` | 纯构建配置，供 `pnpm run typecheck`/`tsup` 使用                       |
| `tsconfig.test.json`  | 测试场景编译配置（引入 Vitest 类型）                                  |
| `tsconfig.lint.json`  | 供 ESLint 类型感知使用的工程文件                                      |
| `tsup.config.ts`      | 打包配置，产出 `dist/`                                                |
| `vitest.config.ts`    | 测试与覆盖率配置                                                      |
| `eslint.config.mjs`   | Flat Config，开启 `typescript-eslint` 的 strict+stylistic 规则        |

### 推荐工作流

1. `pnpm run dev`：利用 `tsx --watch` 和 Node.js 22 稳定的 `--watch` 模式迭代开发。[^node22]
2. `pnpm run lint`：执行 ESLint（strict + stylistic）配置，配合 `noUncheckedSideEffectImports` 捕获遗漏的副作用导入。[^tspr58941]
3. `pnpm run test` / `pnpm run coverage`：运行 Vitest 与覆盖率报告，保障示例/脚本逻辑正确。
4. `pnpm run build`：通过 `tsup` 生成可复用的 CLI/库构建产物（ESM/CJS + `.d.ts`）。

[^ts56]: [Announcing TypeScript 5.6](https://devblogs.microsoft.com/typescript/announcing-typescript-5-6/)

[^node22]: [Node.js 22 is now available!](https://nodejs.org/en/blog/announcements/v22-release-announce)

[^tspr58941]: [TypeScript PR #58941 – `noUncheckedSideEffectImports`](https://github.com/microsoft/TypeScript/pull/58941)

[^ts57]: [Announcing TypeScript 5.7 RC](https://devblogs.microsoft.com/typescript/announcing-typescript-5-7-rc/)

[^ts58]: [Announcing TypeScript 5.8 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8-beta/)

[^ts59]: [Announcing TypeScript 5.9](https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/)
