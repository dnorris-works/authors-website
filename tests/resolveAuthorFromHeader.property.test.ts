import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * Property 1: Valid author key resolves to correct author
 *
 * Validates: Requirements 2.1
 *
 * For any author_key that exists in the database, calling
 * resolveAuthorFromHeader(author_key) returns an Author object
 * whose `key` field equals that author_key.
 */

import type { Author } from '@/lib/authors';

// Set DATABASE_URL so getAuthorByKey doesn't short-circuit to null
process.env.DATABASE_URL = 'postgresql://fake:fake@localhost:5432/fake';

// Mock the db module to prevent real database connections
vi.mock('@/lib/db', () => ({
    getPool: vi.fn(() => ({
        query: vi.fn(),
    })),
}));

function makeFakeAuthor(key: string): Author {
    return {
        key,
        domain: `${key}.com`,
        accentColor: '#000000',
        mailerLiteAccount: null,
        mailerLiteForm: null,
        name: `Author ${key}`,
        tagline: 'A tagline',
        subtagline: 'A subtagline',
        bio: 'A bio',
        logo: null,
        favicon: null,
        heroImage: null,
        photoUrl: null,
        featuredBookId: null,
    };
}

// Generator for valid author keys: lowercase alphanumeric strings starting with a letter
const validAuthorKeyArb = fc.stringMatching(/^[a-z][a-z0-9]{0,29}$/);

describe('Feature: caddy-reverse-proxy-domain-detection, Property 1: Valid author key resolves to correct author', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('resolveAuthorFromHeader(key) returns an Author with matching key for any valid key', async () => {
        // We need to mock getPool().query at the db level to return proper results
        const { getPool } = await import('@/lib/db');
        const { resolveAuthorFromHeader } = await import('@/lib/authors');

        await fc.assert(
            fc.asyncProperty(validAuthorKeyArb, async (key) => {
                // Mock the pool.query to return results that match what getAuthorByKey expects
                const mockQuery = vi.fn()
                    .mockResolvedValueOnce({
                        rows: [{
                            author_key: key,
                            domain: `${key}.com`,
                            accent_color: '#000000',
                            mailerlite_account: null,
                            mailerlite_form: null,
                            name: `Author ${key}`,
                            tagline: 'A tagline',
                            subtagline: 'A subtagline',
                            bio: 'A bio',
                            featured_book_id: null,
                            updated_at: new Date('2024-01-01'),
                        }],
                    })
                    .mockResolvedValueOnce({
                        rows: [],  // no images
                    });

                vi.mocked(getPool).mockReturnValue({ query: mockQuery } as never);

                // Act
                const result = await resolveAuthorFromHeader(key);

                // Assert: result is not null and key matches
                expect(result).not.toBeNull();
                expect(result!.key).toBe(key);
            }),
            { numRuns: 100 }
        );
    });

    it('resolveAuthorFromHeader(key) returns an Author with matching key even when key has surrounding whitespace', async () => {
        const { getPool } = await import('@/lib/db');
        const { resolveAuthorFromHeader } = await import('@/lib/authors');

        await fc.assert(
            fc.asyncProperty(validAuthorKeyArb, async (key) => {
                const paddedKey = `  ${key}  `;

                const mockQuery = vi.fn()
                    .mockResolvedValueOnce({
                        rows: [{
                            author_key: key,
                            domain: `${key}.com`,
                            accent_color: '#000000',
                            mailerlite_account: null,
                            mailerlite_form: null,
                            name: `Author ${key}`,
                            tagline: 'A tagline',
                            subtagline: 'A subtagline',
                            bio: 'A bio',
                            featured_book_id: null,
                            updated_at: new Date('2024-01-01'),
                        }],
                    })
                    .mockResolvedValueOnce({
                        rows: [],
                    });

                vi.mocked(getPool).mockReturnValue({ query: mockQuery } as never);

                // Act
                const result = await resolveAuthorFromHeader(paddedKey);

                // Assert: result is not null and key matches the trimmed value
                expect(result).not.toBeNull();
                expect(result!.key).toBe(key);

                // Verify the query was called with the trimmed key
                expect(mockQuery).toHaveBeenCalledWith(
                    expect.stringContaining('WHERE author_key = $1'),
                    [key]
                );
            }),
            { numRuns: 100 }
        );
    });
});
