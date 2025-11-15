/**
 * Copyright 2025 Shuai Zhang
 * SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception
 */

const config = {
    semi: true,
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 120,
    tabWidth: 4,
    useTabs: false,
    endOfLine: 'lf',

    // Override for specific file types
    overrides: [
        {
            files: '*.md',
            options: {
                proseWrap: 'preserve',
            },
        },
        {
            files: ['*.yaml', '*.yml'],
            options: {
                tabWidth: 2,
            },
        },
    ],
};

export default config;
