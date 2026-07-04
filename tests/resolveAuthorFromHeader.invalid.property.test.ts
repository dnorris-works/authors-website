import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 2: Invalid or absent key resolves to null
 *
 * Validates: Requirements 2.2, 2.3, 4.3
 *
 * For any string not matching a valid author key (including empty, null, whitespace),
 * `resolveAuthorFromHeader(value)` returns null.
 */

// Mock the db module so getAuthorByKey never hits a real database
vi.mock('@/lib/db', () => ({
    getPool: vi.fn(),
}));

// Known valid author keys in the system — anything outside this set is invalid
const VALID_AUTHOR_KEYS = ['dallennorris', 'adrianreeve'];

// Mock getAuthorByKey: returns null for any key not in the valid set
vi.mock('@/lib/authors', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/authors')>();
    return {
        ...actual,
        getAuthorByKey: vi.fn(async (key: string) => {
            if (VALID_AUTHOR_KEYS.includes(key)) {
                return { key, name: `Author ${key}`, domain: `${key}.com` };
            }
            return null;
        }),
    };
});

import { resolveAuthorFromHeader } from '@/lib/authors';

describe('Feature: caddy-reverse-proxy-domain-detection, Property 2: Invalid or absent key resolves to null', () => {
    /**
     * **Validates: Requirements 2.2, 2.3, 4.3**
     */
    it('returns null for null input', async () => {
        const result = await resolveAuthorFromHeader(null);
        expect(result).toBeNull();
    });

    it('returns null for empty string', async () => {
        const result = await resolveAuthorFromHeader('');
        expect(result).toBeNull();
    });

    it('returns null for whitespace-only strings', async () => {
        const result = await resolveAuthorFromHeader('   ');
        expect(result).toBeNull();
        const result2 = await resolveAuthorFromHeader('\t\n');
        expect(result2).toBeNull();
    });

    /**
     * **Validates: Requirements 2.2, 2.3**
     *
     * Property: For any arbitrary string that is NOT a valid author key,
     * resolveAuthorFromHeader returns null.
     */
    it('returns null for any string not matching a valid author key (100+ iterations)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string().filter((s) => !VALID_AUTHOR_KEYS.includes(s.trim())),
                async (invalidKey) => {
                    const result = await resolveAuthorFromHeader(invalidKey);
                    expect(result).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Validates: Requirements 4.3**
     *
     * Property: For any string containing special characters or random noise
     * that is not a valid author key, resolveAuthorFromHeader returns null.
     */
    it('returns null for arbitrary strings with special characters not matching valid keys (100+ iterations)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 200 }).filter(
                    (s) => !VALID_AUTHOR_KEYS.includes(s.trim()) && s.trim().length > 0
                ),
                async (invalidKey) => {
                    const result = await resolveAuthorFromHeader(invalidKey);
                    expect(result).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });
});
