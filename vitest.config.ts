// Copyright 2025 Shuai Zhang
// SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/ts/test/**/*.test.ts'],
        environment: 'node',
        globals: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            thresholds: {
                statements: 80,
                branches: 75,
                functions: 80,
                lines: 80,
            },
        },
    },
});
