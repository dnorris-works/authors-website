import { getPool } from './db';

export type Author = {
    key: string;
    domain: string | null;
    accentColor: string;
    mailerLiteAccount: string | null;
    mailerLiteForm: string | null;
    name: string;
    tagline: string;
    subtagline: string;
    bio: string;
    logo: string | null;
    favicon: string | null;
    heroImage: string | null;
    leadMagnetImage: string | null;
    photoUrl: string | null;
};

export const IMAGE_ROLES = ['logo', 'favicon', 'hero', 'lead_magnet', 'photo'] as const;
export type AuthorImageRole = typeof IMAGE_ROLES[number];

type ProfileRow = {
    author_key: string;
    domain: string | null;
    accent_color: string;
    mailerlite_account: string | null;
    mailerlite_form: string | null;
    name: string;
    tagline: string;
    subtagline: string;
    bio: string;
};

function imageUrl(authorKey: string, role: AuthorImageRole, roles: Set<string>): string | null {
    return roles.has(role) ? `/api/author-image/${authorKey}/${role}` : null;
}

function toAuthor(row: ProfileRow, roles: Set<string>): Author {
    return {
        key: row.author_key,
        domain: row.domain,
        accentColor: row.accent_color,
        mailerLiteAccount: row.mailerlite_account,
        mailerLiteForm: row.mailerlite_form,
        name: row.name,
        tagline: row.tagline,
        subtagline: row.subtagline,
        bio: row.bio,
        logo: imageUrl(row.author_key, 'logo', roles),
        favicon: imageUrl(row.author_key, 'favicon', roles),
        heroImage: imageUrl(row.author_key, 'hero', roles),
        leadMagnetImage: imageUrl(row.author_key, 'lead_magnet', roles),
        photoUrl: imageUrl(row.author_key, 'photo', roles),
    };
}

export async function getAllAuthors(): Promise<Author[]> {
    if (!process.env.DATABASE_URL) return [];

    const pool = getPool();
    const [profiles, images] = await Promise.all([
        pool.query(`SELECT * FROM authors.profiles ORDER BY name ASC`),
        pool.query(`SELECT author_key, role FROM authors.images WHERE book_id IS NULL`),
    ]);

    const rolesByAuthor = new Map<string, Set<string>>();
    for (const row of images.rows) {
        if (!rolesByAuthor.has(row.author_key)) rolesByAuthor.set(row.author_key, new Set());
        rolesByAuthor.get(row.author_key)!.add(row.role);
    }

    return profiles.rows.map(row => toAuthor(row, rolesByAuthor.get(row.author_key) ?? new Set()));
}

export async function getAuthorByKey(key: string): Promise<Author | null> {
    if (!process.env.DATABASE_URL) return null;

    const pool = getPool();
    const [profile, images] = await Promise.all([
        pool.query(`SELECT * FROM authors.profiles WHERE author_key = $1`, [key]),
        pool.query(`SELECT role FROM authors.images WHERE author_key = $1 AND book_id IS NULL`, [key]),
    ]);

    if (profile.rows.length === 0) return null;
    return toAuthor(profile.rows[0], new Set(images.rows.map(r => r.role)));
}

export async function getAuthorByDomain(hostname: string): Promise<Author | null> {
    if (!hostname) return null;
    const all = await getAllAuthors();
    return all.find(a => a.domain && (hostname === a.domain || hostname.endsWith('.' + a.domain))) ?? null;
}

export async function createAuthor(input: {
    key: string;
    domain: string;
    name: string;
}): Promise<void> {
    const pool = getPool();
    await pool.query(
        `INSERT INTO authors.profiles (author_key, domain, name) VALUES ($1, $2, $3)`,
        [input.key, input.domain, input.name]
    );
}

export async function updateAuthorProfile(input: {
    authorKey: string;
    domain: string;
    accentColor: string;
    mailerLiteAccount: string;
    mailerLiteForm: string;
    name: string;
    tagline: string;
    subtagline: string;
    bio: string;
}): Promise<void> {
    const pool = getPool();
    await pool.query(
        `UPDATE authors.profiles
         SET domain = $2, accent_color = $3, mailerlite_account = $4, mailerlite_form = $5,
             name = $6, tagline = $7, subtagline = $8, bio = $9
         WHERE author_key = $1`,
        [
            input.authorKey,
            input.domain,
            input.accentColor,
            input.mailerLiteAccount || null,
            input.mailerLiteForm || null,
            input.name,
            input.tagline,
            input.subtagline,
            input.bio,
        ]
    );
}

export async function upsertAuthorImage(
    authorKey: string,
    role: AuthorImageRole,
    file: { filename: string; mimeType: string; buffer: Buffer }
): Promise<void> {
    const pool = getPool();
    await pool.query(
        `INSERT INTO authors.images (author_key, book_id, role, filename, mime_type, data)
         VALUES ($1, NULL, $2, $3, $4, $5)
         ON CONFLICT (author_key, role) WHERE book_id IS NULL
         DO UPDATE SET filename = EXCLUDED.filename, mime_type = EXCLUDED.mime_type, data = EXCLUDED.data`,
        [authorKey, role, file.filename, file.mimeType, file.buffer]
    );
}
