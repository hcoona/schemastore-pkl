// Copyright 2025 Shuai Zhang
// SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception

import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/ts/src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: false,
    splitting: false,
    shims: false,
    target: 'node22',
    platform: 'node',
    treeshake: true,
    outDir: 'dist',
    tsconfig: 'tsconfig.build.json',
});
