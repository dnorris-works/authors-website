// One-time script: uploads the images that used to be hardcoded in lib/authors.ts
// (public/assets/*) into the authors.images table, so existing sites keep
// showing the same logo/favicon/hero/lead-magnet images after the DB migration.
//
// Run once against your production database:
//   DATABASE_URL="postgres://..." node scripts/migrate-assets.mjs
//
// Safe to re-run — it upserts on (author_key, role).

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'public', 'assets');

const MIME_TYPES = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
};

const uploads = [
    { authorKey: 'dallennorris', role: 'favicon', file: 'dallennorris/favicon.png' },
    { authorKey: 'dallennorris', role: 'logo', file: 'dallennorris/logo.png' },
    { authorKey: 'dallennorris', role: 'hero', file: 'dallennorris/hero.jpg' },
    { authorKey: 'dallennorris', role: 'lead_magnet', file: 'dallennorris/witness-persists.jpg' },
    { authorKey: 'adrianreeve', role: 'logo', file: 'adrianreeve/logo.svg' },
    { authorKey: 'adrianreeve', role: 'favicon', file: 'adrianreeve/favicon.svg' },
];

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('Set DATABASE_URL before running this script.');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    for (const { authorKey, role, file } of uploads) {
        const filePath = path.join(assetsDir, file);
        const ext = path.extname(file).toLowerCase();
        const mimeType = MIME_TYPES[ext];

        try {
            const data = await readFile(filePath);
            await pool.query(
                `INSERT INTO authors.images (author_key, book_id, role, filename, mime_type, data)
                 VALUES ($1, NULL, $2, $3, $4, $5)
                 ON CONFLICT (author_key, role) WHERE book_id IS NULL
                 DO UPDATE SET filename = EXCLUDED.filename, mime_type = EXCLUDED.mime_type, data = EXCLUDED.data`,
                [authorKey, role, path.basename(file), mimeType, data]
            );
            console.log(`Uploaded ${authorKey}/${role} from ${file}`);
        } catch (err) {
            console.error(`Failed to upload ${authorKey}/${role} from ${file}:`, err.message);
        }
    }

    await pool.end();
}

main();
