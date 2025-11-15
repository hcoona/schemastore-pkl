// Copyright 2025 Shuai Zhang
// SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception

import { describe, expect, it } from 'vitest';

import { createSchemaDescriptor, formatDescriptor } from '../src/index.js';

describe('schema descriptor helpers', () => {
    it('builds absolute URLs even when a relative path is provided', () => {
        const descriptor = createSchemaDescriptor({
            id: 'json/turbo',
            name: 'Turbo Repo',
            path: 'turbo.json',
            tags: ['Monorepo', ' build ', 'Turbo'],
        });

        expect(descriptor.url.toString()).toBe('https://schemastore.org/schemas/json/turbo.json');
        expect(descriptor.tags).toEqual(['monorepo', 'build', 'turbo']);
    });

    it('formats descriptors for log output', () => {
        const descriptor = createSchemaDescriptor({
            id: 'json/turbo',
            name: 'Turbo Repo',
            url: 'https://schemastore.org/schemas/json/turbo.json',
            tags: ['Turbo'],
        });

        expect(formatDescriptor(descriptor)).toMatchInlineSnapshot(
            '"Turbo Repo (turbo) → https://schemastore.org/schemas/json/turbo.json"',
        );
    });

    it('throws when required fields are missing', () => {
        expect(() => createSchemaDescriptor({
            id: 'json/turbo',
            name: '',
            path: 'turbo.json',
        })).toThrow('Descriptor "name" is required.');
    });
});
