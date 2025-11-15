// Copyright 2025 Shuai Zhang
// SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception

import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url));
const tsConfigPath = fileURLToPath(new URL('./tsconfig.lint.json', import.meta.url));

export default tseslint.config(
    {
        ignores: ['dist/**', 'coverage/**', 'eslint.config.mjs', '.prettierrc.js'],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked.map((config) => ({
        ...config,
        languageOptions: {
            ...config.languageOptions,
            parserOptions: {
                ...config.languageOptions?.parserOptions,
                project: tsConfigPath,
                tsconfigRootDir,
            },
        },
    })),
    ...tseslint.configs.stylisticTypeChecked,
    {
        files: ['ts/**/*.ts', '*.config.ts', '*.config.cts', '*.config.mts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
            '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
            '@typescript-eslint/no-floating-promises': ['error', { ignoreIIFE: true }],
            '@typescript-eslint/no-unnecessary-type-parameters': 'error',
            '@typescript-eslint/prefer-readonly': ['error'],
        },
    },
);
