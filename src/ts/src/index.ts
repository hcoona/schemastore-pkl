// Copyright 2025 Shuai Zhang
// SPDX-License-Identifier: LGPL-3.0-or-later WITH LGPL-3.0-linking-exception

const DEFAULT_REGISTRY = new URL('https://schemastore.org/schemas/json/');

export interface SchemaDescriptor {
    readonly id: string;
    readonly name: string;
    readonly url: URL;
    readonly tags: readonly string[];
}

export interface SchemaDescriptorInput {
    readonly id: string;
    readonly name: string;
    readonly path?: string;
    readonly url?: string | URL;
    readonly tags?: Iterable<string>;
}

export class SchemaDescriptorError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SchemaDescriptorError';
    }
}

const MAX_TAGS = 8;

const sanitizeTag = (tag: string): string => tag.trim().toLowerCase();

const isNonEmpty = (value: string): boolean => value.length > 0;

const unique = (tagList: Iterable<string>): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const tag of tagList) {
        if (seen.has(tag)) {
            continue;
        }

        seen.add(tag);
        result.push(tag);
    }

    return result;
};

const buildTagList = (source?: Iterable<string>): readonly string[] => {
    if (!source) {
        return [];
    }

    const sanitized = Array.from(source, (entry) => sanitizeTag(entry)).filter(isNonEmpty);
    return unique(sanitized).slice(0, MAX_TAGS);
};

const buildUrl = (input: SchemaDescriptorInput): URL => {
    if (input.url) {
        const candidate = input.url instanceof URL ? input.url : new URL(input.url);
        return candidate;
    }

    if (!input.path) {
        throw new SchemaDescriptorError('Either "url" or "path" must be provided.');
    }

    return new URL(input.path.replace(/^\/+/, ''), DEFAULT_REGISTRY);
};

export const createSchemaDescriptor = (input: SchemaDescriptorInput): SchemaDescriptor => {
    const trimmedId = input.id.trim();
    if (trimmedId.length === 0) {
        throw new SchemaDescriptorError('Descriptor "id" is required.');
    }

    const trimmedName = input.name.trim();
    if (trimmedName.length === 0) {
        throw new SchemaDescriptorError('Descriptor "name" is required.');
    }

    const tags = buildTagList(input.tags);

    return {
        id: trimmedId,
        name: trimmedName,
        url: buildUrl(input),
        tags,
    } satisfies SchemaDescriptor;
};

export const formatDescriptor = (descriptor: SchemaDescriptor): string => {
    const tagSuffix = descriptor.tags.length > 0 ? ` (${descriptor.tags.join(', ')})` : '';
    return `${descriptor.name}${tagSuffix} → ${descriptor.url.toString()}`;
};
