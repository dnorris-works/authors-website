import { getPool } from './db';
import type { Author, AuthorConfig } from './authors';

export type AuthorProfile = {
    authorKey: string;
    name: string;
    tagline: string;
    subtagline: string;
    bio: string;
    hasPhoto: boolean;
};

function emptyProfile(authorKey: string): AuthorProfile {
    return { authorKey, name: '', tagline: '', subtagline: '', bio: '', hasPhoto: false };
}

export async function getAuthorProfile(authorKey: string): Promise<AuthorProfile> {
    if (!process.env.DATABASE_URL) return emptyProfile(authorKey);

    const pool = getPool();
    const result = await pool.query(
        `SELECT name, tagline, subtagline, bio, photo_data IS NOT NULL AS has_photo
         FROM authors.profiles WHERE author_key = $1`,
        [authorKey]
    );

    if (result.rows.length === 0) return emptyProfile(authorKey);

    const row = result.rows[0];
    return {
        authorKey,
        name: row.name,
        tagline: row.tagline,
        subtagline: row.subtagline,
        bio: row.bio,
        hasPhoto: row.has_photo,
    };
}

export async function getAllAuthorProfiles(): Promise<Record<string, AuthorProfile>> {
    if (!process.env.DATABASE_URL) return {};

    const pool = getPool();
    const result = await pool.query(
        `SELECT author_key, name, tagline, subtagline, bio, photo_data IS NOT NULL AS has_photo
         FROM authors.profiles`
    );

    const map: Record<string, AuthorProfile> = {};
    for (const row of result.rows) {
        map[row.author_key] = {
            authorKey: row.author_key,
            name: row.name,
            tagline: row.tagline,
            subtagline: row.subtagline,
            bio: row.bio,
            hasPhoto: row.has_photo,
        };
    }
    return map;
}

export function toAuthor(config: AuthorConfig, profile: AuthorProfile): Author {
    return {
        ...config,
        name: profile.name,
        tagline: profile.tagline,
        subtagline: profile.subtagline,
        bio: profile.bio,
        photoUrl: profile.hasPhoto ? `/api/profile-photo/${config.key}` : null,
    };
}
